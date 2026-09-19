import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Banknote,
  Lock,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  // Loan Application Statuses
  SUBMITTED: { label: 'Submitted', color: 'blue', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'amber', icon: Search },
  APPROVED: { label: 'Approved', color: 'emerald', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'rose', icon: XCircle },
  DISBURSED: { label: 'Disbursed', color: 'indigo', icon: Banknote },
  CLOSED: { label: 'Closed', color: 'slate', icon: Lock },

  // Repayment & EMI Statuses
  PENDING: { label: 'Pending', color: 'amber', icon: Clock },
  PARTIAL: { label: 'Partial', color: 'violet', icon: AlertTriangle },
  PAID: { label: 'Paid', color: 'emerald', icon: CheckCircle2 },
  OVERDUE: { label: 'Overdue', color: 'rose', icon: AlertCircle },

  // Document Statuses
  VERIFIED: { label: 'Verified', color: 'emerald', icon: ShieldCheck },

  // User Account Statuses
  ACTIVE: { label: 'Active', color: 'emerald', icon: UserCheck },
  INACTIVE: { label: 'Inactive', color: 'slate', icon: UserX },
  SUSPENDED: { label: 'Suspended', color: 'rose', icon: AlertCircle },
};

const StatusBadge = ({ status, customLabel, size = 'medium', className = '' }) => {
  const { t } = useTranslation();
  const normalizedStatus = (status || '').toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    color: 'slate',
    icon: Clock,
  };

  const Icon = config.icon;
  const translatedLabel = customLabel || t(`status.${normalizedStatus}`, config.label);

  return (
    <span className={`status-badge badge-${config.color} badge-${size} ${className}`}>
      {Icon && <Icon className="badge-icon" size={size === 'small' ? 12 : 14} />}
      <span className="badge-text">{translatedLabel}</span>
    </span>
  );
};

export default StatusBadge;
