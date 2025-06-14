// index.js
require('dotenv').config();
const express = require('express');
const server = express();
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

// Models and utilities
const { User } = require('./model/User');
const { Order } = require('./model/Order');
const { isAuth, sanitizeUser, cookieExtractor } = require('./services/common');

// Routers
const productsRouter = require('./routes/Products');
const categoriesRouter = require('./routes/Categories');
const brandsRouter = require('./routes/Brands');
const usersRouter = require('./routes/Users');
const authRouter = require('./routes/Auth');
const cartRouter = require('./routes/Cart');
const ordersRouter = require('./routes/Order');

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY);
const endpointSecret = process.env.ENDPOINT_SECRET;

// Middleware
server.use(express.static(path.resolve(__dirname, 'build')));
server.use(cookieParser());
server.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
server.use(passport.authenticate('session'));
server.use(
  cors({
    exposedHeaders: ['X-Total-Count'],
  })
);
server.use(express.json());

// Authenticated routes
server.use('/products', productsRouter.router);
server.use('/categories', isAuth(), categoriesRouter.router);
server.use('/brands', isAuth(), brandsRouter.router);
server.use('/users', isAuth(), usersRouter.router);
server.use('/auth', authRouter.router);
server.use('/cart', isAuth(), cartRouter.router);
server.use('/orders', isAuth(), ordersRouter.router);

// Stripe webhook
server.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        const order = await Order.findById(paymentIntentSucceeded.metadata.orderId);
        order.paymentStatus = 'received';
        await order.save();
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    response.send();
  }
);

// Create payment intent
server.post('/create-payment-intent', async (req, res) => {
  const { totalAmount, orderId } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: 'inr',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId,
    },
  });
  res.send({ clientSecret: paymentIntent.client_secret });
});

// React routing support
server.get('*', (req, res) =>
  res.sendFile(path.resolve('build', 'index.html'))
);

// Passport config
const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET_KEY,
};

passport.use(
  'local',
  new LocalStrategy({ usernameField: 'email' }, async function (email, password, done) {
    try {
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: 'invalid credentials' });
      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashedPassword) => {
        if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
          return done(null, false, { message: 'invalid credentials' });
        }
        const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);
        return done(null, { id: user.id, role: user.role, token });
      });
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(
  'jwt',
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) return done(null, sanitizeUser(user));
      else return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);

passport.serializeUser((user, cb) => {
  process.nextTick(() => cb(null, { id: user.id, role: user.role }));
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => cb(null, user));
});

// MongoDB connection
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('database connected');
}

server.listen(process.env.PORT, () => {
  console.log('server started');
});
