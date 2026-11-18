import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

api.interceptors.response.use(
  (response) => {

    const refreshedToken = response.headers
      ? (response.headers['x-refreshed-token'] || response.headers['X-Refreshed-Token'])
      : null;
    if (refreshedToken) {
      localStorage.setItem('token', refreshedToken);
    }
    return response;
  },
  async (error) => {

    const config = error.config;
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (
      isLocalhost &&
      (error.code === 'ERR_NETWORK' || error.message === 'Network Error') &&
      config &&
      !config._retryDirect
    ) {
      config._retryDirect = true;
      config.baseURL = 'http://localhost:5000/api';
      return api(config);
    }

    if (error.response && error.response.status === 401) {

      localStorage.removeItem('token');
      localStorage.removeItem('user');

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
