import api from './api';

export const todayService = {
  async getToday(focus = 'MIX') {
    const response = await api.get('/today', { params: { focus } });
    return response.data.data;
  },
};
