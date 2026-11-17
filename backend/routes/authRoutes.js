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

router.get('/test-ports', async (req, res) => {
  const net = require('net');
  const ports = [587, 465, 2525, 25, 80, 443];
  const results = {};

  const testPort = (port) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.on('connect', () => {
        results[port] = 'OPEN / CONNECTED';
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        results[port] = 'TIMEOUT (Blocked by firewall)';
        socket.destroy();
        resolve();
      });
      socket.on('error', (err) => {
        results[port] = `ERROR: ${err.message}`;
        socket.destroy();
        resolve();
      });
      socket.connect(port, 'smtp.gmail.com');
    });
  };

  for (const p of ports) {
    await testPort(p);
  }

  res.json({ results });
});

module.exports = router;

