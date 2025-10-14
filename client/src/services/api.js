import axios from 'axios';

// Use relative path to leverage Vite proxy in development
// In production, the backend serves both static files and API from the same server
const API_URL = '/api';

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
  adjustBalance: (id, currency, amount) => api.post(`/admin/users/${id}/adjust-balance`, { currency, amount }),
  getMetrics: () => api.get('/admin/metrics'),
  getActivity: (limit = 50, offset = 0) => api.get('/admin/activity', { params: { limit, offset } }),
  getInviteCodes: () => api.get('/admin/invite-codes'),
  createInviteCode: (code) => api.post('/admin/invite-codes', { code }),
  generateInviteCode: () => api.post('/admin/invite-codes/generate'),
  deleteInviteCode: (id) => api.delete(`/admin/invite-codes/${id}`),
};

// Auction endpoints
export const auctionAPI = {
  getAllAuctions: (status = 'active', limit = 50) => 
    api.get('/auctions', { params: { status, limit } }),
  getAuctionById: (id) => api.get(`/auctions/${id}`),
  createAuction: (itemName, itemDescription, rarity, durability, startingPrice, daysUntilEnd) =>
    api.post('/auctions', { itemName, itemDescription, rarity, durability, startingPrice, daysUntilEnd }),
  placeBid: (id, amount) => api.post(`/auctions/${id}/bid`, { amount }),
  confirmDelivery: (id) => api.post(`/auctions/${id}/confirm-delivery`),
  getMyAuctions: () => api.get('/auctions/my-auctions'),
  getMyBids: () => api.get('/auctions/my-bids'),
  cancelAuction: (id) => api.delete(`/auctions/${id}`),
};

// Prediction Market endpoints
export const predictionAPI = {
  getMarkets: () => api.get('/prediction/markets'),
  getMarketById: (id) => api.get(`/prediction/markets/${id}`),
  placeOrder: (id, side, action, quantity) => 
    api.post(`/prediction/markets/${id}/order`, { side, action, quantity }),
  getPortfolio: () => api.get('/prediction/portfolio'),
  // Admin endpoints
  getAvailableMarkets: () => api.get('/prediction/admin/available-markets'),
  whitelistMarket: (pm_market_id) => api.post('/prediction/admin/markets/whitelist', { pm_market_id }),
  updateMarketStatus: (id, status) => api.put(`/prediction/admin/markets/${id}/status`, { status }),
  removeMarket: (id) => api.delete(`/prediction/admin/markets/${id}`),
  triggerSettlement: (id, outcome) => api.post(`/prediction/admin/markets/${id}/settle`, { outcome }),
  getPlatformStats: () => api.get('/prediction/admin/stats'),
};

export default api;

