import api from './api';

export const progressService = {
  async getProgress() {
    const res = await api.get('/progress');
    return res.data.data;
  },

  async getInsights(range = '30d', timezone) {
    const res = await api.get('/progress/insights', { params: { range, timezone } });
    return res.data.data;
  },

  async getNarrative(timezone) {
    const res = await api.get('/progress/narrative', { params: { timezone } });
    return res.data.data;
  },

  async getDashboard() {
    const res = await api.get('/dashboard');
    return res.data.data;
  },
};
