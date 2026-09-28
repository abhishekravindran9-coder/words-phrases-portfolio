import api from './api';

export const wordService = {
  async getWords({
    page = 0, size = 20,
    query = '', entryType = '',
    categoryId = null, mastered = null,
    dueOnly = null, dueDate = null, stage = null,
    sortBy = 'createdAt', sortDir = 'desc',
  } = {}) {
    const res = await api.get('/words', {
      params: {
        page, size, sortBy, sortDir,
        query:      query      || undefined,
        entryType:  entryType  || undefined,
        categoryId: categoryId ?? undefined,
        mastered:   mastered   ?? undefined,
        dueOnly:    dueOnly    ?? undefined,
        dueDate:    dueDate    || undefined,
        stage:      stage      || undefined,
      },
    });
    return res.data.data;
  },

  async getAllWords() {
    const pageSize = 500;
    const firstPage = await this.getWords({ page: 0, size: pageSize, sortBy: 'word', sortDir: 'asc' });
    const words = [...(firstPage.content || [])];
    const remainingPages = Array.from({ length: Math.max(0, (firstPage.totalPages || 0) - 1) }, (_, index) => index + 1);
    const remainingResults = await Promise.all(remainingPages.map((page) =>
      this.getWords({ page, size: pageSize, sortBy: 'word', sortDir: 'asc' })
    ));
    remainingResults.forEach((result) => words.push(...(result.content || [])));
    return words;
  },

  async getStats() {
    const res = await api.get('/words/stats');
    return res.data.data;
  },

    async findDuplicates(word, entryType, excludeId) {
      const res = await api.get('/words/duplicates', { params: { word, entryType, excludeId: excludeId || undefined } });
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

  async restoreWord(id) {
    const res = await api.post(`/words/${id}/restore`);
    return res.data.data;
  },
};
