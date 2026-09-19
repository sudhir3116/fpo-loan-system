import api from './api';

export const loanService = {
  createLoan: async (loanData) => {
    const response = await api.post('/loans', loanData);
    return response.data;
  },

  getMyLoans: async () => {
    const response = await api.get('/loans/my');
    return response.data;
  },

  getLoanById: async (loanId) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },
};

export const documentService = {
  uploadDocument: async (loanId, documentType, file) => {
    const formData = new FormData();
    formData.append('loanId', loanId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyDocuments: async () => {
    const response = await api.get('/documents/my');
    return response.data;
  },

  getLoanDocuments: async (loanId) => {
    const response = await api.get(`/documents/loan/${loanId}`);
    return response.data;
  },
};

export const repaymentService = {
  getMyRepayments: async () => {
    const response = await api.get('/repayments/my');
    return response.data;
  },

  getLoanRepayments: async (loanId) => {
    const response = await api.get(`/repayments/loan/${loanId}`);
    return response.data;
  },
};
