const express = require('express');
const router = express.Router();
const { getDashboardStats, getActivityReports } = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/activity', protect, authorizeRoles('admin', 'librarian'), getActivityReports);

module.exports = router;

