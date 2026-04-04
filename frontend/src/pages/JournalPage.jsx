import React, { useState, useEffect, useCallback } from 'react';
import { journalService } from '../services/journalService';
import { wordService } from '../services/wordService';
import JournalEntryCard from '../components/journal/JournalEntryCard';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { MOOD_OPTIONS } from '../utils/constants';

const EMPTY_FORM = { title: '', content: '', mood: '', usedWordIds: [] };

/**
 * Journal page – list, create and edit personal reflections about vocabulary words.
 */
export default function JournalPage() {
  const [entries,    setEntries]    = useState([]);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [words,      setWords]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editEntry,  setEditEntry]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await journalService.getEntries({ page, size: 8 });
      setEntries(data.content);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load journal');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    wordService.getWords({ size: 200 })
      .then((d) => setWords(d.content))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      title:       entry.title,
      content:     entry.content,
      mood:        entry.mood || '',
      usedWordIds: entry.usedWords?.map((w) => w.id) || [],
    });
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
      fetchEntries();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const toggleWord = (id) => {
    setForm((f) => ({
      ...f,
      usedWordIds: f.usedWordIds.includes(id)
        ? f.usedWordIds.filter((w) => w !== id)
        : [...f.usedWordIds, id],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">Write reflections using your vocabulary words</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="h-4 w-4" /> New Entry
        </Button>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">✍️</p>
          <p className="text-gray-600 font-medium">No journal entries yet.</p>
          <p className="text-sm text-gray-400 mt-1">Start writing to practise your words in context.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => (
            <JournalEntryCard key={e.id} entry={e} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className="px-4 py-1.5 text-sm text-gray-600 font-medium">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editEntry ? 'Edit Entry' : 'New Journal Entry'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="j-title"
            label="Title *"
            placeholder="My thoughts on…"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          {/* Mood */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mood: f.mood === m.value ? '' : m.value }))}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors
                    ${form.mood === m.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="j-content"
            label="Content *"
            placeholder="Write your reflection or short story here…"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            textarea
          />

          {/* Word tags */}
          {words.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Words used in this entry
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {words.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWord(w.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                      ${form.usedWordIds.includes(w.id)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}
                  >
                    {w.word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editEntry ? 'Save Changes' : 'Create Entry'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
