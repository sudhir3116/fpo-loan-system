import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  SearchCheck,
  CheckCircle2,
  XCircle,
  Banknote,
  CreditCard,
  User,
  Building2,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { loanAPI } from '../api/client';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  ConfirmDialog,
  LoanIdDisplay,
  useToast,
} from '../components';
import './Loans.css';

const Loans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const initialStatusFilter = queryParams.get('status') || 'ALL';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [amountFilter, setAmountFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Action Modals State
  const [activeActionModal, setActiveActionModal] = useState(null); // 'under-review' | 'approve' | 'reject' | 'disburse'
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Action Form Inputs
  const [actionForm, setActionForm] = useState({
    interestRate: 0,
    tenureMonths: 12,
    disbursedAmount: 0,
    remarks: '',
  });

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const response = await loanAPI.getAllLoans(params);
      if (response.data?.status === 'success') {
        setLoans(response.data.data.loans || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [currentPage, pageSize, statusFilter]);

  // Client-side Search & Amount Filtering
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const query = searchTerm.toLowerCase().trim();
      const farmerName = loan.farmer?.name || '';
      const farmerEmail = loan.farmer?.email || '';
      const purpose = loan.purpose || '';
      const loanId = loan._id || '';

      const matchesSearch =
        !query ||
        farmerName.toLowerCase().includes(query) ||
        farmerEmail.toLowerCase().includes(query) ||
        purpose.toLowerCase().includes(query) ||
        loanId.toLowerCase().includes(query);

      let matchesAmount = true;
      const amount = loan.loanAmount || 0;
      if (amountFilter === 'LOW') matchesAmount = amount < 50000;
      else if (amountFilter === 'MID') matchesAmount = amount >= 50000 && amount <= 100000;
      else if (amountFilter === 'HIGH') matchesAmount = amount > 100000;

      return matchesSearch && matchesAmount;
    });
  }, [loans, searchTerm, amountFilter]);

  // State Transition Handlers
  const handleOpenActionModal = (loan, actionType) => {
    setSelectedLoan(loan);
    setActiveActionModal(actionType);
    setActionForm({
      interestRate: loan.interestRate || 0,
      tenureMonths: loan.tenureMonths || 12,
      disbursedAmount: loan.loanAmount || 0,
      remarks: '',
    });
  };

  const handleCloseActionModal = () => {
    setActiveActionModal(null);
    setSelectedLoan(null);
    setActionLoading(false);
  };

  const handleExecuteAction = async () => {
    if (!selectedLoan) return;
    setActionLoading(true);

    try {
      if (activeActionModal === 'under-review') {
        await loanAPI.markUnderReview(selectedLoan._id);
        showSuccess(t('loanDetail.successUnderReview'));
      } else if (activeActionModal === 'approve') {
        await loanAPI.approveLoan(selectedLoan._id, {
          interestRate: Number(actionForm.interestRate),
          tenureMonths: Number(actionForm.tenureMonths),
          remarks: actionForm.remarks,
        });
        showSuccess(t('loanDetail.successApprove'));
      } else if (activeActionModal === 'reject') {
        if (!actionForm.remarks.trim()) {
          showError(t('loanDetail.rejectionReasonRequired'));
          setActionLoading(false);
          return;
        }
        await loanAPI.rejectLoan(selectedLoan._id, {
          remarks: actionForm.remarks.trim(),
        });
        showSuccess(t('loanDetail.successReject'));
      } else if (activeActionModal === 'disburse') {
        if (!actionForm.disbursedAmount || Number(actionForm.disbursedAmount) <= 0) {
          showError(t('common.error'));
          setActionLoading(false);
          return;
        }
        await loanAPI.disburseLoan(selectedLoan._id, {
          disbursedAmount: Number(actionForm.disbursedAmount),
        });
        showSuccess(t('loanDetail.successDisburse'));
      }

      handleCloseActionModal();
      fetchLoans();
    } catch (err) {
      showError(err.response?.data?.message || t('common.error'));
      setActionLoading(false);
    }
  };

  // Table Columns Setup
  const columns = [
    {
      header: t('loans.loanId'),
      key: '_id',
      render: (item) => (
        <div className="loan-id-cell">
          <LoanIdDisplay id={item._id} format="short" showCopy={true} />
          <span className="loan-frequency-tag">{item.repaymentFrequency || 'MONTHLY'}</span>
        </div>
      ),
    },
    {
      header: t('loans.farmer'),
      key: 'farmer',
      render: (item) => (
        <div className="farmer-cell">
          <div className="farmer-avatar-mini">
            <User size={14} />
          </div>
          <div className="farmer-cell-info">
            <span className="farmer-cell-name">{item.farmer?.name || 'Farmer'}</span>
            <span className="farmer-cell-phone">{item.farmer?.phone || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      header: t('farmers.fpoName'),
      key: 'fpoName',
      render: (item) => (
        <div className="fpo-cell">
          <Building2 size={13} className="cell-icon" />
          <span>{item.farmer?.fpoName || 'Green Valley FPO'}</span>
        </div>
      ),
    },
    {
      header: t('loans.amount'),
      key: 'loanAmount',
      sortable: true,
      render: (item) => (
        <div className="amount-cell">
          <span className="amount-value">₹{item.loanAmount?.toLocaleString('en-IN')}</span>
          <span className="amount-tenure">{item.interestRate || 0}% p.a.</span>
        </div>
      ),
    },
    {
      header: t('loans.tenure'),
      key: 'tenureMonths',
      render: (item) => <span className="tenure-cell">{item.tenureMonths} Months</span>,
    },
    {
      header: t('loans.purpose'),
      key: 'purpose',
      render: (item) => (
        <span className="purpose-text" title={item.purpose}>
          {item.purpose?.length > 30 ? `${item.purpose.substring(0, 30)}...` : item.purpose}
        </span>
      ),
    },
    {
      header: t('loans.appliedDate'),
      key: 'createdAt',
      sortable: true,
      render: (item) => (
        <span className="date-cell">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t('loans.status'),
      key: 'status',
      align: 'center',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: t('loans.actions'),
      key: 'actions',
      align: 'right',
      render: (item) => {
        const status = (item.status || '').toUpperCase();
        return (
          <div className="action-buttons-group">
            {/* View Details */}
            <button
              onClick={() => navigate(`/admin/loans/${item._id}`)}
              className="btn action-btn view-btn"
              title={t('loans.viewDetails')}
            >
              <Eye size={13} />
              <span>{t('common.view')}</span>
            </button>

            {/* Contextual Actions strictly based on Backend State Machine */}
            {status === 'SUBMITTED' && (
              <button
                onClick={() => handleOpenActionModal(item, 'under-review')}
                className="btn action-btn review-btn"
                title={t('common.markUnderReview')}
              >
                <SearchCheck size={13} />
                <span>{t('loans.underReview')}</span>
              </button>
            )}

            {status === 'UNDER_REVIEW' && (
              <>
                <button
                  onClick={() => handleOpenActionModal(item, 'approve')}
                  className="btn action-btn approve-btn"
                  title={t('loans.approve')}
                >
                  <CheckCircle2 size={13} />
                  <span>{t('common.approve')}</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal(item, 'reject')}
                  className="btn action-btn reject-btn"
                  title={t('loans.reject')}
                >
                  <XCircle size={13} />
                  <span>{t('common.reject')}</span>
                </button>
              </>
            )}

            {status === 'APPROVED' && (
              <button
                onClick={() => handleOpenActionModal(item, 'disburse')}
                className="btn action-btn disburse-btn"
                title={t('loans.disburse')}
              >
                <Banknote size={13} />
                <span>{t('common.disburse')}</span>
              </button>
            )}

            {status === 'DISBURSED' && (
              <button
                onClick={() => navigate(`/admin/repayments?loan=${item._id}`)}
                className="btn action-btn repayment-btn"
                title={t('nav.repayments')}
              >
                <CreditCard size={13} />
                <span>{t('nav.repayments')}</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="loans-page-container">
      <PageHeader
        title={t('loans.title')}
        actions={
          <button onClick={fetchLoans} className="btn btn-secondary refresh-btn" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('common.refresh')}</span>
          </button>
        }
      />

      {/* Filter & Search Header */}
      <div className="loans-filter-bar glass-panel">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={t('loans.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="loan-status-select" className="filter-label">
              {t('common.status')}:
            </label>
            <select
              id="loan-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">{t('loans.allStatuses')}</option>
              <option value="SUBMITTED">{t('status.submitted')}</option>
              <option value="UNDER_REVIEW">{t('status.underReview')}</option>
              <option value="APPROVED">{t('status.approved')}</option>
              <option value="REJECTED">{t('status.rejected')}</option>
              <option value="DISBURSED">{t('status.disbursed')}</option>
              <option value="CLOSED">{t('status.closed')}</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="amount-select" className="filter-label">
              {t('loans.amount')}:
            </label>
            <select
              id="amount-select"
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="LOW">&lt; ₹50,000</option>
              <option value="MID">₹50,000 - ₹1,00,000</option>
              <option value="HIGH">&gt; ₹1,00,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Content Section */}
      {loading ? (
        <div className="loans-loading-container glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title={t('common.error')} message={error} onRetry={fetchLoans} />
      ) : filteredLoans.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('loans.noLoansFound')}
          description={t('empty.tryAdjusting')}
          action={
            (searchTerm || statusFilter !== 'ALL' || amountFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setAmountFilter('ALL');
                }}
                className="btn btn-secondary"
              >
                {t('common.reset')}
              </button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredLoans}
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

      {/* MODAL 1: Mark Under Review */}
      <ConfirmDialog
        isOpen={activeActionModal === 'under-review'}
        type="info"
        title={t('loans.underReview')}
        message={`#${selectedLoan?._id?.substring(0, 8)}`}
        confirmText={t('common.confirm')}
        onConfirm={handleExecuteAction}
        onCancel={handleCloseActionModal}
        loading={actionLoading}
      />

      {/* MODAL 2: Approve Loan Modal Form */}
      {activeActionModal === 'approve' && (
        <div className="modal-backdrop" onClick={handleCloseActionModal}>
          <div className="modal-card action-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <CheckCircle2 size={24} className="text-emerald" />
                <h3>{t('loanDetail.approveModalTitle')}</h3>
              </div>
              <button className="modal-close-btn" onClick={handleCloseActionModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-intro">
                <strong>{selectedLoan?.farmer?.name}</strong> (₹{selectedLoan?.loanAmount?.toLocaleString('en-IN')})
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="approve-interest" className="form-label">
                    {t('loanDetail.interestRateLabel')}
                  </label>
                  <input
                    id="approve-interest"
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-input"
                    value={actionForm.interestRate}
                    onChange={(e) => setActionForm({ ...actionForm, interestRate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="approve-tenure" className="form-label">
                    {t('loanDetail.tenureMonthsLabel')}
                  </label>
                  <input
                    id="approve-tenure"
                    type="number"
                    min="1"
                    className="form-input"
                    value={actionForm.tenureMonths}
                    onChange={(e) => setActionForm({ ...actionForm, tenureMonths: e.target.value })}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label htmlFor="approve-remarks" className="form-label">
                    {t('common.remarks')}
                  </label>
                  <textarea
                    id="approve-remarks"
                    className="form-textarea"
                    rows="3"
                    placeholder={t('loanDetail.approveRemarksPlaceholder')}
                    value={actionForm.remarks}
                    onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseActionModal} disabled={actionLoading}>
                {t('common.cancel')}
              </button>
              <button className="btn approve-btn" onClick={handleExecuteAction} disabled={actionLoading}>
                {actionLoading ? t('common.loading') : t('common.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Loan Modal Form */}
      {activeActionModal === 'reject' && (
        <div className="modal-backdrop" onClick={handleCloseActionModal}>
          <div className="modal-card action-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <XCircle size={24} className="text-rose" />
                <h3>{t('loanDetail.rejectModalTitle')}</h3>
              </div>
              <button className="modal-close-btn" onClick={handleCloseActionModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-intro">
                <strong>{selectedLoan?.farmer?.name}</strong>.
              </p>

              <div className="form-group col-span-2">
                <label htmlFor="reject-remarks" className="form-label">
                  {t('common.remarks')} <span className="required-star">*</span>
                </label>
                <textarea
                  id="reject-remarks"
                  className="form-textarea"
                  rows="4"
                  placeholder={t('loanDetail.rejectionReasonPlaceholder')}
                  value={actionForm.remarks}
                  onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseActionModal} disabled={actionLoading}>
                {t('common.cancel')}
              </button>
              <button className="btn reject-btn" onClick={handleExecuteAction} disabled={actionLoading}>
                {actionLoading ? t('common.loading') : t('common.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Disburse Loan Modal Form */}
      {activeActionModal === 'disburse' && (
        <div className="modal-backdrop" onClick={handleCloseActionModal}>
          <div className="modal-card action-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <Banknote size={24} className="text-indigo" />
                <h3>{t('loanDetail.disburseModalTitle')}</h3>
              </div>
              <button className="modal-close-btn" onClick={handleCloseActionModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-intro">
                <strong>{selectedLoan?.farmer?.name}</strong>.
              </p>

              <div className="form-group">
                <label htmlFor="disburse-amount" className="form-label">
                  {t('disbursement.disbursedAmount')} (₹)
                </label>
                <input
                  id="disburse-amount"
                  type="number"
                  min="1"
                  className="form-input"
                  value={actionForm.disbursedAmount}
                  onChange={(e) => setActionForm({ ...actionForm, disbursedAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseActionModal} disabled={actionLoading}>
                {t('common.cancel')}
              </button>
              <button className="btn disburse-btn" onClick={handleExecuteAction} disabled={actionLoading}>
                {actionLoading ? t('common.loading') : t('common.disburse')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
