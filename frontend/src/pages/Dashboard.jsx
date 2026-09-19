import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Eye,
  RefreshCw,
  Calendar,
  Building2,
  PieChart,
  BarChart3,
  SearchCheck,
  CreditCard,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { loanAPI, repaymentAPI, documentAPI } from '../api/client';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  CopyableId,
} from '../components';
import './Dashboard.css';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw Datasets from Real Backend Endpoints
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, repayRes, docsRes] = await Promise.allSettled([
        loanAPI.getAllLoans({ limit: 1000 }),
        repaymentAPI.getAllRepayments({ limit: 1000 }),
        documentAPI.getAllDocuments({ limit: 1000 }),
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
      setError(err.message || 'Failed to load administrative dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Real Backend Metrics & Summary Statistics
  const metrics = useMemo(() => {
    let totalApplications = loans.length;
    let countSubmitted = 0;
    let countUnderReview = 0;
    let countApproved = 0;
    let countRejected = 0;
    let countDisbursed = 0;
    let countClosed = 0;

    let totalRequestedCapital = 0;
    let totalDisbursedAmount = 0;

    // Set of unique farmers
    const farmerSet = new Set();

    loans.forEach((loan) => {
      const st = (loan.status || '').toUpperCase();
      totalRequestedCapital += loan.loanAmount || 0;

      if (loan.farmer?._id) {
        farmerSet.add(loan.farmer._id.toString());
      }

      if (st === 'SUBMITTED') countSubmitted++;
      else if (st === 'UNDER_REVIEW') countUnderReview++;
      else if (st === 'APPROVED') countApproved++;
      else if (st === 'REJECTED') countRejected++;
      else if (st === 'DISBURSED') {
        countDisbursed++;
        totalDisbursedAmount += loan.disbursedAmount || loan.loanAmount || 0;
      } else if (st === 'CLOSED') {
        countClosed++;
        totalDisbursedAmount += loan.disbursedAmount || loan.loanAmount || 0;
      }
    });

    let totalRepaid = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let outstandingAmount = 0;

    repayments.forEach((r) => {
      const paid = Number(r.amountPaid) || 0;
      const due = Number(r.amountDue) || 0;
      totalRepaid += paid;
      const rem = Math.max(0, due - paid);
      if (rem > 0) outstandingAmount += rem;
      if ((r.paymentStatus || '').toUpperCase() === 'OVERDUE') {
        overdueCount++;
        overdueAmount += rem;
      }
    });

    return {
      totalFarmers: farmerSet.size,
      totalApplications,
      countSubmitted,
      countUnderReview,
      countApproved,
      countRejected,
      countDisbursed,
      countClosed,
      totalRequestedCapital,
      totalDisbursedAmount,
      totalRepaid,
      outstandingAmount,
      overdueCount,
      overdueAmount,
    };
  }, [loans, repayments, t, i18n.language]);

  // Filter queue items requiring action
  const applicationsRequiringAttention = useMemo(() => {
    return loans.filter((l) => {
      const st = (l.status || '').toUpperCase();
      return st === 'SUBMITTED' || st === 'UNDER_REVIEW' || st === 'APPROVED';
    });
  }, [loans, t, i18n.language]);

  // Recent Repayments
  const recentRepayments = useMemo(() => {
    return repayments.slice(0, 6);
  }, [repayments, t, i18n.language]);

  return (
    <div className="dashboard-container">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <button onClick={fetchDashboardData} className="btn btn-secondary refresh-btn" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('dashboard.refreshData')}</span>
          </button>
        }
      />

      {loading ? (
        <div className="dashboard-loading-wrapper glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title={t('errorState.defaultTitle')} message={error} onRetry={fetchDashboardData} />
      ) : (
        <div className="dashboard-content-layout">
          {/* Executive Summary Metrics Grid */}
          <div className="metrics-grid">
            {/* Total Farmers */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/farmers')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.registeredFarmers')}</span>
                <div className="icon-box blue">
                  <Users size={18} />
                </div>
              </div>
              <div className="card-value">{metrics.totalFarmers}</div>
              <div className="card-footer">
                <span>{t('farmers.viewProfile')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Total Applications */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/loans')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.totalApplications')}</span>
                <div className="icon-box indigo">
                  <FileText size={18} />
                </div>
              </div>
              <div className="card-value">{metrics.totalApplications}</div>
              <div className="card-footer">
                <span>₹{metrics.totalRequestedCapital.toLocaleString('en-IN')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Submitted & Under Review (Action Pending) */}
            <div className="summary-card glass-panel highlight-action" onClick={() => navigate('/admin/loans?status=UNDER_REVIEW')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.pendingDecision')}</span>
                <div className="icon-box amber">
                  <Clock size={18} />
                </div>
              </div>
              <div className="card-value text-amber">
                {metrics.countSubmitted + metrics.countUnderReview}
              </div>
              <div className="card-footer">
                <span>{metrics.countSubmitted} {t('status.SUBMITTED')} | {metrics.countUnderReview} {t('status.UNDER_REVIEW')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Approved (Awaiting Disbursement) */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/loans?status=APPROVED')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.approvedLoans')}</span>
                <div className="icon-box emerald">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="card-value text-emerald">{metrics.countApproved}</div>
              <div className="card-footer">
                <span>{t('loans.modals.disburseTitle')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Disbursed Portfolio Capital */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/loans?status=DISBURSED')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.disbursedPortfolio')}</span>
                <div className="icon-box cyan">
                  <Banknote size={18} />
                </div>
              </div>
              <div className="card-value">₹{metrics.totalDisbursedAmount.toLocaleString('en-IN')}</div>
              <div className="card-footer">
                <span>{metrics.countDisbursed} {t('status.DISBURSED')} | {metrics.countClosed} {t('status.CLOSED')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Total Repaid Collections */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/repayments')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.collectionsRepaid')}</span>
                <div className="icon-box emerald">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="card-value text-emerald">₹{metrics.totalRepaid.toLocaleString('en-IN')}</div>
              <div className="card-footer">
                <span>{t('repayments.viewSchedule')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/repayments')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.outstandingBalance')}</span>
                <div className="icon-box purple">
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="card-value text-purple">₹{metrics.outstandingAmount.toLocaleString('en-IN')}</div>
              <div className="card-footer">
                <span>{t('repayments.pendingCollection')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Overdue Risk */}
            <div className="summary-card glass-panel highlight-danger" onClick={() => navigate('/admin/repayments?status=OVERDUE')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.overdueInstallments')}</span>
                <div className="icon-box rose">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="card-value text-rose">{metrics.overdueCount}</div>
              <div className="card-footer">
                <span>₹{metrics.overdueAmount.toLocaleString('en-IN')}</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts Row */}
          <div className="charts-grid-row">
            {/* Chart 1: Application Pipeline Breakdown */}
            <div className="dashboard-chart-card glass-panel">
              <div className="chart-header">
                <BarChart3 size={18} className="text-primary" />
                <h3>{t('dashboard.pipelineDistribution')}</h3>
              </div>
              <div className="status-bars-container">
                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.SUBMITTED')} ({metrics.countSubmitted})</span>
                    <span>{metrics.totalApplications > 0 ? Math.round((metrics.countSubmitted / metrics.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill blue"
                      style={{ width: `${metrics.totalApplications > 0 ? (metrics.countSubmitted / metrics.totalApplications) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.UNDER_REVIEW')} ({metrics.countUnderReview})</span>
                    <span>{metrics.totalApplications > 0 ? Math.round((metrics.countUnderReview / metrics.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill amber"
                      style={{ width: `${metrics.totalApplications > 0 ? (metrics.countUnderReview / metrics.totalApplications) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.APPROVED')} ({metrics.countApproved})</span>
                    <span>{metrics.totalApplications > 0 ? Math.round((metrics.countApproved / metrics.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill emerald"
                      style={{ width: `${metrics.totalApplications > 0 ? (metrics.countApproved / metrics.totalApplications) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.DISBURSED')} ({metrics.countDisbursed})</span>
                    <span>{metrics.totalApplications > 0 ? Math.round((metrics.countDisbursed / metrics.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill cyan"
                      style={{ width: `${metrics.totalApplications > 0 ? (metrics.countDisbursed / metrics.totalApplications) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.CLOSED')} ({metrics.countClosed})</span>
                    <span>{metrics.totalApplications > 0 ? Math.round((metrics.countClosed / metrics.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill slate"
                      style={{ width: `${metrics.totalApplications > 0 ? (metrics.countClosed / metrics.totalApplications) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.REJECTED')} ({metrics.countRejected})</span>
                    <span>{metrics.totalApplications > 0 ? Math.round((metrics.countRejected / metrics.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill rose"
                      style={{ width: `${metrics.totalApplications > 0 ? (metrics.countRejected / metrics.totalApplications) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Capital Deployment & Recovery Gauge */}
            <div className="dashboard-chart-card glass-panel">
              <div className="chart-header">
                <PieChart size={18} className="text-emerald" />
                <h3>{t('dashboard.recoveryRatio')}</h3>
              </div>
              <div className="capital-meter-wrapper">
                <div className="meter-ring">
                  <span className="meter-val">
                    {metrics.totalDisbursedAmount > 0
                      ? `${Math.min(100, Math.round((metrics.totalRepaid / metrics.totalDisbursedAmount) * 100))}%`
                      : '100%'}
                  </span>
                  <span className="meter-lbl">{t('status.PAID')}</span>
                </div>
                <div className="meter-breakdown">
                  <div className="breakdown-item">
                    <span className="dot emerald" />
                    <span>{t('dashboard.collectionsRepaid')}: <strong>₹{metrics.totalRepaid.toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="breakdown-item">
                    <span className="dot purple" />
                    <span>{t('dashboard.outstandingBalance')}: <strong>₹{metrics.outstandingAmount.toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="breakdown-item">
                    <span className="dot rose" />
                    <span>{t('reports.kpis.overdueExposure')}: <strong>₹{metrics.overdueAmount.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Queues & Lists */}
          <div className="tables-grid-row">
            {/* Queue 1: Applications Requiring Immediate Action */}
            <div className="queue-card glass-panel">
              <div className="queue-header">
                <div className="queue-title-group">
                  <Clock size={18} className="text-amber" />
                  <h3>{t('dashboard.applicationsRequiringAttention')} ({applicationsRequiringAttention.length})</h3>
                </div>
                <button
                  className="queue-view-all"
                  onClick={() => navigate('/admin/loans?status=UNDER_REVIEW')}
                >
                  <span>{t('dashboard.viewAllLoans')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {applicationsRequiringAttention.length === 0 ? (
                <EmptyState title={t('dashboard.noPendingApps')} description="" />
              ) : (
                <div className="queue-list">
                  {applicationsRequiringAttention.map((loan) => (
                    <div
                      key={loan._id}
                      className="queue-item"
                      onClick={() => navigate(`/admin/loans/${loan._id}`)}
                    >
                      <div className="queue-item-left">
                        <CopyableId id={loan._id} />
                        <div className="queue-farmer">{loan.farmer?.name || 'Farmer'}</div>
                        <div className="queue-subtext">₹{loan.loanAmount?.toLocaleString('en-IN')} • {loan.purpose}</div>
                      </div>

                      <div className="queue-item-right">
                        <StatusBadge status={loan.status} size="small" />
                        <button className="btn btn-secondary action-icon-btn" title={t('common.view')}>
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Queue 2: Recent Repayment Activity */}
            <div className="queue-card glass-panel">
              <div className="queue-header">
                <div className="queue-title-group">
                  <CreditCard size={18} className="text-emerald" />
                  <h3>{t('dashboard.recentRepayments')}</h3>
                </div>
                <button className="queue-view-all" onClick={() => navigate('/admin/repayments')}>
                  <span>{t('dashboard.viewAllRepayments')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {recentRepayments.length === 0 ? (
                <EmptyState title={t('dashboard.noRecentRepayments')} description="" />
              ) : (
                <div className="queue-list">
                  {recentRepayments.map((repay) => (
                    <div
                      key={repay._id}
                      className="queue-item"
                      onClick={() => navigate('/admin/repayments')}
                    >
                      <div className="queue-item-left">
                        <span className="queue-id">{t('repayments.columns.installment')} #{repay.installmentNumber}</span>
                        <div className="queue-farmer">{repay.borrower?.name || 'Borrower'}</div>
                        <div className="queue-subtext">
                          {t('repayments.columns.amountPaid')}: ₹{repay.amountPaid?.toLocaleString('en-IN')} / {t('repayments.columns.amountDue')}: ₹{repay.amountDue?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="queue-item-right">
                        <StatusBadge status={repay.paymentStatus} size="small" />
                        <span className="queue-date">{new Date(repay.dueDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
