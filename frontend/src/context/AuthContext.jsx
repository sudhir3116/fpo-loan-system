import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getActiveToken } from '../api/client';

export const AUTH_STATES = {
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.INITIALIZING);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearAllStoredSessions = () => {
    // Clear active tab session
    sessionStorage.removeItem('fpo_active_token');
    sessionStorage.removeItem('fpo_active_user');
    sessionStorage.removeItem('fpo_token');
    sessionStorage.removeItem('fpo_user');

    // Clear any residual localStorage tokens to prevent startup bypass
    localStorage.removeItem('fpo_admin_token');
    localStorage.removeItem('fpo_admin_user');
    localStorage.removeItem('fpo_farmer_token');
    localStorage.removeItem('fpo_farmer_user');
    localStorage.removeItem('fpo_token');
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    setAuthState(AUTH_STATES.UNAUTHENTICATED);
    clearAllStoredSessions();
  }, []);

  // Session verification on initial load and refresh
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const activeToken = getActiveToken();

      if (!activeToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
        }
        return;
      }

      try {
        const response = await authAPI.getMe();
        const currentUser = response.data?.data?.user;

        if (
          isMounted &&
          currentUser &&
          (currentUser.role === 'FPO_ADMIN' || currentUser.role === 'FARMER') &&
          currentUser.status === 'ACTIVE'
        ) {
          // Verified successfully by backend
          setUser(currentUser);
          setToken(activeToken);
          setAuthState(AUTH_STATES.AUTHENTICATED);

          // Save tab session
          sessionStorage.setItem('fpo_active_token', activeToken);
          sessionStorage.setItem('fpo_active_user', JSON.stringify(currentUser));
        } else {
          // Invalid status or role
          if (isMounted) logout();
        }
      } catch (err) {
        console.warn('Session verification failed on startup/refresh:', err.response?.data?.message || err.message);
        if (isMounted) {
          logout();
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Listen for global auto-logout events emitted by Axios 401 interceptor
  useEffect(() => {
    const handleAutoLogout = () => {
      logout();
    };

    window.addEventListener('fpo_auth_logout', handleAutoLogout);
    return () => window.removeEventListener('fpo_auth_logout', handleAutoLogout);
  }, [logout]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login({ email, password });
      const { token: jwtToken, data } = response.data;
      const loggedUser = data?.user;

      if (!loggedUser) {
        const errMsg = 'Login failed. User profile data missing.';
        setError(errMsg);
        setLoading(false);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        return { success: false, message: errMsg };
      }

      // Check account status
      if (loggedUser.status !== 'ACTIVE') {
        const errMsg = 'Access Denied: Account is inactive or suspended.';
        setError(errMsg);
        setLoading(false);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        return { success: false, message: errMsg };
      }

      setToken(jwtToken);
      setUser(loggedUser);
      setAuthState(AUTH_STATES.AUTHENTICATED);

      // Save tab-isolated session
      sessionStorage.setItem('fpo_active_token', jwtToken);
      sessionStorage.setItem('fpo_active_user', JSON.stringify(loggedUser));

      setLoading(false);
      return { success: true, user: loggedUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setError(message);
      setLoading(false);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      return { success: false, message };
    }
  };

  const loginWithGoogle = async (googleIdToken) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.googleLogin(googleIdToken);
      const { token: jwtToken, data } = response.data;
      const loggedUser = data?.user;

      if (!loggedUser) {
        const errMsg = 'Google authentication failed. User profile data missing.';
        setError(errMsg);
        setLoading(false);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        return { success: false, message: errMsg };
      }

      // Check account status
      if (loggedUser.status !== 'ACTIVE') {
        const errMsg = 'Access Denied: Account is inactive or suspended.';
        setError(errMsg);
        setLoading(false);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        return { success: false, message: errMsg };
      }

      setToken(jwtToken);
      setUser(loggedUser);
      setAuthState(AUTH_STATES.AUTHENTICATED);

      // Save tab-isolated session
      sessionStorage.setItem('fpo_active_token', jwtToken);
      sessionStorage.setItem('fpo_active_user', JSON.stringify(loggedUser));

      setLoading(false);
      return { success: true, user: loggedUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Google authentication failed. Please try again.';
      setError(message);
      setLoading(false);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      return { success: false, message };
    }
  };

  const initializing = authState === AUTH_STATES.INITIALIZING;
  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;
  const isAdmin = isAuthenticated && user?.role === 'FPO_ADMIN';
  const isFarmer = isAuthenticated && user?.role === 'FARMER';

  return (
    <AuthContext.Provider
      value={{
        authState,
        AUTH_STATES,
        user,
        token,
        loading,
        initializing,
        error,
        setError,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated,
        isAdmin,
        isFarmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
