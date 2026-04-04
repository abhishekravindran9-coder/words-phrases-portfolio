import api from './api';

/**
 * Enrichment helpers for auto-filling word / phrase definitions.
 * Both words and phrases go through the backend Gemini proxy so the
 * API key is never exposed to the browser.
 */
const enrichService = {
  async enrichWord(word) {
    const res = await api.post('/enrich/word', { word: word.trim() });
    return res.data.data;
  },

  async enrichPhrase(phrase) {
    const res = await api.post('/enrich/phrase', { phrase: phrase.trim() });
    return res.data.data;
  },
};

export default enrichService;
