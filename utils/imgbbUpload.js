const axios = require('axios');
const FormData = require('form-data');

/**
 * Upload image to imgBB
 * @param {string} imageBase64 - Base64 encoded image (without data:image/...;base64, prefix)
 * @returns {Promise<string>} - Image URL
 */
const uploadToImgBB = async (imageBase64) => {
  try {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      throw new Error('IMGBB_API_KEY is not configured');
    }

    const formData = new FormData();
    formData.append('image', imageBase64);
    formData.append('key', apiKey);

    const response = await axios.post(
      'https://api.imgbb.com/1/upload',
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: 10 * 1024 * 1024, // 10MB max
      }
    );

    if (response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error(response.data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('imgBB upload error:', error.response?.data || error.message);
    throw new Error('Image upload failed');
  }
};

module.exports = uploadToImgBB;