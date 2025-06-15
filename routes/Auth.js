const express = require('express');
const router = express.Router();

const { createUser, loginUser, checkAuth, resetPasswordRequest, resetPassword, logout } = require('../controller/Auth');  
const passport = require('passport');

// Define routes
router.post('/signup', createUser);
router.post('/login', passport.authenticate('local'), loginUser);
router.get('/check', passport.authenticate('jwt'), checkAuth);
router.get('/logout', logout);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);

// ✅ Correct way to export:
module.exports = router;
