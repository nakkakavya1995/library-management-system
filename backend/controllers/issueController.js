const IssueRecord = require('../models/IssueRecord');
const Book = require('../models/Book');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const calculateFine = require('../utils/calculateFine');
const {
  sendOverdueFineEmail,
  sendBookAvailableEmail,
  sendReservationApprovedEmail,
  sendRenewalDecisionEmail,
  sendReturnAcceptedEmail
} = require('../utils/emailService');
const { checkAndSendOverdueNotifications } = require('../services/overdueChecker');
const {
  MAX_BORROW_LIMIT,
  DEFAULT_BORROW_DAYS,
  RENEWAL_EXTENSION_DAYS,
  MAX_RENEWALS_ALLOWED
} = require('../config/constants');

const issueBook = async (req, res, next) => {
  try {
    const { bookId, studentId } = req.body;

    if (!bookId || !studentId) {
      return res.status(400).json({ message: 'Please provide both bookId and studentId' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Valid student not found' });
    }
    if (student.status === 'inactive') {
      return res.status(400).json({ message: 'Student account is deactivated' });
    }

    const activeBorrows = await IssueRecord.countDocuments({
      student: studentId,
      status: 'issued'
    });
    if (activeBorrows >= MAX_BORROW_LIMIT) {
      return res.status(400).json({
        message: `Student has reached the maximum borrowing limit of ${MAX_BORROW_LIMIT} books.`
      });
    }

    const alreadyHasBook = await IssueRecord.findOne({
      book: bookId,
      student: studentId,
      status: 'issued'
    });
    if (alreadyHasBook) {
      return res.status(400).json({
        message: 'Student already has an active borrowed copy of this book'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No available copies left for this book' });
    }

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DEFAULT_BORROW_DAYS);

    const issueRecord = await IssueRecord.create({
      book: bookId,
      student: studentId,
      issuedBy: req.user._id,
      issueDate,
      dueDate,
      status: 'issued'
    });

    book.availableCopies -= 1;
    await book.save();

    await Reservation.findOneAndUpdate(
      { book: bookId, student: studentId, status: { $in: ['pending', 'approved'] } },
      { status: 'completed' }
    );

    if (student.email) {
      sendReservationApprovedEmail({
        studentName: student.name,
        studentEmail: student.email,
        bookTitle: book.title,
        bookAuthor: book.author,
        dueDate: issueRecord.dueDate
      }).catch((err) => console.error('[Email Notification Error]:', err.message));
    }

    const populatedRecord = await IssueRecord.findById(issueRecord._id)
      .populate('book', 'title author isbn category')
      .populate('student', 'name email studentId')
      .populate('issuedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      issue: populatedRecord
    });
  } catch (error) {
    next(error);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const { returnNotes, finePaid } = req.body;
    const issueRecord = await IssueRecord.findById(req.params.id)
      .populate('book')
      .populate('student', 'name email studentId');

    if (!issueRecord) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (issueRecord.status === 'returned') {
      return res.json({
        success: true,
        message: 'Book has already been returned and restocked',
        issue: issueRecord
      });
    }

    if (req.user.role === 'student' && issueRecord.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to return another student\'s book' });
    }

    const returnDate = new Date();
    const { daysOverdue, fine } = calculateFine(issueRecord.dueDate, returnDate);

    issueRecord.status = 'returned';
    issueRecord.returnDate = returnDate;
    issueRecord.fineAmount = fine;
    issueRecord.finePaid = fine > 0 ? (finePaid === true || finePaid === 'true') : true;
    if (returnNotes) issueRecord.returnNotes = returnNotes;

    await issueRecord.save();

    await Reservation.updateMany(
      { book: issueRecord.book._id, student: issueRecord.student._id, status: { $in: ['pending', 'approved'] } },
      { status: 'completed' }
    );

    const book = await Book.findById(issueRecord.book._id);
    let reservationNotified = null;

    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();

      const pendingReservation = await Reservation.findOne({
        book: book._id,
        status: 'pending'
      })
        .sort({ createdAt: 1 })
        .populate('student', 'name email notificationPreferences');

      if (pendingReservation && pendingReservation.student) {
        pendingReservation.status = 'approved';
        pendingReservation.availabilityNotified = true;
        pendingReservation.notifiedAt = new Date();
        pendingReservation.responseDate = new Date();
        await pendingReservation.save();

        if (pendingReservation.student?.notificationPreferences?.reservations !== false) {
          sendBookAvailableEmail({
            studentName: pendingReservation.student.name,
            studentEmail: pendingReservation.student.email,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookIsbn: book.isbn,
            bookCategory: book.category
          }).catch((err) =>
            console.error('[Email Notification Error]:', err.message)
          );
        }

        reservationNotified = {
          studentName: pendingReservation.student.name,
          studentEmail: pendingReservation.student.email
        };
      }
    }

    try {
      if (issueRecord.student?.email) {
        await sendReturnAcceptedEmail({
          studentName: issueRecord.student.name,
          studentEmail: issueRecord.student.email,
          bookTitle: issueRecord.book?.title || 'Book'
        });
      }
    } catch (emailErr) {
      console.warn('[Return Acceptance Email Notice]:', emailErr.message);
    }

    res.json({
      success: true,
      message: reservationNotified
        ? `Book returned successfully. Student ${reservationNotified.studentName} has been notified via email that their reserved book is now available!`
        : 'Book returned successfully',
      daysOverdue,
      fineAmount: fine,
      reservationNotified,
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

const getAllBorrowings = async (req, res, next) => {
  try {
    const { status, studentId, search } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (studentId) {
      query.student = studentId;
    }

    const issues = await IssueRecord.find(query)
      .populate('book', 'title author isbn category')
      .populate('student', 'name email studentId phone')
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 });

    const recordsWithFine = issues.map((record) => {
      const doc = record.toObject();
      if (doc.status === 'issued') {
        const { daysOverdue, fine } = calculateFine(doc.dueDate);
        doc.isOverdue = daysOverdue > 0;
        doc.daysOverdue = daysOverdue;
        doc.currentFine = fine;
      } else {
        doc.isOverdue = doc.fineAmount > 0;
        doc.daysOverdue = 0;
        doc.currentFine = doc.fineAmount;
      }
      return doc;
    });

    checkAndSendOverdueNotifications().catch((err) => {
      console.error('[Overdue Checker] Background scan error:', err.message);
    });

    res.json({
      success: true,
      count: recordsWithFine.length,
      issues: recordsWithFine
    });
  } catch (error) {
    next(error);
  }
};

const getMyBorrowings = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { student: req.user._id };

    if (status) {
      query.status = status;
    }

    const issues = await IssueRecord.find(query)
      .populate('book', 'title author isbn category description')
      .sort({ createdAt: -1 });

    const recordsWithFine = issues.map((record) => {
      const doc = record.toObject();
      if (doc.status === 'issued') {
        const { daysOverdue, fine } = calculateFine(doc.dueDate);
        doc.isOverdue = daysOverdue > 0;
        doc.daysOverdue = daysOverdue;
        doc.currentFine = fine;
      } else {
        doc.isOverdue = doc.fineAmount > 0;
        doc.daysOverdue = 0;
        doc.currentFine = doc.fineAmount;
      }
      return doc;
    });

    checkAndSendOverdueNotifications().catch((err) => {
      console.error('[Overdue Checker] Background scan error:', err.message);
    });

    res.json({
      success: true,
      count: recordsWithFine.length,
      issues: recordsWithFine
    });
  } catch (error) {
    next(error);
  }
};

const requestRenewal = async (req, res, next) => {
  try {
    const issueRecord = await IssueRecord.findById(req.params.id);

    if (!issueRecord) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (issueRecord.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only request renewal for your own borrowed books' });
    }

    if (issueRecord.status !== 'issued') {
      return res.status(400).json({ message: 'Only currently borrowed books can be renewed' });
    }

    const { daysOverdue } = calculateFine(issueRecord.dueDate);
    if (daysOverdue > 0) {
      return res.status(400).json({
        message: 'Cannot renew an overdue book. Please return the book and clear any fines.'
      });
    }

    if (issueRecord.renewalCount >= MAX_RENEWALS_ALLOWED) {
      return res.status(400).json({
        message: `Maximum renewal limit (${MAX_RENEWALS_ALLOWED}) reached for this borrowing.`
      });
    }

    if (issueRecord.renewalStatus === 'requested') {
      return res.status(400).json({ message: 'A renewal request is already pending review' });
    }

    const activeReservation = await Reservation.findOne({
      book: issueRecord.book,
      student: { $ne: req.user._id },
      status: { $in: ['pending', 'approved'] }
    });
    if (activeReservation) {
      return res.status(400).json({
        message: 'Cannot renew: this book has an active reservation by another student.'
      });
    }

    const extensionDays = parseInt(req.body.days, 10) || 14;
    issueRecord.renewalStatus = 'requested';
    issueRecord.renewalRequestDate = new Date();
    issueRecord.requestedExtensionDays = extensionDays;
    await issueRecord.save();

    res.json({
      success: true,
      message: `Renewal request for ${extensionDays} days submitted successfully for librarian approval`,
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

const handleRenewalRequest = async (req, res, next) => {
  try {
    const { action, days } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const issueRecord = await IssueRecord.findById(req.params.id)
      .populate('book', 'title')
      .populate('student', 'name email');

    if (!issueRecord) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (issueRecord.renewalStatus !== 'requested') {
      return res.status(400).json({ message: 'No renewal request pending for this record' });
    }

    const previousDueDate = issueRecord.dueDate;
    const extensionDays = parseInt(days, 10) || issueRecord.requestedExtensionDays || 14;

    if (action === 'approve') {
      const currentDue = new Date(issueRecord.dueDate);
      currentDue.setDate(currentDue.getDate() + extensionDays);
      issueRecord.dueDate = currentDue;
      issueRecord.renewalStatus = 'approved';
      issueRecord.renewalCount += 1;
      issueRecord.requestedExtensionDays = extensionDays;
    } else {
      issueRecord.renewalStatus = 'rejected';
    }

    await issueRecord.save();

    try {
      if (issueRecord.student?.email) {
        await sendRenewalDecisionEmail({
          studentName: issueRecord.student.name,
          studentEmail: issueRecord.student.email,
          bookTitle: issueRecord.book?.title || 'Book',
          action,
          extensionDays,
          newDueDate: issueRecord.dueDate,
          currentDueDate: previousDueDate
        });
      }
    } catch (emailErr) {
      console.warn('[Renewal Decision Email Notice]:', emailErr.message);
    }

    res.json({
      success: true,
      message: `Renewal request ${action === 'approve' ? `approved (extended by ${extensionDays} days)` : 'rejected'} successfully`,
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

const payFine = async (req, res, next) => {
  try {
    const issueRecord = await IssueRecord.findById(req.params.id);
    if (!issueRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }

    issueRecord.finePaid = true;
    await issueRecord.save();

    res.json({ success: true, message: 'Fine payment recorded successfully', issue: issueRecord });
  } catch (error) {
    next(error);
  }
};

const sendOverdueNotification = async (req, res, next) => {
  try {
    const issueRecord = await IssueRecord.findById(req.params.id)
      .populate('book', 'title author isbn')
      .populate('student', 'name email');

    if (!issueRecord) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    const { daysOverdue, fine } = calculateFine(issueRecord.dueDate);

    issueRecord.overdueNotified = true;
    issueRecord.notificationDate = new Date();
    issueRecord.notificationMessage =
      req.body.message ||
      `Reminder: Your book "${issueRecord.book?.title}" is past its due date. Current fine is ₹${fine}. Please return it promptly.`;

    await issueRecord.save();

    const emailResult = await sendOverdueFineEmail({
      studentName: issueRecord.student?.name,
      studentEmail: issueRecord.student?.email,
      bookTitle: issueRecord.book?.title,
      bookAuthor: issueRecord.book?.author,
      bookIsbn: issueRecord.book?.isbn,
      dueDate: issueRecord.dueDate,
      overdueDays: daysOverdue,
      fineAmount: fine,
      customMessage: req.body.message
    });

    res.json({
      success: true,
      message: `Overdue return notification and email dispatched to ${issueRecord.student?.name} (${issueRecord.student?.email})`,
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl || null,
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const issueRecord = await IssueRecord.findById(req.params.id);

    if (!issueRecord) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (issueRecord.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only request return for your own borrowed books' });
    }

    if (issueRecord.status !== 'issued') {
      return res.status(400).json({ message: 'Only active borrowed books can be requested for return' });
    }

    if (issueRecord.returnStatus === 'requested') {
      return res.status(400).json({ message: 'Return request has already been submitted and is awaiting librarian acceptance' });
    }

    issueRecord.returnStatus = 'requested';
    issueRecord.returnRequestDate = new Date();
    await issueRecord.save();

    res.json({
      success: true,
      message: 'Return request submitted successfully. The librarian will accept your return and restock the book.',
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

const acceptReturnRequest = async (req, res, next) => {
  try {
    const { returnNotes, finePaid } = req.body;
    const issueRecord = await IssueRecord.findById(req.params.id)
      .populate('book')
      .populate('student', 'name email studentId');

    if (!issueRecord) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (issueRecord.status === 'returned') {
      return res.json({
        success: true,
        message: 'Book has already been returned and restocked',
        issue: issueRecord
      });
    }

    const returnDate = new Date();
    const { daysOverdue, fine } = calculateFine(issueRecord.dueDate, returnDate);

    issueRecord.status = 'returned';
    issueRecord.returnStatus = 'accepted';
    issueRecord.returnDate = returnDate;
    issueRecord.fineAmount = fine;
    issueRecord.finePaid = fine > 0 ? (finePaid === true || finePaid === 'true') : true;
    if (returnNotes) issueRecord.returnNotes = returnNotes;

    await issueRecord.save();

    await Reservation.updateMany(
      { book: issueRecord.book._id, student: issueRecord.student._id, status: { $in: ['pending', 'approved'] } },
      { status: 'completed' }
    );

    const book = await Book.findById(issueRecord.book._id);
    let reservationNotified = null;

    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();

      const pendingReservation = await Reservation.findOne({
        book: book._id,
        status: 'pending'
      })
        .sort({ createdAt: 1 })
        .populate('student', 'name email notificationPreferences');

      if (pendingReservation && pendingReservation.student) {
        pendingReservation.status = 'approved';
        pendingReservation.availabilityNotified = true;
        pendingReservation.notifiedAt = new Date();
        pendingReservation.responseDate = new Date();
        await pendingReservation.save();

        if (pendingReservation.student?.notificationPreferences?.reservations !== false) {
          sendBookAvailableEmail({
            studentName: pendingReservation.student.name,
            studentEmail: pendingReservation.student.email,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookIsbn: book.isbn,
            bookCategory: book.category
          }).catch((err) =>
            console.error('[Email Notification Error]:', err.message)
          );
        }

        reservationNotified = {
          studentName: pendingReservation.student.name,
          studentEmail: pendingReservation.student.email
        };
      }
    }

    try {
      if (issueRecord.student?.email) {
        await sendReturnAcceptedEmail({
          studentName: issueRecord.student.name,
          studentEmail: issueRecord.student.email,
          bookTitle: issueRecord.book?.title || 'Book'
        });
      }
    } catch (emailErr) {
      console.warn('[Return Acceptance Email Notice]:', emailErr.message);
    }

    res.json({
      success: true,
      message: `Return request accepted! "${issueRecord.book?.title}" is restocked. Student ${issueRecord.student?.name} can now borrow another book.`,
      issue: issueRecord,
      daysOverdue,
      fineAmount: fine,
      reservationNotified
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
