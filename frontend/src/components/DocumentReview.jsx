import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  Calendar,
  FileText,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { documentAPI } from '../api/client';
import StatusBadge from './StatusBadge';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './ToastContext';
import './DocumentReview.css';

const DocumentReview = ({ documents = [], onRefresh, className = '' }) => {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [activePreviewDoc, setActivePreviewDoc] = useState(null);
  const [activeVerifyDoc, setActiveVerifyDoc] = useState(null);
  const [activeRejectDoc, setActiveRejectDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Execute Document Verification (PENDING -> VERIFIED)
  const handleConfirmVerify = async () => {
    if (!activeVerifyDoc || actionLoading) return;
    setActionLoading(true);

    try {
      const response = await documentAPI.verifyDocument(activeVerifyDoc._id);
      showSuccess(response.data?.message || 'Document verified successfully');
      setActiveVerifyDoc(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to verify document');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Document Rejection (PENDING -> REJECTED)
  const handleConfirmReject = async () => {
    if (!activeRejectDoc || actionLoading) return;

    if (!rejectionReason.trim()) {
      showError('Rejection reason is mandatory');
      return;
    }

    setActionLoading(true);
    try {
      const response = await documentAPI.rejectDocument(activeRejectDoc._id, {
        rejectionReason: rejectionReason.trim(),
      });
      showSuccess(response.data?.message || 'Document rejected');
      setActiveRejectDoc(null);
      setRejectionReason('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={`document-review-card glass-panel ${className}`}>
      <div className="doc-review-header">
        <div className="header-title-group">
          <ShieldCheck size={20} className="text-emerald" />
          <h3>{t('documents.title')} ({documents.length})</h3>
        </div>
        <span className="doc-subtext">{t('documents.subtitle')}</span>
      </div>

      {documents.length === 0 ? (
        <div className="no-documents-placeholder">
          <FileText size={32} className="placeholder-icon" />
          <p>{t('documents.noDocuments')}</p>
        </div>
      ) : (
        <div className="doc-review-grid">
          {documents.map((doc) => {
            const isPending = doc.status === 'PENDING';
            const isVerified = doc.status === 'VERIFIED';
            const isRejected = doc.status === 'REJECTED';

            return (
              <div key={doc._id} className={`doc-item-card status-${doc.status?.toLowerCase()}`}>
                <div className="doc-item-top">
                  <span className="doc-type-badge">{doc.documentType}</span>
                  <StatusBadge status={doc.status} size="small" />
                </div>

                <div className="doc-item-body">
                  <h4 className="doc-file-name" title={doc.documentName}>
                    {doc.documentName}
                  </h4>
                  <span className="doc-upload-date">
                    <Calendar size={12} />
                    {t('documents.uploadDate')}: {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {/* Audit trail details */}
                {isVerified && doc.verifiedBy && (
                  <div className="doc-audit-info verified">
                    <CheckCircle2 size={12} />
                    <span>{t('status.VERIFIED')}: {doc.verifiedBy.name || 'Admin'}</span>
                  </div>
                )}

                {isRejected && doc.rejectionReason && (
                  <div className="doc-audit-info rejected">
                    <AlertTriangle size={12} />
                    <span>
                      <strong>{t('documents.rejectionRemarksLabel')}:</strong> {doc.rejectionReason}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="doc-item-actions">
                  {/* View / Preview Button */}
                  {doc.fileUrl && (
                    <button
                      onClick={() => setActivePreviewDoc(doc)}
                      className="btn btn-secondary doc-action-btn view-btn"
                      title={t('documents.previewBtn')}
                    >
                      <Eye size={13} />
                      <span>{t('documents.previewBtn')}</span>
                    </button>
                  )}

                  {/* Verify Action Button (Supported for PENDING documents) */}
                  {isPending && (
                    <button
                      onClick={() => setActiveVerifyDoc(doc)}
                      className="btn doc-action-btn verify-btn"
                      title={t('documents.verifyBtn')}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 size={13} />
                      <span>{t('documents.verifyBtn')}</span>
                    </button>
                  )}

                  {/* Reject Action Button (Supported for PENDING documents) */}
                  {isPending && (
                    <button
                      onClick={() => {
                        setActiveRejectDoc(doc);
                        setRejectionReason('');
                      }}
                      className="btn doc-action-btn reject-btn"
                      title={t('documents.rejectBtn')}
                      disabled={actionLoading}
                    >
                      <XCircle size={13} />
                      <span>{t('documents.rejectBtn')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Document File Preview Modal */}
      {activePreviewDoc && (
        <div className="modal-backdrop" onClick={() => setActivePreviewDoc(null)}>
          <div className="modal-card doc-preview-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="preview-title-group">
                <FileText size={18} className="text-emerald" />
                <h3>{activePreviewDoc.documentName}</h3>
                <span className="doc-type-badge">{activePreviewDoc.documentType}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setActivePreviewDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="preview-modal-body">
              {activePreviewDoc.fileType?.startsWith('image/') ||
              activePreviewDoc.fileUrl?.match(/\.(jpg|jpeg|png|webp)/i) ? (
                <div className="image-preview-container">
                  <img
                    src={activePreviewDoc.fileUrl}
                    alt={activePreviewDoc.documentName}
                    className="doc-preview-image"
                  />
                </div>
              ) : (
                <div className="pdf-preview-container">
                  <iframe
                    src={activePreviewDoc.fileUrl}
                    title={activePreviewDoc.documentName}
                    className="doc-preview-iframe"
                  />
                </div>
              )}
            </div>

            <div className="modal-footer preview-footer">
              <a
                href={activePreviewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={14} />
                <span>Open Direct Cloudinary Link</span>
              </a>
              <button className="btn btn-secondary" onClick={() => setActivePreviewDoc(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Verification Dialog */}
      <ConfirmDialog
        isOpen={!!activeVerifyDoc}
        type="success"
        title={t('documents.verifyBtn')}
        message={`Mark '${activeVerifyDoc?.documentName}' (${activeVerifyDoc?.documentType}) as VERIFIED?`}
        confirmText={t('documents.verifyBtn')}
        onConfirm={handleConfirmVerify}
        onCancel={() => setActiveVerifyDoc(null)}
        loading={actionLoading}
      />

      {/* MODAL 3: Rejection Dialog with Mandatory Reason */}
      {activeRejectDoc && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setActiveRejectDoc(null)}>
          <div className="modal-card doc-reject-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="preview-title-group">
                <XCircle size={20} className="text-rose" />
                <h3>{t('documents.rejectModalTitle')}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setActiveRejectDoc(null)}
                disabled={actionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="reject-modal-intro">
                Rejecting document <strong>'{activeRejectDoc.documentName}'</strong> ({activeRejectDoc.documentType}). Please provide a clear rejection reason for the farmer.
              </p>

              <div className="form-group">
                <label className="form-label">
                  {t('documents.rejectionRemarksLabel')} <span className="required-star">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder={t('documents.rejectionRemarksPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setActiveRejectDoc(null)}
                disabled={actionLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn reject-confirm-btn"
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? t('common.loading') : t('documents.confirmRejectBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentReview;
