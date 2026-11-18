const Review = require('../models/Review');
const IssueRecord = require('../models/IssueRecord');
const Book = require('../models/Book');

const addReview = async (req, res, next) => {
  try {
    const { bookId, rating, comment } = req.body;

    if (!bookId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide bookId, rating, and comment' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const hasBorrowed = await IssueRecord.findOne({
      book: bookId,
      student: req.user._id
    });

    if (!hasBorrowed) {
      return res.status(403).json({
        message: 'You can only submit reviews for books you have previously borrowed.'
      });
    }

    const existingReview = await Review.findOne({
      book: bookId,
      student: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already submitted a review for this book'
      });
    }

    const review = await Review.create({
      book: bookId,
      student: req.user._id,
      rating: numRating,
      comment: comment.trim()
    });

    const populatedReview = await Review.findById(review._id)
      .populate('student', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview
    });
  } catch (error) {
    next(error);
  }
};

const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ book: bookId })
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const avgRating = total > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1)
      : 0;

    res.json({
      success: true,
      count: total,
      averageRating: parseFloat(avgRating),
      reviews
    });
  } catch (error) {
    next(error);
  }
};

const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('book', 'title author isbn category')
      .populate('student', 'name studentId email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review removed successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ student: req.user._id })
      .populate('book', 'title author category')
      .sort({ createdAt: -1 });

    const reviewedBookIds = reviews.map((r) => (r.book?._id ? r.book._id.toString() : ''));

    const returnedIssues = await IssueRecord.find({
      student: req.user._id,
      status: 'returned'
    })
      .populate('book', 'title author category')
      .sort({ returnDate: -1 });

    const pendingMap = new Map();
    for (const issue of returnedIssues) {
      if (issue.book && !reviewedBookIds.includes(issue.book._id.toString())) {
        if (!pendingMap.has(issue.book._id.toString())) {
          pendingMap.set(issue.book._id.toString(), {
            book: issue.book,
            returnedDate: issue.returnDate
          });
        }
      }
    }

    res.json({
      success: true,
      myReviews: reviews,
      pendingReviews: Array.from(pendingMap.values())
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  getBookReviews,
  getAllReviews,
  deleteReview,
  getMyReviews
};
