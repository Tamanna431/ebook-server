const User = require('../models/User');
const Ebook = require('../models/Ebook');
const Transaction = require('../models/Transaction');

// @desc    Get overview statistics
// @route   GET /api/admin/stats/overview
const getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalWriters = await User.countDocuments({ role: 'writer' });
    const totalEbooks = await Ebook.countDocuments();
    
    const revenueResult = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalWriters,
        totalEbooks,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get monthly sales data
// @route   GET /api/admin/stats/monthly-sales
const getMonthlySales = async (req, res) => {
  try {
    const monthlyData = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    const formattedData = monthlyData.map(item => ({
      month: `${item._id.month}/${item._id.year}`,
      sales: item.sales,
      revenue: item.revenue
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Get monthly sales error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get ebooks by genre
// @route   GET /api/admin/stats/ebooks-by-genre
const getEbooksByGenre = async (req, res) => {
  try {
    const genreData = await Ebook.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const formattedData = genreData.map(item => ({
      name: item._id,
      count: item.count
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Get ebooks by genre error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get recent users
// @route   GET /api/admin/users/recent
const getRecentUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get recent users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get recent ebooks
// @route   GET /api/admin/ebooks/recent
const getRecentEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find()
      .populate('writer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: ebooks });
  } catch (error) {
    console.error('Get recent ebooks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'writer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change own role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      data: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    await Ebook.deleteMany({ writer: user._id });
    await Transaction.deleteMany({ $or: [{ user: user._id }, { writer: user._id }] });
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all ebooks
// @route   GET /api/admin/ebooks
const getAllEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find()
      .populate('writer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: ebooks });
  } catch (error) {
    console.error('Get all ebooks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete ebook
// @route   DELETE /api/admin/ebooks/:id
const deleteEbook = async (req, res) => {
  try {
    await Ebook.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Ebook deleted successfully' });
  } catch (error) {
    console.error('Delete ebook error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .populate('ebook', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
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
};