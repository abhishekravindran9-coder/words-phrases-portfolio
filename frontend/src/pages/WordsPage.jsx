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
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const TABS = [
  { label: 'All',     value: '' },
  { label: '📖 Words',   value: 'WORD' },
  { label: '💬 Phrases', value: 'PHRASE' },
];

/**
 * My Words page – paginated list, search, filter tabs, add/edit/delete/view words.
 */
export default function WordsPage() {
  const [words,      setWords]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query,      setQuery]      = useState('');
  const [tab,        setTab]        = useState('');          // '' | 'WORD' | 'PHRASE'
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editWord,   setEditWord]   = useState(null);
  const [viewWord,   setViewWord]   = useState(null);        // detail panel

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wordService.getWords({ page, size: 12, query, entryType: tab });
      setWords(data.content);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load words');
    } finally {
      setLoading(false);
    }
  }, [page, query, tab]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const openAdd  = () => { setEditWord(null); setModalOpen(true); };
  const openEdit = (word) => { setEditWord(word); setModalOpen(true); };
  const openView = (word) => setViewWord(word);

  const handleTabChange = (value) => { setTab(value); setPage(0); };
  const handleSearch    = (e)     => { setQuery(e.target.value); setPage(0); };

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

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">My Words & Phrases</h1>
        <Button onClick={openAdd}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </div>

      {/* ── Filter tabs + Search row ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(({ label, value }) => (
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
        <div className="relative flex-1 w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* ── Word grid ── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : words.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">{tab === 'PHRASE' ? '💬' : '📖'}</p>
          <p className="text-gray-600 font-medium">
            {query
              ? 'No entries match your search.'
              : tab
              ? `No ${tab === 'PHRASE' ? 'phrases' : 'words'} yet. Add your first one!`
              : 'No entries yet. Add your first one!'}
          </p>
          <button
            onClick={openAdd}
            className="mt-4 text-sm text-primary-600 hover:underline font-medium"
          >
            + Add Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {words.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              onEdit={openEdit}
              onDelete={handleDelete}
              onView={openView}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </Button>
          <span className="px-4 py-1.5 text-sm text-gray-600 font-medium">
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
