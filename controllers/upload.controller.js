const axios = require('axios');
const FormData = require('form-data');
const { uploadToImgBB } = require('../controllers/upload.controller');
const { validateToken } = require('../middleware/auth.middleware');

// @desc    Upload image to imgBB
// @route   POST /api/upload/image
// @access  Private
const uploadToImgBB = async (req, res) => {
  try {
    const { image } = req.body; // Base64 encoded image

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image provided',
      });
    }

    // Check if API key is configured
    if (!process.env.IMGBB_API_KEY) {
      console.error('❌ IMGBB_API_KEY not configured');
      return res.status(500).json({
        success: false,
        message: 'Image upload service not configured',
      });
    }

    console.log('📤 Uploading image to imgBB...');

    const formData = new FormData();
    formData.append('image', image);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: 10 * 1024 * 1024, // 10MB
        maxBodyLength: 10 * 1024 * 1024,
      }
    );

    console.log('✅ Image uploaded to imgBB:', response.data.data.url);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: response.data.data.url,
        display_url: response.data.data.display_url,
        delete_url: response.data.data.delete_url,
      },
    });
  } catch (error) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};

module.exports = {
  uploadToImgBB,
};