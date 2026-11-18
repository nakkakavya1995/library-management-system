const Book = require('../models/Book');
const User = require('../models/User');
const IssueRecord = require('../models/IssueRecord');
const Reservation = require('../models/Reservation');
const calculateFine = require('../utils/calculateFine');

const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'student') {

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

const getActivityReports = async (req, res, next) => {
  try {

    const recentIssues = await IssueRecord.find()
      .populate('book', 'title author isbn')
      .populate('student', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(10);

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
