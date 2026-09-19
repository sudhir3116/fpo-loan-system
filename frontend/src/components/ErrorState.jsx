import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import './ErrorState.css';

const ErrorState = ({ title, message, onRetry, className = '' }) => {
  const { t } = useTranslation();
  const displayTitle = title || t('errorState.defaultTitle');
  const displayMessage = message || t('errorState.defaultDesc');

  return (
    <div className={`error-state-card glass-panel ${className}`}>
      <div className="error-state-icon">
        <AlertOctagon size={32} />
      </div>
      <div className="error-state-body">
        <h3 className="error-state-title">{displayTitle}</h3>
        {displayMessage && <p className="error-state-message">{displayMessage}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary error-retry-btn">
          <RotateCcw size={16} />
          <span>{t('errorState.retry')}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
