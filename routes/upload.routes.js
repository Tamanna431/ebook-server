const express = require('express');
const router = express.Router();
const uploadToImgBB = require('../utils/imgbbUpload');
const { validateToken } = require('../middleware/auth.middleware');

// @desc    Upload image to imgBB
// @route   POST /api/upload
// @access  Private
router.post('/', validateToken, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image',
      });
    }

    // Remove data:image/...;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const imageUrl = await uploadToImgBB(base64Data);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: imageUrl },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  }
});

module.exports = router;