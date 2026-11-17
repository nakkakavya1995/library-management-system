const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { sendLoginAlertEmail } = require('../utils/emailService');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

router.get('/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'nakkakavya801@gmail.com';
  try {
    const result = await sendLoginAlertEmail({
      userName: req.query.name || 'Registered Test User',
      userEmail: targetEmail,
      role: 'Student'
    });
    res.json({
      success: result.success,
      targetEmail,
      result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      targetEmail,
      error: err.message
    });
  }
});

module.exports = router;

