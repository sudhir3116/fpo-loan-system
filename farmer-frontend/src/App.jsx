import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ApplyLoanPage from './pages/ApplyLoanPage';
import MyLoansPage from './pages/MyLoansPage';
import LoanDetailsPage from './pages/LoanDetailsPage';
import DocumentsPage from './pages/DocumentsPage';
import RepaymentSchedulePage from './pages/RepaymentSchedulePage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Farmer Routes */}
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <DashboardPage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/profile"
              element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ProfilePage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/apply-loan"
              element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ApplyLoanPage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/loans"
              element={
                <ProtectedRoute>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <MyLoansPage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/loans/:id"
              element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <LoanDetailsPage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/loans/:id/documents"
              element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <DocumentsPage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/loans/:id/repayments"
              element={
                <ProtectedRoute>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <RepaymentSchedulePage />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/notifications"
              element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <NotificationsPage />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Root Route */}
            <Route path="/" element={<Navigate to="/farmer/dashboard" replace />} />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/farmer/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
