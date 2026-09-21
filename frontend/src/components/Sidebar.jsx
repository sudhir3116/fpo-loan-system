import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  FileCheck,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { labelKey: 'nav.dashboard',            path: '/admin/dashboard',     icon: LayoutDashboard },
    { labelKey: 'nav.farmers',              path: '/admin/farmers',        icon: Users },
    { labelKey: 'nav.loanApplications',    path: '/admin/loans',          icon: FileText },
    { labelKey: 'nav.documentVerification',path: '/admin/documents',      icon: FileCheck },
    { labelKey: 'nav.loanDisbursement',    path: '/admin/disbursements',  icon: Banknote },
    { labelKey: 'nav.repayments',           path: '/admin/repayments',     icon: CreditCard },
    { labelKey: 'nav.overdue',              path: '/admin/overdue',        icon: AlertTriangle },
    { labelKey: 'nav.reports',              path: '/admin/reports',        icon: BarChart3 },
    { labelKey: 'nav.notifications',        path: '/admin/notifications',  icon: Bell },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-root ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Building2 size={24} />
          </div>
          {!isCollapsed && (
            <div className="brand-titles">
              <h2 className="brand-name">{t('nav.brandName')}</h2>
              <span className="brand-sub">{t('nav.brandSub')}</span>
            </div>
          )}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* FPO Info Panel */}
        {!isCollapsed && (
          <div className="sidebar-fpo-card">
            <ShieldCheck size={16} className="fpo-card-icon" />
            <div className="fpo-card-info">
              <span className="fpo-card-name">{user?.fpoName || 'Green Valley FPO'}</span>
              <span className="fpo-card-reg">{user?.fpoRegistrationNo || 'FPO-MH-2024'}</span>
            </div>
          </div>
        )}

        {/* Main Nav Items */}
        <nav className="sidebar-navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const translatedLabel = t(item.labelKey);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                title={isCollapsed ? translatedLabel : undefined}
              >
                <Icon size={20} className="nav-item-icon" />
                {!isCollapsed && <span className="nav-item-label">{translatedLabel}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle & Logout Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-toggle-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? t('nav.expandMenu') : t('nav.collapseMenu')}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>{t('nav.collapseMenu')}</span>}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title={isCollapsed ? t('nav.signOut') : undefined}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>{t('nav.signOut')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
