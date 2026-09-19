import React from 'react';

const getLoanStatusStyles = (status) => {
  const styles = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    DISBURSED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

const getLoanStatusLabel = (status) => {
  const labels = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DISBURSED: 'Disbursed',
    CLOSED: 'Closed',
  };
  return labels[status] || status;
};

export const LoanStatusBadge = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLoanStatusStyles(status)}`}>
      {getLoanStatusLabel(status)}
    </span>
  );
};

const getRepaymentStatusStyles = (status) => {
  const styles = {
    PENDING: 'bg-red-100 text-red-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

const getRepaymentStatusLabel = (status) => {
  const labels = {
    PENDING: 'Payment Pending',
    PARTIAL: 'Partially Paid',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
  };
  return labels[status] || status;
};

export const RepaymentStatusBadge = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRepaymentStatusStyles(status)}`}>
      {getRepaymentStatusLabel(status)}
    </span>
  );
};

const getDocumentStatusStyles = (status) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

const getDocumentStatusLabel = (status) => {
  const labels = {
    PENDING: 'Pending Verification',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
  };
  return labels[status] || status;
};

export const DocumentStatusBadge = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDocumentStatusStyles(status)}`}>
      {getDocumentStatusLabel(status)}
    </span>
  );
};
