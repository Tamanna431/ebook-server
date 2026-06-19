const Ebook = require('../models/Ebook');

// @desc    Get all ebooks
const getAllEbooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search || '';
    const searchFilter = searchQuery
      ? { $or: [{ title: { $regex: searchQuery, $options: 'i' } }] }
      : {};

    const genreFilter = req.query.genre
      ? { genre: { $in: req.query.genre.split(',') } }
      : {};

    const filter = {
      ...searchFilter,
      ...genreFilter,
      status: 'published',
    };

    let sort = { createdAt: -1 };
    if (req.query.sort === 'price_low_high') sort = { price: 1 };
    if (req.query.sort === 'price_high_low') sort = { price: -1 };

    const ebooks = await Ebook.find(filter)
      .populate('writer', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalEbooks = await Ebook.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: ebooks,
      pagination: {
        total: totalEbooks,
        page,
        pages: Math.ceil(totalEbooks / limit),
      },
    });
  } catch (error) {
    console.error('Get all ebooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single ebook
const getEbookById = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id).populate('writer', 'name email avatar');

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    res.status(200).json({
      success: true,
      data: ebook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getAllEbooks,
  getEbookById,
};