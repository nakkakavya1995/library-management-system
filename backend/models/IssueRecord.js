const mongoose = require('mongoose');

const issueRecordSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['issued', 'returned'],
      default: 'issued'
    },
    fineAmount: {
      type: Number,
      default: 0
    },
    finePaid: {
      type: Boolean,
      default: false
    },
    renewalCount: {
      type: Number,
      default: 0
    },
    renewalStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected'],
      default: 'none'
    },
    renewalRequestDate: {
      type: Date,
      default: null
    },
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'accepted'],
      default: 'none'
    },
    returnRequestDate: {
      type: Date,
      default: null
    },
    returnNotes: {
      type: String,
      default: ''
    },
    overdueNotified: {
      type: Boolean,
      default: false
    },
    notificationDate: {
      type: Date,
      default: null
    },
    notificationMessage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('IssueRecord', issueRecordSchema);

