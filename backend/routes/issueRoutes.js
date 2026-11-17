const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getAllBorrowings,
  getMyBorrowings,
  requestRenewal,
  handleRenewalRequest,
  requestReturn,
  acceptReturnRequest,
  payFine,
  sendOverdueNotification
} = require('../controllers/issueController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Student routes
router.get('/my-borrowings', protect, authorizeRoles('student'), getMyBorrowings);
router.post('/:id/request-renewal', protect, authorizeRoles('student'), requestRenewal);
router.post('/:id/request-return', protect, authorizeRoles('student'), requestReturn);

// Issue & Return routes
router.get('/', protect, authorizeRoles('librarian', 'admin'), getAllBorrowings);
router.post('/', protect, authorizeRoles('librarian', 'admin'), issueBook);
router.put('/:id/return', protect, authorizeRoles('librarian', 'admin', 'student'), returnBook);
router.put('/:id/accept-return', protect, authorizeRoles('librarian', 'admin'), acceptReturnRequest);
router.put('/:id/handle-renewal', protect, authorizeRoles('librarian', 'admin'), handleRenewalRequest);
router.put('/:id/pay-fine', protect, authorizeRoles('librarian', 'admin'), payFine);
router.post('/:id/notify', protect, authorizeRoles('librarian', 'admin'), sendOverdueNotification);

module.exports = router;

