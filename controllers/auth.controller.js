const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const axios = require('axios');

// @desc    Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const validRoles = ['user', 'writer'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      isVerified: true,
    });

    const token = generateToken(user._id, user.role);

    console.log('✅ User registered:', user.email, 'Role:', user.role);

    // ✅ এই অংশটি খুব গুরুত্বপূর্ণ - token এবং user data ফেরত দিতে হবে
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,  // ← Token ফেরত দিতে হবে
      user: {  // ← User data ফেরত দিতে হবে
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
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    console.log('✅ User logged in:', user.email, 'Role:', user.role);

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

const googleLogin = (req, res) => {
  try {
    // ✅ সরাসরি role নিন, decode করবেন না
    const role = req.query.role || 'user';
    console.log('🔔 Google login initiated with role:', role);
    
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ Google Client ID not configured');
      return res.status(500).json({
        success: false,
        message: 'Google Client ID not configured',
      });
    }
    
    // ✅ Cookie তে সরাসরি role save করুন (base64 encode করবেন না)
    res.cookie('google_signup_role', role, { 
      httpOnly: true, 
      maxAge: 5 * 60 * 1000, // 5 minutes
      sameSite: 'lax',
      secure: false // development এর জন্য false
    });
    
    console.log('👤 Role saved in cookie:', role);
    
    // ✅ State parameter এও role পাঠান (simple string, base64 না)
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${role}`; // ✅ সরাসরি role পাঠান
    
    console.log('🔄 Redirecting to Google OAuth...');
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login',
      error: error.message,
    });
  }
};


// @desc    Google OAuth callback
const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

    // ✅ Cookie থেকে role নিন
    let selectedRole = req.cookies?.google_signup_role || 'user';
    console.log('👤 Role from cookie:', selectedRole);

    // ✅ যদি cookie না থাকে, state থেকে নিন
    if (!req.cookies?.google_signup_role && state) {
      selectedRole = state;
      console.log('👤 Role from state:', selectedRole);
    }

    // Clear cookie
    res.clearCookie('google_signup_role');

    if (!code) {
      console.error('❌ No authorization code provided');
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=no_code`
      );
    }

    console.log('🔄 Exchanging code for tokens...');

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

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = userInfoResponse.data;
    console.log('✅ User info received:', userInfo.email);

    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      console.log('🆕 Creating NEW user from Google signup...');
      console.log('👤 Assigned role:', selectedRole);
      
      user = await User.create({
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        googleId: userInfo.id,
        role: selectedRole,
        isVerified: true,
      });
      
      console.log('✅ New user created with role:', user.role);
    } else {
      console.log('✅ Existing user found');
      console.log('👤 Previous role:', user.role);
      console.log('👤 New selected role:', selectedRole);
      
      if (!user.googleId) {
        user.googleId = userInfo.id;
      }
      
      if (userInfo.picture && user.avatar !== userInfo.picture) {
        user.avatar = userInfo.picture;
      }
      
      // ✅ Role update করুন যা user select করেছে
      if (user.role !== selectedRole) {
        console.log('🔄 Updating role from', user.role, 'to', selectedRole);
        user.role = selectedRole;
      }
      
      await user.save();
      console.log('✅ User saved with role:', user.role);
    }

    const token = generateToken(user._id, user.role);
    console.log('✅ JWT token generated');
    console.log('👤 Final role for redirect:', user.role);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;

    console.log('🔄 Redirecting to frontend...');
    res.redirect(frontendUrl);
  } catch (error) {
    console.error('❌ Google callback error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_callback_failed`
    );
  }
};
// @desc    Update user role
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'writer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Role updated to:', role);

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleLogin,
  googleCallback,
  updateRole,
};