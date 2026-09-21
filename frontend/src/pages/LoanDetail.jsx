import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Banknote,
  SearchCheck,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { loanAPI, documentAPI, repaymentAPI } from '../api/client';
import {
  PageHeader,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  ConfirmDialog,
  LoanIdDisplay,
  DocumentReview,
  useToast,
} from '../components';
import './LoanDetail.css';

const LoanDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [repayments, setRepayments] = useState([]);

  // Action Modals State
  const [activeActionModal, setActiveActionModal] = useState(null); // 'under-review' | 'approve' | 'reject' | 'disburse'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionForm, setActionForm] = useState({
    interestRate: 0,
    tenureMonths: 12,
    disbursedAmount: 0,
    remarks: '',
  });

  const fetchLoanData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Loan Details
      const loanRes = await loanAPI.getLoanById(id);
      if (!loanRes.data?.data?.loan) {
        throw new Error('Loan application document not returned by server');
      }
      const fetchedLoan = loanRes.data.data.loan;
      setLoan(fetchedLoan);
      setActionForm({
        interestRate: fetchedLoan.interestRate || 0,
        tenureMonths: fetchedLoan.tenureMonths || 12,
        disbursedAmount: fetchedLoan.loanAmount || 0,
        remarks: '',
      });

      // 2. Fetch Supporting Documents
      try {
        const docsRes = await documentAPI.getLoanDocuments(id);
        if (docsRes.data?.data?.documents) {
          setDocuments(docsRes.data.data.documents);
        }
      } catch (docErr) {
        console.warn('Documents fetch warning:', docErr.message);
      }

      // 3. Fetch Repayment Schedule if loan is DISBURSED or CLOSED
      const currentStatus = (fetchedLoan.status || '').toUpperCase();
      if (['DISBURSED', 'CLOSED'].includes(currentStatus)) {
        try {
          const repayRes = await repaymentAPI.getLoanRepayments(id);
          if (repayRes.data?.data?.repayments) {
            setRepayments(repayRes.data.data.repayments);
          }
        } catch (repayErr) {
          console.warn('Repayments fetch warning:', repayErr.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, [id]);

  // Execute State Transition Mutations
  const handleExecuteAction = async () => {
    if (!loan || actionLoading) return;
    setActionLoading(true);

    try {
      if (activeActionModal === 'under-review') {
        const res = await loanAPI.markUnderReview(loan._id);
        showSuccess(t('loanDetail.successUnderReview'));
      } else if (activeActionModal === 'approve') {
        const res = await loanAPI.approveLoan(loan._id, {
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
        const res = await loanAPI.rejectLoan(loan._id, {
          remarks: actionForm.remarks.trim(),
        });
        showSuccess(t('loanDetail.successReject'));
      } else if (activeActionModal === 'disburse') {
        if (!actionForm.disbursedAmount || Number(actionForm.disbursedAmount) <= 0) {
          showError(t('common.error'));
          setActionLoading(false);
          return;
        }
        const res = await loanAPI.disburseLoan(loan._id, {
          disbursedAmount: Number(actionForm.disbursedAmount),
        });
        showSuccess(t('loanDetail.successDisburse'));
      }

      setActiveActionModal(null);
      await fetchLoanData();
    } catch (err) {
      showError(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loan-detail-loading glass-panel">
        <LoadingSpinner message={t('common.loading')} />
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="loan-detail-error-container">
        <ErrorState title={t('common.error')} message={error} onRetry={fetchLoanData} />
        <button onClick={() => navigate('/admin/loans')} className="btn btn-secondary mt-4">
          <ArrowLeft size={16} /> {t('loanDetail.backToList')}
        </button>
      </div>
    );
  }

  const farmer = loan.farmer || {};
  const status = (loan.status || '').toUpperCase();

  return (
    <div className="loan-detail-container">
      <PageHeader
        title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>{t('loans.loanId')}:</span><LoanIdDisplay id={loan._id} format="full" showCopy={true} /></div>}
        breadcrumbsItems={[
          { label: t('nav.brandName'), path: '/admin' },
          { label: t('nav.loanApplications'), path: '/admin/loans' },
          { label: `#${loan._id.substring(0, 8)}`, path: `/admin/loans/${loan._id}`, isLast: true },
        ]}

        actions={
          <div className="detail-header-actions">
            <button onClick={() => navigate('/admin/loans')} className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>{t('loanDetail.backToList')}</span>
            </button>
            <button onClick={fetchLoanData} className="btn btn-secondary" title={t('common.refresh')}>
              <RefreshCw size={16} />
            </button>
          </div>
        }
      />

      {/* Top Banner Status & Workflow Action Bar */}
      <div className="status-banner-card glass-panel">
        <div className="banner-left">
          <span className="banner-label">{t('common.status')}:</span>
          <StatusBadge status={loan.status} size="large" />
        </div>

        {/* State Machine Transition Controls */}
        <div className="banner-actions">
          {status === 'SUBMITTED' && (
            <button
              onClick={() => setActiveActionModal('under-review')}
              className="btn review-btn"
              disabled={actionLoading}
            >
              <SearchCheck size={16} />
              <span>{t('loans.underReview')}</span>
            </button>
          )}

          {status === 'UNDER_REVIEW' && (
            <>
              <button
                onClick={() => setActiveActionModal('approve')}
                className="btn approve-btn"
                disabled={actionLoading}
              >
                <CheckCircle2 size={16} />
                <span>{t('common.approve')}</span>
              </button>
              <button
                onClick={() => setActiveActionModal('reject')}
                className="btn reject-btn"
                disabled={actionLoading}
              >
                <XCircle size={16} />
                <span>{t('common.reject')}</span>
              </button>
            </>
          )}

          {status === 'APPROVED' && (
            <button
              onClick={() => setActiveActionModal('disburse')}
              className="btn disburse-btn"
              disabled={actionLoading}
            >
              <Banknote size={16} />
              <span>{t('common.disburse')}</span>
            </button>
          )}

          {status === 'DISBURSED' && (
            <button onClick={() => navigate(`/admin/repayments?loan=${loan._id}`)} className="btn repayment-btn">
              <CreditCard size={16} />
              <span>{t('nav.repayments')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details & Borrower Profile */}
      <div className="loan-detail-grid">
        {/* Left Column: Financial Specifications */}
        <div className="detail-card glass-panel">
          <h3 className="card-section-title">
            <FileText size={18} className="text-emerald" />
            <span>{t('loanDetail.loanParameters')}</span>
          </h3>

          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">{t('loans.amount')}</span>
              <span className="spec-value highlight-currency">
                ₹{loan.loanAmount?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="spec-item">
              <span className="spec-label">{t('loans.purpose')}</span>
              <span className="spec-value">{loan.purpose}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">{t('loans.tenure')}</span>
              <span className="spec-value">{loan.tenureMonths} Months</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">{t('loanDetail.interestRateLabel')}</span>
              <span className="spec-value">{loan.interestRate || 0}%</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">{t('repayments.paymentMethod')}</span>
              <span className="spec-value">{loan.repaymentFrequency || 'MONTHLY'}</span>
            </div>

            {loan.disbursedAmount > 0 && (
              <div className="spec-item">
                <span className="spec-label">{t('disbursement.disbursedAmount')}</span>
                <span className="spec-value text-indigo">
                  ₹{loan.disbursedAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {loan.disbursedDate && (
              <div className="spec-item">
                <span className="spec-label">{t('loanDetail.disbursedDate')}</span>
                <span className="spec-value">
                  {new Date(loan.disbursedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {loan.remarks && (
            <div className="remarks-box">
              <strong>{t('common.remarks')}:</strong>
              <p>{loan.remarks}</p>
            </div>
          )}
        </div>

        {/* Right Column: Farmer Borrower Information */}
        <div className="detail-card glass-panel">
          <h3 className="card-section-title">
            <User size={18} className="text-emerald" />
            <span>{t('loanDetail.borrowerInfo')}</span>
          </h3>

          <div className="borrower-profile">
            <div className="borrower-name-header">
              <div className="borrower-avatar">
                <User size={24} />
              </div>
              <div>
                <h4 className="borrower-name">{farmer.name || 'Farmer'}</h4>
                <span className="borrower-role">{t('farmers.farmerName')}</span>
              </div>
            </div>

            <div className="borrower-fields">
              <div className="info-row">
                <Mail size={15} className="info-icon" />
                <span>{farmer.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <Phone size={15} className="info-icon" />
                <span>{farmer.phone || 'N/A'}</span>
              </div>
              <div className="info-row">
                <Building2 size={15} className="info-icon" />
                <span>{farmer.fpoName || 'Green Valley FPO'}</span>
              </div>
              <div className="info-row">
                <MapPin size={15} className="info-icon" />
                <span>
                  {[farmer.address?.village, farmer.address?.district, farmer.address?.state].filter(Boolean).join(', ') ||
                    'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Repayment Schedule Table (For DISBURSED or CLOSED loans) */}
      {['DISBURSED', 'CLOSED'].includes(status) && (
        <div className="repayments-schedule-card glass-panel">
          <h3 className="card-section-title">
            <CreditCard size={18} className="text-indigo" />
            <span>{t('loanDetail.repaymentSchedule')} ({repayments.length})</span>
          </h3>

          {repayments.length === 0 ? (
            <p className="no-docs-text">{t('common.loading')}</p>
          ) : (
            <div className="repayments-table-wrapper">
              <table className="repayments-table">
                <thead>
                  <tr>
                    <th>{t('repayments.installmentNo')}</th>
                    <th>{t('repayments.dueDate')}</th>
                    <th>{t('repayments.amountDue')}</th>
                    <th>{t('repayments.amountPaid')}</th>
                    <th>{t('repayments.paymentStatus')}</th>
                    <th>{t('repayments.paymentMethod')}</th>
                    <th>{t('repayments.paidDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {repayments.map((r) => (
                    <tr key={r._id}>
                      <td className="font-semibold">#{r.installmentNumber}</td>
                      <td>{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td className="font-semibold text-emerald">₹{r.amountDue?.toLocaleString('en-IN')}</td>
                      <td>₹{r.amountPaid?.toLocaleString('en-IN')}</td>
                      <td>
                        <StatusBadge status={r.paymentStatus} size="small" />
                      </td>
                      <td>{r.paymentMethod || '—'}</td>
                      <td>{r.paidDate ? new Date(r.paidDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Admin Document Review Module */}
      <DocumentReview documents={documents} onRefresh={fetchLoanData} />

      {/* Modal Action Controls */}

      {/* MODAL 1: Mark Under Review */}
      <ConfirmDialog
        isOpen={activeActionModal === 'under-review'}
        type="info"
        title={t('loans.underReview')}
        message={`#${loan._id.substring(0, 8)}`}
        confirmText={t('common.confirm')}
        onConfirm={handleExecuteAction}
        onCancel={() => setActiveActionModal(null)}
        loading={actionLoading}
      />

      {/* MODAL 2: Approve Loan */}
      {activeActionModal === 'approve' && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setActiveActionModal(null)}>
          <div className="modal-card action-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <CheckCircle2 size={24} className="text-emerald" />
                <h3>{t('loanDetail.approveModalTitle')}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveActionModal(null)} disabled={actionLoading}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('loanDetail.interestRateLabel')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-input"
                  value={actionForm.interestRate}
                  onChange={(e) => setActionForm({ ...actionForm, interestRate: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('loanDetail.tenureMonthsLabel')}</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={actionForm.tenureMonths}
                  onChange={(e) => setActionForm({ ...actionForm, tenureMonths: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.remarks')}</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={actionForm.remarks}
                  onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveActionModal(null)} disabled={actionLoading}>
                {t('common.cancel')}
              </button>
              <button className="btn approve-btn" onClick={handleExecuteAction} disabled={actionLoading}>
                {actionLoading ? t('common.loading') : t('common.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Loan */}
      {activeActionModal === 'reject' && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setActiveActionModal(null)}>
          <div className="modal-card action-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <XCircle size={24} className="text-rose" />
                <h3>{t('loanDetail.rejectModalTitle')}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveActionModal(null)} disabled={actionLoading}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('common.remarks')} *</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={actionForm.remarks}
                  onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                  disabled={actionLoading}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveActionModal(null)} disabled={actionLoading}>
                {t('common.cancel')}
              </button>
              <button className="btn reject-btn" onClick={handleExecuteAction} disabled={actionLoading}>
                {actionLoading ? t('common.loading') : t('common.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Disburse Loan */}
      {activeActionModal === 'disburse' && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setActiveActionModal(null)}>
          <div className="modal-card action-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <Banknote size={24} className="text-indigo" />
                <h3>{t('loanDetail.disburseModalTitle')}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveActionModal(null)} disabled={actionLoading}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('disbursement.disbursedAmount')} (₹)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={actionForm.disbursedAmount}
                  onChange={(e) => setActionForm({ ...actionForm, disbursedAmount: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveActionModal(null)} disabled={actionLoading}>
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

export default LoanDetail;
