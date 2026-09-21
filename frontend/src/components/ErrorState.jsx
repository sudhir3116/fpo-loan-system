import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import './ErrorState.css';

const ErrorState = ({ title, message, onRetry, className = '' }) => {
  const { t } = useTranslation();

  const finalTitle = title || t('common.error');

  return (
    <div className={`error-state-card glass-panel ${className}`}>
      <div className="error-state-icon">
        <AlertOctagon size={32} />
      </div>
      <div className="error-state-body">
        <h3 className="error-state-title">{finalTitle}</h3>
        {message && <p className="error-state-message">{message}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary error-retry-btn">
          <RotateCcw size={16} />
          <span>{t('common.refresh')}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
