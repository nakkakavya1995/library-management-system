const Book = require('../models/Book');

const getBooks = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query).sort({ title: 1 });
    res.json({ success: true, count: books.length, books });
  } catch (error) {
    next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (error) {
    next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, description, totalCopies, price } = req.body;

    if (!title || !author || !category || totalCopies === undefined) {
      return res.status(400).json({ message: 'Please provide title, author, category, and total copies' });
    }

    const assignedIsbn = isbn && isbn.trim() ? isbn.trim() : 'BK-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const existingBook = await Book.findOne({ isbn: assignedIsbn });
    if (existingBook) {
      return res.status(400).json({ message: 'A book with this ISBN or identifier already exists' });
    }

    const parsedCopies = parseInt(totalCopies, 10);
    if (isNaN(parsedCopies) || parsedCopies < 1) {
      return res.status(400).json({ message: 'Total copies must be at least 1' });
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: assignedIsbn,
      category: category.trim(),
      description: description ? description.trim() : '',
      totalCopies: parsedCopies,
      availableCopies: parsedCopies,
      price: price ? parseFloat(price) : 0
    });

    res.status(201).json({ success: true, book });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, description, totalCopies, price } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (isbn && isbn.trim() !== book.isbn) {
      const existing = await Book.findOne({ isbn: isbn.trim() });
      if (existing) {
        return res.status(400).json({ message: 'A book with this ISBN already exists' });
      }
      book.isbn = isbn.trim();
    }

    if (totalCopies !== undefined) {
      const newTotal = parseInt(totalCopies, 10);
      if (isNaN(newTotal) || newTotal < 1) {
        return res.status(400).json({ message: 'Total copies must be at least 1' });
      }

      const currentlyIssued = book.totalCopies - book.availableCopies;
      if (newTotal < currentlyIssued) {
        return res.status(400).json({
          message: `Cannot set total copies to ${newTotal}. There are currently ${currentlyIssued} copies issued to students.`
        });
      }

      book.availableCopies = newTotal - currentlyIssued;
      book.totalCopies = newTotal;
    }

    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (category) book.category = category.trim();
    if (description !== undefined) book.description = description.trim();
    if (price !== undefined) book.price = parseFloat(price);

    const updatedBook = await book.save();
    res.json({ success: true, book: updatedBook });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const issuedCopies = book.totalCopies - book.availableCopies;
    if (issuedCopies > 0) {
      return res.status(400).json({
        message: `Cannot delete book. ${issuedCopies} copies are currently issued to students.`
      });
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories
};
