import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token exists and restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const farmerData = await authService.getCurrentFarmer();
          setFarmer(farmerData);
          localStorage.setItem('farmer', JSON.stringify(farmerData));
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('farmer');
          setError(err.message);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('farmer', JSON.stringify(response.farmer));
      setFarmer(response.farmer);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const register = async (name, email, phone, farmingArea, location, password) => {
    try {
      setError(null);
      console.log('AuthContext: Starting registration');
      const response = await authService.register(name, email, phone, farmingArea, location, password);
      console.log('AuthContext: Registration response received');
      localStorage.setItem('token', response.token);
      localStorage.setItem('farmer', JSON.stringify(response.farmer));
      setFarmer(response.farmer);
      console.log('AuthContext: User data saved, farmer set');
      return response;
    } catch (err) {
      console.error('AuthContext: Registration error', err);
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setFarmer(null);
  };

  const value = {
    farmer,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!farmer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
