const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    documentType: {
      type: String,
      enum: [
        'ID_PROOF',
        'ADDRESS_PROOF',
        'LAND_RECORD',
        'FPO_MEMBERSHIP',
        'BANK_STATEMENT',
        'FINANCIAL_REPORT',
        'OTHER',
      ],
      required: [true, 'Document type is required'],
    },
    documentName: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    cloudinaryResourceType: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
