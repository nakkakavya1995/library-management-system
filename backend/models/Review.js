const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ book: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
