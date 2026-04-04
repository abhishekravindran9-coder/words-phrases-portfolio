import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { journalService } from '../services/journalService';
import { wordService } from '../services/wordService';
import JournalEntryCard from '../components/journal/JournalEntryCard';
import JournalEntryViewer from '../components/journal/JournalEntryViewer';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';
import { MOOD_OPTIONS } from '../utils/constants';

const EMPTY_FORM = { title: '', content: '', mood: '', usedWordIds: [] };
const PAGE_SIZE   = 8;

function wc(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

/**
 * Journal page — list, create, edit and read personal reflections.
 * Features: search, mood filter, stats bar, full-entry slide-over viewer,
 * rich editor with word count and vocabulary word picker.
 */
export default function JournalPage() {
  const [allEntries,   setAllEntries]   = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [words,        setWords]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editEntry,    setEditEntry]    = useState(null);
  const [viewEntry,    setViewEntry]    = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [wordSearch,   setWordSearch]   = useState('');
  const [search,       setSearch]       = useState('');
  const [moodFilter,   setMoodFilter]   = useState('');
  const [page,         setPage]         = useState(0);
  const contentRef = useRef(null);

  // ── Load all entries (client-side filter + paginate below) ────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await journalService.getEntries({ page: 0, size: 100 });
      setAllEntries(data.content ?? []);
      setTotalEntries(data.totalElements ?? 0);
    } catch {
      toast.error('Failed to load journal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    wordService.getWords({ size: 200 }).then((d) => setWords(d.content ?? [])).catch(() => {});
  }, []);

  // ── Client-side filter + paginate ─────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    let result = allEntries;
    if (moodFilter) result = result.filter((e) => e.mood === moodFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result  = result.filter(
        (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allEntries, search, moodFilter]);

  const totalPages  = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pageEntries = filteredEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, moodFilter]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalWords = useMemo(
    () => allEntries.reduce((sum, e) => sum + wc(e.content), 0),
    [allEntries],
  );

  const topWord = useMemo(() => {
    const counts = {};
    allEntries.forEach((e) =>
      e.usedWords?.forEach((w) => { counts[w.word] = (counts[w.word] ?? 0) + 1; }),
    );
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  }, [allEntries]);

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [form.content]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setWordSearch('');
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      title:       entry.title,
      content:     entry.content,
      mood:        entry.mood || '',
      usedWordIds: entry.usedWords?.map((w) => w.id) ?? [],
    });
    setWordSearch('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      if (editEntry) {
        await journalService.updateEntry(editEntry.id, form);
        toast.success('Entry updated!');
      } else {
        await journalService.createEntry(form);
        toast.success('Entry created!');
      }
      setModalOpen(false);
      fetchEntries();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await journalService.deleteEntry(id);
      toast.success('Entry deleted');
      if (viewEntry?.id === id) setViewEntry(null);
      fetchEntries();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const toggleWord = (id) =>
    setForm((f) => ({
      ...f,
      usedWordIds: f.usedWordIds.includes(id)
        ? f.usedWordIds.filter((x) => x !== id)
        : [...f.usedWordIds, id],
    }));

  const filteredWords = words.filter(
    (w) => !wordSearch || w.word.toLowerCase().includes(wordSearch.toLowerCase()),
  );

  const contentWc    = wc(form.content);
  const contentChars = form.content.length;
  const isFiltered   = !!search.trim() || !!moodFilter;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            📔 Journal
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Reflect and practise vocabulary in context
          </p>
        </div>
        <Button onClick={openCreate} className="flex-shrink-0">
          <PlusIcon className="h-4 w-4" /> New Entry
        </Button>
      </div>

      {/* ── Stats bar ───────────────────────────────────────── */}
      {!loading && allEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatChip label="Total entries"   value={totalEntries} />
          <StatChip label="Words written"   value={totalWords.toLocaleString()} />
          <StatChip label="Top vocab word"  value={topWord ?? '—'} mono={!!topWord} />
        </div>
      )}

      {/* ── Search + mood filter ─────────────────────────────── */}
      {!loading && allEntries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search entries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mood filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setMoodFilter('')}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                ${!moodFilter
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600'}`}
            >
              All
            </button>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMoodFilter((f) => (f === m.value ? '' : m.value))}
                title={m.label}
                className={`text-sm px-2.5 py-1.5 rounded-full border transition-colors
                  ${moodFilter === m.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600'}`}
              >
                {m.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Entry grid ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : allEntries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">✍️</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">No journal entries yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start writing to practise your vocabulary in real sentences.
          </p>
          <div className="mt-6">
            <Button onClick={openCreate}>
              <PlusIcon className="h-4 w-4" /> Write your first entry
            </Button>
          </div>
        </div>
      ) : pageEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No entries match your filters.</p>
          <button
            onClick={() => { setSearch(''); setMoodFilter(''); }}
            className="mt-3 text-xs text-primary-600 dark:text-primary-400 underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {isFiltered && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageEntries.map((e) => (
              <JournalEntryCard
                key={e.id}
                entry={e}
                onEdit={openEdit}
                onDelete={handleDelete}
                onView={setViewEntry}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >← Prev</Button>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium px-3">
            {page + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >Next →</Button>
        </div>
      )}

      {/* ── Full-entry viewer (slide-over) ───────────────────── */}
      {viewEntry && (
        <JournalEntryViewer
          entry={viewEntry}
          onClose={() => setViewEntry(null)}
          onEdit={(entry) => { setViewEntry(null); openEdit(entry); }}
        />
      )}

      {/* ── Create / Edit modal ──────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEntry ? '✏️ Edit Entry' : '📔 New Journal Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="My thoughts on…"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mood: f.mood === m.value ? '' : m.value }))}
                  className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all
                    ${form.mood === m.value
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content with auto-grow + word count */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              ref={contentRef}
              placeholder="Write your reflection, short story, or observations using your vocabulary words…"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 leading-relaxed"
              style={{ minHeight: '140px' }}
            />
            {contentWc > 0 && (
              <p className="text-right text-xs text-gray-400 dark:text-gray-500">
                {contentWc} word{contentWc !== 1 ? 's' : ''} · {contentChars} chars
              </p>
            )}
          </div>

          {/* Vocabulary word picker */}
          {words.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <BookOpenIcon className="h-4 w-4 text-primary-500" />
                  Vocabulary words used
                  {form.usedWordIds.length > 0 && (
                    <span className="ml-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                      {form.usedWordIds.length} selected
                    </span>
                  )}
                </label>
                {form.usedWordIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, usedWordIds: [] }))}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Word search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter words…"
                  value={wordSearch}
                  onChange={(e) => setWordSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Scrollable word pills */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-0.5">
                {filteredWords.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    No words match "{wordSearch}"
                  </p>
                ) : (
                  filteredWords.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWord(w.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all
                        ${form.usedWordIds.includes(w.id)
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600'}`}
                    >
                      {w.word}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editEntry ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/** Small stat tile for the stats bar */
function StatChip({ label, value, mono }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 text-center shadow-sm">
      <p className={`font-extrabold text-gray-800 dark:text-gray-100 leading-tight ${mono ? 'text-sm font-mono' : 'text-xl'}`}>
        {value}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}

