import axios from 'axios';

// Create Axios client instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token to all authorized requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration or auth errors
api.interceptors.response.use(
  (response) => {
    // If backend provided a self-healed or refreshed token, save it automatically
    const refreshedToken = response.headers
      ? (response.headers['x-refreshed-token'] || response.headers['X-Refreshed-Token'])
      : null;
    if (refreshedToken) {
      localStorage.setItem('token', refreshedToken);
    }
    return response;
  },
  async (error) => {
    // If request failed due to proxy drop or Network Error, automatically failover to direct backend port 5000
    const config = error.config;
    if (
      (error.code === 'ERR_NETWORK' || error.message === 'Network Error') &&
      config &&
      !config._retryDirect
    ) {
      config._retryDirect = true;
      config.baseURL = 'http://localhost:5000/api';
      return api(config);
    }

    if (error.response && error.response.status === 401) {
      // Clear token and user if unauthorized or token expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Auto-redirect to login page if user was on a protected page
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

