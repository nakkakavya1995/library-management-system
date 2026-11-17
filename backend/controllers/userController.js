const User = require('../models/User');

// @desc   Get all users (with optional role filter or search)
// @route  GET /api/users
// @access Private (Admin, Librarian)
const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single user by ID
// @route  GET /api/users/:id
// @access Private (Admin)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc   Create a user (Admin only, can create Librarian or Student)
// @route  POST /api/users
// @access Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, phone, status, permissions } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['librarian', 'student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId: studentId || '',
      phone: phone || '',
      status: status || 'active',
      permissions: permissions || {
        manageBooks: true,
        circulation: true,
        manageUsers: role === 'admin',
        viewReports: true
      }
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update user details
// @route  PUT /api/users/:id
// @access Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, studentId, phone, status, password, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.studentId = studentId !== undefined ? studentId : user.studentId;
    user.phone = phone !== undefined ? phone : user.phone;
    user.status = status || user.status;

    if (permissions) {
      user.permissions = {
        ...user.permissions,
        ...permissions
      };
    }

    if (password && password.trim() !== '') {
      user.password = password; // Will be hashed by pre('save') hook
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        studentId: updatedUser.studentId,
        phone: updatedUser.phone,
        status: updatedUser.status,
        permissions: updatedUser.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a user
// @route  DELETE /api/users/:id
// @access Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

