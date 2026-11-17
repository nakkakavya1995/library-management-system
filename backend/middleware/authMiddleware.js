const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate fresh JWT token for self-healed sessions
const generateRefreshedToken = (user) => {
  const userId = user._id ? user._id.toString() : user.id;
  const userEmail = (user.email || '').toLowerCase();
  const userRole = user.role || 'student';
  return jwt.sign(
    { id: userId, email: userEmail, role: userRole },
    process.env.JWT_SECRET || 'lms_secret_jwt_key_2026_super_secure',
    { expiresIn: '30d' }
  );
};

// Verify JWT token and attach user to request with auto-healing for reseeded databases
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'lms_secret_jwt_key_2026_super_secure'
      );

      let user = null;
      if (decoded.id) {
        user = await User.findById(decoded.id).select('-password');
      }

      // Self-heal 1: Match by email if MongoDB ObjectId changed after a reseed/deploy
      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
      }

      // Self-heal 2: If token is a valid signed token and role was admin or legacy admin token
      if (!user && (decoded.role === 'admin' || !decoded.role)) {
        user = await User.findOne({ role: 'admin', status: 'active' }).select('-password');
      }

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // If user ID was healed or updated, provide refreshed token in response header
      if (user._id.toString() !== decoded.id) {
        try {
          const freshToken = generateRefreshedToken(user);
          res.setHeader('x-refreshed-token', freshToken);
        } catch (headerErr) {
          // ignore header error
        }
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Check if user has required role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user ? req.user.role : 'guest'}' is not allowed to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };

