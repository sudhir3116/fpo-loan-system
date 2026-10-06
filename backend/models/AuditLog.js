const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  // Document actions
  'DOCUMENT_VERIFIED',
  'DOCUMENT_REJECTED',
  // Loan actions
  'LOAN_APPROVED',
  'LOAN_DISBURSED',
  'LOAN_REJECTED',
  'LOAN_UNDER_REVIEW',
  // Repayment actions
  'REPAYMENT_RECORDED',
  // Account actions
  'USER_KYC_UPDATED',
];

const auditLogSchema = new mongoose.Schema(
  {
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user reference is required'],
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: [true, 'Action is required'],
    },
    entityType: {
      type: String,
      enum: ['Document', 'Loan', 'Repayment', 'User'],
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Prevent any updates — audit logs are write-once
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  }
);

// Index for efficient querying by admin user and action
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminUser: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
