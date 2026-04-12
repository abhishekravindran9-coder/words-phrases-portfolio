import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { PlusIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import enrichService from '../../services/enrichService';
import toast from 'react-hot-toast';

/**
 * Controlled form for creating or editing a vocabulary word or phrase.
 * Features:
 *  - Word / Phrase type toggle
 *  - Dynamic example sentences (add/remove rows)
 *  - Inline category creation when the list is empty or user needs a new one
 */
export default function WordForm({ initial = null, categories = [], onSubmit, onCancel, onCreateCategory, loading }) {
  const [form, setForm] = useState({
    entryType: 'WORD',
    word: '',
    definition: '',
    categoryId: '',
    notes: '',
    imageUrl: '',
  });
  const [sentences, setSentences] = useState(['']);

  // Auto-fill state
  const [fetching, setFetching] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  // Inline new-category state
  const [showNewCat, setShowNewCat]   = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [catSaving,  setCatSaving]    = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        entryType:  initial.entryType || 'WORD',
        word:       initial.word || '',
        definition: initial.definition || '',
        categoryId: initial.categoryId ? String(initial.categoryId) : '',
        notes:      initial.notes || '',
        imageUrl:   initial.imageUrl || '',
      });
      // Split stored sentences (joined by double newline)
      const parts = (initial.exampleSentence || '').split('\n\n').filter(Boolean);
      setSentences(parts.length ? parts : ['']);
    }
  }, [initial]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Sentences helpers
  const setSentence  = (i, val) => setSentences((s) => s.map((x, j) => j === i ? val : x));
  const addSentence  = ()       => setSentences((s) => [...s, '']);
  const removeSentence = (i)    => setSentences((s) => s.filter((_, j) => j !== i));

  const handleAutoFill = async () => {
    if (!form.word.trim() || rateLimitSeconds > 0) return;
    setFetching(true);
    try {
      const result = form.entryType === 'WORD'
        ? await enrichService.enrichWord(form.word)
        : await enrichService.enrichPhrase(form.word);

      setForm((f) => ({ ...f, definition: result.definition || f.definition }));

      if (result.examples?.length) {
        setSentences(result.examples.filter(Boolean));
      }

      if (result.notes) {
        setForm((f) => ({ ...f, notes: result.notes }));
      }

      toast.success('Definition, examples & notes loaded!');
    } catch (err) {
      if (err.isRateLimit) {
        // Start 60-second countdown
        setRateLimitSeconds(60);
        const interval = setInterval(() => {
          setRateLimitSeconds((s) => {
            if (s <= 1) { clearInterval(interval); return 0; }
            return s - 1;
          });
        }, 1000);
        toast.error('Gemini rate limit hit. Auto-fill will unlock in 60s.');
      } else {
        toast.error(err.message || 'Could not fetch definition');
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const exampleSentence = sentences.filter(Boolean).join('\n\n');
    onSubmit({
      ...form,
      exampleSentence,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSaving(true);
    try {
      const created = await onCreateCategory(newCatName.trim());
      setForm((f) => ({ ...f, categoryId: String(created.id) }));
      setNewCatName('');
      setShowNewCat(false);
    } finally {
      setCatSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Word / Phrase toggle */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
          {['WORD', 'PHRASE'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((f) => ({ ...f, entryType: type }))}
              className={`px-5 py-2 text-sm font-medium transition-colors
                ${form.entryType === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {type === 'WORD' ? '📖 Word' : '💬 Phrase'}
            </button>
          ))}
        </div>
      </div>

      {/* Word / Phrase input with Auto-fill button */}
      <div className="space-y-1">
        <label htmlFor="word" className="block text-sm font-medium text-gray-700">
          {form.entryType === 'PHRASE' ? 'Phrase *' : 'Word *'}
        </label>
        <div className="flex gap-2">
          <input
            id="word"
            type="text"
            required
            placeholder={form.entryType === 'PHRASE' ? 'e.g. break a leg' : 'e.g. serendipity'}
            value={form.word}
            onChange={(e) => {
              const v = e.target.value;
              const norm = v.length > 0 ? v[0].toUpperCase() + v.slice(1).toLowerCase() : v;
              setForm((f) => ({ ...f, word: norm }));
            }}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={!form.word.trim() || fetching || rateLimitSeconds > 0}
            title={rateLimitSeconds > 0 ? `Rate limited — available in ${rateLimitSeconds}s` : 'Auto-fill from Gemini AI'}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border
                       transition-colors whitespace-nowrap flex-shrink-0
                       ${rateLimitSeconds > 0
                         ? 'border-orange-300 text-orange-700 bg-orange-50 cursor-not-allowed'
                         : 'border-primary-300 text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-40 disabled:cursor-not-allowed'
                       }`}
          >
            {fetching ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <SparklesIcon className="h-4 w-4" />
            )}
            {fetching ? 'Fetching…' : rateLimitSeconds > 0 ? `Wait ${rateLimitSeconds}s` : 'Auto-fill'}
          </button>
        </div>
      </div>

      <Input
        id="definition"
        label="Definition"
        placeholder={form.entryType === 'PHRASE' ? 'What does it mean?' : 'The faculty of making happy and unexpected discoveries'}
        value={form.definition}
        onChange={set('definition')}
        textarea
      />

      {/* Dynamic example sentences */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Example Sentences</label>
        {sentences.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              value={s}
              onChange={(e) => setSentence(i, e.target.value)}
              placeholder={`Example ${i + 1}…`}
              rows={2}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {sentences.length > 1 && (
              <button
                type="button"
                onClick={() => removeSentence(i)}
                className="mt-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Remove sentence"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addSentence}
          className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add another sentence
        </button>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        {!showNewCat ? (
          <div className="flex gap-2">
            <select
              id="category"
              value={form.categoryId}
              onChange={set('categoryId')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCat(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 border border-primary-300
                         rounded-lg hover:bg-primary-50 transition-colors font-medium whitespace-nowrap"
            >
              <PlusIcon className="h-3.5 w-3.5" /> New
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name…"
              className="flex-1 rounded-lg border border-primary-400 px-3 py-2.5 text-sm shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="button" size="sm" loading={catSaving} onClick={handleCreateCategory}>
              Save
            </Button>
            <button
              type="button"
              onClick={() => { setShowNewCat(false); setNewCatName(''); }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        {categories.length === 0 && !showNewCat && (
          <p className="text-xs text-gray-400">No categories yet — click <strong>New</strong> to create one.</p>
        )}
      </div>

      <Input
        id="notes"
        label="Notes (optional)"
        placeholder="Personal mnemonics, etymology, context…"
        value={form.notes}
        onChange={set('notes')}
        textarea
      />

      <Input
        id="imageUrl"
        label="Image URL (optional)"
        placeholder="https://…"
        value={form.imageUrl}
        onChange={set('imageUrl')}
        type="url"
      />

      <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Save Changes' : `Add ${form.entryType === 'PHRASE' ? 'Phrase' : 'Word'}`}
        </Button>
      </div>
    </form>
  );
}

