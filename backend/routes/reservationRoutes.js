const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation
} = require('../controllers/reservationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Student routes
router.get('/my-reservations', protect, authorizeRoles('student'), getMyReservations);
router.post('/', protect, authorizeRoles('student'), createReservation);
router.put('/:id/cancel', protect, authorizeRoles('student'), cancelReservation);

// Librarian & Admin routes
router.get('/', protect, authorizeRoles('librarian', 'admin'), getAllReservations);
router.put('/:id/status', protect, authorizeRoles('librarian', 'admin'), updateReservationStatus);

module.exports = router;

