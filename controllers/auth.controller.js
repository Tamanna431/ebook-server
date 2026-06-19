const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const axios = require('axios');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    console.log('✅ User registered:', user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    console.log('✅ User logged in:', user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('❌ Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
// @access  Public
const googleLogin = (req, res) => {
  try {
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    console.log('🔄 Redirecting to Google OAuth...');
    console.log('📍 Redirect URI:', redirectUri);
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login initiation',
      error: error.message,
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

    if (!code) {
      console.error('❌ No authorization code provided');
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=no_code`
      );
    }

    console.log('🔄 Exchanging code for tokens...');

    // Exchange code for tokens using axios
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', 
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens = tokenResponse.data;

    if (!tokens.access_token) {
      console.error('❌ Failed to get access token');
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=token_exchange_failed`
      );
    }

    console.log('✅ Access token received');
    console.log('🔄 Getting user info from Google...');

    // Get user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = userInfoResponse.data;

    console.log('✅ User info received:', userInfo.email);

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      console.log('🆕 Creating new user from Google login...');
      user = await User.create({
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        googleId: userInfo.id,
        role: 'user',
        isVerified: true,
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      console.log('🔗 Linking Google account to existing user...');
      user.googleId = userInfo.id;
      user.avatar = userInfo.picture;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    console.log('✅ JWT token generated');
    console.log('🔄 Redirecting to frontend with token...');

    // Redirect to frontend with token
    const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      })
    )}`;

    res.redirect(frontendUrl);
  } catch (error) {
    console.error('❌ Google callback error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_callback_failed`
    );
  }
};


module.exports = {
  register,
  login,
  getMe,
  googleLogin,
  googleCallback,
};