import React, { useState, useEffect, useCallback } from 'react';
import { wordService } from '../services/wordService';
import { categoryService } from '../services/categoryService';
import WordCard from '../components/words/WordCard';
import WordDetailModal from '../components/words/WordDetailModal';
import WordForm from '../components/words/WordForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon,
  AdjustmentsHorizontalIcon, XMarkIcon, CheckBadgeIcon,
  BookOpenIcon, ChatBubbleLeftRightIcon, AcademicCapIcon,
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
  // ── Fetch state ────────────────────────────────────────────────────────
  const [words,         setWords]         = useState([]);
  const [stats,         setStats]         = useState(null);
  const [categories,    setCategories]    = useState([]);
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,       setLoading]       = useState(true);

  // ── Filter / sort state ────────────────────────────────────────────────
  const [page,       setPage]       = useState(0);
  const [pageSize,   setPageSize]   = useState(12);
  const [query,      setQuery]      = useState('');
  const [tab,        setTab]        = useState('');        // '' | 'WORD' | 'PHRASE'
  const [categoryId, setCategoryId] = useState(null);
  const [mastered,   setMastered]   = useState(null);     // null | true | false
  const [sortIdx,    setSortIdx]    = useState(0);        // index into SORT_OPTIONS
  const [viewMode,   setViewMode]   = useState('grid');   // 'grid' | 'list'

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

  useEffect(() => { fetchWords(); }, [fetchWords]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // ── Filter helpers (reset page on any filter change) ──────────────────

  const handleTabChange      = (v) => { setTab(v);        setPage(0); };
  const handleSearch         = (e) => { setQuery(e.target.value); setPage(0); };
  const handleCategoryChange = (id) => { setCategoryId(id); setPage(0); };
  const handleMasteredToggle = (v) => { setMastered(v);  setPage(0); };
  const handleSortChange     = (idx) => { setSortIdx(idx); setPage(0); };
  const handlePageSizeChange = (s) => { setPageSize(s);  setPage(0); };

  const clearAllFilters = () => {
    setQuery(''); setTab(''); setCategoryId(null);
    setMastered(null); setSortIdx(0); setPage(0);
  };

  const hasActiveFilters = query || tab || categoryId !== null || mastered !== null || sortIdx !== 0;

  // ── CRUD handlers ──────────────────────────────────────────────────────

  const openAdd  = () => { setEditWord(null); setModalOpen(true); };
  const openEdit = (word) => { setEditWord(word); setModalOpen(true); };
  const openView = (word) => setViewWord(word);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editWord) {
        await wordService.updateWord(editWord.id, payload);
        toast.success('Word updated!');
      } else {
        await wordService.createWord(payload);
        toast.success('Word added!');
      }
      setModalOpen(false);
      fetchWords();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save word');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this word?')) return;
    try {
      await wordService.deleteWord(id);
      toast.success('Word deleted');
      if (viewWord?.id === id) setViewWord(null);
      fetchWords();
      fetchStats();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCreateCategory = async (name) => {
    const created = await categoryService.createCategory({ name, color: '#4f46e5' });
    setCategories((cs) => [...cs, created]);
    toast.success(`Category "${name}" created!`);
    return created;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">My Vault</h1>
        <Button onClick={openAdd}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </div>

      {/* ── Stats bar ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip
            icon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
            label="Total"
            value={stats.total}
            color="bg-primary-50 text-primary-700 border-primary-100"
          />
          <StatChip
            icon={<CheckBadgeIcon className="h-4 w-4" />}
            label="Mastered"
            value={stats.mastered}
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
          />
          <StatChip
            icon={<BookOpenIcon className="h-4 w-4" />}
            label="Words"
            value={stats.words}
            color="bg-blue-50 text-blue-700 border-blue-100"
          />
          <StatChip
            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            label="Phrases"
            value={stats.phrases}
            color="bg-purple-50 text-purple-700 border-purple-100"
          />
        </div>
      )}

      {/* ── Toolbar row 1: type tabs + search + view toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Type tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
          {TYPE_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${tab === value
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-800'}`}
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
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setPage(0); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
            title="Grid view"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
            title="List view"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Toolbar row 2: category chips + mastery + sort + page size ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors
                ${categoryId === null
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
            >
              All cats
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(categoryId === cat.id ? null : cat.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors
                  ${categoryId === cat.id ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                style={categoryId === cat.id
                  ? { backgroundColor: cat.color || '#4f46e5', borderColor: cat.color || '#4f46e5', color: '#fff' }
                  : { color: cat.color || '#4f46e5' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {categories.length > 0 && <div className="w-px h-5 bg-gray-200 hidden sm:block" />}

        {/* Mastery 3-way toggle */}
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
          {[
            { v: null,  label: 'All'       },
            { v: false, label: '⏳ To Learn' },
            { v: true,  label: '✅ Mastered' },
          ].map(({ v, label }) => (
            <button
              key={String(v)}
              onClick={() => handleMasteredToggle(v)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap
                ${mastered === v
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortIdx}
          onChange={(e) => handleSortChange(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
      </div>

      {/* ── Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Filters:</span>
          {activeChips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700
                         border border-primary-100 rounded-full px-2.5 py-0.5 font-medium"
            >
              {chip.label}
              <button onClick={chip.clear} className="ml-0.5 hover:text-primary-900">
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {words.map((w) => (
            <WordCard key={w.id} word={w} onEdit={openEdit} onDelete={handleDelete} onView={openView} />
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

function StatChip({ icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${color}`}>
      <span className="flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-xl font-extrabold leading-none">{value}</p>
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

