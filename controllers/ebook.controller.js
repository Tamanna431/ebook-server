const Ebook = require('../models/Ebook');

// @desc    Get all ebooks with search, filter, sort, pagination
// @route   GET /api/ebooks
// @access  Public
const getAllEbooks = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Search by title
    const searchQuery = req.query.search || '';
    const searchFilter = searchQuery
      ? { title: { $regex: searchQuery, $options: 'i' } }
      : {};

    // Filter by genre
    const genreFilter = req.query.genre
      ? { genre: req.query.genre }
      : {};

    // Filter by price range
    const priceFilter = {};
    if (req.query.minPrice) priceFilter.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.$lte = parseFloat(req.query.maxPrice);
    const finalPriceFilter = Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {};

    // Filter by availability
    const availabilityFilter = req.query.available
      ? { isAvailable: req.query.available === 'true' }
      : {};

    // ✅ Filter by writer (NEW - for writer dashboard)
    const writerFilter = req.query.writer
      ? { writer: req.query.writer }
      : {};

    // ✅ Combine all filters
    const filter = {
      ...searchFilter,
      ...genreFilter,
      ...finalPriceFilter,
      ...availabilityFilter,
      ...writerFilter,
      status: 'published',
    };

    // Sort
    let sort = { createdAt: -1 };
    if (req.query.sort === 'price_low_high') sort = { price: 1 };
    if (req.query.sort === 'price_high_low') sort = { price: -1 };
    if (req.query.sort === 'title') sort = { title: 1 };

    // Query ebooks
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

// @desc    Get single ebook by ID
// @route   GET /api/ebooks/:id
// @access  Public
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
    console.error('Get ebook by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create new ebook
// @route   POST /api/ebooks
// @access  Private (Writer only)
const createEbook = async (req, res) => {
  try {
    const { title, description, price, genre, coverImage } = req.body;

    if (!title || !description || !price || !genre) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const ebook = await Ebook.create({
      title,
      description,
      price,
      genre,
      coverImage: coverImage || '',
      writer: req.user._id,
      status: 'published',
      isAvailable: true,
      soldCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Ebook created successfully',
      data: ebook,
    });
  } catch (error) {
    console.error('Create ebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update ebook
// @route   PUT /api/ebooks/:id
// @access  Private (Writer only)
const updateEbook = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if user is the writer
    if (ebook.writer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ebook',
      });
    }

    const { title, description, price, genre, coverImage, status, isAvailable } = req.body;

    const updatedEbook = await Ebook.findByIdAndUpdate(
      req.params.id,
      {
        title: title || ebook.title,
        description: description || ebook.description,
        price: price !== undefined ? price : ebook.price,
        genre: genre || ebook.genre,
        coverImage: coverImage || ebook.coverImage,
        status: status || ebook.status,
        isAvailable: isAvailable !== undefined ? isAvailable : ebook.isAvailable,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Ebook updated successfully',
      data: updatedEbook,
    });
  } catch (error) {
    console.error('Update ebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete ebook
// @route   DELETE /api/ebooks/:id
// @access  Private (Writer only)
const deleteEbook = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if user is the writer
    if (ebook.writer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ebook',
      });
    }

    await Ebook.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Ebook deleted successfully',
    });
  } catch (error) {
    console.error('Delete ebook error:', error);
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
  createEbook,
  updateEbook,
  deleteEbook,
};