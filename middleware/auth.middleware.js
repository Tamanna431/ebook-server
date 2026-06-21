const jwt = require('jsonwebtoken');
const User = require('../models/User');

const validateToken = async (req, res, next) => {
  try {
    let token;

    // ১. হেডার থেকে টোকেন এক্সট্র্যাক্ট করা
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // ২. টোকেন না থাকলে এরর রিটার্ন করা
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    // ৩. টোকেন ভেরিফাই করা
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    // ৪. ডাটাবেজ থেকে ইউজার খুঁজে বের করা এবং পাসওয়ার্ড বাদ দেওয়া
    req.user = await User.findById(decoded.id).select('-password');

    // ৫. ইউজার যদি ডাটাবেজে না থাকে
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // ৬. সবকিছু ঠিক থাকলে পরবর্তী মিডলওয়্যার বা কন্ট্রোলারে পাঠানো
    return next();

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    next();
  };
};

module.exports = {
  validateToken,
  checkRole,
};