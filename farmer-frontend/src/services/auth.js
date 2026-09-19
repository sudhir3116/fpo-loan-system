import api from './api';

export const authService = {
  register: async (name, email, phone, farmingArea, location, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      phone,
      farmingArea,
      location,
      password,
      role: 'FARMER',
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getCurrentFarmer: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('farmer');
  },
};
