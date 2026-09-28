import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { wordService } from '../services/wordService';
import { categoryService } from '../services/categoryService';
import { downloadWordsPdf, preparePdfExport } from '../utils/pdfExport';
import WordCard from '../components/words/WordCard';
import WordDetailModal from '../components/words/WordDetailModal';
import WordForm from '../components/words/WordForm';
import PdfExportPanel from '../components/common/PdfExportPanel';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon,
  AdjustmentsHorizontalIcon, XMarkIcon, CheckBadgeIcon,
  BookOpenIcon, ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { label: 'All',        value: '' },
  { label: '📖 Words',   value: 'WORD' },
  { label: '💬 Phrases', value: 'PHRASE' },
];

const SORT_OPTIONS = [
  { label: 'Newest first',   sortBy: 'createdAt',     sortDir: 'desc' },
  { label: 'Oldest first',   sortBy: 'createdAt',     sortDir: 'asc'  },
  { label: 'A → Z',          sortBy: 'word',          sortDir: 'asc'  },
  { label: 'Z → A',          sortBy: 'word',          sortDir: 'desc' },
  { label: 'Due soonest',    sortBy: 'nextReviewDate', sortDir: 'asc'  },
  { label: 'Hardest first',  sortBy: 'easeFactor',    sortDir: 'asc'  },
  { label: 'Most reviewed',  sortBy: 'repetitions',   sortDir: 'desc' },
];

const PAGE_SIZES = [12, 24, 48];

/**
 * My Words page – full-featured browse with sort, category filter,
 * mastery filter, grid/list toggle, page size selector and a stats bar.
 */
export default function WordsPage() {
  const [searchParams] = useSearchParams();
  const deepLinkWordId = searchParams.get('wordId');
  // ── Fetch state ────────────────────────────────────────────────────────
  const [words,         setWords]         = useState([]);
  const [stats,         setStats]         = useState(null);
  const [categories,    setCategories]    = useState([]);
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [exporting,     setExporting]     = useState(false);
  const [exportPageSize, setExportPageSize] = useState('A4');

  // ── Filter / sort state ────────────────────────────────────────────────
  const [page,       setPage]       = useState(0);
  const [pageSize,   setPageSize]   = useState(12);
  const [query,      setQuery]      = useState('');
  const [tab,        setTab]        = useState('');        // '' | 'WORD' | 'PHRASE'
  const [categoryId, setCategoryId] = useState(null);
  const [mastered,   setMastered]   = useState(null);     // null | true | false
  const [sortIdx,    setSortIdx]    = useState(0);        // index into SORT_OPTIONS
  const [viewMode,   setViewMode]   = useState('grid');   // 'grid' | 'list'
  const [coverDefinitions, setCoverDefinitions] = useState(false);
  const [smartView, setSmartView] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // ── Modal state ────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editWord,  setEditWord]  = useState(null);
  const [viewWord,  setViewWord]  = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────

  const { sortBy, sortDir } = SORT_OPTIONS[sortIdx];

  const fetchStats = useCallback(() => {
    wordService.getStats().then(setStats).catch(() => {});
  }, []);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wordService.getWords({
        page, size: pageSize, query, entryType: tab,
        categoryId, mastered, sortBy, sortDir,
      });
      setWords(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast.error('Failed to load words');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, tab, categoryId, mastered, sortBy, sortDir]);

  // Refetch without showing the loading spinner (used after CRUD so there's no flash)
  const silentFetch = useCallback(async () => {
    try {
      const data = await wordService.getWords({
        page, size: pageSize, query, entryType: tab,
        categoryId, mastered, sortBy, sortDir,
      });
      setWords(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch { /* silently ignore */ }
  }, [page, pageSize, query, tab, categoryId, mastered, sortBy, sortDir]);

  useEffect(() => { fetchWords(); }, [fetchWords]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);
  useEffect(() => {
    if (!deepLinkWordId) return;
    wordService.getWord(deepLinkWordId)
      .then(setViewWord)
      .catch(() => toast.error('That vocabulary card could not be opened.'));
  }, [deepLinkWordId]);

  // ── Filter helpers (reset page on any filter change) ──────────────────

  const handleTabChange      = (v) => { setTab(v);        setPage(0); };
  const handleSearch         = (e) => { setQuery(e.target.value); setPage(0); };
  const handleCategoryChange = (id) => { setCategoryId(id); setPage(0); };
  const handleMasteredToggle = (v) => { setMastered(v);  setPage(0); };
  const handleSortChange     = (idx) => { setSortIdx(idx); setPage(0); };
  const handlePageSizeChange = (s) => { setPageSize(s);  setPage(0); };
  const applySmartView = (view) => {
    setSmartView(view); setPage(0);
    if (view === 'due') { setMastered(false); setSortIdx(4); }
    else if (view === 'weak') { setMastered(false); setSortIdx(5); }
    else if (view === 'recent') { setMastered(null); setSortIdx(0); }
    else if (view === 'never') { setMastered(false); setSortIdx(0); }
    else { setMastered(null); setSortIdx(0); }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.matches('input, textarea, select')) return;
      if (event.key === '/') { event.preventDefault(); document.querySelector('[aria-label="Search words and phrases"]')?.focus(); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); openAdd(); }
      if (event.key.toLowerCase() === 'e' && words[0]) { event.preventDefault(); openEdit(words[0]); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const clearAllFilters = () => {
    setQuery(''); setTab(''); setCategoryId(null);
    setMastered(null); setSortIdx(0); setPage(0);
  };

  const hasActiveFilters = query || tab || categoryId !== null || mastered !== null || sortIdx !== 0;
  const advancedFilterCount = (categoryId !== null ? 1 : 0) + (mastered !== null ? 1 : 0) + (sortIdx !== 0 ? 1 : 0);

  // ── CRUD handlers ──────────────────────────────────────────────────────

  const openAdd  = () => { setEditWord(null); setModalOpen(true); };
  const openEdit = (word) => { setEditWord(word); setModalOpen(true); };
  const openView = (word) => setViewWord(word);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editWord) {
        const updated = await wordService.updateWord(editWord.id, payload);
        if (viewWord?.id === editWord.id) setViewWord(updated);
        toast.success('Word updated!');
      } else {
        await wordService.createWord(payload);
        toast.success('Word added!');
      }
      // Reconcile the list after every mutation so filters, pagination, and
      // server-derived fields never remain stale.
      await silentFetch();
      if (payload.saveAnother && !editWord) {
        setEditWord(null);
        setModalOpen(true);
      } else {
        setModalOpen(false);
      }
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save word');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Move this entry to trash? You can undo this action for a short time.')) return;
    const prevWords = words;
    setWords((prev) => prev.filter((w) => w.id !== id));
    if (viewWord?.id === id) setViewWord(null);
    try {
      await wordService.deleteWord(id);
      toast((t) => (
        <div className="flex items-center gap-3 text-sm">
          <span>Entry moved to trash.</span>
          <button type="button" className="font-bold text-[var(--mv-moss)] underline" onClick={async () => {
            await wordService.restoreWord(id);
            toast.dismiss(t.id);
            await silentFetch();
            toast.success('Entry restored.');
          }}>Undo</button>
        </div>
      ), { duration: 6000 });
      fetchStats();
      silentFetch(); // reconcile page counts
    } catch {
      setWords(prevWords);
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Move ${selectedIds.length} selected ${selectedIds.length === 1 ? 'entry' : 'entries'} to trash?`)) return;
    const ids = [...selectedIds];
    setWords((current) => current.filter((word) => !ids.includes(word.id)));
    setSelectedIds([]);
    try {
      await Promise.all(ids.map((id) => wordService.deleteWord(id)));
      toast((t) => <div className="flex items-center gap-3 text-sm"><span>{ids.length} entries moved to trash.</span><button type="button" className="font-bold text-[var(--mv-moss)] underline" onClick={async () => { await Promise.all(ids.map((id) => wordService.restoreWord(id))); toast.dismiss(t.id); await silentFetch(); toast.success('Entries restored.'); }}>Undo</button></div>, { duration: 7000 });
      fetchStats();
      silentFetch();
    } catch {
      setSelectedIds([]);
      await silentFetch();
      toast.error('Some entries could not be moved to trash.');
    }
  };

  const handleExportSelected = async () => {
    const selectedWords = words.filter((word) => selectedIds.includes(word.id));
    if (!selectedWords.length) return;
    setExporting(true);
    try {
      const pdfMake = await preparePdfExport();
      await downloadWordsPdf(selectedWords, pdfMake, exportPageSize);
      toast.success(`Exported ${selectedWords.length} selected entries`);
    } catch { toast.error('Could not export selected entries'); }
    finally { setExporting(false); }
  };

  const handleCreateCategory = async (name) => {
    const created = await categoryService.createCategory({ name, color: '#4f46e5' });
    setCategories((cs) => [...cs, created]);
    toast.success(`Category "${name}" created!`);
    return created;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [allWords, pdfMake] = await Promise.all([
        wordService.getAllWords(),
        preparePdfExport(),
      ]);
      if (!allWords.length) {
        toast('Your vocabulary is empty. Add some words or phrases first.');
        return;
      }
      await downloadWordsPdf(allWords, pdfMake, exportPageSize);
      toast.success(`Downloaded ${allWords.length} vocabulary entries`);
    } catch {
      toast.error('Could not download your vocabulary PDF');
    } finally {
      setExporting(false);
    }
  };

  // ── Active filter chips description ───────────────────────────────────

  const activeChips = [];
  if (tab)           activeChips.push({ label: tab === 'WORD' ? '📖 Words' : '💬 Phrases', clear: () => handleTabChange('') });
  if (categoryId)    activeChips.push({ label: categories.find(c => c.id === categoryId)?.name || 'Category', clear: () => handleCategoryChange(null) });
  if (mastered === true)  activeChips.push({ label: '✅ Mastered', clear: () => handleMasteredToggle(null) });
  if (mastered === false) activeChips.push({ label: '⏳ Not Mastered', clear: () => handleMasteredToggle(null) });
  if (sortIdx !== 0) activeChips.push({ label: `↕ ${SORT_OPTIONS[sortIdx].label}`, clear: () => handleSortChange(0) });
  if (query)         activeChips.push({ label: `🔍 "${query}"`, clear: () => { setQuery(''); setPage(0); } });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="sm:max-w-5xl sm:mx-auto space-y-4">

      {/* ── Header ── */}
      <PageHeader space="Learn" title="My Words" description="Your words and phrases, gathered in one calm, searchable place." action={<Button onClick={openAdd} className="!bg-[var(--mv-terracotta)] hover:!bg-[#984a36]"><PlusIcon className="h-4 w-4" /> Add entry</Button>} />

      {stats && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--mv-line)] pb-4 text-sm text-[var(--mv-ink-soft)]"><span><strong className="text-[var(--mv-ink)]">{stats.total}</strong> entries · <strong className="text-[var(--mv-moss)]">{stats.dueToday}</strong> due today</span>{stats.dueToday > 0 && <Button size="sm" onClick={() => window.location.assign('/practice')} className="!bg-[var(--mv-moss)] hover:!bg-[var(--mv-moss-dark)]">Practice due words</Button>}</div>}

      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-[var(--mv-radius-md)] border border-[var(--mv-line)] px-4 text-sm font-semibold text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><span>Export vocabulary</span><span className="text-xs group-open:rotate-180">⌄</span></summary>
        <div className="mt-2"><PdfExportPanel collection="vocabulary" pageSize={exportPageSize} onPageSizeChange={setExportPageSize} onDownload={handleExport} exporting={exporting} loading={loading} count={totalElements} /></div>
      </details>

      {/* ── Primary browse controls ── */}
      <section aria-label="Search and browse vocabulary" className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Entry type */}
        <div className="flex w-full flex-shrink-0 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900/60 sm:w-auto">
          {TYPE_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              aria-pressed={tab === value}
              className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap sm:flex-none
                ${tab === value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search word or definition…"
            value={query}
            onChange={handleSearch}
            aria-label="Search words and phrases"
            className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:bg-gray-900 dark:focus:ring-primary-900/40"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setPage(0); }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-start">
        {/* View toggle */}
        <div className="flex flex-shrink-0 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900/60">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-700 dark:text-primary-300' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'}`}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setViewMode('recall')} aria-pressed={viewMode === 'recall'} className={`min-h-10 rounded-xl border px-3 text-xs font-bold ${viewMode === 'recall' ? 'border-[var(--mv-moss)] bg-[var(--mv-moss)] text-white' : 'border-[var(--mv-line)] text-[var(--mv-ink-soft)]'}`}>Recall</button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-700 dark:text-primary-300' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'}`}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          aria-expanded={showFilters}
          aria-controls="word-filter-panel"
          onClick={() => setShowFilters((open) => !open)}
          className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${showFilters || advancedFilterCount > 0 ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          <span>Filters{advancedFilterCount > 0 ? ` · ${advancedFilterCount}` : ''}</span>
        </button>
        </div>
        </div>

        <div id="word-filter-panel" hidden={!showFilters} className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-700">
            {categories.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    aria-pressed={categoryId === null}
                    className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${categoryId === null ? 'border-gray-800 bg-gray-800 text-white dark:border-gray-200 dark:bg-gray-100 dark:text-gray-900' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                  >All categories</button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(categoryId === cat.id ? null : cat.id)}
                      aria-pressed={categoryId === cat.id}
                      className="min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                      style={categoryId === cat.id
                        ? { backgroundColor: cat.color || '#4f46e5', borderColor: cat.color || '#4f46e5', color: '#fff' }
                        : { color: cat.color || '#4f46e5', borderColor: `${cat.color || '#4f46e5'}55` }}
                    >{cat.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="word-mastery-filter" className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Learning status</label>
                <select
                  id="word-mastery-filter"
                  value={mastered === null ? 'all' : mastered ? 'mastered' : 'learning'}
                  onChange={(event) => handleMasteredToggle(event.target.value === 'all' ? null : event.target.value === 'mastered')}
                  className="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="all">All entries</option>
                  <option value="learning">Still learning</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>
              <div>
                <label htmlFor="word-sort" className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Sort by</label>
                <select id="word-sort" value={sortIdx} onChange={(event) => handleSortChange(Number(event.target.value))} className="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  {SORT_OPTIONS.map((opt, index) => <option key={opt.label} value={index}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="word-page-size" className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Entries per page</label>
                <select id="word-page-size" value={pageSize} onChange={(event) => handlePageSizeChange(Number(event.target.value))} className="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} entries</option>)}
                </select>
              </div>
            </div>
            {advancedFilterCount > 0 && (
              <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-gray-700">
                <button type="button" onClick={() => { handleCategoryChange(null); handleMasteredToggle(null); handleSortChange(0); }} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30">
                  Clear filters
                </button>
              </div>
            )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2" aria-label="Saved word views">
        {[['all', 'All'], ['due', 'Due now'], ['weak', 'Weak words'], ['recent', 'Recently added'], ['never', 'Never reviewed']].map(([value, label]) => <button key={value} type="button" onClick={() => applySmartView(value)} aria-pressed={smartView === value} className={`min-h-9 rounded-full border px-3 text-xs font-bold ${smartView === value ? 'border-[var(--mv-moss)] bg-[var(--mv-moss)] text-white' : 'border-[var(--mv-line)] text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]'}`}>{label}</button>)}
        {viewMode === 'recall' && <button type="button" onClick={() => setCoverDefinitions((value) => !value)} aria-pressed={coverDefinitions} className="min-h-9 rounded-full border border-[var(--mv-line)] px-3 text-xs font-bold text-[var(--mv-ink-soft)]">{coverDefinitions ? 'Show definitions' : 'Cover definitions'}</button>}
      </div>

        {viewMode !== 'list' && words.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--mv-radius-md)] border border-[var(--mv-line)] bg-[var(--mv-paper-deep)] px-4 py-3"><label className="flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--mv-ink-soft)]"><input type="checkbox" checked={words.length > 0 && words.every((word) => selectedIds.includes(word.id))} onChange={(event) => setSelectedIds(event.target.checked ? words.map((word) => word.id) : [])} className="h-4 w-4 accent-[var(--mv-moss)]" /> Select visible cards</label>{selectedIds.length > 0 ? <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-[var(--mv-ink)]">{selectedIds.length} selected</span><button type="button" onClick={handleExportSelected} className="min-h-10 rounded-lg border border-[var(--mv-line)] px-3 text-xs font-bold text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper)]">Export selected</button><button type="button" onClick={handleBulkDelete} className="min-h-10 rounded-lg border border-[var(--mv-terracotta)]/40 px-3 text-xs font-bold text-[var(--mv-terracotta)] hover:bg-[var(--mv-paper)]">Move to trash</button><button type="button" onClick={() => setSelectedIds([])} className="min-h-10 px-2 text-xs font-bold text-[var(--mv-ink-soft)]">Clear</button></div> : <span className="text-xs text-[var(--mv-ink-soft)]">Or click any card to select it</span>}</div>}

      {/* ── Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Filters:</span>
          {activeChips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {chip.label}
              <button onClick={chip.clear} aria-label={`Remove ${chip.label} filter`} className="ml-0.5 rounded-full p-0.5 hover:bg-primary-100 hover:text-primary-900 dark:hover:bg-primary-800">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Result count ── */}
      {!loading && words.length > 0 && (
        <p className="text-xs text-gray-400">
          Showing {words.length} of <strong className="text-gray-600">{totalElements}</strong> results
        </p>
      )}

      {/* ── Word grid / list ── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : words.length === 0 ? (
        <EmptyState query={query} tab={tab} hasFilters={hasActiveFilters} onAdd={openAdd} onClear={clearAllFilters} />
      ) : viewMode === 'grid' || viewMode === 'recall' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {words.map((w) => (
            <WordCard key={w.id} word={w} recallMode={viewMode === 'recall'} coverDefinitions={coverDefinitions} selected={selectedIds.includes(w.id)} onSelect={(checked) => setSelectedIds((ids) => checked ? [...ids, w.id] : ids.filter((id) => id !== w.id))} onEdit={openEdit} onDelete={handleDelete} onView={openView} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {words.map((w) => (
            <WordCard key={w.id} word={w} onEdit={openEdit} onDelete={handleDelete} onView={openView} compact />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </Button>
          <span className="px-3 py-1.5 text-sm text-gray-500 font-medium">
            {page + 1} / {totalPages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Next →
          </Button>
        </div>
      )}

      {/* ── Word detail slide-over ── */}
      {viewWord && (
        <WordDetailModal
          word={viewWord}
          onClose={() => setViewWord(null)}
          onEdit={(w) => { setViewWord(null); openEdit(w); }}
        />
      )}

      {/* ── Add/Edit modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editWord ? 'Edit Entry' : 'Add Word or Phrase'}
        size="lg"
      >
        <WordForm
          initial={editWord}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          onCreateCategory={handleCreateCategory}
          loading={saving}
        />
      </Modal>
    </div>
  );
}

// ── Small helper components ────────────────────────────────────────────────

function StatChip({ icon, label, value }) {
  const accent = {
    Total: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    Mastered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Words: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    Phrases: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  }[label] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3.5 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:px-4">
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold leading-none tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ query, tab, hasFilters, onAdd, onClear }) {
  const emoji = tab === 'PHRASE' ? '💬' : '📖';
  let message;
  if (query || hasFilters) {
    message = 'No entries match your current filters.';
  } else if (tab === 'PHRASE') {
    message = 'No phrases yet. Add your first one!';
  } else if (tab === 'WORD') {
    message = 'No words yet. Add your first one!';
  } else {
    message = 'Your library is empty. Start adding words!';
  }

  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-3">{emoji}</p>
      <p className="text-gray-600 font-medium mb-4">{message}</p>
      <div className="flex justify-center gap-3">
        {hasFilters && (
          <button onClick={onClear} className="text-sm text-gray-400 hover:text-gray-600 underline">
            Clear filters
          </button>
        )}
        <button onClick={onAdd} className="text-sm text-primary-600 hover:underline font-medium">
          + Add Entry
        </button>
      </div>
    </div>
  );
}

