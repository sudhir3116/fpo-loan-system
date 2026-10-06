const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const { recordAuditLog } = require('./auditController');
const { assertLoanTransition } = require('../utils/loanStateMachine');
const { publicServerError } = require('../utils/publicError');
const { getNotificationService } = require('../services/notificationService');

const failFrom = (error, res, fallback) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
    });
  }
  return res.status(500).json({
    status: 'error',
    message: publicServerError(error, fallback),
  });
};

// @desc    Submit a new loan application
// @route   POST /api/loans
// @access  Private (FARMER only)
const createLoan = async (req, res) => {
  try {
    const { loanAmount, purpose, interestRate, tenureMonths, repaymentFrequency, remarks } = req.body || {};

    // Input Validation
    if (!loanAmount || Number(loanAmount) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive loan amount',
      });
    }

    if (!purpose || !purpose.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Loan purpose is required',
      });
    }

    if (!tenureMonths || Number(tenureMonths) < 1) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenure months must be at least 1',
      });
    }

    if (repaymentFrequency && !['MONTHLY', 'QUARTERLY', 'SEASONAL', 'BULLET'].includes(repaymentFrequency)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid repayment frequency',
      });
    }

    // Always associate loan with req.user._id (ignore client-supplied farmer/borrower ID)
    const loan = await Loan.create({
      farmer: req.user._id,
      loanAmount: Number(loanAmount),
      purpose: purpose.trim(),
      interestRate: interestRate !== undefined ? Number(interestRate) : 0,
      tenureMonths: Number(tenureMonths),
      repaymentFrequency: repaymentFrequency || 'MONTHLY',
      status: 'SUBMITTED',
      remarks,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        loan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error creating loan application',
    });
  }
};

// @desc    Get loans belonging to the authenticated farmer
// @route   GET /api/loans/my
// @access  Private (FARMER only)
const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ farmer: req.user._id })
      .populate('approvedBy', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: loans.length,
      data: {
        loans,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching your loans',
    });
  }
};

// @desc    Get all loans for admin review with filtering & pagination
// @route   GET /api/loans
// @access  Private (FPO_ADMIN only)
const getAllLoans = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) {
      const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED'];
      const upperStatus = status.toUpperCase();
      if (!validStatuses.includes(upperStatus)) {
        return res.status(400).json({
          status: 'fail',
          message: `Invalid status filter '${status}'`,
        });
      }
      query.status = upperStatus;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalLoans = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .populate('farmer', 'name email phone fpoName address')
      .populate('approvedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      status: 'success',
      results: loans.length,
      totalCount: totalLoans,
      page: pageNum,
      totalPages: Math.ceil(totalLoans / limitNum),
      data: {
        loans,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching all loans',
    });
  }
};

// @desc    Get loan by ID (Farmer accesses own, FPO_ADMIN accesses any)
// @route   GET /api/loans/:id
// @access  Private (FARMER & FPO_ADMIN)
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid loan ID format',
      });
    }

    const loan = await Loan.findById(id)
      .populate('farmer', 'name email phone fpoName address')
      .populate('approvedBy', 'name email phone');

    if (!loan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Loan application not found',
      });
    }

    // IDOR Security Check for FARMER role
    if (req.user.role === 'FARMER' && loan.farmer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You do not have permission to view this loan application',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        loan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching loan details',
    });
  }
};

// @desc    Transition loan state: SUBMITTED -> UNDER_REVIEW
// @route   PUT /api/loans/:id/under-review
// @access  Private (FPO_ADMIN only)
const markUnderReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid loan ID format',
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Loan application not found',
      });
    }

    // State Transition Rule Enforcement
    if (loan.status !== 'SUBMITTED') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot move loan to UNDER_REVIEW. Current status is '${loan.status}', expected 'SUBMITTED'`,
      });
    }

    loan.status = 'UNDER_REVIEW';
    await loan.save();

    return res.status(200).json({
      status: 'success',
      message: 'Loan status updated to UNDER_REVIEW',
      data: {
        loan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error updating loan to under-review',
    });
  }
};

// @desc    Transition loan state: UNDER_REVIEW -> APPROVED
// @route   PUT /api/loans/:id/approve
// @access  Private (FPO_ADMIN only)
const approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { interestRate, tenureMonths, remarks } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid loan ID format',
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Loan application not found',
      });
    }

    // State Transition Rule Enforcement
    if (loan.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot approve loan. Current status is '${loan.status}', expected 'UNDER_REVIEW'`,
      });
    }

    loan.status = 'APPROVED';
    loan.approvedBy = req.user._id;

    if (interestRate !== undefined && Number(interestRate) >= 0) {
      loan.interestRate = Number(interestRate);
    }

    if (tenureMonths !== undefined && Number(tenureMonths) >= 1) {
      loan.tenureMonths = Number(tenureMonths);
    }

    if (remarks) {
      loan.remarks = remarks.trim();
    }

    await loan.save();

    // Audit log
    await recordAuditLog(
      req.user._id,
      'LOAN_APPROVED',
      'Loan',
      loan._id,
      `Loan application approved for ₹${loan.loanAmount}`,
      { loanAmount: loan.loanAmount, interestRate: loan.interestRate, tenureMonths: loan.tenureMonths }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Loan application successfully approved',
      data: {
        loan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error approving loan',
    });
  }
};

// @desc    Transition loan state: UNDER_REVIEW -> REJECTED
// @route   PUT /api/loans/:id/reject
// @access  Private (FPO_ADMIN only)
const rejectLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid loan ID format',
      });
    }

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rejection remarks are required when rejecting a loan application',
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Loan application not found',
      });
    }

    // State Transition Rule Enforcement
    if (loan.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot reject loan. Current status is '${loan.status}', expected 'UNDER_REVIEW'`,
      });
    }

    loan.status = 'REJECTED';
    loan.approvedBy = req.user._id;
    loan.remarks = remarks.trim();

    await loan.save();

    return res.status(200).json({
      status: 'success',
      message: 'Loan application rejected',
      data: {
        loan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error rejecting loan',
    });
  }
};

// @desc    Transition loan state: APPROVED -> DISBURSED
// @route   PUT /api/loans/:id/disburse
// @access  Private (FPO_ADMIN only)
const disburseLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { disbursedAmount } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid loan ID format',
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Loan application not found',
      });
    }

    // State Transition Rule Enforcement
    if (loan.status !== 'APPROVED') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot disburse loan. Current status is '${loan.status}', expected 'APPROVED'`,
      });
    }

    const amountToDisburse = disbursedAmount !== undefined ? Number(disbursedAmount) : loan.loanAmount;
    if (amountToDisburse <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Disbursed amount must be a positive number',
      });
    }

    loan.status = 'DISBURSED';
    loan.disbursedAmount = amountToDisburse;
    loan.disbursedDate = new Date();

    await loan.save();

    // Generate Repayment Schedule automatically after disbursement
    const { generateRepaymentSchedule } = require('./repaymentController');
    const repayments = await generateRepaymentSchedule(loan);

    // Audit log
    await recordAuditLog(
      req.user._id,
      'LOAN_DISBURSED',
      'Loan',
      loan._id,
      `Loan disbursed: ₹${amountToDisburse}`,
      { disbursedAmount: amountToDisburse, disbursedDate: loan.disbursedDate }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Loan successfully disbursed and repayment schedule generated',
      data: {
        loan,
        repayments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error disbursing loan',
    });
  }
};

module.exports = {
  createLoan,
  getMyLoans,
  getAllLoans,
  getLoanById,
  markUnderReview,
  approveLoan,
  rejectLoan,
  disburseLoan,
};
