const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide book title'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Please provide author name'],
      trim: true
    },
    isbn: {
      type: String,
      default: () => 'BK-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    totalCopies: {
      type: Number,
      required: [true, 'Please provide total copies'],
      min: [1, 'Total copies must be at least 1']
    },
    availableCopies: {
      type: Number,
      required: [true, 'Please provide available copies'],
      min: [0, 'Available copies cannot be negative']
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Book', bookSchema);
