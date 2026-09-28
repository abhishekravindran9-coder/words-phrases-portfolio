import React, { useEffect, useState } from 'react';
import { XMarkIcon, PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from './Button';
import { wordService } from '../../services/wordService';
import { BRAND } from '../../utils/brand';

export default function QuickAddSheet({ isOpen, onClose, onCreated }) {
  const [word, setWord] = useState('');
  const [entryType, setEntryType] = useState('WORD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => document.getElementById('quick-add-word')?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!word.trim()) return;
    setSaving(true);
    try {
      const created = await wordService.createWord({ word: word.trim(), entryType });
      toast.success(`${created.word} is safely tucked away.`);
      setWord('');
      onCreated?.(created);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add that entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
      <button type="button" aria-label="Close quick add" className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl animate-slide-up rounded-t-[1.5rem] border border-[var(--mv-line)] bg-[var(--mv-paper)] p-5 shadow-2xl sm:bottom-6 sm:rounded-[1.5rem] sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--mv-moss)]">Add to {BRAND.name}</p>
            <h2 id="quick-add-title" className="mv-display mt-1 text-2xl text-[var(--mv-ink)]">Keep a new word close.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close quick add" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--mv-ink)]">Word or phrase</span>
            <input id="quick-add-word" value={word} onChange={(event) => setWord(event.target.value)} placeholder="e.g. mellifluous" className="min-h-12 w-full rounded-[var(--mv-radius-md)] border border-[var(--mv-line)] bg-transparent px-4 text-base text-[var(--mv-ink)] placeholder:text-[var(--mv-ink-soft)] focus:border-[var(--mv-moss)] focus:outline-none focus:ring-2 focus:ring-[var(--mv-moss)]/20" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['WORD', 'PHRASE'].map((type) => (
              <button key={type} type="button" onClick={() => setEntryType(type)} aria-pressed={entryType === type} className={`flex min-h-11 items-center justify-center gap-2 rounded-[var(--mv-radius-sm)] border text-sm font-semibold transition-colors ${entryType === type ? 'border-[var(--mv-moss)] bg-[var(--mv-moss)] text-white' : 'border-[var(--mv-line)] text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]'}`}>
                <BookOpenIcon className="h-4 w-4" /> {type === 'WORD' ? 'Word' : 'Phrase'}
              </button>
            ))}
          </div>
          <Button type="submit" loading={saving} className="min-h-12 w-full justify-center !rounded-[var(--mv-radius-md)] !bg-[var(--mv-moss)] hover:!bg-[var(--mv-moss-dark)]">
            <PlusIcon className="h-5 w-5" /> Add to {BRAND.name}
          </Button>
        </form>
      </div>
    </div>
  );
}
