import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  ShieldCheck,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { loanAPI, documentAPI } from '../api/client';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from '../components';
import './Farmers.css';

const Farmers = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('profile');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansRes, docsRes] = await Promise.allSettled([
        loanAPI.getAllLoans({ limit: 100 }),
        documentAPI.getAllDocuments(),
      ]);

      let fetchedLoans = [];
      if (loansRes.status === 'fulfilled' && loansRes.value.data?.data?.loans) {
        fetchedLoans = loansRes.value.data.data.loans;
      } else if (loansRes.status === 'rejected') {
        console.warn('Loan fetch error:', loansRes.reason?.message);
      }

      let fetchedDocs = [];
      if (docsRes.status === 'fulfilled' && docsRes.value.data?.data?.documents) {
        fetchedDocs = docsRes.value.data.data.documents;
      } else if (docsRes.status === 'rejected') {
        console.warn('Document fetch error:', docsRes.reason?.message);
      }

      setLoans(fetchedLoans);
      setDocuments(fetchedDocs);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Process loans to group by unique Farmer entity
  const farmersList = useMemo(() => {
    const farmerMap = new Map();

    loans.forEach((loan) => {
      const farmerObj = loan.farmer;
      if (!farmerObj || !farmerObj._id) return;

      const farmerId = farmerObj._id.toString();

      if (!farmerMap.has(farmerId)) {
        farmerMap.set(farmerId, {
          _id: farmerId,
          name: farmerObj.name || 'N/A',
          email: farmerObj.email || 'N/A',
          phone: farmerObj.phone || 'N/A',
          fpoName: farmerObj.fpoName || 'Green Valley FPO',
          fpoRegistrationNo: farmerObj.fpoRegistrationNo || 'N/A',
          address: farmerObj.address || {},
          kycVerified: farmerObj.kycVerified ?? false,
          status: farmerObj.status || 'ACTIVE',
          createdAt: farmerObj.createdAt || loan.createdAt,
          loans: [],
          documents: [],
        });
      }

      const farmerRecord = farmerMap.get(farmerId);
      farmerRecord.loans.push(loan);
    });

    // Attach documents belonging to each farmer
    documents.forEach((doc) => {
      const docUserId = doc.user?._id || doc.user;
      if (docUserId && farmerMap.has(docUserId.toString())) {
        farmerMap.get(docUserId.toString()).documents.push(doc);
      }
    });

    return Array.from(farmerMap.values());
  }, [loans, documents]);

  // Search & Filtered Farmers
  const filteredFarmers = useMemo(() => {
    return farmersList.filter((farmer) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        farmer.name.toLowerCase().includes(query) ||
        farmer.email.toLowerCase().includes(query) ||
        farmer.phone.includes(query) ||
        (farmer.address?.village && farmer.address.village.toLowerCase().includes(query)) ||
        (farmer.address?.district && farmer.address.district.toLowerCase().includes(query));

      const latestLoan = farmer.loans[0];
      const matchesStatus =
        statusFilter === 'ALL' ||
        (latestLoan && latestLoan.status.toUpperCase() === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [farmersList, searchTerm, statusFilter]);

  // Paginated data slice
  const paginatedFarmers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFarmers.slice(start, start + pageSize);
  }, [filteredFarmers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredFarmers.length / pageSize) || 1;

  // Format full address from User address schema
  const formatAddress = (addr) => {
    if (!addr) return t('farmers.address');
    const parts = [addr.village, addr.district, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : t('farmers.address');
  };

  // Table Columns
  const columns = [
    {
      header: t('farmers.farmerName'),
      key: 'name',
      sortable: true,
      render: (item) => (
        <div className="farmer-profile-cell">
          <div className="farmer-avatar-icon">
            <User size={18} />
          </div>
          <div className="farmer-name-group">
            <span className="farmer-name-text">{item.name}</span>
            {item.kycVerified && (
              <span className="kyc-badge" title={t('farmers.kycVerified')}>
                <CheckCircle2 size={12} /> {t('farmers.kycVerified')}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: t('farmers.phone'),
      key: 'email',
      render: (item) => (
        <div className="contact-cell-group">
          <span className="contact-line">
            <Mail size={13} className="cell-icon" /> {item.email}
          </span>
          <span className="contact-line phone">
            <Phone size={13} className="cell-icon" /> {item.phone}
          </span>
        </div>
      ),
    },
    {
      header: t('farmers.fpoName'),
      key: 'fpoName',
      render: (item) => (
        <div className="location-cell-group">
          <span className="fpo-line">
            <Building2 size={13} className="cell-icon" /> {item.fpoName}
          </span>
          <span className="address-line">
            <MapPin size={13} className="cell-icon" /> {formatAddress(item.address)}
          </span>
        </div>
      ),
    },
    {
      header: t('loans.title'),
      key: 'loans',
      align: 'center',
      render: (item) => (
        <span className="loan-count-badge">
          {item.loans.length} {t('loans.title')}
        </span>
      ),
    },
    {
      header: t('farmers.kycStatus'),
      key: 'status',
      align: 'center',
      render: (item) => {
        const latestLoan = item.loans[0];
        return latestLoan ? (
          <StatusBadge status={latestLoan.status} />
        ) : (
          <StatusBadge status="ACTIVE" customLabel={t('status.active')} />
        );
      },
    },
    {
      header: t('common.date'),
      key: 'createdAt',
      render: (item) => (
        <span className="date-cell">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      key: 'actions',
      align: 'right',
      render: (item) => (
        <button
          onClick={() => {
            setSelectedFarmer(item);
            setActiveModalTab('profile');
          }}
          className="btn btn-secondary view-farmer-btn"
          title={t('farmers.viewProfile')}
        >
          <Eye size={15} />
          <span>{t('farmers.viewProfile')}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="farmers-page-container">
      <PageHeader
        title={t('farmers.title')}
        actions={
          <button onClick={fetchData} className="btn btn-secondary refresh-btn" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('common.refresh')}</span>
          </button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="farmers-filter-bar glass-panel">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={t('farmers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-search-input"
          />
        </div>

        <div className="status-filter-wrapper">
          <label htmlFor="status-select" className="filter-label">
            {t('common.filter')}:
          </label>
          <select
            id="status-select"
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
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="farmers-loading-container glass-panel">
          <LoadingSpinner message={t('common.loading')} />
        </div>
      ) : error ? (
        <ErrorState title={t('common.error')} message={error} onRetry={fetchData} />
      ) : filteredFarmers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('empty.noData')}
          description={t('empty.tryAdjusting')}
          action={
            (searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
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
          data={paginatedFarmers}
          pagination={{
            currentPage,
            totalPages,
            totalItems: filteredFarmers.length,
            pageSize,
            onPageChange: setCurrentPage,
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            },
          }}
          onRowClick={(item) => {
            setSelectedFarmer(item);
            setActiveModalTab('profile');
          }}
        />
      )}

      {/* Farmer Details Modal Drawer */}
      {selectedFarmer && (
        <div className="modal-backdrop" onClick={() => setSelectedFarmer(null)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-avatar">
                  <User size={22} />
                </div>
                <div>
                  <h2 className="modal-title">{selectedFarmer.name}</h2>
                  <span className="modal-subtitle">
                    {t('common.id')}: #{selectedFarmer._id.substring(0, 8)}... | {t('farmers.farmerName')}
                  </span>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedFarmer(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="modal-tabs">
              <button
                className={`tab-btn ${activeModalTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('profile')}
              >
                <User size={15} />
                <span>{t('farmers.profileModalTitle')}</span>
              </button>
              <button
                className={`tab-btn ${activeModalTab === 'loans' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('loans')}
              >
                <FileText size={15} />
                <span>{t('farmers.loanHistory')} ({selectedFarmer.loans.length})</span>
              </button>
              <button
                className={`tab-btn ${activeModalTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('documents')}
              >
                <ShieldCheck size={15} />
                <span>{t('loanDetail.uploadedDocs')} ({selectedFarmer.documents.length})</span>
              </button>
            </div>

            {/* Modal Body Views */}
            <div className="modal-body">
              {/* TAB 1: Profile & FPO Details */}
              {activeModalTab === 'profile' && (
                <div className="tab-content profile-tab">
                  <div className="detail-section">
                    <h3 className="section-title">{t('farmers.profileModalTitle')}</h3>
                    <div className="detail-grid">
                      <div className="detail-field">
                        <span className="field-label">{t('farmers.farmerName')}</span>
                        <span className="field-value">{selectedFarmer.name}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">{t('auth.emailLabel')}</span>
                        <span className="field-value">{selectedFarmer.email}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">{t('farmers.phone')}</span>
                        <span className="field-value">{selectedFarmer.phone}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">{t('farmers.kycStatus')}</span>
                        <span className="field-value">
                          {selectedFarmer.kycVerified ? (
                            <span className="text-emerald font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 size={14} /> {t('farmers.kycVerified')}
                            </span>
                          ) : (
                            <span className="text-amber font-semibold inline-flex items-center gap-1">
                              <Clock size={14} /> {t('farmers.kycPending')}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">{t('common.status')}</span>
                        <span className="field-value">
                          <StatusBadge status={selectedFarmer.status} />
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">{t('common.date')}</span>
                        <span className="field-value">
                          {new Date(selectedFarmer.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">{t('farmers.fpoName')} & {t('farmers.address')}</h3>
                    <div className="detail-grid">
                      <div className="detail-field">
                        <span className="field-label">{t('farmers.fpoName')}</span>
                        <span className="field-value">{selectedFarmer.fpoName}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">{t('farmers.registrationNo')}</span>
                        <span className="field-value">{selectedFarmer.fpoRegistrationNo}</span>
                      </div>
                      <div className="detail-field col-span-2">
                        <span className="field-label">{t('farmers.address')}</span>
                        <span className="field-value">{formatAddress(selectedFarmer.address)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Loan History */}
              {activeModalTab === 'loans' && (
                <div className="tab-content loans-tab">
                  {selectedFarmer.loans.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title={t('farmers.noLoans')}
                      description={t('farmers.noLoans')}
                    />
                  ) : (
                    <div className="loans-list">
                      {selectedFarmer.loans.map((loan) => (
                        <div key={loan._id} className="loan-card-item glass-panel">
                          <div className="loan-card-header">
                            <div>
                              <span className="loan-id-tag">{t('loans.loanId')}: {loan._id.substring(0, 10)}...</span>
                              <h4 className="loan-purpose-title">{loan.purpose}</h4>
                            </div>
                            <StatusBadge status={loan.status} />
                          </div>

                          <div className="loan-card-details">
                            <div className="loan-metric">
                              <span className="metric-label">{t('loans.amount')}</span>
                              <span className="metric-value font-highlight">
                                ₹{loan.loanAmount?.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="loan-metric">
                              <span className="metric-label">{t('loans.tenure')}</span>
                              <span className="metric-value">{loan.tenureMonths} {t('common.months')}</span>
                            </div>
                            <div className="loan-metric">
                              <span className="metric-label">{t('loanDetail.interestRateLabel')}</span>
                              <span className="metric-value">{loan.interestRate || 0}%</span>
                            </div>
                            {loan.disbursedAmount > 0 && (
                              <div className="loan-metric">
                                <span className="metric-label">{t('disbursement.disbursedAmount')}</span>
                                <span className="metric-value text-indigo">
                                  ₹{loan.disbursedAmount?.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                          </div>

                          {loan.remarks && (
                            <div className="loan-remarks-box">
                              <strong>{t('common.remarks')}:</strong> {loan.remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Verification Documents */}
              {activeModalTab === 'documents' && (
                <div className="tab-content docs-tab">
                  {selectedFarmer.documents.length === 0 ? (
                    <EmptyState
                      icon={ShieldCheck}
                      title={t('documents.noDocsFound')}
                      description={t('documents.noDocsFound')}
                    />
                  ) : (
                    <div className="docs-grid">
                      {selectedFarmer.documents.map((doc) => (
                        <div key={doc._id} className="doc-card-item glass-panel">
                          <div className="doc-card-header">
                            <span className="doc-type-badge">{doc.documentType ? doc.documentType.toUpperCase() : t('loanDetail.uploadedDocs')}</span>
                            <StatusBadge status={doc.status} size="small" />
                          </div>
                          <h4 className="doc-name-title">{doc.documentName}</h4>
                          <span className="doc-date">
                            {t('documents.uploadedAt')}: {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                          </span>

                          {doc.rejectionReason && (
                            <div className="doc-rejection-msg">
                              <strong>{t('documents.rejectionReason')}:</strong> {doc.rejectionReason}
                            </div>
                          )}

                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary view-doc-link"
                            >
                              <ExternalLink size={14} />
                              <span>{t('documents.viewDocument')}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedFarmer(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farmers;
