const axios = require('axios');
const FormData = require('form-data');

const uploadToImgBB = async (base64Image) => {
  try {
    if (!process.env.IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY not configured');
    }

    console.log('📤 Uploading image to imgBB...');
    console.log('📏 Image size:', (base64Image.length / 1024).toFixed(2), 'KB');

    const formData = new FormData();
    formData.append('image', base64Image);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: 50 * 1024 * 1024,  // 50MB
        maxBodyLength: 50 * 1024 * 1024,      // 50MB
        timeout: 60000,  // 60 seconds
      }
    );

    console.log('✅ Image uploaded to imgBB:', response.data.data.url);

    return response.data.data.url;
  } catch (error) {
    console.error('❌ imgBB upload error:', error.response?.data || error.message);
    
    if (error.response?.status === 413) {
      throw new Error('Image too large. Please use an image smaller than 5MB.');
    }
    
    throw new Error(error.response?.data?.error?.message || 'Image upload failed');
  }
};

module.exports = uploadToImgBB;