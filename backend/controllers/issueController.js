const IssueRecord = require('../models/IssueRecord');
const Book = require('../models/Book');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const calculateFine = require('../utils/calculateFine');
const {
  sendOverdueFineEmail,
  sendBookAvailableEmail,
  sendReservationApprovedEmail
} = require('../utils/emailService');
const { checkAndSendOverdueNotifications } = require('../services/overdueChecker');
const {
  MAX_BORROW_LIMIT,
  DEFAULT_BORROW_DAYS,
  RENEWAL_EXTENSION_DAYS,
  MAX_RENEWALS_ALLOWED
} = require('../config/constants');

// @desc   Issue a book to a student
// @route  POST /api/issues
// @access Private (Librarian, Admin)
const issueBook = async (req, res, next) => {
  try {
    const { bookId, studentId } = req.body;

    if (!bookId || !studentId) {
      return res.status(400).json({ message: 'Please provide both bookId and studentId' });
    }

    // 1. Verify Student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Valid student not found' });
    }
    if (student.status === 'inactive') {
      return res.status(400).json({ message: 'Student account is deactivated' });
    }

    // 2. Check student's current active borrowed count
    const activeBorrows = await IssueRecord.countDocuments({
      student: studentId,
      status: 'issued'
    });
    if (activeBorrows >= MAX_BORROW_LIMIT) {
      return res.status(400).json({
        message: `Student has reached the maximum borrowing limit of ${MAX_BORROW_LIMIT} books.`
      });
    }

    // 3. Check if student currently already has an active issue of this book
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

    // 4. Verify Book and copy availability
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No available copies left for this book' });
    }

    // 5. Calculate issue and due dates
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DEFAULT_BORROW_DAYS);

    // 6. Create issue record
    const issueRecord = await IssueRecord.create({
      book: bookId,
      student: studentId,
      issuedBy: req.user._id,
      issueDate,
      dueDate,
      status: 'issued'
    });

    // 7. Decrement available copies
    book.availableCopies -= 1;
    await book.save();

    // 8. If student had an approved or pending reservation for this book, mark it completed
    await Reservation.findOneAndUpdate(
      { book: bookId, student: studentId, status: { $in: ['pending', 'approved'] } },
      { status: 'completed' }
    );

    // 9. Notify student immediately via registered email that book is accepted and issued
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

// @desc   Return an issued book
// @route  PUT /api/issues/:id/return
// @access Private (Librarian, Admin, Student)
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
      return res.status(400).json({ message: 'Book has already been returned' });
    }

    // If student is returning, ensure they only return their own borrowed book
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

    // Clean up any lingering reservations for this student and book
    await Reservation.updateMany(
      { book: issueRecord.book._id, student: issueRecord.student._id, status: { $in: ['pending', 'approved'] } },
      { status: 'completed' }
    );

    // Increment available copies on book
    const book = await Book.findById(issueRecord.book._id);
    let reservationNotified = null;

    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();

      // Check if any student has a pending reservation for this now-available book
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

        // Send email notification to waiting student via Nodemailer if student enabled notification
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

// @desc   Get all borrowing records (Filter by status, overdue, student)
// @route  GET /api/issues
// @access Private (Librarian, Admin)
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

    // Compute live fine and overdue status for currently active issued books
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

    // Trigger automated overdue notification check in background
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

// @desc   Get logged-in student's borrowings (active or history)
// @route  GET /api/issues/my-borrowings
// @access Private (Student)
const getMyBorrowings = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Auto-sync: Ensure any approved reservations for this student are actively in IssueRecord
    try {
      const approvedReservations = await Reservation.find({
        student: req.user._id,
        status: 'approved'
      }).populate('book');

      for (const resDoc of approvedReservations) {
        if (resDoc.book) {
          const bookId = resDoc.book._id || resDoc.book;
          const activeIssue = await IssueRecord.findOne({
            book: bookId,
            student: req.user._id,
            status: 'issued'
          });

          if (!activeIssue) {
            const issueDate = resDoc.responseDate || new Date();
            const dueDate = new Date(issueDate);
            dueDate.setDate(dueDate.getDate() + 14);

            await IssueRecord.create({
              book: bookId,
              student: req.user._id,
              issuedBy: resDoc.handledBy || req.user._id,
              issueDate,
              dueDate,
              status: 'issued'
            });

            if (resDoc.book.availableCopies > 0) {
              await Book.findByIdAndUpdate(bookId, {
                $inc: { availableCopies: -1 }
              });
            }
          }
        }
      }
    } catch (syncErr) {
      console.error('[Sync Error in getMyBorrowings]:', syncErr.message);
    }

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

    // Trigger automated overdue notification check in background
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

// @desc   Student requests book renewal
// @route  POST /api/issues/:id/request-renewal
// @access Private (Student)
const requestRenewal = async (req, res, next) => {
  try {
    const issueRecord = await IssueRecord.findById(req.params.id);

    if (!issueRecord) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    // Ensure student owns this record
    if (issueRecord.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only request renewal for your own borrowed books' });
    }

    if (issueRecord.status !== 'issued') {
      return res.status(400).json({ message: 'Only currently borrowed books can be renewed' });
    }

    // Rule: Do not allow renewal when book is already overdue
    const { daysOverdue } = calculateFine(issueRecord.dueDate);
    if (daysOverdue > 0) {
      return res.status(400).json({
        message: 'Cannot renew an overdue book. Please return the book and clear any fines.'
      });
    }

    // Rule: Check max renewals allowed
    if (issueRecord.renewalCount >= MAX_RENEWALS_ALLOWED) {
      return res.status(400).json({
        message: `Maximum renewal limit (${MAX_RENEWALS_ALLOWED}) reached for this borrowing.`
      });
    }

    // Rule: Do not allow duplicate renewal requests
    if (issueRecord.renewalStatus === 'requested') {
      return res.status(400).json({ message: 'A renewal request is already pending review' });
    }

    // Rule: Do not allow renewal if book is reserved by another student
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

    issueRecord.renewalStatus = 'requested';
    issueRecord.renewalRequestDate = new Date();
    await issueRecord.save();

    res.json({
      success: true,
      message: 'Renewal request submitted successfully for librarian approval',
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Librarian/Admin approves or rejects renewal request
// @route  PUT /api/issues/:id/handle-renewal
// @access Private (Librarian, Admin)
const handleRenewalRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'

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

    if (action === 'approve') {
      // Extend due date by RENEWAL_EXTENSION_DAYS
      const currentDue = new Date(issueRecord.dueDate);
      currentDue.setDate(currentDue.getDate() + RENEWAL_EXTENSION_DAYS);
      issueRecord.dueDate = currentDue;
      issueRecord.renewalStatus = 'approved';
      issueRecord.renewalCount += 1;
    } else {
      issueRecord.renewalStatus = 'rejected';
    }

    await issueRecord.save();

    res.json({
      success: true,
      message: `Renewal request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      issue: issueRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update fine payment status
// @route  PUT /api/issues/:id/pay-fine
// @access Private (Librarian, Admin)
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

// @desc   Send overdue return notification to student
// @route  POST /api/issues/:id/notify
// @access Private (Librarian, Admin)
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

    // Send email using Nodemailer
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

module.exports = {
  issueBook,
  returnBook,
  getAllBorrowings,
  getMyBorrowings,
  requestRenewal,
  handleRenewalRequest,
  payFine,
  sendOverdueNotification
};

