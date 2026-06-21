const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifyPayment,
  checkPurchase,
  getWriterSales,  // ✅ নতুন import
} = require('../controllers/payment.controller');

const { validateToken, checkRole } = require('../middleware/auth.middleware');
console.log('📍 Payment routes loaded');

// Create checkout session (protected)
router.post('/create-checkout', validateToken, createCheckoutSession);

// Verify payment (protected) - NO WEBHOOK NEEDED
router.post('/verify', validateToken, verifyPayment);

// Check if user purchased an ebook (protected)
router.get('/check/:ebookId', validateToken, checkPurchase);

// ✅ নতুন route - Writer এর sales history
router.get('/writer-sales', validateToken, checkRole('writer', 'admin'), getWriterSales);

module.exports = router;