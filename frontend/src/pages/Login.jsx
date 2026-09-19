import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Building2, Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, loginWithGoogle, loading, error: authError, setError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = (userRole) => {
    if (userRole === 'FARMER') {
      return '/farmer/dashboard';
    }
    if (location.state?.from?.pathname && !location.state.from.pathname.startsWith('/farmer') && location.state.from.pathname !== '/login') {
      return location.state.from.pathname;
    }
    return '/admin/dashboard';
  };

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Initialize Google Identity Services
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return;
    }

    const handleGoogleCredentialResponse = async (response) => {
      if (response && response.credential) {
        setFormError('');
        if (setError) setError(null);
        const result = await loginWithGoogle(response.credential);
        if (result.success && result.user) {
          navigate(getRedirectPath(result.user.role), { replace: true });
        }
      }
    };

    const renderGoogleButton = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });

          const btnElement = document.getElementById('google-signin-btn');
          if (btnElement) {
            window.google.accounts.id.renderButton(btnElement, {
              theme: 'outline',
              size: 'large',
              width: btnElement.offsetWidth || 360,
              text: 'continue_with',
              shape: 'rectangular',
            });
          }
        } catch (err) {
          console.warn('Google Identity initialization error:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle, navigate, location, setError]);

  const validateForm = () => {
    if (!email.trim()) {
      setFormError(t('login.validation.emailRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError(t('login.validation.emailInvalid'));
      return false;
    }
    if (!password) {
      setFormError(t('login.validation.passwordRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (setError) setError(null);

    if (!validateForm()) {
      return;
    }

    const result = await login(email.trim(), password);
    if (result.success && result.user) {
      navigate(getRedirectPath(result.user.role), { replace: true });
    }
  };

  const displayError = formError || authError;

  return (
    <div className="login-container">
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <LanguageSwitcher />
      </div>

      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-brand-icon">
            <Building2 size={28} />
          </div>
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        {displayError && (
          <div className="login-error-alert">
            <ShieldAlert size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{displayError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              {t('login.emailLabel')}
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                className="form-input with-icon"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              {t('login.passwordLabel')}
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon with-eye"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                <span>{t('login.authenticating')}</span>
              </>
            ) : (
              <>
                <span>{t('login.signInButton')}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <div className="google-auth-container">
          <div id="google-signin-btn" className="google-btn-wrapper"></div>
        </div>

        <div className="login-footer">
          <p>{t('login.footerText')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
