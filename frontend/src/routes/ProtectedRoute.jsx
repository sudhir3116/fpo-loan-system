import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ProtectedRoute = ({ children, requiredRole = 'FPO_ADMIN' }) => {
  const { authState, isAuthenticated, user, initializing } = useAuth();
  const location = useLocation();

  if (initializing || authState === 'INITIALIZING') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Loading message={`Verifying ${requiredRole === 'FPO_ADMIN' ? 'Admin' : 'Farmer'} Authorization...`} />
      </div>
    );
  }

  if (!isAuthenticated || authState !== 'AUTHENTICATED') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Cross-role protection
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'FARMER') {
      return <Navigate to="/farmer/dashboard" replace />;
    } else if (user?.role === 'FPO_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
