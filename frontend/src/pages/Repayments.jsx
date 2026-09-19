import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  AlertCircle,
  IndianRupee,
  User,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Lock,
  ArrowRight,
  Banknote,
} from 'lucide-react';
import { repaymentAPI, loanAPI } from '../api/client';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  useToast,
  CopyableId,
} from '../components';
import './Repayments.css';

const Repayments = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Parse URL query parameter for pre-filtering loan or status (e.g. /admin/repayments?status=OVERDUE)
  const queryParams = new URLSearchParams(location.search);
  const initialLoanFilter = queryParams.get('loan') || 'ALL';
  const initialStatusFilter = queryParams.get('status') || 'ALL';
  const initialOverdueFilter = queryParams.get('overdue') === 'true' || initialStatusFilter === 'OVERDUE';

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [loanFilter, setLoanFilter] = useState(initialLoanFilter);
  const [overdueOnlyFilter, setOverdueOnlyFilter] = useState(initialOverdueFilter);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Schedule Modal State
  const [selectedScheduleLoan, setSelectedScheduleLoan] = useState(null);
  const [scheduleRepayments, setScheduleRepayments] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Record Payment Modal State
  const [selectedPaymentInst, setSelectedPaymentInst] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter !== 'ALL') {
        params.paymentStatus = statusFilter;
      }
      if (loanFilter !== 'ALL') {
        params.loan = loanFilter;
      }

      const [repaymentsRes, loansRes] = await Promise.allSettled([
        repaymentAPI.getAllRepayments(params),
        loanAPI.getAllLoans({ limit: 100 }),
      ]);

      if (repaymentsRes.status === 'fulfilled' && repaymentsRes.value.data?.status === 'success') {
        setRepayments(repaymentsRes.value.data.data.repayments || []);
        setTotalCount(repaymentsRes.value.data.totalCount || 0);
        setTotalPages(repaymentsRes.value.data.totalPages || 1);
      } else if (repaymentsRes.status === 'rejected') {
        console.warn('Repayments fetch warning:', repaymentsRes.reason?.message);
        setRepayments([]);
      }

      if (loansRes.status === 'fulfilled' && loansRes.value.data?.data?.loans) {
        setLoans(loansRes.value.data.data.loans || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load repayment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, statusFilter, loanFilter]);

  // Safely extract string representation of Loan ID
  const getLoanIdString = (loanProp) => {
    if (!loanProp) return '';
    if (typeof loanProp === 'string') return loanProp;
    if (typeof loanProp === 'object') {
      if (loanProp._id) return String(loanProp._id);
      if (loanProp.id) return String(loanProp.id);
    }
    return String(loanProp);
  };

  // Derive Overview Summary Metrics from real backend data
  const summaryMetrics = useMemo(() => {
    let totalDisbursed = 0;
    let activeLoansCount = 0;
    let closedLoansCount = 0;

    (loans || []).forEach((loan) => {
      if (!loan) return;
      const st = (loan.status || '').toUpperCase();
      if (st === 'DISBURSED') {
        activeLoansCount++;
        totalDisbursed += Number(loan.disbursedAmount) || Number(loan.loanAmount) || 0;
      } else if (st === 'CLOSED') {
        closedLoansCount++;
        totalDisbursed += Number(loan.disbursedAmount) || Number(loan.loanAmount) || 0;
      }
    });

    let totalRepaid = 0;
    let overdueCount = 0;
    let totalOutstanding = 0;

    (repayments || []).forEach((r) => {
      if (!r) return;
      const amountPaid = Number(r.amountPaid) || 0;
      const amountDue = Number(r.amountDue) || 0;
      totalRepaid += amountPaid;
      const remaining = Math.max(0, amountDue - amountPaid);
      if (remaining > 0) {
        totalOutstanding += remaining;
      }
      if ((r.paymentStatus || '').toUpperCase() === 'OVERDUE') {
        overdueCount++;
      }
    });

    return {
      totalDisbursed,
      totalRepaid,
      totalOutstanding,
      activeLoansCount,
      closedLoansCount,
      overdueCount,
    };
  }, [loans, repayments, t, i18n.language]);

  // Client-side Search & Overdue Filter
  const filteredRepayments = useMemo(() => {
    return (repayments || []).filter((r) => {
      if (!r) return false;
      const query = searchTerm.toLowerCase().trim();
      const borrowerName = typeof r.borrower === 'object' ? (r.borrower?.name || '') : '';
      const loanPurpose = typeof r.loan === 'object' ? (r.loan?.purpose || '') : '';
      const loanIdStr = getLoanIdString(r.loan);
      const txnRef = r.transactionReference || '';

      const matchesSearch =
        !query ||
        borrowerName.toLowerCase().includes(query) ||
        loanPurpose.toLowerCase().includes(query) ||
        loanIdStr.toLowerCase().includes(query) ||
        txnRef.toLowerCase().includes(query);

      const matchesOverdue = !overdueOnlyFilter || (r.paymentStatus || '').toUpperCase() === 'OVERDUE';

      return matchesSearch && matchesOverdue;
    });
  }, [repayments, searchTerm, overdueOnlyFilter, t, i18n.language]);

  // Handle opening Schedule Modal
  const handleOpenScheduleModal = async (loanObj) => {
    if (!loanObj) return;
    const loanId = typeof loanObj === 'object' ? (loanObj._id || loanObj.id) : loanObj;
    if (!loanId) return;

    setSelectedScheduleLoan(typeof loanObj === 'object' ? loanObj : { _id: loanId });
    setScheduleLoading(true);
    try {
      const res = await repaymentAPI.getLoanRepayments(loanId);
      if (res.data?.data?.repayments) {
        setScheduleRepayments(res.data.data.repayments || []);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch loan repayment schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Handle opening Record Payment Modal
  const handleOpenPaymentModal = (inst) => {
    if (!inst) return;
    setSelectedPaymentInst(inst);
    const amountDue = Number(inst.amountDue) || 0;
    const amountPaid = Number(inst.amountPaid) || 0;
    const remaining = Math.max(0, amountDue - amountPaid);
    setPaymentForm({
      amountPaid: remaining,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: '',
      remarks: '',
    });
  };

  // Execute Record Payment Mutation (PUT /api/repayments/:id/pay)
  const handleConfirmPayment = async () => {
    if (!selectedPaymentInst || paymentLoading) return;

    const amount = Number(paymentForm.amountPaid);
    if (isNaN(amount) || amount < 0) {
      showError('Payment amount cannot be negative');
      return;
    }

    const due = Number(selectedPaymentInst.amountDue) || 0;
    const paid = Number(selectedPaymentInst.amountPaid) || 0;
    const remaining = Math.max(0, due - paid);
    if (amount > remaining) {
      showError(`Payment amount (₹${amount}) cannot exceed remaining due (₹${remaining})`);
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await repaymentAPI.markRepaymentPaid(selectedPaymentInst._id, {
        amountPaid: amount,
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference.trim(),
        remarks: paymentForm.remarks.trim(),
      });

      showSuccess(response.data?.message || 'Payment successfully recorded');
      setSelectedPaymentInst(null);

      // Refresh data to reflect updated amounts, remaining balances, and loan status
      await fetchData();
      if (selectedScheduleLoan) {
        await handleOpenScheduleModal(selectedScheduleLoan);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to record repayment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: t('repayments.columns.loanId'),
      key: 'loan',
      render: (item) => {
        const loanIdStr = getLoanIdString(item.loan);
        const purpose = typeof item.loan === 'object' ? item.loan?.purpose : 'Crop Credit';
        return (
          <div className="loan-id-cell">
            <CopyableId id={loanIdStr} />
            <span className="purpose-subtext">{purpose || 'Crop Credit'}</span>
          </div>
        );
      },
    },
    {
      header: t('repayments.columns.borrower'),
      key: 'borrower',
      render: (item) => {
        const borrowerName = typeof item.borrower === 'object' ? (item.borrower?.name || 'Farmer Member') : 'Farmer Member';
        const borrowerPhone = typeof item.borrower === 'object' ? (item.borrower?.phone || 'No Phone') : 'No Phone';
        return (
          <div className="borrower-cell">
            <div className="borrower-avatar-mini">
              <User size={14} />
            </div>
            <div className="borrower-cell-info">
              <span className="borrower-cell-name">{borrowerName}</span>
              <span className="borrower-cell-phone">{borrowerPhone}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: t('repayments.columns.installment'),
      key: 'installmentNumber',
      align: 'center',
      render: (item) => (
        <span className="installment-tag">{t('repayments.columns.installment')} #{item.installmentNumber || 1}</span>
      ),
    },
    {
      header: t('repayments.columns.dueDate'),
      key: 'dueDate',
      sortable: true,
      render: (item) => (
        <span className="date-cell">
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) : 'N/A'}
        </span>
      ),
    },
    {
      header: t('repayments.columns.amountDue'),
      key: 'amountDue',
      sortable: true,
      render: (item) => (
        <span className="amount-cell due">₹{(Number(item.amountDue) || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: t('repayments.columns.amountPaid'),
      key: 'amountPaid',
      render: (item) => (
        <span className="amount-cell paid">₹{(Number(item.amountPaid) || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: t('repayments.columns.remaining'),
      key: 'remaining',
      render: (item) => {
        const due = Number(item.amountDue) || 0;
        const paid = Number(item.amountPaid) || 0;
        const remaining = Math.max(0, due - paid);
        return (
          <span className={`amount-cell ${remaining > 0 ? 'outstanding' : 'zero'}`}>
            ₹{remaining.toLocaleString('en-IN')}
          </span>
        );
      },
    },
    {
      header: t('repayments.columns.paymentStatus'),
      key: 'paymentStatus',
      align: 'center',
      render: (item) => <StatusBadge status={item.paymentStatus} />,
    },
    {
      header: t('repayments.columns.actions'),
      key: 'actions',
      align: 'right',
      render: (item) => {
        const isPaid = (item.paymentStatus || '').toUpperCase() === 'PAID';
        return (
          <div className="repayment-actions">
            {item.loan && (
              <button
                onClick={() => handleOpenScheduleModal(item.loan)}
                className="btn btn-secondary action-btn view-schedule-btn"
                title={t('repayments.viewSchedule')}
              >
                <Eye size={13} />
                <span>{t('repayments.viewSchedule')}</span>
              </button>
            )}

            {!isPaid && (
              <button
                onClick={() => handleOpenPaymentModal(item)}
                className="btn action-btn pay-btn"
                title={t('repayments.recordPay')}
              >
                <CreditCard size={13} />
                <span>{t('repayments.recordPay')}</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="repayments-page-container">
      <PageHeader
        title={t('repayments.title')}
        subtitle={t('repayments.subtitle')}
        actions={
          <button onClick={fetchData} className="btn btn-secondary refresh-btn" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('repayments.refreshRepayments')}</span>
          </button>
        }
      />

      {/* Summary Metrics Overview Cards */}
      <div className="metrics-overview-grid">
        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">{t('repayments.totalDisbursedCapital')}</span>
            <div className="metric-icon-box blue">
              <Banknote size={20} />
            </div>
          </div>
          <span className="metric-main-value">₹{summaryMetrics.totalDisbursed.toLocaleString('en-IN')}</span>
          <span className="metric-footer-text">{t('repayments.activeDisbursedLoans', { count: summaryMetrics.activeLoansCount })}</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">{t('repayments.totalRepaidCollections')}</span>
            <div className="metric-icon-box emerald">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="metric-main-value text-emerald">
            ₹{summaryMetrics.totalRepaid.toLocaleString('en-IN')}
          </span>
          <span className="metric-footer-text">{t('repayments.closedPaidLoans', { count: summaryMetrics.closedLoansCount })}</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">{t('repayments.totalOutstandingBalance')}</span>
            <div className="metric-icon-box amber">
              <CreditCard size={20} />
            </div>
          </div>
          <span className="metric-main-value text-amber">
            ₹{summaryMetrics.totalOutstanding.toLocaleString('en-IN')}
          </span>
          <span className="metric-footer-text">{t('repayments.pendingCollection')}</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">{t('repayments.overdueInstallments')}</span>
            <div className="metric-icon-box rose">
              <AlertCircle size={20} />
            </div>
          </div>
          <span className="metric-main-value text-rose">{summaryMetrics.overdueCount}</span>
          <span className="metric-footer-text">{t('repayments.pastDueInstallments')}</span>
        </div>
      </div>

      {/* Filter & Search Header */}
      <div className="repayments-filter-bar glass-panel">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={t('repayments.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="repay-status-select" className="filter-label">
              {t('repayments.paymentStatusLabel')}
            </label>
            <select
              id="repay-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">{t('repayments.allPaymentStatuses')}</option>
              <option value="PENDING">{t('status.PENDING')}</option>
              <option value="PARTIAL">{t('status.PARTIAL')}</option>
              <option value="PAID">{t('status.PAID')}</option>
              <option value="OVERDUE">{t('status.OVERDUE')}</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="loan-select" className="filter-label">
              {t('repayments.loanAppLabel')}
            </label>
            <select
              id="loan-select"
              value={loanFilter}
              onChange={(e) => {
                setLoanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">{t('repayments.allLoans')}</option>
              {(loans || []).map((l) => {
                if (!l) return null;
                const loanIdStr = getLoanIdString(l);
                const farmerName = l.farmer?.name || 'Farmer';
                const purposeStr = l.purpose ? String(l.purpose).substring(0, 20) : 'Crop Credit';
                return (
                  <option key={l._id || loanIdStr} value={l._id}>
                    #{loanIdStr.substring(0, 8)} - {farmerName} ({purposeStr})
                  </option>
                );
              })}
            </select>
          </div>

          <label className="checkbox-filter-label">
            <input
              type="checkbox"
              checked={overdueOnlyFilter}
              onChange={(e) => setOverdueOnlyFilter(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text text-rose font-semibold">{t('repayments.overdueOnly')}</span>
          </label>
        </div>
      </div>

      {/* Repayments Table Section */}
      {loading ? (
        <div className="repayments-loading-container glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title={t('errorState.defaultTitle')} message={error} onRetry={fetchData} />
      ) : filteredRepayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('emptyState.defaultTitle')}
          description={t('emptyState.defaultDesc')}
          action={
            (searchTerm || statusFilter !== 'ALL' || loanFilter !== 'ALL' || overdueOnlyFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setLoanFilter('ALL');
                  setOverdueOnlyFilter(false);
                }}
                className="btn btn-secondary"
              >
                {t('common.clearFilters')}
              </button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRepayments}
          pagination={{
            currentPage,
            totalPages,
            totalItems: totalCount,
            pageSize,
            onPageChange: setCurrentPage,
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            },
          }}
        />
      )}

      {/* MODAL 1: Complete Repayment Schedule View Modal */}
      {selectedScheduleLoan && (
        <div className="modal-backdrop" onClick={() => setSelectedScheduleLoan(null)}>
          <div className="modal-card schedule-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-wrapper">
                <CreditCard size={22} className="text-emerald" />
                <div>
                  <h3 className="modal-title">
                    {t('repayments.scheduleModal.title', { id: getLoanIdString(selectedScheduleLoan).substring(0, 10) })}
                  </h3>
                  <span className="modal-subtitle">
                    {t('repayments.scheduleModal.subtitle', {
                      name: selectedScheduleLoan.farmer?.name || 'Farmer',
                      purpose: selectedScheduleLoan.purpose || 'Agricultural Loan',
                    })}
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedScheduleLoan(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {scheduleLoading ? (
                <LoadingSpinner message={t('common.loading')} />
              ) : (scheduleRepayments || []).length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={t('repayments.scheduleModal.noSchedule')}
                  description={t('emptyState.defaultDesc')}
                />
              ) : (
                <div className="schedule-table-wrapper">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>{t('repayments.columns.installment')}</th>
                        <th>{t('repayments.columns.dueDate')}</th>
                        <th>{t('repayments.columns.amountDue')}</th>
                        <th>{t('repayments.columns.amountPaid')}</th>
                        <th>{t('repayments.columns.remaining')}</th>
                        <th>{t('repayments.columns.paymentStatus')}</th>
                        <th>{t('repayments.payModal.methodLabel')}</th>
                        <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleRepayments.map((inst) => {
                        const due = Number(inst.amountDue) || 0;
                        const paid = Number(inst.amountPaid) || 0;
                        const remaining = Math.max(0, due - paid);
                        const isPaid = (inst.paymentStatus || '').toUpperCase() === 'PAID';
                        return (
                          <tr key={inst._id || inst.installmentNumber}>
                            <td className="font-semibold">{t('repayments.columns.installment')} #{inst.installmentNumber}</td>
                            <td>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                            <td className="font-semibold text-emerald">
                              ₹{due.toLocaleString('en-IN')}
                            </td>
                            <td>₹{paid.toLocaleString('en-IN')}</td>
                            <td>₹{remaining.toLocaleString('en-IN')}</td>
                            <td>
                              <StatusBadge status={inst.paymentStatus} size="small" />
                            </td>
                            <td>
                              {inst.paymentMethod ? (
                                <span className="method-tag">
                                  {inst.paymentMethod}{' '}
                                  {inst.transactionReference && `(${inst.transactionReference})`}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {!isPaid && (
                                <button
                                  onClick={() => handleOpenPaymentModal(inst)}
                                  className="btn action-btn pay-btn"
                                  title={t('repayments.recordPay')}
                                >
                                  <CreditCard size={12} /> {t('repayments.recordPay')}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedScheduleLoan(null)}>
                {t('repayments.scheduleModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Installment Payment Modal Form */}
      {selectedPaymentInst && (
        <div className="modal-backdrop" onClick={() => !paymentLoading && setSelectedPaymentInst(null)}>
          <div className="modal-card payment-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-wrapper">
                <CreditCard size={22} className="text-emerald" />
                <h3>{t('repayments.payModal.title')}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedPaymentInst(null)}
                disabled={paymentLoading}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p className="payment-intro">
                {t('repayments.payModal.intro', {
                  inst: selectedPaymentInst.installmentNumber || 1,
                  date: selectedPaymentInst.dueDate ? new Date(selectedPaymentInst.dueDate).toLocaleDateString('en-IN') : 'N/A',
                  amount: (Number(selectedPaymentInst.amountDue) || 0).toLocaleString('en-IN'),
                })}
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="pay-amount" className="form-label">
                    {t('repayments.payModal.amountPaidLabel')} <span className="required-star">*</span>
                  </label>
                  <input
                    id="pay-amount"
                    type="number"
                    min="0"
                    max={selectedPaymentInst.amountDue}
                    step="0.01"
                    className="form-input"
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    disabled={paymentLoading}
                    required
                  />
                  <span className="input-hint">
                    {t('repayments.payModal.remainingDue', {
                      amount: Math.max(0, (Number(selectedPaymentInst.amountDue) || 0) - (Number(selectedPaymentInst.amountPaid) || 0)).toLocaleString('en-IN'),
                    })}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="pay-method" className="form-label">
                    {t('repayments.payModal.methodLabel')}
                  </label>
                  <select
                    id="pay-method"
                    className="form-select"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    disabled={paymentLoading}
                  >
                    <option value="BANK_TRANSFER">{t('repayments.payModal.bankTransfer')}</option>
                    <option value="UPI">{t('repayments.payModal.upi')}</option>
                    <option value="CASH">{t('repayments.payModal.cash')}</option>
                    <option value="CHEQUE">{t('repayments.payModal.cheque')}</option>
                    <option value="OTHER">{t('repayments.payModal.other')}</option>
                  </select>
                </div>

                <div className="form-group col-span-2">
                  <label htmlFor="pay-txn" className="form-label">
                    {t('repayments.payModal.txnRefLabel')}
                  </label>
                  <input
                    id="pay-txn"
                    type="text"
                    className="form-input"
                    placeholder={t('repayments.payModal.txnRefPlaceholder')}
                    value={paymentForm.transactionReference}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
                    }
                    disabled={paymentLoading}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label htmlFor="pay-remarks" className="form-label">
                    {t('repayments.payModal.remarksLabel')}
                  </label>
                  <textarea
                    id="pay-remarks"
                    className="form-textarea"
                    rows="2"
                    placeholder={t('repayments.payModal.remarksPlaceholder')}
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    disabled={paymentLoading}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedPaymentInst(null)}
                disabled={paymentLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn pay-confirm-btn"
                onClick={handleConfirmPayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? t('repayments.payModal.recording') : t('repayments.payModal.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repayments;
