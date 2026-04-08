import api from './api';

export const propertyService = {
  // ─── Properties ─────────────────────────────────────────────────────────────
  async getAll() {
    const res = await api.get('/properties');
    return res.data.data;
  },

  async get(id) {
    const res = await api.get(`/properties/${id}`);
    return res.data.data;
  },

  async create(data) {
    const res = await api.post('/properties', data);
    return res.data.data;
  },

  async update(id, data) {
    const res = await api.put(`/properties/${id}`, data);
    return res.data.data;
  },

  async delete(id) {
    await api.delete(`/properties/${id}`);
  },

  // ─── Builder Installments ────────────────────────────────────────────────────
  async getInstallments(propertyId) {
    const res = await api.get(`/properties/${propertyId}/installments`);
    return res.data.data;
  },

  async addInstallment(propertyId, data) {
    const res = await api.post(`/properties/${propertyId}/installments`, data);
    return res.data.data;
  },

  async updateInstallment(propertyId, instId, data) {
    const res = await api.put(`/properties/${propertyId}/installments/${instId}`, data);
    return res.data.data;
  },

  async markInstallmentPaid(propertyId, instId, data) {
    const res = await api.post(`/properties/${propertyId}/installments/${instId}/mark-paid`, data);
    return res.data.data;
  },

  async deleteInstallment(propertyId, instId) {
    await api.delete(`/properties/${propertyId}/installments/${instId}`);
  },

  // ─── Loan ────────────────────────────────────────────────────────────────────
  async getLoan(propertyId) {
    const res = await api.get(`/properties/${propertyId}/loan`);
    return res.data.data;
  },

  async saveLoan(propertyId, data) {
    const res = await api.post(`/properties/${propertyId}/loan`, data);
    return res.data.data;
  },

  // ─── Amortization Schedule ───────────────────────────────────────────────────
  async getSchedule(propertyId) {
    const res = await api.get(`/properties/${propertyId}/loan/schedule`);
    return res.data.data;
  },

  async markEmiPaid(propertyId, month, paidDate) {
    const params = paidDate ? { paidDate } : {};
    await api.post(`/properties/${propertyId}/loan/emi/${month}/mark-paid`, null, { params });
  },

  // ─── Prepayments ─────────────────────────────────────────────────────────────
  async getPrepayments(propertyId) {
    const res = await api.get(`/properties/${propertyId}/loan/prepayments`);
    return res.data.data;
  },

  async addPrepayment(propertyId, data) {
    const res = await api.post(`/properties/${propertyId}/loan/prepayments`, data);
    return res.data.data;
  },

  async deletePrepayment(propertyId, prepaymentId) {
    await api.delete(`/properties/${propertyId}/loan/prepayments/${prepaymentId}`);
  },

  async simulate(propertyId, data) {
    const res = await api.post(`/properties/${propertyId}/loan/simulate`, data);
    return res.data.data;
  },

  // ─── Insights ────────────────────────────────────────────────────────────────
  async getInsights(propertyId) {
    const res = await api.get(`/properties/${propertyId}/loan/insights`);
    return res.data.data;
  },
};
