import api from './api';

export const progressService = {
  async getProgress() {
    const res = await api.get('/progress');
    return res.data.data;
  },

  async getDashboard() {
    const res = await api.get('/dashboard');
    return res.data.data;
  },
};
