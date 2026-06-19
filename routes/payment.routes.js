const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  handleWebhook,
  getSessionDetails,
} = require('../controllers/payment.controller');
const { validateToken } = require('../middleware/auth.middleware');

// Protected routes
router.post('/create-checkout', validateToken, createCheckoutSession);
router.get('/session/:sessionId', validateToken, getSessionDetails);

// ✅ Webhook route - MUST use express.raw() for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),  // ✅ এটি খুব গুরুত্বপূর্ণ!
  handleWebhook
);

module.exports = router;