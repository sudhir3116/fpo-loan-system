const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const { publicServerError } = require('../utils/publicError');
const { getNotificationService } = require('../services/notificationService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register new User (FARMER or FPO_ADMIN)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, fpoName, fpoRegistrationNo, address } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, password, and phone number',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters',
      });
    }

    // Role check & Security Safeguard — never trust client role without ADMIN_SECRET_KEY
    let userRole = 'FARMER';
    if (role && role.toUpperCase() === 'FPO_ADMIN') {
      const adminSecret = process.env.ADMIN_SECRET_KEY;
      if (!adminSecret) {
        return res.status(500).json({
          status: 'error',
          message: 'Admin registration is not configured',
        });
      }
      if (!req.body.adminSecretKey || req.body.adminSecretKey !== adminSecret) {
        return res.status(403).json({
          status: 'fail',
          message: 'Forbidden: Valid Admin Secret Key is required to register as FPO_ADMIN',
        });
      }
      userRole = 'FPO_ADMIN';
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email address already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole,
      fpoName,
      fpoRegistrationNo,
      address,
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    try {
      await getNotificationService().notify({
        userId: user._id,
        type: 'USER_REGISTERED',
        title: 'Welcome to the FPO loan portal',
        body: 'Your account was created successfully. You can now apply for a loan and upload documents.',
        entityType: 'User',
        entityId: user._id,
      });
    } catch (notifyErr) {
      console.error('[notify] USER_REGISTERED', notifyErr.message);
    }

    // Response user payload without password
    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      fpoName: user.fpoName,
      fpoRegistrationNo: user.fpoRegistrationNo,
      address: user.address,
      kycVerified: user.kycVerified,
      status: user.status,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      status: 'success',
      token,
      data: {
        user: userPayload,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: publicServerError(error, 'Server error during registration'),
    });
  }
};

// @desc    Authenticate User & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // Account status check
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        status: 'fail',
        message: 'Account is inactive or suspended',
      });
    }

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Response user payload without password
    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      fpoName: user.fpoName,
      fpoRegistrationNo: user.fpoRegistrationNo,
      address: user.address,
      kycVerified: user.kycVerified,
      status: user.status,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userPayload,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: publicServerError(error, 'Server error during login'),
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: publicServerError(error, 'Server error fetching user profile'),
    });
  }
};

// @desc    Authenticate User via Google ID token
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const idToken = req.body.idToken || req.body.token || req.body.credential;

    if (!idToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Google ID token is required',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        status: 'error',
        message: 'Google client ID is not configured on the server',
      });
    }

    // Verify token with Google's official library
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired Google token',
      });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({
        status: 'fail',
        message: 'Google token does not contain a valid email address',
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || email.split('@')[0] || 'Google User';

    // 1. Check if user already exists with this googleId
    let user = await User.findOne({ googleId });

    // 2. If not found by googleId, check by email
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Safely link Google identity to existing account
        // DO NOT change the user's existing role!
        user.googleId = googleId;
        await user.save();
      }
    }

    // 3. If no user exists, create a new user with default role FARMER
    // NEVER allow frontend or Google token to create an FPO_ADMIN account
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        role: 'FARMER',
        status: 'ACTIVE',
      });
    }

    // 4. Account status check
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        status: 'fail',
        message: 'Account is inactive or suspended',
      });
    }

    // 5. Generate existing application JWT
    const token = generateToken(user._id, user.role);

    // 6. Return standard user payload
    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      fpoName: user.fpoName,
      fpoRegistrationNo: user.fpoRegistrationNo,
      address: user.address,
      kycVerified: user.kycVerified,
      status: user.status,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userPayload,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: publicServerError(error, 'Server error during Google authentication'),
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleAuth,
};
