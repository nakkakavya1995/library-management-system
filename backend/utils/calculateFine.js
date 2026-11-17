const { FINE_RATE_PER_DAY } = require('../config/constants');

/**
 * Calculates fine based on due date and return date (or current date if unreturned).
 * @param {Date} dueDate - The date the book was due
 * @param {Date} [returnDate] - The date returned, or null/undefined if currently issued
 * @returns {{ daysOverdue: number, fine: number }}
 */
const calculateFine = (dueDate, returnDate = null) => {
  const compareDate = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(dueDate);

  // If compare date is before or on due date, no fine
  if (compareDate <= due) {
    return { daysOverdue: 0, fine: 0 };
  }

  // Calculate millisecond difference
  const diffTime = compareDate.getTime() - due.getTime();
  // Calculate total days (ceiling to count any partial day as 1 day overdue, or floor depending on policy)
  const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 0) {
    return { daysOverdue: 0, fine: 0 };
  }

  const fine = daysOverdue * FINE_RATE_PER_DAY;
  return { daysOverdue, fine };
};

module.exports = calculateFine;

