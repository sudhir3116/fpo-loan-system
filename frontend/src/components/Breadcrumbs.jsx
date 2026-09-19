import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

const PATH_NAME_KEYS = {
  admin: 'nav.home',
  dashboard: 'nav.dashboard',
  farmers: 'nav.farmers',
  loans: 'nav.loanApplications',
  repayments: 'nav.repayments',
  reports: 'nav.reports',
  notifications: 'nav.notifications',
};

const Breadcrumbs = ({ items }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  // If custom items passed, use them, otherwise generate from path
  const breadcrumbItems = React.useMemo(() => {
    if (items && items.length > 0) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generated = [];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const translationKey = PATH_NAME_KEYS[segment];
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
  }, [items, location.pathname, t, i18n.language]);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className="breadcrumbs-container" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/admin/dashboard" className="breadcrumb-link home-link" aria-label={t('nav.home')}>
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
