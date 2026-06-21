const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe,
  googleLogin,
  googleCallback,
  updateRole 
} = require('../controllers/auth.controller');
const { validateToken } = require('../middleware/auth.middleware');

console.log('📍 Auth routes loaded');

router.post('/register', register);
router.post('/login', login);
router.get('/me', validateToken, getMe);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.patch('/update-role', validateToken, updateRole);

module.exports = router;