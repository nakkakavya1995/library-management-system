const mongoose = require('mongoose');
require('../models/Book');
require('../models/User');
const IssueRecord = require('../models/IssueRecord');
const calculateFine = require('../utils/calculateFine');
const { sendOverdueFineEmail, sendDueDateReminderEmail } = require('../utils/emailService');

const checkAndSendOverdueNotifications = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { checked: 0, reason: 'Database not connected yet' };
    }

    const activeIssues = await IssueRecord.find({ status: 'issued' })
      .populate('book', 'title author isbn')
      .populate('student', 'name email');

    if (!activeIssues || activeIssues.length === 0) {
      return { checked: 0, overdueNotified: 0, remindersSent: 0 };
    }

    const now = new Date();
    let overdueNotifiedCount = 0;
    let reminderNotifiedCount = 0;

    for (const record of activeIssues) {
      if (!record.student?.email) continue;

      const { daysOverdue, fine } = calculateFine(record.dueDate);

      if (daysOverdue > 0) {
        const lastNotified = record.notificationDate ? new Date(record.notificationDate).getTime() : 0;
        const hoursSinceLastNotification = (now.getTime() - lastNotified) / (1000 * 60 * 60);

        if (!record.overdueNotified || hoursSinceLastNotification >= 24) {
          console.log(`[Overdue Service] Book "${record.book?.title}" is ${daysOverdue} days overdue for ${record.student?.email} (Fine: ₹${fine}). Dispatching late fine email...`);

          record.fineAmount = fine;
          record.overdueNotified = true;
          record.notificationDate = now;
          record.notificationMessage = `Late Fine Alert: "${record.book?.title}" is ${daysOverdue} days overdue. Current fine is ₹${fine}. Please return immediately.`;
          await record.save();

          await sendOverdueFineEmail({
            studentName: record.student?.name,
            studentEmail: record.student?.email,
            bookTitle: record.book?.title,
            bookAuthor: record.book?.author,
            bookIsbn: record.book?.isbn,
            dueDate: record.dueDate,
            overdueDays: daysOverdue,
            fineAmount: fine
          });

          overdueNotifiedCount++;
        }
      }

      else {
        const msRemaining = new Date(record.dueDate).getTime() - now.getTime();
        const hoursRemaining = msRemaining / (1000 * 60 * 60);

        if (hoursRemaining > 0 && hoursRemaining <= 48) {
          const lastNotified = record.notificationDate ? new Date(record.notificationDate).getTime() : 0;
          const hoursSinceLastNotification = (now.getTime() - lastNotified) / (1000 * 60 * 60);

          if (!record.notificationDate || hoursSinceLastNotification >= 24) {
            console.log(`[Overdue Service] Book "${record.book?.title}" is due in ${Math.round(hoursRemaining)} hours for ${record.student?.email}. Dispatching due date reminder email...`);

            record.notificationDate = now;
            await record.save();

            await sendDueDateReminderEmail({
              studentName: record.student?.name,
              studentEmail: record.student?.email,
              bookTitle: record.book?.title,
              bookAuthor: record.book?.author,
              dueDate: record.dueDate,
              hoursRemaining: Math.round(hoursRemaining)
            });

            reminderNotifiedCount++;
          }
        }
      }
    }

    return {
      checked: activeIssues.length,
      overdueNotified: overdueNotifiedCount,
      remindersSent: reminderNotifiedCount
    };
  } catch (error) {
    console.error('[Overdue Service] Error checking overdue books:', error.message);
    return { error: error.message };
  }
};

const startOverdueScheduler = () => {
  setTimeout(() => {
    checkAndSendOverdueNotifications();
  }, 5000);

  setInterval(() => {
    checkAndSendOverdueNotifications();
  }, 30 * 60 * 1000);

  console.log('[Overdue Service] Automated overdue & late fine notification scheduler initialized');
};

module.exports = {
  checkAndSendOverdueNotifications,
  startOverdueScheduler
};
