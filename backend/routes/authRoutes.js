const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { sendLoginAlertEmail, sendRegistrationWelcomeEmail } = require('../utils/emailService');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

router.get('/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'nakkakavya801@gmail.com';
  const type = req.query.type || 'login';

  try {
    let result;
    if (type === 'register') {
      result = await sendRegistrationWelcomeEmail({
        userName: req.query.name || 'Test Student',
        userEmail: targetEmail,
        role: 'student',
        studentId: 'STU-TEST-99'
      });
    } else {
      result = await sendLoginAlertEmail({
        userName: req.query.name || 'Test Student',
        userEmail: targetEmail,
        role: 'student'
      });
    }

    res.json({
      success: result.success,
      targetEmail,
      type,
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
