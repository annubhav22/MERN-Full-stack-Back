// ✅ Required Packages
require('dotenv').config();
const express = require('express');
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

// ✅ Models and Utils
const { User } = require("./model/User");
const { Order } = require("./model/Order");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");

// ✅ Routes
const productsRouter = require("./routes/Products"); 
const categoriesRouter = require("./routes/Categories"); 
const brandsRouter = require("./routes/Brands");
const usersRouter = require("./routes/Users");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const ordersRouter = require("./routes/Order");

// ✅ Database Connection
const connectDB = require("./connectDB");

// ✅ Stripe
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY);
const endpointSecret = process.env.ENDPOINT_SECRET;

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL || 'https://mern-full-stack-front.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const authRouter = require('./routes/Auth');
app.use('/auth', authRouter);


// ✅ Handle Stripe Webhook First
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event?.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const order = await Order.findById(paymentIntent.metadata.orderId);
    order.paymentStatus = 'received';
    await order.save();
  }
  res.send();
});

// ✅ Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Passport Local Strategy
passport.use('local', new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'Invalid credentials' });
    crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashed) => {
      if (err) return done(err);
      if (!crypto.timingSafeEqual(user.password, hashed)) {
        return done(null, false, { message: 'Invalid credentials' });
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
  secretOrKey: process.env.JWT_SECRET_KEY
}, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) return done(null, sanitizeUser(user));
    return done(null, false);
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
app.use('/products', productsRouter);
app.use('/categories', categoriesRouter);
app.use('/brands', brandsRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/cart', cartRouter);
app.use('/orders', ordersRouter);

// ✅ Stripe Payment Intent
app.post('/create-payment-intent', async (req, res) => {
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
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'build')));
  app.get('*', (req, res) => res.sendFile(path.resolve('build', 'index.html')));
}

// ✅ Database Connection and Server Start



connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is up and running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to DB!', err);
  });