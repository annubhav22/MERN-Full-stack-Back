const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('./model/User');
const { sanitizeUser, cookieExtractor } = require('./services/common');

// Local Strategy
passport.use(
  'local',
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
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
  })
);

// JWT Strategy
passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_SECRET_KEY,
    },
    async (jwtPayload, done) => {
      try {
        const user = await User.findById(jwtPayload.id);
        if (user) return done(null, sanitizeUser(user));
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Session serialization (optional if using sessions)
passport.serializeUser((user, cb) => {
  process.nextTick(() => cb(null, { id: user.id, role: user.role }));
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => cb(null, user));
});

module.exports = passport;
