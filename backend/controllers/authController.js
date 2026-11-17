const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendLoginAlertEmail, sendRegistrationWelcomeEmail } = require('../utils/emailService');

// Helper to generate JWT token with user identity context
const generateToken = (userOrId) => {
  let id = '';
  let email = '';
  let role = 'student';

  if (typeof userOrId === 'object' && userOrId !== null) {
    id = userOrId._id ? userOrId._id.toString() : (userOrId.id || '');
    email = (userOrId.email || '').toLowerCase();
    role = userOrId.role || 'student';
  } else {
    id = userOrId ? userOrId.toString() : '';
  }

  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'lms_secret_jwt_key_2026_super_secure',
    { expiresIn: '30d' }
  );
};

// @desc   Register a new student
// @route  POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Students can only register with role 'student'
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      studentId: studentId || '',
      phone: phone || ''
    });

    const token = generateToken(user);

    // Send welcome email on registration in background (non-blocking)
    sendRegistrationWelcomeEmail({
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      studentId: user.studentId
    }).catch((emailErr) => {
      console.error('[Auth Controller] Error dispatching registration welcome email:', emailErr.message);
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Login user (Admin, Librarian, Student)
// @route  POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const identifier = (email || '').trim();
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${escapeRegex(identifier)}$`, 'i') } },
        { name: { $regex: new RegExp(`^${escapeRegex(identifier)}$`, 'i') } },
        { studentId: identifier }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    // Send automatic login notification email in background (non-blocking)
    sendLoginAlertEmail({
      userName: user.name,
      userEmail: user.email,
      role: user.role
    }).catch((emailErr) => {
      console.error('[Auth Controller] Error dispatching login alert email:', emailErr.message);
    });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get current logged-in user profile
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc   Update current logged-in user profile (Name, Phone, Student ID, Password)
// @route  PUT /api/auth/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, studentId, password, notificationPreferences } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (studentId !== undefined) user.studentId = studentId.trim();

    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password; // Hashed by pre-save hook
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        studentId: updatedUser.studentId,
        phone: updatedUser.phone,
        notificationPreferences: updatedUser.notificationPreferences,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Google Sign-In / Sign-Up with Firebase
// @route  POST /api/auth/google
// @access Public
const googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, photoUrl } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google authentication' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });
      }

      // Link googleId or photoUrl if missing
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (photoUrl) user.photoUrl = photoUrl;
        await user.save();
      }
    } else {
      // Automatically register new user as student
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';

      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: randomPassword,
        role: 'student',
        authProvider: 'google',
        googleId: googleId || '',
        photoUrl: photoUrl || '',
        status: 'active',
        studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000)
      });
    }

    const token = generateToken(user);

    // Send automatic login notification email in background (non-blocking)
    sendLoginAlertEmail({
      userName: user.name,
      userEmail: user.email,
      role: user.role
    }).catch((emailErr) => {
      console.error('[Google Auth] Failed to dispatch login alert email:', emailErr.message);
    });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
        photoUrl: user.photoUrl,
        authProvider: user.authProvider
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile
};

