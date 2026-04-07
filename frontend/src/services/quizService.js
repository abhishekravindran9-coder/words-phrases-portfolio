import api from './api';

export const quizService = {
  /**
   * Persists a completed quiz session to the backend.
   * @param {Object} payload
   * @param {number} payload.questionCount
   * @param {number} payload.totalTimeSeconds
   * @param {Array}  payload.answers – [{ wordId, questionType, correct, timeTakenSeconds, userAnswer, correctAnswer }]
   * @returns {Promise<{ id: number }>}
   */
  async saveSession(payload) {
    const res = await api.post('/quiz/sessions', payload);
    return res.data.data;
  },

  /**
   * Fetches detailed quiz statistics for the current user.
   * @returns {Promise<QuizStatsResponse>}
   */
  async getStats() {
    const res = await api.get('/quiz/stats');
    return res.data.data;
  },
};
