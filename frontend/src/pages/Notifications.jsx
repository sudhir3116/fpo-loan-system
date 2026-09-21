import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Building2,
  CheckCheck,
  Trash2,
  RefreshCw,
  Info,
  ChevronRight,
  Filter,
  Eye,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { loanAPI, repaymentAPI, documentAPI } from '../api/client';
import {
  PageHeader,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  useToast,
} from '../components';
import './Notifications.css';

const Notifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw Backend Entities
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Stored Read Notification IDs in localStorage for persistence
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('fpo_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Category & Read Filters: 'ALL' | 'UNREAD' | 'ACTION_REQUIRED' | 'LOANS' | 'REPAYMENTS' | 'DOCUMENTS'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Selected Notification for Drawer Details View
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotificationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, repayRes, docsRes] = await Promise.allSettled([
        loanAPI.getAllLoans({ limit: 100 }),
        repaymentAPI.getAllRepayments({ limit: 100 }),
        documentAPI.getAllDocuments({ limit: 100 }),
      ]);

      if (loansRes.status === 'fulfilled' && loansRes.value.data?.status === 'success') {
        setLoans(loansRes.value.data.data.loans || []);
      }
      if (repayRes.status === 'fulfilled' && repayRes.value.data?.status === 'success') {
        setRepayments(repayRes.value.data.data.repayments || []);
      }
      if (docsRes.status === 'fulfilled' && docsRes.value.data?.status === 'success') {
        setDocuments(docsRes.value.data.data.documents || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync notifications from backend resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, []);

  // Save readIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fpo_read_notifications', JSON.stringify(readIds));
    } catch (e) {
      console.warn('Failed to save read notifications state', e);
    }
  }, [readIds]);

  // Compile Operational Action Notifications from real domain objects
  const allNotifications = useMemo(() => {
    const list = [];

    // 1. Loans: SUBMITTED (New Applications)
    loans.forEach((loan) => {
      const st = (loan.status || '').toUpperCase();
      const farmerName = loan.farmer?.name || 'Farmer';

      if (st === 'SUBMITTED') {
        list.push({
          id: `notif-loan-sub-${loan._id}`,
          titleKey: 'notifications.newLoanSubmittedTitle',
          descKey: 'notifications.newLoanSubmittedDesc',
          descParams: { farmer: farmerName, amount: loan.loanAmount?.toLocaleString('en-IN'), purpose: loan.purpose || 'Agricultural Loan' },
          category: 'LOANS',
          priority: 'HIGH',
          actionRequired: true,
          date: loan.createdAt || new Date().toISOString(),
          targetUrl: `/admin/loans/${loan._id}`,
          icon: FileText,
          iconColor: 'blue',
          meta: { loanId: loan._id, farmer: farmerName, amount: loan.loanAmount },
        });
      } else if (st === 'UNDER_REVIEW') {
        list.push({
          id: `notif-loan-rev-${loan._id}`,
          titleKey: 'notifications.awaitingDecisionTitle',
          descKey: 'notifications.awaitingDecisionDesc',
          descParams: { loanId: loan._id.substring(0, 8), farmer: farmerName },
          category: 'LOANS',
          priority: 'MEDIUM',
          actionRequired: true,
          date: loan.updatedAt || loan.createdAt || new Date().toISOString(),
          targetUrl: `/admin/loans/${loan._id}`,
          icon: Clock,
          iconColor: 'amber',
          meta: { loanId: loan._id, farmer: farmerName, amount: loan.loanAmount },
        });
      } else if (st === 'APPROVED') {
        list.push({
          id: `notif-loan-app-${loan._id}`,
          titleKey: 'notifications.awaitingDisbursementTitle',
          descKey: 'notifications.awaitingDisbursementDesc',
          descParams: { loanId: loan._id.substring(0, 8), amount: loan.loanAmount?.toLocaleString('en-IN') },
          category: 'LOANS',
          priority: 'HIGH',
          actionRequired: true,
          date: loan.updatedAt || loan.createdAt || new Date().toISOString(),
          targetUrl: `/admin/loans/${loan._id}`,
          icon: CheckCircle2,
          iconColor: 'emerald',
          meta: { loanId: loan._id, farmer: farmerName, amount: loan.loanAmount },
        });
      }
    });

    // 2. Repayments: OVERDUE
    repayments.forEach((repay) => {
      const st = (repay.paymentStatus || '').toUpperCase();
      if (st === 'OVERDUE') {
        const borrowerName = repay.borrower?.name || 'Borrower';
        const loanIdStr = typeof repay.loan === 'object' ? repay.loan._id : repay.loan;
        list.push({
          id: `notif-repay-over-${repay._id}`,
          titleKey: 'notifications.overdueAlertTitle',
          descKey: 'notifications.overdueAlertDesc',
          descParams: { installmentNo: repay.installmentNumber, amount: repay.amountDue?.toLocaleString('en-IN'), borrower: borrowerName, dueDate: new Date(repay.dueDate).toLocaleDateString('en-IN') },
          category: 'REPAYMENTS',
          priority: 'HIGH',
          actionRequired: true,
          date: repay.dueDate || new Date().toISOString(),
          targetUrl: `/admin/repayments`,
          icon: AlertTriangle,
          iconColor: 'rose',
          meta: { repaymentId: repay._id, loanId: loanIdStr, borrower: borrowerName, amount: repay.amountDue },
        });
      }
    });

    // 3. Documents: REJECTED
    documents.forEach((doc) => {
      const st = (doc.verificationStatus || '').toUpperCase();
      if (st === 'REJECTED') {
        const loanIdStr = typeof doc.loan === 'object' ? doc.loan._id : doc.loan;
        list.push({
          id: `notif-doc-rej-${doc._id}`,
          titleKey: 'notifications.docRejectedTitle',
          descKey: 'notifications.docRejectedDesc',
          descParams: { docType: doc.documentType || 'Uploaded Document', loanId: (loanIdStr || '').substring(0, 8), remarks: doc.rejectionReason || 'Invalid document' },
          category: 'DOCUMENTS',
          priority: 'MEDIUM',
          actionRequired: true,
          date: doc.updatedAt || doc.createdAt || new Date().toISOString(),
          targetUrl: loanIdStr ? `/admin/loans/${loanIdStr}` : '/admin/loans',
          icon: XCircle,
          iconColor: 'rose',
          meta: { docId: doc._id, loanId: loanIdStr, docType: doc.documentType, remarks: doc.rejectionReason },
        });
      }
    });

    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [loans, repayments, documents]);

  // Filtered Notifications based on category and read status
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      const isRead = readIds.includes(n.id);
      if (categoryFilter === 'UNREAD' && isRead) return false;
      if (categoryFilter === 'ACTION_REQUIRED' && !n.actionRequired) return false;
      if (['LOANS', 'REPAYMENTS', 'DOCUMENTS'].includes(categoryFilter) && n.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [allNotifications, categoryFilter, readIds]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !readIds.includes(n.id)).length;
  }, [allNotifications, readIds]);

  // Handlers
  const handleToggleRead = (id, e) => {
    if (e) e.stopPropagation();
    setReadIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleMarkAllRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadIds(allIds);
    showSuccess('All notifications marked as read');
  };

  const handleClearRead = () => {
    setReadIds((prev) => prev.filter((id) => !allNotifications.some((n) => n.id === id)));
    showSuccess('Notification read states reset');
  };

  const handleNotificationClick = (notif) => {
    if (!readIds.includes(notif.id)) {
      setReadIds((prev) => [...prev, notif.id]);
    }
    setSelectedNotification(notif);
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="notifications-page-container">
      <PageHeader
        title={t('notifications.title')}
        actions={
          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn btn-secondary">
                <CheckCheck size={15} />
                <span>{t('notifications.markAllRead', { count: unreadCount })}</span>
              </button>
            )}
            <button onClick={handleClearRead} className="btn btn-secondary">
              <RefreshCw size={15} />
              <span>{t('notifications.resetState')}</span>
            </button>
            <button onClick={fetchNotificationData} className="btn btn-secondary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            </button>
          </div>
        }
      />

      {/* Backend API Dependency Notice Banner */}
      <div className="backend-notice-banner glass-panel">
        <div className="notice-icon-wrapper">
          <Info size={20} className="text-amber" />
        </div>
        <div className="notice-content">
          <div className="notice-title">{t('notifications.backendNoticeTitle')}</div>
          <div className="notice-description">
            {t('notifications.backendNoticeDesc')}
          </div>
        </div>
      </div>

      {/* Category & Status Filter Tabs */}
      <div className="notif-filter-bar glass-panel">
        <button
          className={`notif-filter-chip ${categoryFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('ALL')}
        >
          <span>{t('notifications.allAlerts')}</span>
          <span className="count-pill">{allNotifications.length}</span>
        </button>
        <button
          className={`notif-filter-chip ${categoryFilter === 'UNREAD' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('UNREAD')}
        >
          <span>{t('notifications.unread')}</span>
          {unreadCount > 0 && <span className="count-pill unread">{unreadCount}</span>}
        </button>
        <button
          className={`notif-filter-chip ${categoryFilter === 'ACTION_REQUIRED' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('ACTION_REQUIRED')}
        >
          <span>{t('notifications.actionRequired')}</span>
        </button>
        <button
          className={`notif-filter-chip ${categoryFilter === 'LOANS' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('LOANS')}
        >
          <span>{t('nav.loanApplications')}</span>
        </button>
        <button
          className={`notif-filter-chip ${categoryFilter === 'REPAYMENTS' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('REPAYMENTS')}
        >
          <span>{t('nav.repayments')}</span>
        </button>
        <button
          className={`notif-filter-chip ${categoryFilter === 'DOCUMENTS' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('DOCUMENTS')}
        >
          <span>{t('nav.documentVerification')}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="notif-loading-card glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title="Failed to Fetch Notifications" message={error} onRetry={fetchNotificationData} />
      ) : filteredNotifications.length === 0 ? (
        <div className="notif-empty-card glass-panel">
          <EmptyState
            title={categoryFilter === 'UNREAD' ? t('notifications.noUnread') : t('notifications.allClear')}
            description={t('notifications.noNotifications')}
          />
        </div>
      ) : (
        <div className="notifications-list-container">
          {filteredNotifications.map((notif) => {
            const isRead = readIds.includes(notif.id);
            const IconComponent = notif.icon || Bell;

            return (
              <div
                key={notif.id}
                className={`notification-item-card glass-panel ${isRead ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`notif-icon-badge ${notif.iconColor || 'blue'}`}>
                  <IconComponent size={18} />
                </div>

                <div className="notif-card-body">
                  <div className="notif-card-header">
                    <h4 className="notif-title">{t(notif.titleKey)}</h4>
                    <div className="notif-meta-tags">
                      <span className={`category-tag ${notif.category.toLowerCase()}`}>{notif.category}</span>
                      {notif.priority === 'HIGH' && <span className="priority-tag high">{t('notifications.highPriority')}</span>}
                      {notif.priority === 'MEDIUM' && <span className="priority-tag medium">{t('notifications.mediumPriority')}</span>}
                      <span className="notif-time">{formatRelativeTime(notif.date)}</span>
                    </div>
                  </div>

                  <p className="notif-description">{t(notif.descKey, notif.descParams)}</p>

                  <div className="notif-card-footer">
                    <button
                      className="notif-action-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRead) handleToggleRead(notif.id);
                        navigate(notif.targetUrl);
                      }}
                    >
                      <span>{t('notifications.takeAction')}</span>
                      <ExternalLink size={13} />
                    </button>

                    <button
                      className="btn-mark-read"
                      title={isRead ? t('notifications.markUnread') : t('notifications.markRead')}
                      onClick={(e) => handleToggleRead(notif.id, e)}
                    >
                      {isRead ? <CircleDot size={15} /> : <CheckCircle2 size={15} />}
                      <span>{isRead ? t('notifications.markUnread') : t('notifications.markRead')}</span>
                    </button>
                  </div>
                </div>

                {!isRead && <div className="unread-dot-indicator" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Notification Details Modal */}
      {selectedNotification && (
        <div className="modal-backdrop" onClick={() => setSelectedNotification(null)}>
          <div className="modal-content glass-panel notif-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <selectedNotification.icon className={`text-${selectedNotification.iconColor}`} size={22} />
                <h3>{t(selectedNotification.titleKey)}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedNotification(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="notif-detail-row">
                <span className="detail-label">{t('notifications.category')}:</span>
                <span className={`category-tag ${selectedNotification.category.toLowerCase()}`}>
                  {selectedNotification.category}
                </span>
              </div>

              <div className="notif-detail-row">
                <span className="detail-label">{t('notifications.timestamp')}:</span>
                <span>{new Date(selectedNotification.date).toLocaleString('en-IN')}</span>
              </div>

              <div className="notif-detail-row">
                <span className="detail-label">{t('notifications.priorityLevel')}:</span>
                <span className={`priority-tag ${selectedNotification.priority.toLowerCase()}`}>
                  {selectedNotification.priority === 'HIGH' ? t('notifications.highPriority') : t('notifications.mediumPriority')}
                </span>
              </div>

              <div className="notif-detail-box">
                <span className="detail-label">{t('common.details')}:</span>
                <p>{t(selectedNotification.descKey, selectedNotification.descParams)}</p>
              </div>

              {selectedNotification.meta && (
                <div className="notif-meta-table">
                  <div className="meta-table-title">Target Payload Metadata</div>
                  {Object.entries(selectedNotification.meta).map(([k, v]) => (
                    <div key={k} className="meta-table-row">
                      <span className="meta-key">{k}:</span>
                      <span className="meta-val">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedNotification(null)}>
                {t('common.close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const target = selectedNotification.targetUrl;
                  setSelectedNotification(null);
                  navigate(target);
                }}
              >
                <span>Navigate to Target Record</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper SVG icon for Unread toggle
const CircleDot = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export default Notifications;
