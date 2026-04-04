import api from './api';

export const wordService = {
  async getWords({
    page = 0, size = 20,
    query = '', entryType = '',
    categoryId = null, mastered = null,
    sortBy = 'createdAt', sortDir = 'desc',
  } = {}) {
    const res = await api.get('/words', {
      params: {
        page, size, sortBy, sortDir,
        query:      query      || undefined,
        entryType:  entryType  || undefined,
        categoryId: categoryId ?? undefined,
        mastered:   mastered   ?? undefined,
      },
    });
    return res.data.data;
  },

  async getStats() {
    const res = await api.get('/words/stats');
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
