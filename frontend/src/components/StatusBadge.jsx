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
  SUBMITTED: { labelKey: 'status.submitted', color: 'blue', icon: Clock },
  UNDER_REVIEW: { labelKey: 'status.underReview', color: 'amber', icon: Search },
  APPROVED: { labelKey: 'status.approved', color: 'emerald', icon: CheckCircle2 },
  REJECTED: { labelKey: 'status.rejected', color: 'rose', icon: XCircle },
  DISBURSED: { labelKey: 'status.disbursed', color: 'indigo', icon: Banknote },
  CLOSED: { labelKey: 'status.closed', color: 'slate', icon: Lock },

  // Repayment & EMI Statuses
  PENDING: { labelKey: 'status.pending', color: 'amber', icon: Clock },
  PARTIAL: { labelKey: 'status.partial', color: 'violet', icon: AlertTriangle },
  PAID: { labelKey: 'status.paid', color: 'emerald', icon: CheckCircle2 },
  OVERDUE: { labelKey: 'status.overdue', color: 'rose', icon: AlertCircle },

  // Document Statuses
  VERIFIED: { labelKey: 'status.verified', color: 'emerald', icon: ShieldCheck },

  // User Account Statuses
  ACTIVE: { labelKey: 'status.active', color: 'emerald', icon: UserCheck },
  INACTIVE: { labelKey: 'status.inactive', color: 'slate', icon: UserX },
  SUSPENDED: { labelKey: 'status.suspended', color: 'rose', icon: AlertCircle },
};

const StatusBadge = ({ status, customLabel, size = 'medium', className = '' }) => {
  const { t } = useTranslation();
  const normalizedStatus = (status || '').toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    labelKey: null,
    color: 'slate',
    icon: Clock,
  };

  const Icon = config.icon;
  const badgeText = customLabel || (config.labelKey ? t(config.labelKey) : status || t('status.unknown'));

  return (
    <span className={`status-badge badge-${config.color} badge-${size} ${className}`}>
      {Icon && <Icon className="badge-icon" size={size === 'small' ? 12 : 14} />}
      <span className="badge-text">{badgeText}</span>
    </span>
  );
};

export default StatusBadge;
