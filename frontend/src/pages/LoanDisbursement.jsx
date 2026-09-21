import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Banknote,
  Search,
  RefreshCw,
  CheckCircle2,
  IndianRupee,
  User,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { loanAPI } from '../api/client';
import {
  PageHeader,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  ConfirmDialog,
  LoanIdDisplay,
  useToast,
} from '../components';
import './LoanDisbursement.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const LoanDisbursement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Disburse dialog state
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [disbursedAmount, setDisbursedAmount] = useState(0);
  const [disburseLoading, setDisburseLoading] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await loanAPI.getAllLoans({ status: 'APPROVED', limit: 100 });
      if (response.data?.status === 'success') {
        setLoans(response.data.data?.loans || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('disbursement.loadingLoans');
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return loans;
    const q = searchTerm.toLowerCase();
    return loans.filter(
      (l) =>
        l.farmer?.name?.toLowerCase().includes(q) ||
        l.farmer?.email?.toLowerCase().includes(q) ||
        l.purpose?.toLowerCase().includes(q) ||
        l._id?.toLowerCase().includes(q)
    );
  }, [loans, searchTerm]);

  const summary = useMemo(() => ({
    count: loans.length,
    totalAmount: loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0),
  }), [loans]);

  const openDisburseDialog = (loan) => {
    setSelectedLoan(loan);
    setDisbursedAmount(loan.loanAmount || 0);
  };

  const handleDisburse = async () => {
    if (!selectedLoan || disburseLoading) return;
    setDisburseLoading(true);
    try {
      const response = await loanAPI.disburseLoan(selectedLoan._id, {
        disbursedAmount: Number(disbursedAmount),
      });
      if (response.data?.status === 'success') {
        showSuccess(t('loanDetail.successDisburse'));
        setSelectedLoan(null);
        await fetchLoans();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Disbursement failed. Please try again.');
    } finally {
      setDisburseLoading(false);
    }
  };

  return (
    <div className="disbursement-page-container">
      <PageHeader
        title={t('disbursement.title')}
      />

      {/* Summary Cards */}
      <div className="metrics-overview-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('disbursement.loansReady')}</span>
            <div className="metric-icon-box emerald"><CheckCircle2 size={18} /></div>
          </div>
          <div className="metric-main-value">{summary.count}</div>
          <div className="metric-footer-text">{t('disbursement.approvedPending')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('disbursement.totalApprovedAmount')}</span>
            <div className="metric-icon-box blue"><IndianRupee size={18} /></div>
          </div>
          <div className="metric-main-value disburse-amount">{fmt(summary.totalAmount)}</div>
          <div className="metric-footer-text">{t('disbursement.acrossAllApproved')}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="disbursement-filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('disbursement.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary refresh-btn"
          onClick={fetchLoans}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="disbursement-loader-wrap">
          <LoadingSpinner message={t('disbursement.loadingLoans')} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLoans} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={searchTerm ? t('disbursement.noSearchMatch') : t('disbursement.noApprovedLoans')}
          description={t('disbursement.emptyMessage')}
        />
      ) : (
        <div className="glass-panel disbursement-table-panel">
          <div className="disbursement-table-header">
            <span className="disbursement-results-count">
              {t('disbursement.readyCount', { count: filtered.length })}
            </span>
          </div>
          <div className="disbursement-table-responsive">
            <table className="disbursement-table">
              <thead>
                <tr>
                  <th>{t('disbursement.thFarmer')}</th>
                  <th>{t('disbursement.thLoanId')}</th>
                  <th>{t('disbursement.thPurpose')}</th>
                  <th>{t('disbursement.thApprovedAmount')}</th>
                  <th>{t('disbursement.thRateTenure')}</th>
                  <th>{t('disbursement.thApprovedBy')}</th>
                  <th>{t('disbursement.thStatus')}</th>
                  <th style={{ textAlign: 'right' }}>{t('disbursement.thAction')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan) => (
                  <tr key={loan._id}>
                    {/* Farmer */}
                    <td>
                      <div className="farmer-cell">
                        <div className="farmer-avatar-mini">
                          <User size={14} />
                        </div>
                        <div className="farmer-cell-info">
                          <span className="farmer-cell-name">{loan.farmer?.name || '—'}</span>
                          <span className="farmer-cell-phone">{loan.farmer?.email || ''}</span>
                        </div>
                      </div>
                    </td>

                    {/* Loan ID */}
                    <td>
                      <LoanIdDisplay id={loan._id} format="short" showCopy={true} />
                    </td>
                    <td>
                      <span className="purpose-text">{loan.purpose}</span>
                    </td>
                    {/* Amount */}
                    <td>
                      <div className="amount-cell">
                        <span className="amount-value">{fmt(loan.loanAmount)}</span>
                      </div>
                    </td>
                    {/* Rate / Tenure */}
                    <td>
                      <div className="rate-tenure-cell">
                        <span className="rate-val">{loan.interestRate}{t('disbursement.pa')}</span>
                        <span className="tenure-val">{loan.tenureMonths} {t('disbursement.months')}</span>
                      </div>
                    </td>
                    {/* Approved By */}
                    <td>
                      <span className="approved-by-text">
                        {loan.approvedBy?.name || '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td>
                      <StatusBadge status={loan.status} size="small" />
                    </td>
                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn disburse-action-btn"
                        onClick={() => openDisburseDialog(loan)}
                      >
                        <Banknote size={14} />
                        <span>{t('disbursement.disburseBtn')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disburse Confirmation Dialog */}
      {selectedLoan && (
        <div className="disburse-modal-overlay" onClick={() => !disburseLoading && setSelectedLoan(null)}>
          <div
            className="disburse-modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="disburse-modal-header">
              <div className="disburse-modal-icon-wrap">
                <Banknote size={24} />
              </div>
              <div>
                <h3 className="disburse-modal-title">{t('disbursement.confirmDisbursement')}</h3>
                <p className="disburse-modal-sub">
                  {t('disbursement.loanForFarmer')} <strong>{selectedLoan.farmer?.name}</strong>
                </p>
              </div>
            </div>

            <div className="disburse-modal-body">
              <div className="disburse-info-grid">
                <div className="disburse-info-item">
                  <span className="disburse-info-label"><User size={13} /> {t('disbursement.thFarmer')}</span>
                  <span className="disburse-info-val">{selectedLoan.farmer?.name}</span>
                </div>
                <div className="disburse-info-item">
                  <span className="disburse-info-label"><IndianRupee size={13} /> {t('disbursement.thApprovedAmount')}</span>
                  <span className="disburse-info-val text-emerald">{fmt(selectedLoan.loanAmount)}</span>
                </div>
                <div className="disburse-info-item">
                  <span className="disburse-info-label"><TrendingUp size={13} /> {t('disbursement.interestRate')}</span>
                  <span className="disburse-info-val">{selectedLoan.interestRate}{t('disbursement.pa')}</span>
                </div>
                <div className="disburse-info-item">
                  <span className="disburse-info-label"><Clock size={13} /> {t('disbursement.tenure')}</span>
                  <span className="disburse-info-val">{selectedLoan.tenureMonths} {t('disbursement.months')}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" htmlFor="disburse-amount">
                  {t('disbursement.disbursementAmount')} <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div className="disburse-amount-input-wrap">
                  <IndianRupee size={15} className="disburse-amount-icon" />
                  <input
                    id="disburse-amount"
                    type="number"
                    className="form-input disburse-amount-input"
                    value={disbursedAmount}
                    min={1}
                    max={selectedLoan.loanAmount}
                    onChange={(e) => setDisbursedAmount(e.target.value)}
                    disabled={disburseLoading}
                  />
                </div>
                <span className="input-hint">
                  {t('disbursement.disbursementHint')}
                </span>
              </div>

              <p className="disburse-note">
                {t('disbursement.disbursementNote')}
              </p>
            </div>

            <div className="disburse-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedLoan(null)}
                disabled={disburseLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn disburse-confirm-btn"
                onClick={handleDisburse}
                disabled={disburseLoading || !disbursedAmount || Number(disbursedAmount) <= 0}
              >
                <Banknote size={15} />
                <span>{disburseLoading ? t('disbursement.processing') : t('disbursement.confirmDisbursement')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDisbursement;
