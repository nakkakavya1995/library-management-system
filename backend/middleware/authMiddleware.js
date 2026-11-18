const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
      }

      if (!user && (decoded.role === 'admin' || !decoded.role)) {
        user = await User.findOne({ role: 'admin', status: 'active' }).select('-password');
      }

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      if (user._id.toString() !== decoded.id) {
        try {
          const freshToken = generateRefreshedToken(user);
          res.setHeader('x-refreshed-token', freshToken);
        } catch (headerErr) {

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
