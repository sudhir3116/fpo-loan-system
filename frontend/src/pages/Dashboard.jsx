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
  LoanIdDisplay,
} from '../components';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
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
      setError(err.message || t('common.error'));
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

    repayments.forEach((r) => {
      totalRepaid += r.amountPaid || 0;
      const due = r.amountDue || 0;
      const paid = r.amountPaid || 0;
      if (r.paymentStatus === 'OVERDUE') {
        overdueCount++;
        overdueAmount += Math.max(0, due - paid);
      }
    });

    const outstandingAmount = Math.max(0, totalDisbursedAmount - totalRepaid);

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
  }, [loans, repayments]);

  // Operational Action Queues
  const applicationsRequiringAttention = useMemo(() => {
    return loans
      .filter((l) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes((l.status || '').toUpperCase()))
      .slice(0, 5);
  }, [loans]);

  const recentRepayments = useMemo(() => {
    return [...repayments]
      .sort((a, b) => new Date(b.updatedAt || b.dueDate) - new Date(a.updatedAt || a.dueDate))
      .slice(0, 5);
  }, [repayments]);

  return (
    <div className="dashboard-page-container">
      <PageHeader
        title={t('dashboard.title')}
        actions={
          <button onClick={fetchDashboardData} className="btn btn-secondary refresh-btn" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('common.refresh')}</span>
          </button>
        }
      />

      {loading ? (
        <div className="dashboard-loading-card glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title={t('common.error')} message={error} onRetry={fetchDashboardData} />
      ) : (
        <div className="dashboard-body">
          {/* Top Operational Metrics Summary Grid */}
          <div className="metrics-grid">
            {/* Total Farmers */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/farmers')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.totalFarmers')}</span>
                <div className="icon-box blue">
                  <Users size={18} />
                </div>
              </div>
              <div className="card-value">{metrics.totalFarmers}</div>
              <div className="card-footer">
                <span>{t('dashboard.viewAllFarmers')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Total Applications */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/loans')}>
              <div className="card-top">
                <span className="card-title">{t('loans.title')}</span>
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
                <span className="card-title">{t('dashboard.pendingReview')}</span>
                <div className="icon-box amber">
                  <Clock size={18} />
                </div>
              </div>
              <div className="card-value text-amber">
                {metrics.countSubmitted + metrics.countUnderReview}
              </div>
              <div className="card-footer">
                <span>{metrics.countSubmitted} {t('status.submitted')} | {metrics.countUnderReview} {t('status.underReview')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Approved (Awaiting Disbursement) */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/loans?status=APPROVED')}>
              <div className="card-top">
                <span className="card-title">{t('status.approved')}</span>
                <div className="icon-box emerald">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="card-value text-emerald">{metrics.countApproved}</div>
              <div className="card-footer">
                <span>{t('disbursement.pendingDisbursement')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Disbursed Portfolio Capital */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/loans?status=DISBURSED')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.totalDisbursed')}</span>
                <div className="icon-box cyan">
                  <Banknote size={18} />
                </div>
              </div>
              <div className="card-value">₹{metrics.totalDisbursedAmount.toLocaleString('en-IN')}</div>
              <div className="card-footer">
                <span>{metrics.countDisbursed} {t('status.disbursed')} | {metrics.countClosed} {t('status.closed')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Total Repaid Collections */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/repayments')}>
              <div className="card-top">
                <span className="card-title">{t('reports.totalCollected')}</span>
                <div className="icon-box emerald">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="card-value text-emerald">₹{metrics.totalRepaid.toLocaleString('en-IN')}</div>
              <div className="card-footer">
                <span>{t('dashboard.viewAllRepayments')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="summary-card glass-panel" onClick={() => navigate('/admin/repayments')}>
              <div className="card-top">
                <span className="card-title">{t('reports.outstandingBalance')}</span>
                <div className="icon-box purple">
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="card-value text-purple">₹{metrics.outstandingAmount.toLocaleString('en-IN')}</div>
              <div className="card-footer">
                <span>{t('reports.outstandingBalance')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Overdue Risk */}
            <div className="summary-card glass-panel highlight-danger" onClick={() => navigate('/admin/repayments?status=OVERDUE')}>
              <div className="card-top">
                <span className="card-title">{t('dashboard.overdueAmount')}</span>
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
                <h3>{t('dashboard.statusDistribution')}</h3>
              </div>
              <div className="status-bars-container">
                <div className="status-bar-row">
                  <div className="bar-label-group">
                    <span>{t('status.submitted')} ({metrics.countSubmitted})</span>
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
                    <span>{t('status.underReview')} ({metrics.countUnderReview})</span>
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
                    <span>{t('status.approved')} ({metrics.countApproved})</span>
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
                    <span>{t('status.disbursed')} ({metrics.countDisbursed})</span>
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
                    <span>{t('status.closed')} ({metrics.countClosed})</span>
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
                    <span>{t('status.rejected')} ({metrics.countRejected})</span>
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
                <h3>{t('dashboard.recoveryRate')}</h3>
              </div>
              <div className="capital-meter-wrapper">
                <div className="meter-ring">
                  <span className="meter-val">
                    {metrics.totalDisbursedAmount > 0
                      ? `${Math.min(100, Math.round((metrics.totalRepaid / metrics.totalDisbursedAmount) * 100))}%`
                      : '100%'}
                  </span>
                  <span className="meter-lbl">{t('status.paid')}</span>
                </div>
                <div className="meter-breakdown">
                  <div className="breakdown-item">
                    <span className="dot emerald" />
                    <span>{t('reports.totalCollected')}: <strong>₹{metrics.totalRepaid.toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="breakdown-item">
                    <span className="dot purple" />
                    <span>{t('reports.outstandingBalance')}: <strong>₹{metrics.outstandingAmount.toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="breakdown-item">
                    <span className="dot rose" />
                    <span>{t('dashboard.overdueAmount')}: <strong>₹{metrics.overdueAmount.toLocaleString('en-IN')}</strong></span>
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
                  <h3>{t('dashboard.recentApplications')} ({applicationsRequiringAttention.length})</h3>
                </div>
                <button
                  className="queue-view-all"
                  onClick={() => navigate('/admin/loans?status=UNDER_REVIEW')}
                >
                  <span>{t('common.view')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {applicationsRequiringAttention.length === 0 ? (
                <EmptyState title={t('empty.noData')} description={t('empty.tryAdjusting')} />
              ) : (
                <div className="queue-list">
                  {applicationsRequiringAttention.map((loan) => (
                    <div
                      key={loan._id}
                      className="queue-item"
                      onClick={() => navigate(`/admin/loans/${loan._id}`)}
                    >
                      <div className="queue-item-left">
                        <LoanIdDisplay id={loan._id} format="short" showCopy={true} />
                        <div className="queue-farmer">{loan.farmer?.name || t('loans.farmer')}</div>
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
                  <h3>{t('dashboard.repaymentTrend')}</h3>
                </div>
                <button className="queue-view-all" onClick={() => navigate('/admin/repayments')}>
                  <span>{t('common.view')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {recentRepayments.length === 0 ? (
                <EmptyState title={t('empty.noData')} description={t('empty.tryAdjusting')} />
              ) : (
                <div className="queue-list">
                  {recentRepayments.map((repay) => (
                    <div
                      key={repay._id}
                      className="queue-item"
                      onClick={() => navigate('/admin/repayments')}
                    >
                      <div className="queue-item-left">
                        <span className="queue-id">{t('repayments.installmentNo')} #{repay.installmentNumber}</span>
                        <div className="queue-farmer">{repay.borrower?.name || t('repayments.borrower')}</div>
                        <div className="queue-subtext">
                          {t('repayments.amountPaid')}: ₹{repay.amountPaid?.toLocaleString('en-IN')} / {t('repayments.amountDue')}: ₹{repay.amountDue?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="queue-item-right">
                        <StatusBadge status={repay.paymentStatus} size="small" />
                        <span className="queue-date">{new Date(repay.dueDate).toLocaleDateString()}</span>
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
