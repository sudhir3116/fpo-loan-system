import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to resolve the correct authentication token across tabs and roles
// Strict tab session isolation: Prevents stale localStorage tokens from bypassing login on startup
export const getActiveToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('fpo_active_token') || sessionStorage.getItem('fpo_token') || null;
};

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling & 401 Auto-Logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        console.warn('Authentication error or token expired:', data?.message);
        // Clear active session storage
        sessionStorage.removeItem('fpo_active_token');
        sessionStorage.removeItem('fpo_active_user');

        const isFarmer = typeof window !== 'undefined' && window.location.pathname.startsWith('/farmer');
        if (isFarmer) {
          localStorage.removeItem('fpo_farmer_token');
          localStorage.removeItem('fpo_farmer_user');
        } else {
          localStorage.removeItem('fpo_admin_token');
          localStorage.removeItem('fpo_admin_user');
        }

        // Dispatch custom event so AuthContext can synchronize state
        window.dispatchEvent(new Event('fpo_auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API Service Contracts Grounded Strictly in Backend Specification

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
  googleLogin: (token) => apiClient.post('/auth/google', { token }),
};

export const loanAPI = {
  getAllLoans: (params) => apiClient.get('/loans', { params }),
  getMyLoans: () => apiClient.get('/loans/my'),
  getLoanById: (id) => apiClient.get(`/loans/${id}`),
  markUnderReview: (id) => apiClient.put(`/loans/${id}/under-review`),
  approveLoan: (id, body) => apiClient.put(`/loans/${id}/approve`, body),
  rejectLoan: (id, body) => apiClient.put(`/loans/${id}/reject`, body),
  disburseLoan: (id, body) => apiClient.put(`/loans/${id}/disburse`, body),
};

export const documentAPI = {
  getAllDocuments: (params) => apiClient.get('/documents', { params }),
  getMyDocuments: () => apiClient.get('/documents/my'),
  getLoanDocuments: (loanId) => apiClient.get(`/documents/loan/${loanId}`),
  verifyDocument: (id) => apiClient.put(`/documents/${id}/verify`),
  rejectDocument: (id, body) => apiClient.put(`/documents/${id}/reject`, body),
};

export const repaymentAPI = {
  getAllRepayments: (params) => apiClient.get('/repayments', { params }),
  getMyRepayments: () => apiClient.get('/repayments/my'),
  getLoanRepayments: (loanId) => apiClient.get(`/repayments/loan/${loanId}`),
  markRepaymentPaid: (id, body) => apiClient.put(`/repayments/${id}/pay`, body),
};

export const auditAPI = {
  getAuditLogs: (params) => apiClient.get('/audit-logs', { params }),
};
