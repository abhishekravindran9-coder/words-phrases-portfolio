import api from './api';

export const reminderService = {
  async getReminders() {
    const res = await api.get('/reminders');
    return res.data.data;
  },

  async createReminder(payload) {
    const res = await api.post('/reminders', payload);
    return res.data.data;
  },

  async updateReminder(id, payload) {
    const res = await api.put(`/reminders/${id}`, payload);
    return res.data.data;
  },

  async deleteReminder(id) {
    await api.delete(`/reminders/${id}`);
  },
};
