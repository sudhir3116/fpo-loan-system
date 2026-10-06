const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'USER_REGISTERED',
  'KYC_STATUS',
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'LOAN_SUBMITTED',
  'LOAN_UNDER_REVIEW',
  'LOAN_APPROVED',
  'LOAN_REJECTED',
  'LOAN_DISBURSED',
  'EMI_UPCOMING',
  'EMI_DUE',
  'EMI_OVERDUE',
  'PAYMENT_RECORDED',
  'LOAN_COMPLETED',
];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: ['Loan', 'Document', 'Repayment', 'User', 'None'],
      default: 'None',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
