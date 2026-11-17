const Book = require('../models/Book');
const User = require('../models/User');
const IssueRecord = require('../models/IssueRecord');
const Reservation = require('../models/Reservation');
const calculateFine = require('../utils/calculateFine');

// @desc   Get overall statistics for Admin & Librarian dashboards
// @route  GET /api/reports/stats
// @access Private (Admin, Librarian, Student - Student gets tailored stats)
const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'student') {
      // Auto-sync: Ensure any approved reservations have an active IssueRecord
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
            }
          }
        }
      } catch (syncErr) {
        console.error('[Sync Error in getDashboardStats]:', syncErr.message);
      }

      // Student-specific stats
      const myActiveIssues = await IssueRecord.countDocuments({
        student: req.user._id,
        status: 'issued'
      });
      const myReturnedIssues = await IssueRecord.countDocuments({
        student: req.user._id,
        status: 'returned'
      });
      const myPendingReservations = await Reservation.countDocuments({
        student: req.user._id,
        status: 'pending'
      });

      // Calculate my overdue books & unpaid fines
      const activeRecords = await IssueRecord.find({
        student: req.user._id,
        status: 'issued'
      });

      let myOverdueCount = 0;
      let myPendingFine = 0;

      activeRecords.forEach((record) => {
        const { daysOverdue, fine } = calculateFine(record.dueDate);
        if (daysOverdue > 0) {
          myOverdueCount += 1;
          myPendingFine += fine;
        }
      });

      // Also add unpaid fines from returned books
      const unpaidReturned = await IssueRecord.find({
        student: req.user._id,
        status: 'returned',
        finePaid: false,
        fineAmount: { $gt: 0 }
      });
      unpaidReturned.forEach((record) => {
        myPendingFine += record.fineAmount;
      });

      return res.json({
        success: true,
        stats: {
          myActiveIssues,
          myReturnedIssues,
          myPendingReservations,
          myOverdueCount,
          myPendingFine
        }
      });
    }

    // Admin & Librarian overall stats
    const totalBooks = await Book.countDocuments();
    const books = await Book.find().select('totalCopies availableCopies');
    const totalCopies = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
    const availableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);

    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalLibrarians = await User.countDocuments({ role: 'librarian' });

    const totalIssued = await IssueRecord.countDocuments({ status: 'issued' });
    const totalReturned = await IssueRecord.countDocuments({ status: 'returned' });
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });

    // Calculate live overdue count and fine totals
    const activeRecords = await IssueRecord.find({ status: 'issued' });
    let overdueCount = 0;
    let totalUnpaidFine = 0;

    activeRecords.forEach((record) => {
      const { daysOverdue, fine } = calculateFine(record.dueDate);
      if (daysOverdue > 0) {
        overdueCount += 1;
        totalUnpaidFine += fine;
      }
    });

    const returnedRecords = await IssueRecord.find({ status: 'returned' });
    let totalCollectedFine = 0;
    returnedRecords.forEach((record) => {
      if (record.finePaid) {
        totalCollectedFine += record.fineAmount || 0;
      } else {
        totalUnpaidFine += record.fineAmount || 0;
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBooks,
        totalCopies,
        availableCopies,
        totalStudents,
        totalLibrarians,
        totalIssued,
        totalReturned,
        overdueCount,
        pendingReservations,
        totalCollectedFine,
        totalUnpaidFine,
        totalFines: totalCollectedFine + totalUnpaidFine
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get comprehensive library activity report
// @route  GET /api/reports/activity
// @access Private (Admin, Librarian)
const getActivityReports = async (req, res, next) => {
  try {
    // Recent 10 issues
    const recentIssues = await IssueRecord.find()
      .populate('book', 'title author isbn')
      .populate('student', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(10);

    // Current overdue list
    const activeIssues = await IssueRecord.find({ status: 'issued' })
      .populate('book', 'title author isbn')
      .populate('student', 'name email studentId phone');

    const overdueList = [];
    activeIssues.forEach((issue) => {
      const { daysOverdue, fine } = calculateFine(issue.dueDate);
      if (daysOverdue > 0) {
        const item = issue.toObject();
        item.daysOverdue = daysOverdue;
        item.fineAmount = fine;
        overdueList.push(item);
      }
    });

    res.json({
      success: true,
      recentIssues,
      overdueList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getActivityReports
};

