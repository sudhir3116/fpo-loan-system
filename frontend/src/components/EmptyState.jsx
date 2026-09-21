import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen } from 'lucide-react';
import './EmptyState.css';

const EmptyState = ({
  icon = FolderOpen,
  title,
  description,
  message,
  action,
  className = '',
}) => {
  const { t } = useTranslation();

  const finalTitle = title || t('empty.noData');
  const finalDesc = description !== undefined ? description : (message !== undefined ? message : t('empty.tryAdjusting'));

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = typeof icon === 'function' ? icon : FolderOpen;
    return <IconComponent size={36} className="empty-state-icon" />;
  };

  return (
    <div className={`empty-state-card glass-panel ${className}`}>
      <div className="empty-state-icon-wrapper">
        {renderIcon()}
      </div>
      <h3 className="empty-state-title">{finalTitle}</h3>
      {finalDesc && <p className="empty-state-description">{finalDesc}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
