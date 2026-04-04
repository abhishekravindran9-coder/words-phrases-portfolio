import React, { useState, useEffect, useCallback } from 'react';
import { wordService } from '../services/wordService';
import { categoryService } from '../services/categoryService';
import WordCard from '../components/words/WordCard';
import WordForm from '../components/words/WordForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * My Words page – paginated list, search, add/edit/delete words.
 */
export default function WordsPage() {
  const [words,      setWords]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editWord,   setEditWord]   = useState(null);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wordService.getWords({ page, size: 12, query });
      setWords(data.content);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load words');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const openAdd  = () => { setEditWord(null); setModalOpen(true); };
  const openEdit = (word) => { setEditWord(word); setModalOpen(true); };

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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">My Words & Phrases</h1>
        <Button onClick={openAdd}>
          <PlusIcon className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search words…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Word grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : words.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">📝</p>
          <p className="text-gray-600 font-medium">
            {query ? 'No words match your search.' : 'No words yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {words.map((w) => (
            <WordCard key={w.id} word={w} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
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

      {/* Add/Edit modal */}
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
