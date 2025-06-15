const { User } = require('../model/User');
const crypto = require('crypto');
const { sanitizeUser, sendMail } = require('../services/common');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET_KEY, {
    expiresIn: '1h'
  });
};

// ➤ SIGNUP CONTROLLER
exports.createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      'sha256',
     async function (err, hashedPassword) {
        if (err) return res.status(500).json({ error: 'Hashing failed' });

        const user = new User({ ...req.body, passwordHash: hashedPassword });
        const doc = await user.save();

        const sanitized = sanitizeUser(doc);
        const token = generateToken(sanitized);

        // login to session (optional)
        req.login(sanitized, (err) => {
          if (err) return res.status(400).json(err);

          res
            .cookie('jwt', token, {
              expires: new Date(Date.now() + 3600000),
              httpOnly: true,
              secure: true,
              sameSite: 'None'
            })
            .status(201)
            .json({ id: doc.id, role: doc.role });
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'User creation failed' });
  }
};

// ➤ LOGIN CONTROLLER
exports.loginUser = async (req, res) => {
  const user = req.user;
  const sanitized = sanitizeUser(user);
  const token = generateToken(sanitized);

  res
    .cookie('jwt', token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    })
    .status(200)
    .json({ id: user.id, role: user.role });
};

// ➤ LOGOUT CONTROLLER
exports.logout = async (req, res) => {
  res
    .cookie('jwt', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    })
    .sendStatus(200);
};

// ➤ CHECK AUTH
exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
};

// ➤ RESET PASSWORD REQUEST
exports.resetPasswordRequest = async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (user) {
    const token = crypto.randomBytes(48).toString('hex');
    user.resetPasswordToken = token;
    await user.save();

    const resetPageLink =
      `http://localhost:5000/reset-password?token=${token}&email=${email}`;
    const subject = 'Reset your password for E-Commerce';
    const html = `<p>Click <a href='${resetPageLink}'>here</a> to reset your password</p>`;

    const response = await sendMail({ to: email, subject, html });
    res.json(response);
  } else {
    res.status(400).json({ error: 'User not found' });
  }
};

// ➤ RESET PASSWORD FINAL STEP
exports.resetPassword = async (req, res) => {
  const { email, password, token } = req.body;

  const user = await User.findOne({ email: email, resetPasswordToken: token });
  if (user) {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async function (err, hashedPassword) {
      if (err) return res.status(500).json({ error: 'Hashing error' });

      user.password = hashedPassword;
      user.salt = salt;
      user.resetPasswordToken = undefined;
      await user.save();

      const subject = 'Your password has been reset';
      const html = `<p>Your password was successfully reset.</p>`;
      const response = await sendMail({ to: email, subject, html });

      res.json(response);
    });
  } else {
    res.status(400).json({ error: 'Invalid token or email' });
  }
};
