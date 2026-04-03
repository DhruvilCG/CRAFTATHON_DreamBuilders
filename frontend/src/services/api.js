import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const loginUser = async (email, password) => {
  const response = await api.post('/api/users/login', { email, password });
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await api.post('/api/users', payload);
  return response.data;
};

export const fetchTraffic = async () => {
  const response = await api.get('/api/traffic');
  return response.data;
};

export const fetchAlerts = async () => {
  const response = await api.get('/api/alerts');
  return response.data;
};

export const fetchStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

export const simulateTraffic = async (type) => {
  const response = await api.post('/api/simulate', { type });
  return response.data;
};

export default api;
