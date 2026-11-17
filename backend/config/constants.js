// Centralized library configuration constants
module.exports = {
  // Fine rate per day overdue in Indian Rupees (₹)
  FINE_RATE_PER_DAY: 5,

  // Currency symbol
  CURRENCY: '₹',

  // Maximum number of active borrowed books per student
  MAX_BORROW_LIMIT: 3,

  // Standard borrow duration in days
  DEFAULT_BORROW_DAYS: 14,

  // Extra days added upon approved renewal
  RENEWAL_EXTENSION_DAYS: 7,

  // Maximum times a single issue record can be renewed
  MAX_RENEWALS_ALLOWED: 1
};
