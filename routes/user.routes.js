const express = require('express');
const router = express.Router();
const {
  getTopWriters,
  getMyProfile,
  getMyPurchases,
  getMyPurchasedEbooks,
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  checkBookmark,
} = require('../controllers/user.controller');
const { validateToken } = require('../middleware/auth.middleware');

// Public routes
router.get('/top-writers', getTopWriters);

// Protected routes
router.get('/me', validateToken, getMyProfile);
router.get('/me/purchases', validateToken, getMyPurchases);
router.get('/me/purchased-ebooks', validateToken, getMyPurchasedEbooks);
router.get('/me/bookmarks', validateToken, getMyBookmarks);

// Bookmark routes
router.post('/bookmarks/:ebookId', validateToken, addBookmark);
router.delete('/bookmarks/:ebookId', validateToken, removeBookmark);
router.get('/bookmarks/check/:ebookId', validateToken, checkBookmark);

module.exports = router;