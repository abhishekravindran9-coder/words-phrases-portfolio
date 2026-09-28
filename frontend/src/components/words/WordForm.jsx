import React, { useEffect, useState } from 'react';
import { ChevronDownIcon, PlusIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import Input from '../common/Input';
import enrichService from '../../services/enrichService';

const blank = { entryType: 'WORD', word: '', definition: '', categoryId: '', notes: '', imageUrl: '', difficultyTier: '', sourceContext: '', userExample: '', userMnemonic: '' };

export default function WordForm({ initial = null, categories = [], onSubmit, onCancel, onCreateCategory, loading }) {
  const [form, setForm] = useState(blank);
  const [sentences, setSentences] = useState(['']);
  const [fetching, setFetching] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [duplicateMatches, setDuplicateMatches] = useState([]);

  useEffect(() => {
    if (!initial) { setForm(blank); setSentences(['']); return; }
    setForm({ ...blank, ...initial, categoryId: initial.categoryId ? String(initial.categoryId) : '' });
    const examples = (initial.exampleSentence || '').split('\n\n').filter(Boolean);
    setSentences(examples.length ? examples : ['']);
  }, [initial]);

  useEffect(() => {
    if (!form.word.trim()) { setDuplicateMatches([]); return undefined; }
    const timer = setTimeout(() => import('../../services/wordService').then(({ wordService }) => wordService.findDuplicates(form.word, form.entryType, initial?.id).then(setDuplicateMatches).catch(() => setDuplicateMatches([]))), 300);
    return () => clearTimeout(timer);
  }, [form.word, form.entryType, initial?.id]);

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const enrich = async () => {
    if (!form.word.trim() || fetching) return;
    setFetching(true);
    try {
      const result = form.entryType === 'WORD' ? await enrichService.enrichWord(form.word) : await enrichService.enrichPhrase(form.word);
      setForm((current) => ({ ...current, definition: result.definition || current.definition, notes: result.notes || current.notes, difficultyTier: result.difficultyTier || current.difficultyTier, partOfSpeech: result.partOfSpeech || current.partOfSpeech }));
      if (result.examples?.length) setSentences(result.examples.filter(Boolean));
      toast.success('AI suggestions are ready for review.');
    } catch (error) { toast.error(error.message || 'AI could not enrich this entry. You can still save it manually.'); }
    finally { setFetching(false); }
  };
  const submit = (event, saveAnother = false) => {
    event?.preventDefault();
    onSubmit({ ...form, exampleSentence: sentences.filter(Boolean).join('\n\n'), categoryId: form.categoryId ? Number(form.categoryId) : null, difficultyTier: form.difficultyTier || null, saveAnother });
  };
  const submitBulk = () => {
    const entries = bulkText.split(/\n|,/).map((value) => value.trim()).filter(Boolean);
    if (!entries.length) return;
    setBulkOpen(false);
    setForm((current) => ({ ...current, word: entries[0] }));
    toast.success(`${entries.length} entries queued for review one at a time.`);
  };

  return <form onSubmit={submit} className="space-y-5">
    <div className="flex items-center justify-between gap-3"><div><p className="mv-eyebrow">{initial ? 'Refine an entry' : 'Capture first'}</p><h2 className="mv-display mt-1 text-2xl text-[var(--mv-ink)]">{initial ? 'Make it yours.' : 'Keep a new word close.'}</h2></div><button type="button" onClick={onCancel} aria-label="Close entry form" className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><XMarkIcon className="h-5 w-5" /></button></div>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setForm((current) => ({ ...current, entryType: 'WORD' }))} aria-pressed={form.entryType === 'WORD'} className={`min-h-11 rounded-[var(--mv-radius-sm)] border text-sm font-bold ${form.entryType === 'WORD' ? 'border-[var(--mv-moss)] bg-[var(--mv-moss)] text-white' : 'border-[var(--mv-line)] text-[var(--mv-ink-soft)]'}`}>Word</button><button type="button" onClick={() => setForm((current) => ({ ...current, entryType: 'PHRASE' }))} aria-pressed={form.entryType === 'PHRASE'} className={`min-h-11 rounded-[var(--mv-radius-sm)] border text-sm font-bold ${form.entryType === 'PHRASE' ? 'border-[var(--mv-moss)] bg-[var(--mv-moss)] text-white' : 'border-[var(--mv-line)] text-[var(--mv-ink-soft)]'}`}>Phrase</button></div>
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--mv-ink)]">{form.entryType === 'PHRASE' ? 'Phrase' : 'Word'}</span><div className="flex gap-2"><input autoFocus id="word" required value={form.word} onChange={(event) => setForm((current) => ({ ...current, word: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) { event.preventDefault(); enrich(); } }} placeholder={form.entryType === 'PHRASE' ? 'break a leg' : 'mellifluous'} className="min-h-12 flex-1 rounded-[var(--mv-radius-md)] border border-[var(--mv-line)] bg-transparent px-4 text-base text-[var(--mv-ink)] focus:border-[var(--mv-moss)] focus:outline-none focus:ring-2 focus:ring-[var(--mv-moss)]/20" /><button type="button" onClick={enrich} disabled={fetching || !form.word.trim()} className="flex min-h-12 items-center gap-2 rounded-[var(--mv-radius-md)] border border-[var(--mv-moss)] px-3 text-xs font-bold text-[var(--mv-moss)] disabled:opacity-50"><SparklesIcon className="h-4 w-4" />{fetching ? 'Thinking…' : 'Enrich'}</button></div></label>
    {duplicateMatches.length > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">You already have <strong>{duplicateMatches[0].word}</strong>. Review it before saving a duplicate.</p>}
    {fetching && <div className="rounded-[var(--mv-radius-md)] bg-[var(--mv-paper-deep)] p-4"><p className="mv-eyebrow">Preparing suggestions</p><div className="mt-3 h-3 animate-pulse rounded bg-[var(--mv-line)]" /><div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-[var(--mv-line)]" /></div>}
    <Input id="definition" label="Definition" value={form.definition} onChange={set('definition')} textarea placeholder="Review or write the meaning in your own words." />
    <div><p className="mb-2 text-sm font-semibold text-[var(--mv-ink)]">Examples</p>{sentences.slice(0, 3).map((sentence, index) => <textarea key={index} value={sentence} onChange={(event) => setSentences((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} rows={2} placeholder={`Example ${index + 1}`} className="mb-2 min-h-11 w-full rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] bg-transparent px-3 py-2 text-sm text-[var(--mv-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--mv-moss)]/30" />)}</div>
    <button type="button" onClick={() => setMoreOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between border-y border-[var(--mv-line)] text-sm font-bold text-[var(--mv-ink-soft)]"><span>More details</span><ChevronDownIcon className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} /></button>
    {moreOpen && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-bold text-[var(--mv-ink-soft)]">Difficulty</span><select value={form.difficultyTier} onChange={set('difficultyTier')} className="min-h-11 w-full rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] bg-[var(--mv-paper)] px-3 text-sm text-[var(--mv-ink)]"><option value="">Not rated</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option><option value="SUPER_HARD">Super hard</option></select></label><label className="block"><span className="mb-2 block text-xs font-bold text-[var(--mv-ink-soft)]">Category</span><select value={form.categoryId} onChange={set('categoryId')} className="min-h-11 w-full rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] bg-[var(--mv-paper)] px-3 text-sm text-[var(--mv-ink)]"><option value="">None</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><Input id="notes" label="Original notes" value={form.notes} onChange={set('notes')} textarea /><Input id="userExample" label="Your example" value={form.userExample} onChange={set('userExample')} textarea /><Input id="userMnemonic" label="Your memory hook" value={form.userMnemonic} onChange={set('userMnemonic')} textarea /></div>}
    <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--mv-line)] pt-4"><button type="button" onClick={() => setBulkOpen(true)} className="min-h-11 text-xs font-bold text-[var(--mv-moss)]">Bulk add</button><div className="flex gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="button" onClick={(event) => submit(event, true)} loading={loading}>Save & add another</Button><Button type="submit" loading={loading}>Save entry</Button></div></div>
    {bulkOpen && <div className="rounded-[var(--mv-radius-md)] border border-[var(--mv-line)] bg-[var(--mv-paper-deep)] p-4"><p className="text-sm font-bold text-[var(--mv-ink)]">Bulk add</p><p className="mt-1 text-xs text-[var(--mv-ink-soft)]">Paste one word or phrase per line. We’ll bring the first into review now without saving anything automatically.</p><textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} rows={5} className="mt-3 w-full rounded-lg border border-[var(--mv-line)] bg-[var(--mv-paper)] p-3 text-sm" placeholder={'serendipity\nby and large\n...'} /><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setBulkOpen(false)} className="text-xs font-bold text-[var(--mv-ink-soft)]">Cancel</button><Button type="button" size="sm" onClick={submitBulk}>Review first</Button></div></div>}
  </form>;
}
