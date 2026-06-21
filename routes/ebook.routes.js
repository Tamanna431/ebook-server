const express = require('express');
const router = express.Router();
const {
  getAllEbooks,
  getEbookById,
  createEbook,
  updateEbook,
  deleteEbook,
  getMyEbooks,
  getTopSellingEbooks,
  getFeaturedEbooks,
  togglePublishStatus,  // ✅ Import করুন
} = require('../controllers/ebook.controller');
const { validateToken, checkRole } = require('../middleware/auth.middleware');

// ✅ Public routes (specific routes আগে)
router.get('/', getAllEbooks);
router.get('/featured', getFeaturedEbooks);
router.get('/top-selling', getTopSellingEbooks);

// ✅ Protected routes - Writer এর নিজস্ব routes (/:id এর আগে!)
router.get('/my-ebooks', validateToken, checkRole('writer', 'admin'), getMyEbooks);

// ✅ নতুন route - Publish/Unpublish
router.patch('/:id/publish', validateToken, checkRole('writer', 'admin'), togglePublishStatus);

// ✅ Dynamic route (সবচেয়ে শেষে!)
router.get('/:id', getEbookById);

// ✅ Protected routes (create, update, delete)
router.post('/', validateToken, checkRole('writer', 'admin'), createEbook);
router.put('/:id', validateToken, checkRole('writer', 'admin'), updateEbook);
router.delete('/:id', validateToken, checkRole('writer', 'admin'), deleteEbook);

module.exports = router;