import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, CheckCheck, Globe, ChevronDown, Check, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminProfile from './AdminProfile';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';

const Header = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const notifRef = useRef(null);
  const langRef = useRef(null);

  const currentLang = i18n.language || 'en';

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
  ];

  // Mock notifications for UI shell indicator
  const notifications = [
    { id: 1, titleKey: 'dashboard.newLoanSubmitted', defaultText: 'New Loan Submitted', time: '10m ago', unread: true, link: '/admin/loans' },
    { id: 2, titleKey: 'documents.verifyDoc', defaultText: 'Document Uploaded', time: '1h ago', unread: true, link: '/admin/documents' },
    { id: 3, titleKey: 'repayments.paymentRecordedSuccess', defaultText: 'EMI Payment Recorded', time: '3h ago', unread: false, link: '/admin/repayments' },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false);
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
          aria-label="Toggle Navigation Menu"
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
        {/* Language Switcher Dropdown */}
        <div className="lang-switcher-wrapper" ref={langRef}>
          <button
            type="button"
            className={`lang-switcher-btn ${showLangMenu ? 'active' : ''}`}
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Change Language"
          >
            <Globe size={16} className="lang-globe-icon" />
            <span>{currentLang === 'ta' ? 'தமிழ்' : 'English'}</span>
            <ChevronDown size={14} />
          </button>

          {showLangMenu && (
            <div className="lang-dropdown-menu glass-panel">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-option-btn ${currentLang === lang.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span>{lang.label}</span>
                  {currentLang === lang.code && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <button
          type="button"
          className="theme-switcher-btn"
          onClick={toggleTheme}
          aria-label="Toggle Dark / Light Theme"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <>
              <Moon size={16} className="theme-icon moon-icon" />
              <span className="theme-label">Dark</span>
            </>
          ) : (
            <>
              <Sun size={16} className="theme-icon sun-icon" />
              <span className="theme-label">Light</span>
            </>
          )}
        </button>

        {/* Notification indicator & Popover */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`header-action-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-popover glass-panel">
              <div className="notif-header">
                <h3>{t('header.notifications')}</h3>
                <span className="notif-count-badge">
                  {t('header.unreadCount', { count: unreadCount })}
                </span>
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
                      <p className="notif-title">
                        {n.titleKey ? t(n.titleKey, n.defaultText) : n.defaultText}
                      </p>
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
