const { FINE_RATE_PER_DAY } = require('../config/constants');

const calculateFine = (dueDate, returnDate = null) => {
  const compareDate = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(dueDate);

  if (compareDate <= due) {
    return { daysOverdue: 0, fine: 0 };
  }

  const diffTime = compareDate.getTime() - due.getTime();

  const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 0) {
    return { daysOverdue: 0, fine: 0 };
  }

  const fine = daysOverdue * FINE_RATE_PER_DAY;
  return { daysOverdue, fine };
};

module.exports = calculateFine;
