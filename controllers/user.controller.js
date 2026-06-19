const User = require('../models/User');
const Ebook = require('../models/Ebook');
const Transaction = require('../models/Transaction');
const Bookmark = require('../models/Bookmark');

// @desc    Get top writers by sales
// @route   GET /api/users/top-writers
// @access  Public
const getTopWriters = async (req, res) => {
  try {
    const topWriters = await Ebook.aggregate([
      {
        $group: {
          _id: '$writer',
          totalSales: { $sum: '$soldCount' },
          totalEbooks: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'writerInfo',
        },
      },
      { $unwind: '$writerInfo' },
      {
        $project: {
          _id: '$_id',
          name: '$writerInfo.name',
          email: '$writerInfo.email',
          avatar: '$writerInfo.avatar',
          totalSales: 1,
          totalEbooks: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: topWriters,
    });
  } catch (error) {
    console.error('Get top writers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top writers',
      error: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message,
    });
  }
};

// @desc    Get user's purchase history
// @route   GET /api/users/me/purchases
// @access  Private
const getMyPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'purchase',
      status: 'completed',
    })
      .populate('ebook', 'title coverImage price writer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({
      user: req.user._id,
      type: 'purchase',
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching purchases',
      error: error.message,
    });
  }
};

// @desc    Get user's purchased ebooks
// @route   GET /api/users/me/purchased-ebooks
// @access  Private
const getMyPurchasedEbooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Get completed purchase transactions
    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'purchase',
      status: 'completed',
    })
      .populate({
        path: 'ebook',
        populate: { path: 'writer', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const ebooks = transactions.map((t) => t.ebook).filter((e) => e);

    const total = await Transaction.countDocuments({
      user: req.user._id,
      type: 'purchase',
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      data: ebooks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get purchased ebooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching purchased ebooks',
      error: error.message,
    });
  }
};

// @desc    Add bookmark
// @route   POST /api/users/bookmarks/:ebookId
// @access  Private
const addBookmark = async (req, res) => {
  try {
    const { ebookId } = req.params;

    // Check if ebook exists
    const ebook = await Ebook.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if already bookmarked
    const existing = await Bookmark.findOne({
      user: req.user._id,
      ebook: ebookId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already bookmarked',
      });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      ebook: ebookId,
    });

    res.status(201).json({
      success: true,
      message: 'Bookmark added successfully',
      data: bookmark,
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding bookmark',
      error: error.message,
    });
  }
};

// @desc    Remove bookmark
// @route   DELETE /api/users/bookmarks/:ebookId
// @access  Private
const removeBookmark = async (req, res) => {
  try {
    const { ebookId } = req.params;

    await Bookmark.deleteOne({
      user: req.user._id,
      ebook: ebookId,
    });

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing bookmark',
      error: error.message,
    });
  }
};

// @desc    Get user's bookmarks
// @route   GET /api/users/me/bookmarks
// @access  Private
const getMyBookmarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'ebook',
        populate: { path: 'writer', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const ebooks = bookmarks.map((b) => b.ebook).filter((e) => e);

    const total = await Bookmark.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: ebooks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookmarks',
      error: error.message,
    });
  }
};

// @desc    Check if ebook is bookmarked
// @route   GET /api/users/bookmarks/check/:ebookId
// @access  Private
const checkBookmark = async (req, res) => {
  try {
    const { ebookId } = req.params;

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      ebook: ebookId,
    });

    res.status(200).json({
      success: true,
      data: { isBookmarked: !!bookmark },
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking bookmark',
      error: error.message,
    });
  }
};

module.exports = {
  getTopWriters,
  getMyProfile,
  getMyPurchases,
  getMyPurchasedEbooks,
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  checkBookmark,
};