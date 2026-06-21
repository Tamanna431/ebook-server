const Ebook = require('../models/Ebook');
const Transaction = require('../models/Transaction');

// @desc    Get all ebooks with filtering, sorting, pagination
// @route   GET /api/ebooks
// @access  Public
const getAllEbooks = async (req, res) => {
  try {
    const { 
      search, 
      genre, 
      minPrice, 
      maxPrice, 
      availability, 
      sort, 
      page = 1, 
      limit = 12 
    } = req.query;

    // Build query
    let query = {};

    // Search by title or writer name
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by genre
    if (genre && genre !== 'All Genres') {
      query.genre = genre;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by availability
    if (availability === 'sold') {
      query.soldCount = { $gt: 0 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'popular':
        sortOption = { soldCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const ebooks = await Ebook.find(query)
      .populate('writer', 'name email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Ebook.countDocuments(query);

    res.status(200).json({
      success: true,
      data: ebooks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all ebooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ebooks',
      error: error.message,
    });
  }
};

// @desc    Get single ebook by ID
// @route   GET /api/ebooks/:id
// @access  Public
const getEbookById = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id)
      .populate('writer', 'name email avatar');

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
      message: 'Server error fetching ebook',
      error: error.message,
    });
  }
};

// @desc    Create new ebook
// @route   POST /api/ebooks
// @access  Private (Writer/Admin)


// @desc    Create new ebook
// @route   POST /api/ebooks
// @access  Private (Writer/Admin)
const createEbook = async (req, res) => {
  try {
    const { title, description, price, genre, coverImage, pdfUrl } = req.body;

    console.log('📚 Creating ebook with data:', { title, description, price, genre });
    console.log('👤 Writer ID:', req.user._id);

    // ✅ Better validation with clear messages
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters',
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters',
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
      });
    }

    if (!genre) {
      return res.status(400).json({
        success: false,
        message: 'Please select a genre',
      });
    }

    const ebook = await Ebook.create({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      genre,
      writer: req.user._id,
      coverImage: coverImage || 'https://via.placeholder.com/300x450?text=No+Cover',
      pdfUrl: pdfUrl || '',
      isPublished: true,
    });

    console.log('✅ Ebook created successfully:', ebook._id);

    res.status(201).json({
      success: true,
      message: 'Ebook created successfully',
      data: ebook,
    });
  } catch (error) {
    console.error('❌ Create ebook error:', error);
    console.error('❌ Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating ebook',
      error: error.message,
    });
  }
};
// @desc    Toggle ebook publish status
// @route   PATCH /api/ebooks/:id/publish
// @access  Private (Writer)
const togglePublishStatus = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if user is the writer or admin
    if (ebook.writer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ebook',
      });
    }

    // Toggle publish status
    ebook.isPublished = !ebook.isPublished;
    await ebook.save();

    console.log(`✅ Ebook ${ebook.isPublished ? 'published' : 'unpublished'}:`, ebook._id);

    res.status(200).json({
      success: true,
      message: `Ebook ${ebook.isPublished ? 'published' : 'unpublished'} successfully`,
      data: ebook,
    });
  } catch (error) {
    console.error('❌ Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling publish status',
      error: error.message,
    });
  }
};

// @desc    Update ebook
// @route   PUT /api/ebooks/:id
// @access  Private (Writer/Admin)
const updateEbook = async (req, res) => {
  try {
    let ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if user is the writer or admin
    if (ebook.writer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ebook',
      });
    }

    ebook = await Ebook.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Ebook updated successfully',
      data: ebook,
    });
  } catch (error) {
    console.error('Update ebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating ebook',
      error: error.message,
    });
  }
};

// @desc    Delete ebook
// @route   DELETE /api/ebooks/:id
// @access  Private (Writer/Admin)
const deleteEbook = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: 'Ebook not found',
      });
    }

    // Check if user is the writer or admin
    if (ebook.writer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
      message: 'Server error deleting ebook',
      error: error.message,
    });
  }
};

// @desc    Get writer's own ebooks
// @route   GET /api/ebooks/my-ebooks
// @access  Private (Writer)
const getMyEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find({ writer: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: ebooks,
    });
  } catch (error) {
    console.error('Get my ebooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your ebooks',
      error: error.message,
    });
  }
};

// @desc    Get featured ebooks
// @route   GET /api/ebooks/featured
// @access  Public
const getFeaturedEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find()
      .populate('writer', 'name email avatar')
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: ebooks,
    });
  } catch (error) {
    console.error('Get featured ebooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured ebooks',
      error: error.message,
    });
  }
};

// @desc    Get top selling ebooks
// @route   GET /api/ebooks/top-selling
// @access  Public
const getTopSellingEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find()
      .populate('writer', 'name email avatar')
      .sort({ soldCount: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: ebooks,
    });
  } catch (error) {
    console.error('Get top selling ebooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top selling ebooks',
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
  getMyEbooks,
  getTopSellingEbooks,
  getFeaturedEbooks,
   togglePublishStatus,
};