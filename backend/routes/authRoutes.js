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

// Diagnostic test endpoint to test email delivery in real-time
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

router.get('/test-ports', async (req, res) => {
  const net = require('net');
  const hosts = [
    { host: 'smtp.gmail.com', port: 465 },
    { host: 'smtp.gmail.com', port: 587 },
    { host: 'smtp-relay.brevo.com', port: 587 },
    { host: 'smtp-relay.brevo.com', port: 2525 },
    { host: 'smtp.sendgrid.net', port: 2525 },
    { host: 'smtp.mailgun.org', port: 2525 },
    { host: 'smtp.elasticemail.com', port: 2525 }
  ];
  const results = {};

  const testOne = ({ host, port }) => {
    return new Promise((resolve) => {
      const key = `${host}:${port}`;
      const socket = new net.Socket();
      socket.setTimeout(2500);
      socket.on('connect', () => {
        results[key] = 'OPEN / CONNECTED';
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        results[key] = 'TIMEOUT (Blocked)';
        socket.destroy();
        resolve();
      });
      socket.on('error', (err) => {
        results[key] = `ERROR: ${err.message}`;
        socket.destroy();
        resolve();
      });
      socket.connect(port, host);
    });
  };

  for (const h of hosts) {
    await testOne(h);
  }

  res.json({ results });
});

module.exports = router;

