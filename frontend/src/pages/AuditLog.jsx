import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollText,
  RefreshCw,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Banknote,
  SearchCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
} from 'lucide-react';
import { auditAPI } from '../api/client';
import {
  PageHeader,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  LoanIdDisplay,
  useToast,
} from '../components';
import './AuditLog.css';

const ACTION_CONFIG = {
  DOCUMENT_VERIFIED: { label: 'Document Verified',   color: 'emerald', icon: ShieldCheck },
  DOCUMENT_REJECTED: { label: 'Document Rejected',   color: 'rose',    icon: XCircle },
  LOAN_APPROVED:     { label: 'Loan Approved',        color: 'emerald', icon: CheckCircle2 },
  LOAN_DISBURSED:    { label: 'Loan Disbursed',       color: 'indigo',  icon: Banknote },
  LOAN_REJECTED:     { label: 'Loan Rejected',        color: 'rose',    icon: XCircle },
  LOAN_UNDER_REVIEW: { label: 'Moved to Review',      color: 'amber',   icon: SearchCheck },
  REPAYMENT_RECORDED:{ label: 'Repayment Recorded',   color: 'blue',    icon: CheckCircle2 },
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const PAGE_SIZE = 25;

const AuditLog = () => {
  const { t } = useTranslation();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const ACTION_FILTER_OPTIONS = [
    { key: 'ALL', label: t('auditLog.allActions') },
    ...Object.entries(ACTION_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label })),
  ];

  const fetchLogs = async (page = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (actionFilter !== 'ALL') params.action = actionFilter;

      const response = await auditAPI.getAuditLogs(params);
      if (response.data?.status === 'success') {
        setLogs(response.data.data?.auditLogs || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load audit logs';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [actionFilter, currentPage]);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  return (
    <div className="auditlog-page-container">
      <PageHeader
        title={t('auditLog.title')}
      />

      {/* Filter Bar */}
      <div className="auditlog-filter-bar">
        <div className="auditlog-filter-left">
          <Filter size={15} className="filter-icon" />
          <select
            className="auditlog-filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {ACTION_FILTER_OPTIONS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <span className="auditlog-total-count">{t('auditLog.entries', { count: totalCount })}</span>
        </div>
        <button
          className="btn btn-secondary refresh-btn"
          onClick={() => fetchLogs(currentPage)}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="auditlog-loader-wrap">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchLogs(currentPage)} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={40} />}
          title={t('auditLog.noAuditEntries')}
          message={
            actionFilter !== 'ALL'
              ? `No ${ACTION_CONFIG[actionFilter]?.label || actionFilter} events recorded.`
              : 'Audit entries are recorded when admins verify documents or disburse loans.'
          }
        />
      ) : (
        <div className="glass-panel auditlog-panel">
          {/* Read-only notice */}
          <div className="auditlog-notice">
            <ShieldCheck size={14} />
            <span>{t('auditLog.readOnlyNotice')}</span>
          </div>

          <div className="auditlog-table-responsive">
            <table className="auditlog-table">
              <thead>
                <tr>
                  <th>{t('auditLog.thTimestamp')}</th>
                  <th>{t('auditLog.thAdmin')}</th>
                  <th>{t('auditLog.thAction')}</th>
                  <th>{t('auditLog.thEntity')}</th>
                  <th>{t('auditLog.thDescription')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'slate', icon: ScrollText };
                  const Icon = cfg.icon;
                  return (
                    <tr key={log._id}>
                      {/* Timestamp */}
                      <td>
                        <span className="audit-timestamp">{fmtDateTime(log.createdAt)}</span>
                      </td>
                      {/* Admin */}
                      <td>
                        <div className="audit-admin-cell">
                          <div className="audit-admin-avatar">
                            <User size={13} />
                          </div>
                          <div className="audit-admin-info">
                            <span className="audit-admin-name">{log.adminUser?.name || '—'}</span>
                            <span className="audit-admin-email">{log.adminUser?.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      {/* Action Badge */}
                      <td>
                        <span className={`audit-action-badge badge-action-${cfg.color}`}>
                          <Icon size={12} />
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                      {/* Entity */}
                      <td>
                        <div className="audit-entity-cell">
                          <span className="audit-entity-type">{log.entityType}</span>
                          <LoanIdDisplay id={log.entityId} format="short" showCopy={true} />
                        </div>
                      </td>
                      {/* Description */}
                      <td>
                        <span className="audit-description">{log.description}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="auditlog-pagination">
              <button
                className="audit-page-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="audit-page-info">
                {t('auditLog.pageInfo', { current: currentPage, total: totalPages })}
              </span>
              <button
                className="audit-page-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
