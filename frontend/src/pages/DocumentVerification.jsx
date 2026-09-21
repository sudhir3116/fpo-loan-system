import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  XCircle,
  FileText,
} from 'lucide-react';
import { documentAPI } from '../api/client';
import {
  PageHeader,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  DocumentReview,
  useToast,
} from '../components';
import './DocumentVerification.css';

const DocumentVerification = () => {
  const { t } = useTranslation();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await documentAPI.getAllDocuments(params);
      if (response.data?.status === 'success') {
        setDocuments(response.data.data?.documents || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('documents.loadingDocs');
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  // Client-side search
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const q = searchTerm.toLowerCase();
    return documents.filter(
      (d) =>
        d.user?.name?.toLowerCase().includes(q) ||
        d.user?.email?.toLowerCase().includes(q) ||
        d.documentName?.toLowerCase().includes(q) ||
        d.documentType?.toLowerCase().includes(q)
    );
  }, [documents, searchTerm]);

  // Summary counts (from all documents regardless of current filter)
  const [allDocs, setAllDocs] = useState([]);
  useEffect(() => {
    documentAPI
      .getAllDocuments({})
      .then((r) => setAllDocs(r.data?.data?.documents || []))
      .catch(() => {});
  }, [documents]);

  const summary = useMemo(() => ({
    total: allDocs.length,
    pending: allDocs.filter((d) => d.status === 'PENDING').length,
    verified: allDocs.filter((d) => d.status === 'VERIFIED').length,
    rejected: allDocs.filter((d) => d.status === 'REJECTED').length,
  }), [allDocs]);

  const STATUS_TABS = [
    { key: 'ALL',      label: t('documents.allDocs'),      icon: FileText,   count: summary.total },
    { key: 'PENDING',  label: t('documents.pending'),      icon: Clock,      count: summary.pending },
    { key: 'VERIFIED', label: t('documents.verified'),     icon: ShieldCheck,count: summary.verified },
    { key: 'REJECTED', label: t('documents.rejected'),     icon: XCircle,    count: summary.rejected },
  ];

  return (
    <div className="docver-page-container">
      <PageHeader
        title={t('documents.title')}
        icon={<FileCheck size={22} />}
      />

      {/* Summary Cards */}
      <div className="metrics-overview-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('documents.totalDocs')}</span>
            <div className="metric-icon-box blue"><FileText size={18} /></div>
          </div>
          <div className="metric-main-value">{summary.total}</div>
          <div className="metric-footer-text">{t('documents.allUploadedDocs')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('documents.pendingReview')}</span>
            <div className="metric-icon-box amber"><Clock size={18} /></div>
          </div>
          <div className="metric-main-value">{summary.pending}</div>
          <div className="metric-footer-text">{t('documents.awaitingAdminAction')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('documents.verified')}</span>
            <div className="metric-icon-box emerald"><ShieldCheck size={18} /></div>
          </div>
          <div className="metric-main-value">{summary.verified}</div>
          <div className="metric-footer-text">{t('documents.approvedDocs')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('documents.rejected')}</span>
            <div className="metric-icon-box rose"><XCircle size={18} /></div>
          </div>
          <div className="metric-main-value">{summary.rejected}</div>
          <div className="metric-footer-text">{t('documents.docsRejected')}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="docver-filter-bar">
        {/* Status Tabs */}
        <div className="docver-tabs">
          {STATUS_TABS.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`docver-tab-btn ${statusFilter === key ? 'active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              <Icon size={15} />
              <span>{label}</span>
              <span className="tab-count">{count}</span>
            </button>
          ))}
        </div>

        {/* Search + Refresh */}
        <div className="docver-filter-right">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={t('documents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary refresh-btn"
            onClick={fetchDocuments}
            disabled={loading}
            title={t('common.refresh')}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="docver-loader-wrap">
          <LoadingSpinner message={t('documents.loadingDocs')} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDocuments} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileCheck size={40} />}
          title={statusFilter === 'ALL' ? t('documents.noDocsUploaded') : t('documents.noStatusDocs', { status: statusFilter.toLowerCase() })}
          message={t('documents.docsEmptyMessage')}
        />
      ) : (
        <div className="glass-panel docver-content-panel">
          <div className="docver-results-header">
            <span className="docver-results-count">
              {t('documents.showingDocs', { count: filtered.length })}
            </span>
            {statusFilter !== 'ALL' && (
              <StatusBadge status={statusFilter} size="small" />
            )}
          </div>
          <DocumentReview
            documents={filtered}
            onRefresh={fetchDocuments}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentVerification;
