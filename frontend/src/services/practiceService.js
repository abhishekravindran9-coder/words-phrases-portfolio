import api from './api';

export const practiceService = {
  async getOverview() {
    const res = await api.get('/practice/overview');
    return res.data.data;
  },

  async getQueue({ mode = 'DUE', size = 10 } = {}) {
    const res = await api.get('/practice/queue', { params: { mode, size } });
    return res.data.data;
  },

  async submitAnswer(payload) {
    const res = await api.post('/practice/answers', payload);
    return res.data.data;
  },
};
