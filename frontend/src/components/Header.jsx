import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, Search, LogOut, CheckCheck } from 'lucide-react';
import AdminProfile from './AdminProfile';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';

const Header = ({ onToggleSidebar }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Notifications for UI shell indicator
  const notifications = [
    { id: 1, title: t('notifications.items.newLoanSubmittedTitle'), time: `10 ${t('common.date')}`, unread: true, link: '/admin/loans' },
    { id: 2, title: t('notifications.items.appUnderReviewTitle'), time: `1 ${t('common.date')}`, unread: true, link: '/admin/loans' },
    { id: 3, title: t('notifications.items.overdueInstallmentTitle'), time: `3 ${t('common.date')}`, unread: false, link: '/admin/repayments' },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="admin-header-root glass-panel">
      <div className="header-left-section">
        <button
          type="button"
          className="mobile-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={t('header.toggleMenu')}
        >
          <Menu size={20} />
        </button>

        <div className="header-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="header-search-input"
          />
        </div>
      </div>

      <div className="header-right-section">
        <LanguageSwitcher />

        {/* Notification indicator & Popover */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`header-action-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={t('header.notificationsTitle')}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-popover glass-panel">
              <div className="notif-header">
                <h3>{t('header.notificationsTitle')}</h3>
                <span className="notif-count-badge">{t('header.unreadBadge', { count: unreadCount })}</span>
              </div>
              <div className="notif-list">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => setShowNotifications(false)}
                    className={`notif-item ${n.unread ? 'unread' : ''}`}
                  >
                    <div className="notif-indicator-dot" />
                    <div className="notif-text-wrapper">
                      <p className="notif-title">{n.title}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="notif-footer">
                <Link
                  to="/admin/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="view-all-notif-link"
                >
                  <CheckCheck size={14} />
                  <span>{t('header.viewAllAlerts')}</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <AdminProfile />

        <button
          type="button"
          onClick={handleLogout}
          className="header-action-btn logout-quick-btn"
          title={t('nav.signOut')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
