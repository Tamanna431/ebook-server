const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  googleLogin,
  googleCallback,
} = require('../controllers/auth.controller');
const { validateToken } = require('../middleware/auth.middleware');

// ✅ Google OAuth routes (এই order গুরুত্বপূর্ণ)
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

// ✅ Custom auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', validateToken, getMe);

module.exports = router;