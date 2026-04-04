import api from './api';

export const authService = {
  async register(payload) {
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  },
};
