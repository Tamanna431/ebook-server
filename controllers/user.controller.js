const User = require('../models/User');
const Ebook = require('../models/Ebook');

// @desc    Get top writers by sales
// @route   GET /api/users/top-writers
// @access  Public
const getTopWriters = async (req, res) => {
  try {
    // Aggregate ebooks by writer and sum soldCount
    const topWriters = await Ebook.aggregate([
      {
        $group: {
          _id: '$writer',
          totalSales: { $sum: '$soldCount' },
          totalEbooks: { $sum: 1 },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
      {
        $limit: 3,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'writerInfo',
        },
      },
      {
        $unwind: '$writerInfo',
      },
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

module.exports = {
  getTopWriters,
};