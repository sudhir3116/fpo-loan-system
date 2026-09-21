import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { loanAPI, repaymentAPI, documentAPI } from '../api/client';
import {
  Sprout,
  LogOut,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  User,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import './FarmerDashboard.css';

const FarmerDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('loans');
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFarmerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, repaymentsRes, docsRes] = await Promise.allSettled([
        loanAPI.getMyLoans(),
        repaymentAPI.getMyRepayments(),
        documentAPI.getMyDocuments(),
      ]);

      if (loansRes.status === 'fulfilled') {
        setLoans(loansRes.value.data?.data?.loans || []);
      }
      if (repaymentsRes.status === 'fulfilled') {
        setRepayments(repaymentsRes.value.data?.data?.repayments || []);
      }
      if (docsRes.status === 'fulfilled') {
        setDocuments(docsRes.value.data?.data?.documents || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load farmer data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'DISBURSED':
      case 'VERIFIED':
      case 'PAID':
        return 'badge-success';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'PENDING':
        return 'badge-warning';
      case 'REJECTED':
      case 'OVERDUE':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  // Summary Metrics
  const totalLoanAmount = loans.reduce((acc, curr) => acc + (curr.loanAmount || 0), 0);
  const activeLoans = loans.filter((l) => ['APPROVED', 'DISBURSED', 'UNDER_REVIEW'].includes(l.status)).length;
  const pendingRepayments = repayments.filter((r) => r.status === 'PENDING' || r.status === 'OVERDUE').length;

  return (
    <div className="farmer-dashboard-layout">
      {/* Top Navigation */}
      <header className="farmer-header glass-panel">
        <div className="farmer-brand">
          <div className="farmer-brand-icon">
            <Sprout size={24} />
          </div>
          <div>
            <h2>{t('farmerDashboard.portalTitle')}</h2>
            <p>{t('farmerDashboard.portalSub')}</p>
          </div>
        </div>

        <div className="farmer-user-actions">
          <div className="farmer-profile-chip">
            <div className="farmer-avatar">
              <User size={18} />
            </div>
            <div className="farmer-meta">
              <span className="farmer-name">{user?.name || 'Farmer Member'}</span>
              <span className="farmer-email">{user?.email}</span>
            </div>
            <span className="badge badge-success role-badge">FARMER</span>
          </div>

          <button onClick={handleLogout} className="btn-logout" title={t('nav.signOut')}>
            <LogOut size={18} />
            <span>{t('nav.signOut')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="farmer-main-container">
        {/* Welcome & Stats Row */}
        <section className="farmer-stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-icon-wrap icon-loans">
              <CreditCard size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">{t('farmerDashboard.totalApplied')}</span>
              <span className="stat-value">₹{totalLoanAmount.toLocaleString('en-IN')}</span>
              <span className="stat-sub">{loans.length} application(s)</span>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrap icon-active">
              <Clock size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">{t('farmerDashboard.activeLoans')}</span>
              <span className="stat-value">{activeLoans}</span>
              <span className="stat-sub">Under review or active</span>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrap icon-repay">
              <FileText size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">{t('farmerDashboard.pendingInstallments')}</span>
              <span className="stat-value">{pendingRepayments}</span>
              <span className="stat-sub">Awaiting payment</span>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrap icon-kyc">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">{t('farmerDashboard.kycStatus')}</span>
              <span className="stat-value">
                {user?.kycVerified ? (
                  <span className="text-success">{t('farmers.kycVerified')}</span>
                ) : (
                  <span className="text-warning">{t('farmers.kycPending')}</span>
                )}
              </span>
              <span className="stat-sub">{user?.fpoName || 'Member'}</span>
            </div>
          </div>
        </section>

        {/* Content Navigation Tabs */}
        <div className="tabs-header">
          <div className="tabs-list">
            <button
              className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
              onClick={() => setActiveTab('loans')}
            >
              <CreditCard size={18} />
              <span>{t('farmerDashboard.myLoans')} ({loans.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'repayments' ? 'active' : ''}`}
              onClick={() => setActiveTab('repayments')}
            >
              <Clock size={18} />
              <span>{t('farmerDashboard.repayments')} ({repayments.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <FolderOpen size={18} />
              <span>{t('farmerDashboard.documents')} ({documents.length})</span>
            </button>
          </div>

          <button onClick={fetchFarmerData} className="btn-refresh" disabled={loading} title={t('common.refresh')}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>

        {/* Data Container */}
        <section className="farmer-data-section glass-panel">
          {error && (
            <div className="farmer-error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="farmer-loading-state">
              <RefreshCw size={28} className="spinning" />
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* Tab 1: My Loans */}
              {activeTab === 'loans' && (
                <div className="table-responsive">
                  {loans.length === 0 ? (
                    <div className="farmer-empty-state">
                      <CreditCard size={42} />
                      <p>{t('farmerDashboard.noLoans')}</p>
                      <span>Your submitted loan applications will appear here.</span>
                    </div>
                  ) : (
                    <table className="farmer-table">
                      <thead>
                        <tr>
                          <th>{t('loans.purpose')}</th>
                          <th>{t('loans.amount')}</th>
                          <th>{t('loans.tenure')}</th>
                          <th>{t('disbursement.interestRate')}</th>
                          <th>{t('loans.status')}</th>
                          <th>{t('loans.appliedDate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.map((loan) => (
                          <tr key={loan._id}>
                            <td className="font-medium text-main">{loan.purpose}</td>
                            <td className="font-semibold">₹{loan.loanAmount?.toLocaleString('en-IN')}</td>
                            <td>{loan.tenureMonths} Months</td>
                            <td>{loan.interestRate || 4}% p.a.</td>
                            <td>
                              <span className={`status-pill ${getStatusBadgeClass(loan.status)}`}>
                                {loan.status}
                              </span>
                            </td>
                            <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 2: Repayments */}
              {activeTab === 'repayments' && (
                <div className="table-responsive">
                  {repayments.length === 0 ? (
                    <div className="farmer-empty-state">
                      <Clock size={42} />
                      <p>{t('farmerDashboard.noRepayments')}</p>
                      <span>Repayment schedules are generated once an approved loan is disbursed.</span>
                    </div>
                  ) : (
                    <table className="farmer-table">
                      <thead>
                        <tr>
                          <th>{t('repayments.installment')} #</th>
                          <th>{t('repayments.amountDue')}</th>
                          <th>{t('repayments.dueDate')}</th>
                          <th>{t('loans.status')}</th>
                          <th>{t('repayments.amountPaid')}</th>
                          <th>{t('repayments.paidDate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repayments.map((repay) => (
                          <tr key={repay._id}>
                            <td className="font-medium">{t('repayments.installmentTag', { number: repay.installmentNumber })}</td>
                            <td className="font-semibold">₹{repay.amountDue?.toLocaleString('en-IN')}</td>
                            <td>{new Date(repay.dueDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-pill ${getStatusBadgeClass(repay.status)}`}>
                                {repay.status}
                              </span>
                            </td>
                            <td>₹{(repay.amountPaid || 0).toLocaleString('en-IN')}</td>
                            <td>{repay.paidDate ? new Date(repay.paidDate).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 3: Documents */}
              {activeTab === 'documents' && (
                <div className="table-responsive">
                  {documents.length === 0 ? (
                    <div className="farmer-empty-state">
                      <FolderOpen size={42} />
                      <p>{t('farmerDashboard.noDocs')}</p>
                      <span>Land records and identity proofs uploaded for your loans will appear here.</span>
                    </div>
                  ) : (
                    <table className="farmer-table">
                      <thead>
                        <tr>
                          <th>{t('documents.docName')}</th>
                          <th>{t('documents.docType')}</th>
                          <th>{t('documents.status')}</th>
                          <th>{t('documents.uploadedAt')}</th>
                          <th>{t('documents.viewDocument')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc._id}>
                            <td className="font-medium text-main">{doc.documentName}</td>
                            <td>{doc.documentType}</td>
                            <td>
                              <span className={`status-pill ${getStatusBadgeClass(doc.status)}`}>
                                {doc.status}
                              </span>
                            </td>
                            <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                            <td>
                              {doc.fileUrl ? (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="view-link"
                                >
                                  <span>{t('common.view')}</span>
                                  <ExternalLink size={14} />
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default FarmerDashboard;
