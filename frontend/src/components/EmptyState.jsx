import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen } from 'lucide-react';
import './EmptyState.css';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className = '',
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('emptyState.defaultTitle');
  const displayDesc = description || t('emptyState.defaultDesc');

  return (
    <div className={`empty-state-card glass-panel ${className}`}>
      <div className="empty-state-icon-wrapper">
        <Icon size={36} className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{displayTitle}</h3>
      {displayDesc && <p className="empty-state-description">{displayDesc}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
