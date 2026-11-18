const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories
} = require('../controllers/bookController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/categories', protect, getCategories);
router.get('/', protect, getBooks);
router.get('/:id', protect, getBookById);

router.post('/', protect,  authorizeRoles('librarian', 'admin'), createBook);
router.put('/:id', protect, authorizeRoles('librarian', 'admin'), updateBook);
router.delete('/:id', protect, authorizeRoles('librarian', 'admin'), deleteBook);

module.exports = router;
