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
  FunnelIcon, BarsArrowDownIcon,
} from '@heroicons/react/24/outline';
import { MOOD_OPTIONS } from '../utils/constants';

const EMPTY_FORM = { title: '', content: '', mood: '', usedWordIds: [] };
const PAGE_SIZE  = 6;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'longest', label: 'Most words' },
  { value: 'shortest', label: 'Fewest words' },
];

function wc(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

// Compute writing streak (consecutive days with at least one entry)
function computeStreak(entries) {
  if (!entries.length) return 0;
  const days = [...new Set(
    entries.map((e) => new Date(e.createdAt).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));
  const today    = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/**
 * Journal page — list, create, edit and read personal reflections.
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
  const [sortBy,       setSortBy]       = useState('newest');
  const [showSort,     setShowSort]     = useState(false);
  const [page,         setPage]         = useState(0);
  const contentRef = useRef(null);

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

  // Client-side filter + sort + paginate
  const filteredEntries = useMemo(() => {
    let result = allEntries;
    if (moodFilter) result = result.filter((e) => e.mood === moodFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result  = result.filter(
        (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'oldest')   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'longest')  return wc(b.content) - wc(a.content);
      if (sortBy === 'shortest') return wc(a.content) - wc(b.content);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });
    return result;
  }, [allEntries, search, moodFilter, sortBy]);

  const totalPages  = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pageEntries = filteredEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  useEffect(() => { setPage(0); }, [search, moodFilter, sortBy]);

  // Stats
  const totalWords = useMemo(
    () => allEntries.reduce((sum, e) => sum + wc(e.content), 0), [allEntries],
  );
  const avgWords = allEntries.length ? Math.round(totalWords / allEntries.length) : 0;
  const streak   = useMemo(() => computeStreak(allEntries), [allEntries]);

  const topWord = useMemo(() => {
    const counts = {};
    allEntries.forEach((e) =>
      e.usedWords?.forEach((w) => { counts[w.word] = (counts[w.word] ?? 0) + 1; }),
    );
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  }, [allEntries]);

  const moodCounts = useMemo(() => {
    const c = {};
    allEntries.forEach((e) => { if (e.mood) c[e.mood] = (c[e.mood] ?? 0) + 1; });
    return c;
  }, [allEntries]);
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const dominantMoodMeta = MOOD_OPTIONS.find((m) => m.value === dominantMood);

  // Auto-grow textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [form.content]);

  // CRUD
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
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────────── */}
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

      {/* ── Rich stats bar ───────────────────────────────────── */}
      {!loading && allEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            emoji="📝"
            label="Entries"
            value={totalEntries}
          />
          <StatCard
            emoji="✍️"
            label="Words written"
            value={totalWords.toLocaleString()}
          />
          <StatCard
            emoji="🔥"
            label="Day streak"
            value={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''}` : '—'}
            highlight={streak >= 3}
          />
          <StatCard
            emoji={dominantMoodMeta ? dominantMoodMeta.label.split(' ')[0] : '💡'}
            label="Avg entry"
            value={`${avgWords} words`}
            sub={dominantMood ? `Mostly ${dominantMoodMeta?.label.split(' ').slice(1).join(' ')}` : null}
          />
        </div>
      )}

      {/* ── Mood breakdown bar ───────────────────────────────── */}
      {!loading && allEntries.length > 2 && Object.keys(moodCounts).length > 0 && (
        <MoodBreakdownBar moodCounts={moodCounts} total={allEntries.length} />
      )}

      {/* ── Search + filter row ──────────────────────────────── */}
      {!loading && allEntries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search entries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort((s) => !s)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400
                         hover:border-primary-400 transition-colors whitespace-nowrap"
            >
              <BarsArrowDownIcon className="h-4 w-4" />
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
            </button>
            {showSort && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-10 py-1">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setSortBy(o.value); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors
                      ${sortBy === o.value
                        ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mood filter chips ────────────────────────────────── */}
      {!loading && allEntries.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mr-1">
            <FunnelIcon className="h-3.5 w-3.5" /> Mood:
          </span>
          <button
            onClick={() => setMoodFilter('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
              ${!moodFilter
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
          >
            All
          </button>
          {MOOD_OPTIONS.map((m) => {
            const count = moodCounts[m.value] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={m.value}
                onClick={() => setMoodFilter((f) => (f === m.value ? '' : m.value))}
                title={`${m.label} (${count})`}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-colors
                  ${moodFilter === m.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
              >
                {m.label.split(' ')[0]}
                <span className={`text-[10px] ${moodFilter === m.value ? 'opacity-80' : 'opacity-50'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Entry grid ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : allEntries.length === 0 ? (
        <EmptyJournal onWrite={openCreate} />
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
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                  ${i === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}

      {/* ── Full-entry viewer ────────────────────────────────── */}
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
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              How are you feeling?
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mood: f.mood === m.value ? '' : m.value }))}
                  className={`text-sm px-3 py-2 rounded-xl border font-medium transition-all
                    ${form.mood === m.value
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm scale-105'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
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
                         placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 leading-relaxed"
              style={{ minHeight: '140px' }}
            />
            <div className="flex items-center justify-between">
              {contentWc > 0 ? (
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{contentWc} word{contentWc !== 1 ? 's' : ''}</span>
                  <span className="opacity-40">·</span>
                  <span>{contentChars} chars</span>
                  <span className="opacity-40">·</span>
                  <span>~{Math.max(1, Math.ceil(contentWc / 200))} min read</span>
                </div>
              ) : <span />}
              {contentWc >= 50 && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Great length!</span>
              )}
            </div>
          </div>

          {/* Vocabulary word picker */}
          {words.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <BookOpenIcon className="h-4 w-4 text-primary-500" />
                  Vocabulary used
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
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear all
                  </button>
                )}
              </div>
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
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-0.5">
                {filteredWords.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No words match "{wordSearch}"</p>
                ) : (
                  filteredWords.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWord(w.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all
                        ${form.usedWordIds.includes(w.id)
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
                    >
                      {w.word}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {editEntry ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

const MOOD_BAR_COLOR = {
  excited:    'bg-amber-400',
  happy:      'bg-yellow-400',
  motivated:  'bg-green-400',
  neutral:    'bg-gray-300',
  challenged: 'bg-blue-400',
  tired:      'bg-purple-400',
};

function StatCard({ emoji, label, value, sub, highlight }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-2xl px-4 py-4 shadow-sm transition-all
      ${highlight
        ? 'border-orange-200 dark:border-orange-800 ring-1 ring-orange-100 dark:ring-orange-900/30'
        : 'border-gray-100 dark:border-gray-700'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl leading-none">{emoji}</span>
        <p className={`font-extrabold leading-tight ${
          highlight ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-100'
        } ${String(value).length > 6 ? 'text-base' : 'text-xl'}`}>
          {value}
        </p>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function MoodBreakdownBar({ moodCounts, total }) {
  const segments = MOOD_OPTIONS
    .filter((m) => moodCounts[m.value])
    .map((m) => ({ ...m, count: moodCounts[m.value], pct: (moodCounts[m.value] / total) * 100 }));

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        Mood distribution
      </p>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {segments.map((s) => (
          <div
            key={s.value}
            className={`${MOOD_BAR_COLOR[s.value]} transition-all`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label}: ${s.count} entr${s.count !== 1 ? 'ies' : 'y'}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {segments.map((s) => (
          <span key={s.value} className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            <span className={`inline-block w-2 h-2 rounded-full ${MOOD_BAR_COLOR[s.value]}`} />
            {s.label.split(' ')[0]} {s.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyJournal({ onWrite }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">✍️</div>
      <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">
        Your journal awaits
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
        Write about things you've read, thoughts you want to remember, or practise using your vocabulary words in real sentences.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Button onClick={onWrite}>
          <PlusIcon className="h-4 w-4" /> Write your first entry
        </Button>
        <p className="text-xs text-gray-300 dark:text-gray-600">Takes less than 2 minutes</p>
      </div>
    </div>
  );
}
