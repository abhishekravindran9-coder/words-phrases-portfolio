import api from './api';

/**
 * Enrichment helpers for auto-filling word / phrase definitions.
 * Both words and phrases go through the backend Gemini proxy so the
 * API key is never exposed to the browser.
 */

function handleEnrichResponse(res) {
  if (!res.data.success) {
    const msg = res.data.message || 'Enrichment failed';
    const err = new Error(msg);
    err.isRateLimit = msg.toLowerCase().includes('rate limit');
    throw err;
  }
  return res.data.data;
}

function wrapError(err) {
  const msg =
    err.response?.data?.message ||
    err.message ||
    'Could not fetch definition';
  const typed = new Error(msg);
  typed.isRateLimit = msg.toLowerCase().includes('rate limit');
  return typed;
}

const enrichService = {
  async enrichWord(word) {
    try {
      const res = await api.post('/enrich/word', { word: word.trim() });
      return handleEnrichResponse(res);
    } catch (err) {
      throw err.isRateLimit !== undefined ? err : wrapError(err);
    }
  },

  async enrichPhrase(phrase) {
    try {
      const res = await api.post('/enrich/phrase', { phrase: phrase.trim() });
      return handleEnrichResponse(res);
    } catch (err) {
      throw err.isRateLimit !== undefined ? err : wrapError(err);
    }
  },
};

export default enrichService;
