import axios from 'axios';

// In production (Vercel), REACT_APP_API_URL points to the Render backend.
// In local dev, requests go to the proxy (localhost:8080) via package.json "proxy".
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wp_token');
      localStorage.removeItem('wp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
