import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenIcon, CommandLineIcon, MagnifyingGlassIcon, PencilSquareIcon, PlayIcon, SunIcon, MoonIcon, PlusIcon } from '@heroicons/react/24/outline';
import { wordService } from '../../services/wordService';
import { journalService } from '../../services/journalService';
import { useTheme } from '../../context/ThemeContext';

const destinations = [
  { label: 'Go to Today', hint: 'Your daily starting point', to: '/dashboard', Icon: BookOpenIcon },
  { label: 'Go to Words', hint: 'Browse your vocabulary', to: '/words', Icon: BookOpenIcon },
  { label: 'Go to Practice', hint: 'Begin a focused session', to: '/practice', Icon: PlayIcon },
  { label: 'Go to Progress', hint: 'See what is sticking', to: '/progress', Icon: CommandLineIcon },
  { label: 'Go to Journal', hint: 'Write and reflect', to: '/journal', Icon: PencilSquareIcon },
  { label: 'Go to Property Tracker', hint: 'Open Portfolio', to: '/property-tracker', Icon: CommandLineIcon },
];

export default function CommandPalette({ isOpen, onClose, onQuickAdd }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    setQuery('');
    setActiveIndex(0);
    setTimeout(() => document.getElementById('command-palette-input')?.focus(), 0);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0))); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
      if (event.key === 'Enter' && results[activeIndex]) { event.preventDefault(); results[activeIndex].run(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, isOpen, onClose, results]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    Promise.allSettled([
      wordService.getWords({ query, page: 0, size: 5 }),
      journalService.getEntries({ page: 0, size: 5 }),
    ]).then(([wordsResult, journalResult]) => {
      if (cancelled) return;
      const next = [];
      if (wordsResult.status === 'fulfilled') (wordsResult.value.content || []).forEach((word) => next.push({ label: word.word, hint: word.definition || 'Open vocabulary entry', Icon: BookOpenIcon, run: () => { navigate(`/words?wordId=${word.id}`); onClose(); } }));
      if (journalResult.status === 'fulfilled') (journalResult.value.content || []).filter((entry) => `${entry.title || ''} ${entry.content || ''}`.toLowerCase().includes(query.toLowerCase())).forEach((entry) => next.push({ label: entry.title || 'Untitled journal entry', hint: 'Open journal', Icon: PencilSquareIcon, run: () => { navigate('/journal'); onClose(); } }));
      setResults(next);
      setActiveIndex(0);
    });
    return () => { cancelled = true; };
  }, [isOpen, navigate, onClose, query]);

  const actions = useMemo(() => [
    { label: 'Add a word', hint: 'Quickly save something new', Icon: PlusIcon, run: () => { onClose(); onQuickAdd(); } },
    { label: 'Start practice', hint: 'Review what is due', Icon: PlayIcon, run: () => { navigate('/practice'); onClose(); } },
    { label: theme === 'light' ? 'Use dark theme' : 'Use light theme', hint: 'Change the atmosphere', Icon: theme === 'light' ? MoonIcon : SunIcon, run: () => { toggleTheme(); onClose(); } },
  ], [navigate, onClose, onQuickAdd, theme, toggleTheme]);

  if (!isOpen) return null;
  const visibleResults = query.trim() ? results : [...actions, ...destinations.map((item) => ({ ...item, run: () => { navigate(item.to); onClose(); } }))];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" aria-label="Close command palette" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[var(--mv-radius-lg)] border border-[var(--mv-line)] bg-[var(--mv-paper)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--mv-line)] px-5">
          <MagnifyingGlassIcon className="h-5 w-5 text-[var(--mv-ink-soft)]" />
          <input id="command-palette-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search words, journal, or actions" className="min-h-14 flex-1 bg-transparent text-base text-[var(--mv-ink)] outline-none placeholder:text-[var(--mv-ink-soft)]" />
          <kbd className="hidden rounded border border-[var(--mv-line)] px-2 py-1 text-xs text-[var(--mv-ink-soft)] sm:block">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {visibleResults.length === 0 && <p className="px-4 py-8 text-center text-sm text-[var(--mv-ink-soft)]">No entries found.</p>}
          {visibleResults.map((item, index) => {
            const Icon = item.Icon;
            return <button key={`${item.label}-${index}`} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={item.run} className={`flex w-full items-center gap-3 rounded-[var(--mv-radius-sm)] px-3 py-3 text-left ${activeIndex === index ? 'bg-[var(--mv-paper-deep)]' : ''}`}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mv-paper-deep)] text-[var(--mv-moss)]"><Icon className="h-5 w-5" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[var(--mv-ink)]">{item.label}</span><span className="block truncate text-xs text-[var(--mv-ink-soft)]">{item.hint}</span></span></button>;
          })}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--mv-line)] px-4 py-3 text-[11px] text-[var(--mv-ink-soft)]"><span>Navigate with arrows</span><span>Enter to open</span></div>
      </div>
    </div>
  );
}
