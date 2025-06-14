// ✅ Required Packages
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const server = express();

// ✅ Models and Utils
const { User } = require('./model/User');
const { Order } = require('./model/Order');
const { isAuth, sanitizeUser, cookieExtractor } = require('./services/common');

// ✅ Routes
const productsRouter = require('./routes/Products');
const categoriesRouter = require('./routes/Categories');
const brandsRouter = require('./routes/Brands');
const usersRouter = require('./routes/Users');
const authRouter = require('./routes/Auth');
const cartRouter = require('./routes/Cart');
const ordersRouter = require('./routes/Order');

// ✅ Stripe
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY);
const endpointSecret = process.env.ENDPOINT_SECRET;

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://mern-full-stack-front-7312-ht773ho8d-annubhav22s-projects.vercel.app',
];

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true, // required for cookies, sessions, etc.
  })
);

// ✅ Middleware
server.use(express.json());
server.use(cookieParser());
server.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  }
}));
server.use(passport.initialize());
server.use(passport.session());

// ✅ Passport Local Strategy
passport.use('local', new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'invalid credentials' });

    crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashedPassword) => {
      if (err) return done(err);
      if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
        return done(null, false, { message: 'invalid credentials' });
      }
      const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);
      return done(null, { id: user.id, role: user.role, token });
    });
  } catch (err) {
    return done(err);
  }
}));

// ✅ Passport JWT Strategy
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET_KEY,
}, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) return done(null, sanitizeUser(user));
    else return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

passport.serializeUser((user, cb) => {
  process.nextTick(() => cb(null, { id: user.id, role: user.role }));
});
passport.deserializeUser((user, cb) => {
  process.nextTick(() => cb(null, user));
});

// ✅ API Routes
server.use('/products', productsRouter.router);
server.use('/categories', isAuth(), categoriesRouter.router);
server.use('/brands', isAuth(), brandsRouter.router);
server.use('/users', isAuth(), usersRouter.router);
server.use('/auth', authRouter.router);
server.use('/cart', isAuth(), cartRouter.router);
server.use('/orders', isAuth(), ordersRouter.router);

// ✅ Stripe Webhook (must come before express.json())
server.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const order = await Order.findById(paymentIntent.metadata.orderId);
    order.paymentStatus = 'received';
    await order.save();
  }

  res.send();
});

// ✅ Stripe Payment Intent
server.post('/create-payment-intent', async (req, res) => {
  const { totalAmount, orderId } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: 'inr',
    automatic_payment_methods: { enabled: true },
    metadata: { orderId },
  });
  res.send({ clientSecret: paymentIntent.client_secret });
});

// ✅ Serve Frontend in Production
server.use(express.static(path.resolve(__dirname, 'build')));
server.get('*', (req, res) => res.sendFile(path.resolve('build', 'index.html')));

// ✅ Connect to MongoDB and Start Server
mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log('✅ MongoDB connected');
  server.listen(process.env.PORT || 8080, () => {
    console.log('🚀 Server running on port', process.env.PORT || 8080);
  });
}).catch(err => console.error('❌ DB connection error:', err));
