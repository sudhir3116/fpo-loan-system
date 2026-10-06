const AuditLog = require('../models/AuditLog');

/**
 * Internal helper — called by other controllers after a successful admin action.
 * Never throws: logs any failure to console so that the primary action response
 * is never blocked by an audit recording failure.
 *
 * @param {ObjectId|string} adminUserId
 * @param {string} action - Must match the enum in AuditLog model
 * @param {string} entityType - 'Document' | 'Loan' | 'Repayment' | 'User'
 * @param {ObjectId|string} entityId
 * @param {string} description - Human-readable summary
 * @param {Object} [metadata] - Optional extra data
 */
const recordAuditLog = async (adminUserId, action, entityType, entityId, description, metadata = {}) => {
  try {
    await AuditLog.create({
      adminUser: adminUserId,
      action,
      entityType,
      entityId,
      description,
      metadata,
    });
  } catch (err) {
    // Audit logging must never crash the primary request
    console.error('[AuditLog] Failed to record audit entry:', err.message);
  }
};

// @desc    Get all audit log entries — read-only, paginated
// @route   GET /api/audit-logs
// @access  Private (FPO_ADMIN only)
const getAllAuditLogs = async (req, res) => {
  try {
    const { action, page = 1, limit = 25 } = req.query;

    const query = {};
    if (action) {
      const upperAction = action.toUpperCase();
      const validActions = [
        'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED',
        'LOAN_APPROVED', 'LOAN_DISBURSED', 'LOAN_REJECTED', 'LOAN_UNDER_REVIEW',
        'REPAYMENT_RECORDED', 'USER_KYC_UPDATED',
      ];
      if (!validActions.includes(upperAction)) {
        return res.status(400).json({
          status: 'fail',
          message: `Invalid action filter '${action}'`,
        });
      }
      query.action = upperAction;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 25, 100); // cap at 100
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('adminUser', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      status: 'success',
      results: logs.length,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: {
        auditLogs: logs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching audit logs',
    });
  }
};

module.exports = {
  recordAuditLog,
  getAllAuditLogs,
};
