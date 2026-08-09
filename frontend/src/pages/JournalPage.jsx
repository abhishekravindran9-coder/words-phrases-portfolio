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
  FunnelIcon, BarsArrowDownIcon, ListBulletIcon, CalendarIcon, FolderIcon,
  PencilIcon, Bars3Icon, TrashIcon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MOOD_OPTIONS } from '../utils/constants';

const EMPTY_FORM = { title: '', content: '', mood: '', articleUrl: '', articleTitle: '', category: '', usedWordIds: [] };
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
  const [viewMode,     setViewMode]     = useState('list'); // 'list', 'timeline', 'folders'
  const [localCategories, setLocalCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('journal-folders') || '[]'); } catch { return []; }
  }); // empty folders created in UI, persisted in localStorage
  const [newFolderName,  setNewFolderName]  = useState('');
  const [renamingFolder, setRenamingFolder] = useState(null); // name of folder currently being renamed
  const [renameValue,    setRenameValue]    = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [movingEntryId,  setMovingEntryId]  = useState(null); // id of card being moved to folder

  // Detect which vocab words appear in content (whole-word, case-insensitive)
  const detectWordsInContent = useCallback((content) => {
    if (!content.trim() || !words.length) return [];
    const text = content.toLowerCase();
    return words
      .filter((w) => {
        const escaped = w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
      })
      .map((w) => w.id);
  }, [words]);
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
    if (categoryFilter) result = result.filter((e) => (e.category || 'Uncategorized') === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result  = result.filter(
        (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q) || e.articleTitle?.toLowerCase().includes(q),
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

  const groupedEntries = useMemo(() => {
    const groups = {};
    // Seed local (empty) folders only when not filtering by a specific category
    if (!categoryFilter) {
      localCategories.forEach((cat) => { groups[cat] = []; });
    }
    filteredEntries.forEach((e) => {
      const cat = e.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return groups;
  }, [filteredEntries, localCategories, categoryFilter]);

  // All known categories: from entries + locally created empty folders
  const allCategories = useMemo(() => {
    const fromEntries = allEntries.map((e) => e.category).filter(Boolean);
    return [...new Set([...fromEntries, ...localCategories])].sort();
  }, [allEntries, localCategories]);

  const sortedCategories = useMemo(() => {
    const base = Object.keys(groupedEntries);
    // When filtering by category, only show matching folders — don't pad with unrelated empty folders
    const withLocal = categoryFilter
      ? base
      : [...new Set([...base, ...localCategories])].sort();
    const sorted = withLocal.filter((c) => c !== 'Uncategorized').sort();
    if (withLocal.includes('Uncategorized')) sorted.push('Uncategorized');
    return sorted;
  }, [groupedEntries, localCategories, categoryFilter]);

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

  const totalPages  = viewMode === 'list' ? Math.ceil(filteredEntries.length / PAGE_SIZE) : 1;
  const pageEntries = viewMode === 'list' ? filteredEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : filteredEntries;
  useEffect(() => { setPage(0); }, [search, moodFilter, sortBy, categoryFilter]);

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

  // Auto-detect vocab words when content changes
  useEffect(() => {
    if (!modalOpen) return;
    const detected = detectWordsInContent(form.content);
    setForm((f) => {
      // Merge: keep manually-toggled selections, add newly detected ones
      const merged = [...new Set([...detected, ...f.usedWordIds])];
      // Also remove any that were auto-detected before but are no longer in content
      // (only remove if they weren't in the original entry's saved words)
      const original = editEntry?.usedWords?.map((w) => w.id) ?? [];
      const kept = merged.filter((id) => detected.includes(id) || original.includes(id) || !f._autoDetected?.includes(id));
      return { ...f, usedWordIds: kept, _autoDetected: detected };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.content, modalOpen]);

  // CRUD
  const openCreate = () => {
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setWordSearch('');
    setModalOpen(true);
  };
  const openEdit = (entry) => {
    setEditEntry(entry);
    const savedWordIds = entry.usedWords?.map((w) => w.id) ?? [];
    setForm({
      title:        entry.title,
      content:      entry.content,
      mood:         entry.mood || '',
      articleUrl:   entry.articleUrl || '',
      articleTitle: entry.articleTitle || '',
      category:     entry.category || '',
      usedWordIds:  savedWordIds,
      _autoDetected: [],
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
    // Strip internal UI state before sending to API
    const { _autoDetected, ...payload } = form;
    try {
      if (editEntry) {
        const updated = await journalService.updateEntry(editEntry.id, payload);
        setAllEntries((prev) => prev.map((e) => e.id === editEntry.id ? updated : e));
        if (viewEntry?.id === editEntry.id) setViewEntry(updated);
        toast.success('Entry updated!');
      } else {
        const created = await journalService.createEntry(payload);
        setAllEntries((prev) => [created, ...prev]);
        setTotalEntries((n) => n + 1);
        toast.success('Entry created!');
      }
      setModalOpen(false);
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    const prevEntries = allEntries;
    setAllEntries((prev) => prev.filter((e) => e.id !== id));
    setTotalEntries((n) => n - 1);
    if (viewEntry?.id === id) setViewEntry(null);
    try {
      await journalService.deleteEntry(id);
      toast.success('Entry deleted');
    } catch {
      setAllEntries(prevEntries);
      setTotalEntries((n) => n + 1);
      toast.error('Failed to delete entry');
    }
  };
  // Move an entry to a folder — optimistic update so the card moves instantly, no page reload
  const moveToFolder = useCallback(async (entry, category) => {
    const newCategory = category === 'Uncategorized' ? '' : category;
    // 1. Snapshot for rollback
    const prevEntries = allEntries;
    // 2. Apply optimistic update immediately
    setAllEntries((prev) =>
      prev.map((e) => e.id === entry.id ? { ...e, category: newCategory } : e)
    );
    setMovingEntryId(entry.id);
    try {
      await journalService.updateEntry(entry.id, {
        title:        entry.title,
        content:      entry.content,
        mood:         entry.mood || '',
        articleUrl:   entry.articleUrl || '',
        articleTitle: entry.articleTitle || '',
        category:     newCategory,
        usedWordIds:  entry.usedWords?.map((w) => w.id) ?? [],
      });
      toast.success(category === 'Uncategorized' ? 'Removed from folder' : `Moved to "${category}"`, { duration: 2000 });
    } catch {
      // Rollback on failure
      setAllEntries(prevEntries);
      toast.error('Failed to move entry');
    } finally {
      setMovingEntryId(null);
    }
  }, [allEntries]);

  const saveLocalCategories = (cats) => {
    setLocalCategories(cats);
    localStorage.setItem('journal-folders', JSON.stringify(cats));
  };

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (allCategories.includes(name)) {
      toast.error(`Folder "${name}" already exists`);
      return;
    }
    saveLocalCategories([...localCategories, name]);
    setNewFolderName('');
    toast.success(`Folder "${name}" created — drag cards into it`);
  };

  const deleteFolder = (cat) => {
    const entriesToUpdate = allEntries.filter((e) => e.category === cat);
    // Optimistic: update state immediately
    setAllEntries((prev) => prev.map((e) => e.category === cat ? { ...e, category: '' } : e));
    saveLocalCategories(localCategories.filter((c) => c !== cat));
    toast.success(`Deleted folder "${cat}"`);
    // Background API updates (best-effort)
    Promise.all(entriesToUpdate.map((entry) =>
      journalService.updateEntry(entry.id, {
        title:        entry.title,
        content:      entry.content,
        mood:         entry.mood || '',
        articleUrl:   entry.articleUrl || '',
        articleTitle: entry.articleTitle || '',
        category:     '',
        usedWordIds:  entry.usedWords?.map((w) => w.id) ?? [],
      })
    )).catch(() => toast.error('Some entries may not have been unassigned — please refresh'));
  };

  const renameFolder = async (oldName, newName) => {
    const trimmed = newName.trim();
    setRenamingFolder(null);
    if (!trimmed || trimmed === oldName) return;
    if (allCategories.includes(trimmed)) {
      toast.error(`Folder "${trimmed}" already exists`);
      return;
    }
    const entriesToUpdate = allEntries.filter((e) => e.category === oldName);
    // Optimistic: update state immediately
    setAllEntries((prev) => prev.map((e) => e.category === oldName ? { ...e, category: trimmed } : e));
    saveLocalCategories(localCategories.map((c) => (c === oldName ? trimmed : c)));
    toast.success(`Renamed to "${trimmed}"`);
    // Background API updates with rollback on failure
    try {
      await Promise.all(entriesToUpdate.map((entry) =>
        journalService.updateEntry(entry.id, {
          title:        entry.title,
          content:      entry.content,
          mood:         entry.mood || '',
          articleUrl:   entry.articleUrl || '',
          articleTitle: entry.articleTitle || '',
          category:     trimmed,
          usedWordIds:  entry.usedWords?.map((w) => w.id) ?? [],
        })
      ));
    } catch {
      // Rollback
      setAllEntries((prev) => prev.map((e) => e.category === trimmed ? { ...e, category: oldName } : e));
      saveLocalCategories(localCategories);
      toast.error('Failed to rename folder');
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
  const isFiltered   = !!search.trim() || !!moodFilter || !!categoryFilter;

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
        <div className="flex gap-2">
          <Button onClick={openCreate} className="flex-shrink-0">
            <PlusIcon className="h-4 w-4" /> New Entry
          </Button>
        </div>
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
            emoji={dominantMoodMeta ? dominantMoodMeta.label.split(' ')[0] : '�'}
            label="Avg entry"
            value={`${avgWords} words`}
            sub={topWord ? `🏆 ${topWord}` : null}
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

      {/* ── View mode toggle ─────────────────────────────────── */}
      {!loading && allEntries.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">View:</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all
                ${viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-400 shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              <ListBulletIcon className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all
                ${viewMode === 'timeline'
                  ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-400 shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              <CalendarIcon className="h-4 w-4" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('folders')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all
                ${viewMode === 'folders'
                  ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-400 shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              <FolderIcon className="h-4 w-4" />
              Folders
            </button>
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

      {/* ── Category filter chips ────────────────────────────── */}
      {!loading && allCategories.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">📁 Category:</span>
          <button
            onClick={() => setCategoryFilter('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
              ${!categoryFilter
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter((f) => (f === cat ? '' : cat))}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors
                ${categoryFilter === cat
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
            >
              {cat}
            </button>
          ))}
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
            onClick={() => { setSearch(''); setMoodFilter(''); setCategoryFilter(''); }}
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

          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageEntries.map((e) => (
                <JournalEntryCard
                  key={e.id}
                  entry={e}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onView={setViewEntry}
                  allCategories={allCategories}
                  onMoveToFolder={moveToFolder}
                  isMoving={movingEntryId === e.id}
                />
              ))}
            </div>
          )}

          {viewMode === 'timeline' && (() => {
            const today     = new Date();
            const yesterday = new Date(Date.now() - 86400000);
            const groups    = {};
            const groupOrder = [];
            filteredEntries.forEach((e) => {
              const d = new Date(e.createdAt);
              let label;
              if (d.toDateString() === today.toDateString()) label = 'Today';
              else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
              else label = d.toLocaleDateString('en-US', {
                month: 'long', day: 'numeric',
                ...(d.getFullYear() !== today.getFullYear() && { year: 'numeric' }),
              });
              if (!groups[label]) { groups[label] = []; groupOrder.push(label); }
              groups[label].push(e);
            });
            return (
              <div className="space-y-8">
                {groupOrder.map((dateLabel) => (
                  <div key={dateLabel}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {dateLabel}
                      </span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                    </div>
                    <div className="space-y-4 pl-1">
                      {groups[dateLabel].map((e, i) => (
                        <div key={e.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                            {i < groups[dateLabel].length - 1 && (
                              <div className="w-0.5 flex-1 min-h-[1.5rem] bg-gray-200 dark:bg-gray-700 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <JournalEntryCard entry={e} onEdit={openEdit} onDelete={handleDelete} onView={setViewEntry} allCategories={allCategories} onMoveToFolder={moveToFolder} isMoving={movingEntryId === e.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {viewMode === 'folders' && (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const sourceCat = result.source.droppableId;
              const destCat   = result.destination.droppableId;
              if (sourceCat === destCat) return;
              const entry = filteredEntries.find(e => e.id.toString() === result.draggableId);
              if (entry) moveToFolder(entry, destCat);
            }}>
              {/* Inline folder creator */}
              <div className="flex items-center gap-2 mb-6">
                <FolderIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="New folder name…"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFolder(); } }}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button size="sm" onClick={addFolder} disabled={!newFolderName.trim()}>
                  + Create Folder
                </Button>
              </div>

              <div className="space-y-4">
                {sortedCategories.map((cat) => (
                  <Droppable key={cat} droppableId={cat}>
                    {(provided, snapshot) => (
                      <div className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden
                        ${snapshot.isDraggingOver
                          ? 'border-indigo-400 dark:border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-700'}`}>

                        {/* Folder header */}
                        <div className={`flex items-center gap-2 px-4 py-3 border-b transition-colors
                          ${snapshot.isDraggingOver
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700'
                            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'}`}>
                          <FolderIcon className={`h-4 w-4 flex-shrink-0 transition-colors ${snapshot.isDraggingOver ? 'text-indigo-500' : 'text-indigo-400'}`} />

                          {renamingFolder === cat ? (
                            <form
                              className="flex-1 flex gap-2"
                              onSubmit={(e) => { e.preventDefault(); renameFolder(cat, renameValue); }}
                            >
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFolder(null); }}
                                className="flex-1 px-2 py-1 text-sm rounded-lg border border-indigo-300 dark:border-indigo-600
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                           focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              <button type="submit" className="text-xs px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium">Save</button>
                              <button type="button" onClick={() => setRenamingFolder(null)} className="text-xs px-2.5 py-1 text-gray-500 hover:text-gray-700 rounded-lg">Cancel</button>
                            </form>
                          ) : (
                            <>
                              <span className={`text-sm font-semibold flex-1 transition-colors ${snapshot.isDraggingOver ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-100'}`}>
                                {cat}
                                <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                                  {groupedEntries[cat]?.length ?? 0} {(groupedEntries[cat]?.length ?? 0) === 1 ? 'entry' : 'entries'}
                                </span>
                              </span>
                              {cat !== 'Uncategorized' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setRenamingFolder(cat); setRenameValue(cat); }}
                                    title="Rename folder"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                  >
                                    <PencilIcon className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteFolder(cat)}
                                    title="Delete folder"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Drop zone — this is the actual Droppable target */}
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-3 min-h-[80px] transition-colors duration-200
                            ${snapshot.isDraggingOver
                              ? 'bg-indigo-50/60 dark:bg-indigo-900/10'
                              : 'bg-white dark:bg-gray-800'}`}
                        >
                          {/* Empty state */}
                          {(groupedEntries[cat]?.length ?? 0) === 0 && (
                            <div className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed transition-all
                              ${snapshot.isDraggingOver
                                ? 'border-indigo-400 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}>
                              {snapshot.isDraggingOver
                                ? <><span className="text-2xl mb-1">📂</span><span className="text-sm font-medium">Release to drop here</span></>
                                : <><span className="text-lg mb-1">📁</span><span className="text-xs">Drag cards here to organise</span></>
                              }
                            </div>
                          )}

                          {/* Cards grid */}
                          {(groupedEntries[cat]?.length ?? 0) > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {groupedEntries[cat].map((e, index) => (
                                <Draggable key={e.id} draggableId={e.id.toString()} index={index}>
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      className={`transition-transform duration-150 ${dragSnapshot.isDragging ? 'rotate-1 scale-105 shadow-2xl z-50' : ''}`}
                                    >
                                      {/* Drag handle bar */}
                                      <div
                                        {...dragProvided.dragHandleProps}
                                        className="flex items-center justify-center gap-1.5 py-1.5 mb-1.5 rounded-lg
                                                   cursor-grab active:cursor-grabbing select-none
                                                   bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-900/40
                                                   text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400
                                                   border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700
                                                   transition-colors"
                                        title="Drag to move to another folder"
                                      >
                                        <Bars3Icon className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium">hold &amp; drag to move</span>
                                      </div>
                                      <JournalEntryCard
                                        entry={e}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                        onView={setViewEntry}
                                        allCategories={allCategories}
                                        onMoveToFolder={moveToFolder}
                                        isMoving={movingEntryId === e.id}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
        </>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {viewMode === 'list' && totalPages > 1 && (
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

          {/* Article URL */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Article URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/article"
              value={form.articleUrl}
              onChange={(e) => setForm((f) => ({ ...f, articleUrl: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Article Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Article Title (optional)
            </label>
            <input
              type="text"
              placeholder="Title of the article"
              value={form.articleTitle}
              onChange={(e) => setForm((f) => ({ ...f, articleTitle: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category (optional)
            </label>
            <input
              type="text"
              list="journal-categories"
              placeholder="e.g. Tech, Politics, Fiction…"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <datalist id="journal-categories">
              {allCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Type a new category or pick an existing one
            </p>
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
                  {form._autoDetected?.length > 0 && (
                    <span className="ml-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" title="Auto-detected from your content">
                      ✨ {form._autoDetected.length} auto-detected
                    </span>
                  )}
                  {form.usedWordIds.filter(id => !form._autoDetected?.includes(id)).length > 0 && (
                    <span className="ml-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                      +{form.usedWordIds.filter(id => !form._autoDetected?.includes(id)).length} manual
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
                  filteredWords.map((w) => {
                    const isSelected  = form.usedWordIds.includes(w.id);
                    const isAutoFound = form._autoDetected?.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWord(w.id)}
                        title={isAutoFound ? `"${w.word}" found in your content` : undefined}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all
                          ${isSelected && isAutoFound
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}
                      >
                        {isAutoFound && isSelected && <span className="mr-0.5 opacity-80">✨</span>}
                        {w.word}
                      </button>
                    );
                  })
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
