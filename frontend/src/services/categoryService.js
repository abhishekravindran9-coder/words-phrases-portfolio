import api from './api';

export const categoryService = {
  async getCategories() {
    const res = await api.get('/categories');
    return res.data.data;
  },

  async createCategory(payload) {
    const res = await api.post('/categories', payload);
    return res.data.data;
  },

  async updateCategory(id, payload) {
    const res = await api.put(`/categories/${id}`, payload);
    return res.data.data;
  },

  async deleteCategory(id) {
    await api.delete(`/categories/${id}`);
  },
};
