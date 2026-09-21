import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

const PATH_KEY_MAP = {
  admin: 'nav.brandName',
  dashboard: 'nav.dashboard',
  farmers: 'nav.farmers',
  loans: 'nav.loanApplications',
  documents: 'nav.documentVerification',
  disbursements: 'nav.loanDisbursement',
  repayments: 'nav.repayments',
  overdue: 'nav.overdue',
  reports: 'nav.reports',
  notifications: 'nav.notifications',
  'audit-log': 'nav.auditLog',
};

const Breadcrumbs = ({ items }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const breadcrumbItems = React.useMemo(() => {
    if (items && items.length > 0) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generated = [];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const translationKey = PATH_KEY_MAP[segment];
      const label = translationKey
        ? t(translationKey)
        : segment.length > 15
        ? `${segment.substring(0, 12)}...`
        : segment;

      generated.push({
        label,
        path: currentPath,
        isLast: index === pathSegments.length - 1,
      });
    });

    return generated;
  }, [items, location.pathname, t]);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className="breadcrumbs-container" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/admin/dashboard" className="breadcrumb-link home-link" aria-label="Home">
            <Home size={14} />
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => (
          <li key={item.path || index} className="breadcrumb-item">
            <ChevronRight size={13} className="breadcrumb-separator" />
            {item.isLast ? (
              <span className="breadcrumb-current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link to={item.path} className="breadcrumb-link">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
