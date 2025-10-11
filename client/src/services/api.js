import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (username, password, inviteCode) => api.post('/auth/signup', { username, password, inviteCode }),
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Wallet endpoints
export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  swapCurrency: (fromCurrency, toCurrency, amount) => 
    api.post('/wallet/swap', { fromCurrency, toCurrency, amount }),
};

// Payment endpoints
export const paymentAPI = {
  sendPayment: (recipientUsername, currency, amount, description) => 
    api.post('/payment/send', { recipientUsername, currency, amount, description }),
  getTransactions: (limit = 50, offset = 0) => 
    api.get('/payment/transactions', { params: { limit, offset } }),
};

// User endpoints
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  searchUsers: (query) => api.get('/users/search', { params: { query } }),
};

// Admin endpoints
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  toggleDisabled: (id) => api.post(`/admin/users/${id}/toggle-disabled`),
  toggleAdmin: (id) => api.post(`/admin/users/${id}/toggle-admin`),
  getMetrics: () => api.get('/admin/metrics'),
  getActivity: (limit = 50, offset = 0) => api.get('/admin/activity', { params: { limit, offset } }),
  getInviteCodes: () => api.get('/admin/invite-codes'),
  createInviteCode: (code) => api.post('/admin/invite-codes', { code }),
  generateInviteCode: () => api.post('/admin/invite-codes/generate'),
  deleteInviteCode: (id) => api.delete(`/admin/invite-codes/${id}`),
};

export default api;

