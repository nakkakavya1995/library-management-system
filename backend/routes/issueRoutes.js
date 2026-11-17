const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getAllBorrowings,
  getMyBorrowings,
  requestRenewal,
  handleRenewalRequest,
  payFine,
  sendOverdueNotification
} = require('../controllers/issueController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Student routes
router.get('/my-borrowings', protect, authorizeRoles('student'), getMyBorrowings);
router.post('/:id/request-renewal', protect, authorizeRoles('student'), requestRenewal);

// Librarian & Admin routes
router.get('/', protect, authorizeRoles('librarian', 'admin'), getAllBorrowings);
router.post('/', protect, authorizeRoles('librarian', 'admin'), issueBook);
router.put('/:id/return', protect, authorizeRoles('librarian', 'admin'), returnBook);
router.put('/:id/handle-renewal', protect, authorizeRoles('librarian', 'admin'), handleRenewalRequest);
router.put('/:id/pay-fine', protect, authorizeRoles('librarian', 'admin'), payFine);
router.post('/:id/notify', protect, authorizeRoles('librarian', 'admin'), sendOverdueNotification);

module.exports = router;

