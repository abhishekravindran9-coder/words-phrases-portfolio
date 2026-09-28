import api from './api';

export const reviewService = {
  async getDueWords() {
    const res = await api.get('/reviews/due');
    return res.data.data;
  },

  async submitReview(payload) {
    const res = await api.post('/reviews', payload);
    return res.data.data;
  },

  async getHistory(wordId) {
    const response = await api.get(`/reviews/word/${wordId}`);
    return response.data.data;
  },
};
