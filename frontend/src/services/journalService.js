import api from './api';

export const journalService = {
  async getEntries({ page = 0, size = 10 } = {}) {
    const res = await api.get('/journal', { params: { page, size } });
    return res.data.data;
  },

  async getAllEntries() {
    const pageSize = 500;
    const firstPage = await this.getEntries({ page: 0, size: pageSize });
    const entries = [...(firstPage.content || [])];
    const remainingPages = Array.from({ length: Math.max(0, (firstPage.totalPages || 0) - 1) }, (_, index) => index + 1);
    const remainingResults = await Promise.all(remainingPages.map((page) =>
      this.getEntries({ page, size: pageSize })
    ));
    remainingResults.forEach((result) => entries.push(...(result.content || [])));
    return entries;
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
