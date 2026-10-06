const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['DISBURSED'],
  REJECTED: [],
  DISBURSED: ['CLOSED'],
  CLOSED: [],
};

const TRANSITION_MESSAGES = {
  UNDER_REVIEW: (status) =>
    `Cannot move loan to UNDER_REVIEW. Current status is '${status}', expected 'SUBMITTED'`,
  APPROVED: (status) =>
    `Cannot approve loan. Current status is '${status}', expected 'UNDER_REVIEW'`,
  REJECTED: (status) =>
    `Cannot reject loan. Current status is '${status}', expected 'UNDER_REVIEW'`,
  DISBURSED: (status) =>
    `Cannot disburse loan. Current status is '${status}', expected 'APPROVED'`,
  CLOSED: (status) =>
    `Cannot close loan. Current status is '${status}', expected 'DISBURSED'`,
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Central loan lifecycle guard. All status writes must go through this.
 * @param {object} loan
 * @param {string} nextStatus
 * @param {{ reason?: string }} [options]
 */
const assertLoanTransition = (loan, nextStatus, options = {}) => {
  if (!loan) {
    throw createHttpError(404, 'Loan application not found');
  }

  const current = loan.status;
  const allowed = ALLOWED_TRANSITIONS[current] || [];

  if (!allowed.includes(nextStatus)) {
    const messageFactory = TRANSITION_MESSAGES[nextStatus];
    const message = messageFactory
      ? messageFactory(current)
      : `Cannot transition loan from '${current}' to '${nextStatus}'`;
    throw createHttpError(400, message);
  }

  if (nextStatus === 'REJECTED') {
    const reason = options.reason != null ? String(options.reason).trim() : '';
    if (!reason) {
      throw createHttpError(
        400,
        'Rejection remarks are required when rejecting a loan application'
      );
    }
  }

  return true;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  assertLoanTransition,
};
