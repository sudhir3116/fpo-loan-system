import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  RefreshCw,
  FileText,
  CreditCard,
  AlertTriangle,
  Building2,
  CheckCircle2,
  XCircle,
  Banknote,
  Calendar,
  Filter,
  Users,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { loanAPI, repaymentAPI } from '../api/client';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  LoanIdDisplay,
  useToast,
} from '../components';
import './Reports.css';

const Reports = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);

  // Active Report Tab: 'executive' | 'loans' | 'repayments' | 'fpo'
  const [activeTab, setActiveTab] = useState('executive');

  // Report Filter States
  const [dateRange, setDateRange] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [repayStatusFilter, setRepayStatusFilter] = useState('ALL');
  const [fpoFilter, setFpoFilter] = useState('ALL');

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, repayRes] = await Promise.allSettled([
        loanAPI.getAllLoans({ limit: 1000 }),
        repaymentAPI.getAllRepayments({ limit: 1000 }),
      ]);

      if (loansRes.status === 'fulfilled' && loansRes.value.data?.status === 'success') {
        setLoans(loansRes.value.data.data.loans || []);
      }
      if (repayRes.status === 'fulfilled' && repayRes.value.data?.status === 'success') {
        setRepayments(repayRes.value.data.data.repayments || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to compile report data from backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Filter Loans by Date Range, Status & FPO
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const createdAt = new Date(loan.createdAt);
      const now = new Date();

      let matchesDate = true;
      if (dateRange === '30DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = createdAt >= thirtyDaysAgo;
      } else if (dateRange === 'THIS_MONTH') {
        matchesDate =
          createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      } else if (dateRange === 'THIS_YEAR') {
        matchesDate = createdAt.getFullYear() === now.getFullYear();
      }

      const matchesStatus =
        statusFilter === 'ALL' || (loan.status || '').toUpperCase() === statusFilter;

      const fpoName = loan.farmer?.fpoName || 'Green Valley FPO';
      const matchesFpo = fpoFilter === 'ALL' || fpoName === fpoFilter;

      return matchesDate && matchesStatus && matchesFpo;
    });
  }, [loans, dateRange, statusFilter, fpoFilter]);

  // Filter Repayments by Repayment Status
  const filteredRepayments = useMemo(() => {
    return repayments.filter((r) => {
      return repayStatusFilter === 'ALL' || (r.paymentStatus || '').toUpperCase() === repayStatusFilter;
    });
  }, [repayments, repayStatusFilter]);

  // Compiled Executive Metrics from real backend payload
  const analytics = useMemo(() => {
    let totalSubmittedCount = 0;
    let totalUnderReviewCount = 0;
    let totalApprovedCount = 0;
    let totalRejectedCount = 0;
    let totalDisbursedCount = 0;
    let totalClosedCount = 0;

    let totalRequestedCapital = 0;
    let totalDisbursedCapital = 0;

    filteredLoans.forEach((loan) => {
      const st = (loan.status || '').toUpperCase();
      totalRequestedCapital += loan.loanAmount || 0;

      if (st === 'SUBMITTED') totalSubmittedCount++;
      else if (st === 'UNDER_REVIEW') totalUnderReviewCount++;
      else if (st === 'APPROVED') {
        totalApprovedCount++;
      } else if (st === 'REJECTED') {
        totalRejectedCount++;
      } else if (st === 'DISBURSED') {
        totalDisbursedCount++;
        totalDisbursedCapital += loan.disbursedAmount || loan.loanAmount || 0;
      } else if (st === 'CLOSED') {
        totalClosedCount++;
        totalDisbursedCapital += loan.disbursedAmount || loan.loanAmount || 0;
      }
    });

    const evaluatedCount = totalApprovedCount + totalRejectedCount + totalDisbursedCount + totalClosedCount;
    const approvalRate = evaluatedCount > 0 ? ((totalApprovedCount + totalDisbursedCount + totalClosedCount) / evaluatedCount) * 100 : 0;
    const rejectionRate = evaluatedCount > 0 ? (totalRejectedCount / evaluatedCount) * 100 : 0;

    let totalCollectedRepaid = 0;
    let totalOverdueAmount = 0;
    let overdueInstallmentCount = 0;

    repayments.forEach((r) => {
      totalCollectedRepaid += r.amountPaid || 0;
      const due = r.amountDue || 0;
      const paid = r.amountPaid || 0;
      if (r.paymentStatus === 'OVERDUE') {
        overdueInstallmentCount++;
        totalOverdueAmount += Math.max(0, due - paid);
      }
    });

    const totalOutstandingCapital = Math.max(0, totalDisbursedCapital - totalCollectedRepaid);
    const collectionEfficiency =
      totalDisbursedCapital > 0
        ? Math.min(100, (totalCollectedRepaid / totalDisbursedCapital) * 100)
        : 0;

    return {
      totalApplications: filteredLoans.length,
      totalSubmittedCount,
      totalUnderReviewCount,
      totalApprovedCount,
      totalRejectedCount,
      totalDisbursedCount,
      totalClosedCount,
      totalRequestedCapital,
      totalDisbursedCapital,
      approvalRate: Math.round(approvalRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      totalCollectedRepaid,
      totalOutstandingCapital,
      overdueInstallmentCount,
      totalOverdueAmount,
      collectionEfficiency: Math.round(collectionEfficiency * 10) / 10,
    };
  }, [filteredLoans, repayments]);

  // Extract unique FPOs for filter dropdown
  const fpoOptions = useMemo(() => {
    const set = new Set();
    loans.forEach((l) => {
      if (l.farmer?.fpoName) set.add(l.farmer.fpoName);
    });
    return Array.from(set);
  }, [loans]);

  // FPO Organizational Breakdown
  const fpoBreakdown = useMemo(() => {
    const map = new Map();
    loans.forEach((l) => {
      const fpo = l.farmer?.fpoName || 'Green Valley FPO';
      if (!map.has(fpo)) {
        map.set(fpo, {
          name: fpo,
          regNo: l.farmer?.fpoRegistrationNo || 'FPO-MH-2024',
          totalLoans: 0,
          disbursedCapital: 0,
          activeLoans: 0,
          closedLoans: 0,
        });
      }
      const record = map.get(fpo);
      record.totalLoans++;
      const st = (l.status || '').toUpperCase();
      if (st === 'DISBURSED') {
        record.activeLoans++;
        record.disbursedCapital += l.disbursedAmount || l.loanAmount || 0;
      } else if (st === 'CLOSED') {
        record.closedLoans++;
        record.disbursedCapital += l.disbursedAmount || l.loanAmount || 0;
      }
    });
    return Array.from(map.values());
  }, [loans]);

  // CSV Export Utility
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';

      if (activeTab === 'loans' || activeTab === 'executive') {
        csvContent += 'Loan ID,Farmer Name,Farmer Phone,FPO Name,Purpose,Loan Amount (INR),Status,Created Date\n';
        filteredLoans.forEach((l) => {
          csvContent += `"${l._id}","${l.farmer?.name || ''}","${l.farmer?.phone || ''}","${l.farmer?.fpoName || ''}","${l.purpose || ''}",${l.loanAmount || 0},"${l.status}","${new Date(l.createdAt).toLocaleDateString('en-IN')}"\n`;
        });
      } else if (activeTab === 'repayments') {
        csvContent += 'Repayment ID,Loan ID,Borrower Name,Installment No,Due Date,Amount Due (INR),Amount Paid (INR),Payment Status,Payment Method\n';
        filteredRepayments.forEach((r) => {
          csvContent += `"${r._id}","${r.loan?._id || r.loan}","${r.borrower?.name || ''}",${r.installmentNumber},"${new Date(r.dueDate).toLocaleDateString('en-IN')}",${r.amountDue},${r.amountPaid},"${r.paymentStatus}","${r.paymentMethod || ''}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FPO_Credit_Report_${activeTab.toUpperCase()}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess(t('reports.csvExportSuccess'));
    } catch {
      showError(t('reports.csvExportError'));
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="reports-page-container">
      <PageHeader
        title={t('reports.title')}
        actions={
          <div className="report-header-actions">
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <Download size={15} />
              <span>{t('reports.exportCsv')}</span>
            </button>
            <button onClick={handlePrintReport} className="btn btn-secondary">
              <Printer size={15} />
              <span>{t('reports.printPdf')}</span>
            </button>
            <button onClick={fetchReportData} className="btn btn-secondary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            </button>
          </div>
        }
      />

      {/* Global Report Filter Bar */}
      <div className="reports-filter-bar glass-panel">
        <div className="filter-item">
          <label htmlFor="date-range-select" className="filter-label">
            <Calendar size={14} /> {t('reports.dateHorizon')}:
          </label>
          <select
            id="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">{t('reports.allTime')}</option>
            <option value="30DAYS">{t('reports.last30Days')}</option>
            <option value="THIS_MONTH">{t('reports.thisMonth')}</option>
            <option value="THIS_YEAR">{t('reports.thisYear')}</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="loan-status-select" className="filter-label">
            <Filter size={14} /> {t('loans.status')}:
          </label>
          <select
            id="loan-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
          <label htmlFor="fpo-select" className="filter-label">
            <Building2 size={14} /> {t('farmers.fpoName')}:
          </label>
          <select
            id="fpo-select"
            value={fpoFilter}
            onChange={(e) => setFpoFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">{t('reports.allFpos')}</option>
            {fpoOptions.map((fpo) => (
              <option key={fpo} value={fpo}>
                {fpo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Report Tabs */}
      <div className="reports-tab-bar">
        <button
          className={`report-tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
          onClick={() => setActiveTab('executive')}
        >
          <BarChart3 size={16} />
          <span>{t('reports.executiveSummary')}</span>
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          <FileText size={16} />
          <span>{t('reports.loanAudit', { count: filteredLoans.length })}</span>
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'repayments' ? 'active' : ''}`}
          onClick={() => setActiveTab('repayments')}
        >
          <CreditCard size={16} />
          <span>{t('reports.repaymentRisk', { count: filteredRepayments.length })}</span>
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'fpo' ? 'active' : ''}`}
          onClick={() => setActiveTab('fpo')}
        >
          <Building2 size={16} />
          <span>{t('reports.fpoBreakdown')}</span>
        </button>
      </div>

      {/* Main Content Sections */}
      {loading ? (
        <div className="reports-loading-container glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title="Failed to Compile Report Data" message={error} onRetry={fetchReportData} />
      ) : (
        <div className="report-tab-body">
          {/* TAB 1: Executive Financial Summary */}
          {activeTab === 'executive' && (
            <div className="executive-summary-section">
              {/* Summary Metrics KPI Grid */}
              <div className="kpi-cards-grid">
                <div className="kpi-card glass-panel">
                  <span className="kpi-label">{t('reports.totalCreditApps')}</span>
                  <span className="kpi-value">{analytics.totalApplications}</span>
                  <span className="kpi-subtext">{t('reports.requestedCapital')}: ₹{analytics.totalRequestedCapital.toLocaleString('en-IN')}</span>
                </div>

                <div className="kpi-card glass-panel">
                  <span className="kpi-label">{t('reports.disbursedPortfolioCapital')}</span>
                  <span className="kpi-value text-indigo">
                    ₹{analytics.totalDisbursedCapital.toLocaleString('en-IN')}
                  </span>
                  <span className="kpi-subtext">
                    {t('reports.activeAndClosed', { active: analytics.totalDisbursedCount, closed: analytics.totalClosedCount })}
                  </span>
                </div>

                <div className="kpi-card glass-panel">
                  <span className="kpi-label">{t('reports.collectionsRepaid')}</span>
                  <span className="kpi-value text-emerald">
                    ₹{analytics.totalCollectedRepaid.toLocaleString('en-IN')}
                  </span>
                  <span className="kpi-subtext">{t('reports.efficiencyRatio')}: {analytics.collectionEfficiency}%</span>
                </div>

                <div className="kpi-card glass-panel">
                  <span className="kpi-label">{t('reports.outstandingBalance')}</span>
                  <span className="kpi-value text-amber">
                    ₹{analytics.totalOutstandingCapital.toLocaleString('en-IN')}
                  </span>
                  <span className="kpi-subtext">{t('reports.pendingCollection')}</span>
                </div>

                <div className="kpi-card glass-panel">
                  <span className="kpi-label">{t('reports.overdueRiskExposure')}</span>
                  <span className="kpi-value text-rose">
                    ₹{analytics.totalOverdueAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="kpi-subtext">{t('reports.overdueInstallmentsCount', { count: analytics.overdueInstallmentCount })}</span>
                </div>

                <div className="kpi-card glass-panel">
                  <span className="kpi-label">{t('reports.approvalRate')}</span>
                  <span className="kpi-value">{analytics.approvalRate}%</span>
                  <span className="kpi-subtext">{t('reports.rejectionRate')}: {analytics.rejectionRate}%</span>
                </div>
              </div>

              {/* Visual SVG Distribution Charts */}
              <div className="visual-charts-grid">
                {/* Application Lifecycle Distribution Chart */}
                <div className="chart-card glass-panel">
                  <h3 className="chart-title">{t('reports.pipelineBreakdown')}</h3>
                  <div className="chart-bars-list">
                    <div className="bar-item">
                      <div className="bar-info">
                        <span>{t('status.submitted')} ({analytics.totalSubmittedCount})</span>
                        <span>{analytics.totalApplications > 0 ? Math.round((analytics.totalSubmittedCount / analytics.totalApplications) * 100) : 0}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill blue"
                          style={{
                            width: `${analytics.totalApplications > 0 ? (analytics.totalSubmittedCount / analytics.totalApplications) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-info">
                        <span>{t('status.underReview')} ({analytics.totalUnderReviewCount})</span>
                        <span>{analytics.totalApplications > 0 ? Math.round((analytics.totalUnderReviewCount / analytics.totalApplications) * 100) : 0}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill amber"
                          style={{
                            width: `${analytics.totalApplications > 0 ? (analytics.totalUnderReviewCount / analytics.totalApplications) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-info">
                        <span>{t('status.approved')} ({analytics.totalApprovedCount})</span>
                        <span>{analytics.totalApplications > 0 ? Math.round((analytics.totalApprovedCount / analytics.totalApplications) * 100) : 0}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill emerald"
                          style={{
                            width: `${analytics.totalApplications > 0 ? (analytics.totalApprovedCount / analytics.totalApplications) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-info">
                        <span>{t('status.disbursed')} ({analytics.totalDisbursedCount})</span>
                        <span>{analytics.totalApplications > 0 ? Math.round((analytics.totalDisbursedCount / analytics.totalApplications) * 100) : 0}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill indigo"
                          style={{
                            width: `${analytics.totalApplications > 0 ? (analytics.totalDisbursedCount / analytics.totalApplications) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-info">
                        <span>{t('status.closed')} ({analytics.totalClosedCount})</span>
                        <span>{analytics.totalApplications > 0 ? Math.round((analytics.totalClosedCount / analytics.totalApplications) * 100) : 0}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill slate"
                          style={{
                            width: `${analytics.totalApplications > 0 ? (analytics.totalClosedCount / analytics.totalApplications) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-info">
                        <span>{t('status.rejected')} ({analytics.totalRejectedCount})</span>
                        <span>{analytics.totalApplications > 0 ? Math.round((analytics.totalRejectedCount / analytics.totalApplications) * 100) : 0}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill rose"
                          style={{
                            width: `${analytics.totalApplications > 0 ? (analytics.totalRejectedCount / analytics.totalApplications) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capital Collection Recovery Meter */}
                <div className="chart-card glass-panel">
                  <h3 className="chart-title">{t('reports.recoveryMeter')}</h3>
                  <div className="recovery-meter-container">
                    <div className="meter-circle">
                      <span className="meter-percentage">{analytics.collectionEfficiency}%</span>
                      <span className="meter-label">{t('reports.recovered')}</span>
                    </div>
                    <div className="meter-stats">
                      <div className="meter-stat-row">
                        <span className="stat-dot emerald" />
                        <span className="stat-text">{t('reports.repaid')}: ₹{analytics.totalCollectedRepaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="meter-stat-row">
                        <span className="stat-dot amber" />
                        <span className="stat-text">{t('reports.outstanding')}: ₹{analytics.totalOutstandingCapital.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Loan Portfolio Report */}
          {activeTab === 'loans' && (
            <div className="loans-report-section">
              <DataTable
                columns={[
                  {
                    header: t('loans.loanId'),
                    key: '_id',
                    render: (l) => <LoanIdDisplay id={l._id} format="short" showCopy={true} />,
                  },
                  {
                    header: t('loans.farmer'),
                    key: 'farmer',
                    render: (l) => l.farmer?.name || 'Farmer',
                  },
                  {
                    header: t('farmers.fpoName'),
                    key: 'fpoName',
                    render: (l) => l.farmer?.fpoName || 'Green Valley FPO',
                  },
                  {
                    header: t('loans.amount'),
                    key: 'loanAmount',
                    render: (l) => `₹${l.loanAmount?.toLocaleString('en-IN')}`,
                  },
                  {
                    header: t('disbursement.disbursedAmount'),
                    key: 'disbursedAmount',
                    render: (l) => (l.disbursedAmount > 0 ? `₹${l.disbursedAmount?.toLocaleString('en-IN')}` : '—'),
                  },
                  {
                    header: t('loans.tenure'),
                    key: 'tenureMonths',
                    render: (l) => `${l.tenureMonths}m (${l.interestRate || 0}%)`,
                  },
                  {
                    header: t('loans.appliedDate'),
                    key: 'createdAt',
                    render: (l) => new Date(l.createdAt).toLocaleDateString('en-IN'),
                  },
                  {
                    header: t('loans.status'),
                    key: 'status',
                    align: 'center',
                    render: (l) => <StatusBadge status={l.status} size="small" />,
                  },
                ]}
                data={filteredLoans}
              />
            </div>
          )}

          {/* TAB 3: Repayment & Default Risk Report */}
          {activeTab === 'repayments' && (
            <div className="repayments-report-section">
              <DataTable
                columns={[
                  {
                    header: t('repayments.title'),
                    key: '_id',
                    render: (r) => <span className="mono-text">#{r._id.substring(0, 10)}...</span>,
                  },
                  {
                    header: t('loans.loanId'),
                    key: 'loan',
                    render: (r) => <LoanIdDisplay id={r.loan?._id || r.loan} format="short" showCopy={true} />,
                  },
                  {
                    header: t('repayments.borrower'),
                    key: 'borrower',
                    render: (r) => r.borrower?.name || 'Farmer',
                  },
                  {
                    header: t('repayments.installment'),
                    key: 'installmentNumber',
                    align: 'center',
                    render: (r) => `#${r.installmentNumber}`,
                  },
                  {
                    header: t('repayments.dueDate'),
                    key: 'dueDate',
                    render: (r) => new Date(r.dueDate).toLocaleDateString('en-IN'),
                  },
                  {
                    header: t('repayments.amountDue'),
                    key: 'amountDue',
                    render: (r) => `₹${r.amountDue?.toLocaleString('en-IN')}`,
                  },
                  {
                    header: t('repayments.amountPaid'),
                    key: 'amountPaid',
                    render: (r) => `₹${r.amountPaid?.toLocaleString('en-IN')}`,
                  },
                  {
                    header: t('repayments.remaining'),
                    key: 'remaining',
                    render: (r) => `₹${Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0)).toLocaleString('en-IN')}`,
                  },
                  {
                    header: t('repayments.paymentStatus'),
                    key: 'paymentStatus',
                    align: 'center',
                    render: (r) => <StatusBadge status={r.paymentStatus} size="small" />,
                  },
                ]}
                data={filteredRepayments}
              />
            </div>
          )}

          {/* TAB 4: FPO Organization Breakdown */}
          {activeTab === 'fpo' && (
            <div className="fpo-report-section">
              <DataTable
                columns={[
                  {
                    header: t('farmers.fpoName'),
                    key: 'name',
                    render: (f) => (
                      <div className="fpo-cell">
                        <Building2 size={16} className="text-emerald" />
                        <span className="font-semibold">{f.name}</span>
                      </div>
                    ),
                  },
                  {
                    header: t('reports.registrationNo'),
                    key: 'regNo',
                    render: (f) => f.regNo,
                  },
                  {
                    header: t('reports.totalCreditApps'),
                    key: 'totalLoans',
                    align: 'center',
                    render: (f) => f.totalLoans,
                  },
                  {
                    header: t('dashboard.activeLoans'),
                    key: 'activeLoans',
                    align: 'center',
                    render: (f) => f.activeLoans,
                  },
                  {
                    header: t('status.closed'),
                    key: 'closedLoans',
                    align: 'center',
                    render: (f) => f.closedLoans,
                  },
                  {
                    header: t('disbursement.disbursedAmount'),
                    key: 'disbursedCapital',
                    align: 'right',
                    render: (f) => `₹${f.disbursedCapital.toLocaleString('en-IN')}`,
                  },
                ]}
                data={fpoBreakdown}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
