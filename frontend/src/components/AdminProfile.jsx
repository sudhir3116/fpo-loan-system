import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, LogOut, ChevronDown, Building2, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminProfile.css';

const AdminProfile = ({ className = '' }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`admin-profile-container ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`profile-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="profile-avatar">
          <User size={18} />
        </div>
        <div className="profile-info-compact">
          <span className="profile-name">{user?.name || 'Administrator'}</span>
          <span className="profile-role-badge">{t('header.fpoAdminRole')}</span>
        </div>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="profile-dropdown-card glass-panel">
          <div className="dropdown-header">
            <div className="user-avatar-large">
              <User size={24} />
            </div>
            <div className="user-text-details">
              <h4 className="dropdown-user-name">{user?.name || 'Administrator'}</h4>
              <p className="dropdown-user-email">
                <Mail size={12} />
                <span>{user?.email || 'admin@fpo.org'}</span>
              </p>
            </div>
          </div>

          <div className="dropdown-divider" />

          <div className="fpo-organization-details">
            <div className="fpo-detail-item">
              <Building2 size={15} className="fpo-detail-icon" />
              <div className="fpo-detail-text">
                <span className="detail-label">{t('farmers.columns.fpoAffiliation')}</span>
                <span className="detail-value">{user?.fpoName || t('profile.defaultFpo')}</span>
              </div>
            </div>

            <div className="fpo-detail-item">
              <ShieldCheck size={15} className="fpo-detail-icon" />
              <div className="fpo-detail-text">
                <span className="detail-label">{t('reports.columns.regNo')}</span>
                <span className="detail-value">{user?.fpoRegistrationNo || 'FPO-REG-2024'}</span>
              </div>
            </div>
          </div>

          <div className="dropdown-divider" />

          <button onClick={handleLogout} className="dropdown-logout-btn">
            <LogOut size={16} />
            <span>{t('nav.signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
