import api from './api';

export const journalService = {
  async getEntries({ page = 0, size = 10 } = {}) {
    const res = await api.get('/journal', { params: { page, size } });
    return res.data.data;
  },

  async getEntry(id) {
    const res = await api.get(`/journal/${id}`);
    return res.data.data;
  },

  async createEntry(payload) {
    const res = await api.post('/journal', payload);
    return res.data.data;
  },

  async updateEntry(id, payload) {
    const res = await api.put(`/journal/${id}`, payload);
    return res.data.data;
  },

  async deleteEntry(id) {
    await api.delete(`/journal/${id}`);
  },
};
