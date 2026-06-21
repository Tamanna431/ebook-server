const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getMonthlySales,
  getEbooksByGenre,
  getRecentUsers,
  getRecentEbooks,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllEbooks,
  deleteEbook,
  getAllTransactions,
} = require('../controllers/admin.controller');
const { validateToken, checkRole } = require('../middleware/auth.middleware');

// All routes protected - Admin only
router.use(validateToken);
router.use(checkRole('admin'));

// Stats endpoints
router.get('/stats/overview', getOverviewStats);
router.get('/stats/monthly-sales', getMonthlySales);
router.get('/stats/ebooks-by-genre', getEbooksByGenre);
router.get('/users/recent', getRecentUsers);
router.get('/ebooks/recent', getRecentEbooks);

// Management endpoints
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/ebooks', getAllEbooks);
router.patch('/ebooks/:id/publish', async (req, res) => {
  // Reuse existing ebook controller
  const { togglePublishStatus } = require('../controllers/ebook.controller');
  await togglePublishStatus(req, res);
});
router.delete('/ebooks/:id', deleteEbook);

router.get('/transactions', getAllTransactions);

module.exports = router;