const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const IssueRecord = require('../models/IssueRecord');
const { sendReservationApprovedEmail } = require('../utils/emailService');

const createReservation = async (req, res, next) => {
  try {
    const { bookId, notes } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const activelyBorrowed = await IssueRecord.findOne({
      book: bookId,
      student: req.user._id,
      status: 'issued'
    });
    if (activelyBorrowed) {
      return res.status(400).json({
        message: 'You already currently have this book borrowed.'
      });
    }

    const existingReservation = await Reservation.findOne({
      book: bookId,
      student: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });
    if (existingReservation) {
      return res.status(400).json({
        message: 'You already have an active reservation for this book'
      });
    }

    const reservation = await Reservation.create({
      book: bookId,
      student: req.user._id,
      notes: notes || '',
      status: 'pending'
    });

    const populated = await Reservation.findById(reservation._id)
      .populate('book', 'title author isbn category availableCopies');

    res.status(201).json({
      success: true,
      message: 'Reservation request submitted successfully',
      reservation: populated
    });
  } catch (error) {
    next(error);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ student: req.user._id })
      .populate('book', 'title author isbn category availableCopies')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    next(error);
  }
};

const getAllReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('book', 'title author isbn category availableCopies')
      .populate('student', 'name email studentId phone')
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    next(error);
  }
};

const updateReservationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const reservation = await Reservation.findById(req.params.id)
      .populate('book', 'title author isbn availableCopies')
      .populate('student', 'name email studentId notificationPreferences');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = status;
    reservation.responseDate = new Date();
    reservation.handledBy = req.user._id;
    if (notes) {
      reservation.notes = notes;
    }

    await reservation.save();

    if (status === 'approved' && reservation.book && reservation.student) {
      const bookId = reservation.book._id || reservation.book;
      const studentId = reservation.student._id || reservation.student;

      const activeBorrowCount = await IssueRecord.countDocuments({
        student: studentId,
        status: 'issued'
      });

      if (activeBorrowCount >= 3) {
        return res.status(400).json({
          message: 'Student has already reached the maximum borrowing limit of 3 books. A borrowed book must be returned first.'
        });
      }

      const activeIssue = await IssueRecord.findOne({
        book: bookId,
        student: studentId,
        status: 'issued'
      });

      if (!activeIssue) {
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        await IssueRecord.create({
          book: bookId,
          student: studentId,
          issuedBy: req.user._id,
          issueDate,
          dueDate,
          status: 'issued'
        });

        const bookDoc = await Book.findById(bookId);
        if (bookDoc && bookDoc.availableCopies > 0) {
          bookDoc.availableCopies -= 1;
          await bookDoc.save();
        }
      }

      reservation.status = 'completed';
      await reservation.save();

      if (reservation.student?.email) {
        sendReservationApprovedEmail({
          studentName: reservation.student.name,
          studentEmail: reservation.student.email,
          bookTitle: reservation.book?.title,
          bookAuthor: reservation.book?.author
        }).catch((err) =>
          console.error('[Email Notification Error]:', err.message)
        );
      }
    }

    res.json({
      success: true,
      message: `Reservation approved and book borrowed successfully`,
      reservation
    });
  } catch (error) {
    next(error);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending reservations' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      reservation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation
};
