const express = require('express');
const router = express.Router();
const {
  addReview,
  getBookReviews,
  getAllReviews,
  deleteReview,
  getMyReviews
} = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/book/:bookId', protect, getBookReviews);
router.get('/my-reviews', protect, authorizeRoles('student'), getMyReviews);
router.post('/', protect, authorizeRoles('student'), addReview);

router.get('/', protect, authorizeRoles('librarian', 'admin'), getAllReviews);
router.delete('/:id', protect, authorizeRoles('librarian', 'admin'), deleteReview);

module.exports = router;
