import api from './api';

export const wordService = {
  async getWords({ page = 0, size = 20, query = '' } = {}) {
    const res = await api.get('/words', { params: { page, size, query: query || undefined } });
    return res.data.data;
  },

  async getWord(id) {
    const res = await api.get(`/words/${id}`);
    return res.data.data;
  },

  async createWord(payload) {
    const res = await api.post('/words', payload);
    return res.data.data;
  },

  async updateWord(id, payload) {
    const res = await api.put(`/words/${id}`, payload);
    return res.data.data;
  },

  async deleteWord(id) {
    await api.delete(`/words/${id}`);
  },
};
