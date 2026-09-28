import React, { useState } from 'react';
import { CheckCircleIcon, EllipsisHorizontalIcon, EyeIcon, PencilIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useSpeech } from '../../hooks/useSpeech';

function stageFor(word) {
  if (word.mastered) return ['Mastered', 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'];
  if (!word.repetitions) return ['New', 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'];
  if ((word.intervalDays || 1) < 7) return ['Learning', 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200'];
  if ((word.intervalDays || 1) < 21) return ['Young', 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200'];
  return ['Mature', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'];
}

function dueLabel(date, localToday) {
  if (!date) return 'Not scheduled';
  const today = localToday || new Date().toISOString().slice(0, 10);
  const current = new Date(`${today}T00:00:00Z`);
  const due = new Date(`${date}T00:00:00Z`);
  const days = Math.round((due - current) / 86400000);
  if (days < 0) return 'Due';
  if (days === 0) return 'Due today';
  return `Due in ${days}d`;
}

export default function WordCard({ word, onEdit, onDelete, onView, compact = false, recallMode = false, coverDefinitions = false, selected = false, selectionMode = false, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { speak, speaking, supported } = useSpeech();
  const [stage, stageClass] = stageFor(word);
  const examples = (word.exampleSentence || '').split('\n\n').filter(Boolean);
  const isProblem = (word.lapseCount || 0) >= 3;

  if (compact) return (
    <div className={`group flex min-h-14 items-center gap-3 rounded-lg border-b border-[var(--mv-line)] px-3 py-3 transition-colors ${selectionMode && selected ? 'border-l-4 border-l-[var(--mv-moss)] bg-[color-mix(in_srgb,var(--mv-moss)_9%,var(--mv-paper))]' : 'hover:bg-[var(--mv-paper-deep)]'}`} onClick={() => selectionMode ? onSelect?.(!selected) : onView?.(word)} role="button" aria-pressed={selectionMode ? selected : undefined} aria-label={selectionMode ? `${word.word}, ${selected ? 'selected' : 'not selected'}` : `Open ${word.word}`} tabIndex={0} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || (selectionMode && event.key === ' ')) { event.preventDefault(); selectionMode ? onSelect?.(!selected) : onView?.(word); } }}>
      {selectionMode && selected && <CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--mv-moss)]" aria-hidden="true" />}
      <span className="mv-display min-w-0 flex-1 truncate text-lg text-[var(--mv-ink)]">{word.word}</span>
      <span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline-flex ${stageClass}`}>{stage}</span>
      <span className={`shrink-0 text-xs font-semibold ${isProblem ? 'text-[var(--mv-terracotta)]' : 'text-[var(--mv-ink-soft)]'}`}>{dueLabel(word.nextReviewDate, word.localToday)}</span>
      <div className="flex shrink-0 items-center gap-1 opacity-70 group-hover:opacity-100">
        {supported && <button type="button" aria-label={`Read ${word.word} aloud`} onClick={(event) => { event.stopPropagation(); speak(word.word); }} className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--mv-paper-deep)] ${speaking ? 'text-[var(--mv-moss)]' : 'text-[var(--mv-ink-soft)]'}`}><SpeakerWaveIcon className="h-4 w-4" /></button>}
        <button type="button" aria-label={`Edit ${word.word}`} onClick={(event) => { event.stopPropagation(); onEdit?.(word); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><PencilIcon className="h-4 w-4" /></button>
      </div>
    </div>
  );

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[var(--mv-radius-lg)] border bg-[var(--mv-paper)] p-5 shadow-sm transition-all duration-200 ${selectionMode ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--mv-shadow-soft)]' : ''} ${selectionMode && selected ? 'border-2 border-[var(--mv-moss)] bg-[color-mix(in_srgb,var(--mv-moss)_9%,var(--mv-paper))] ring-2 ring-[var(--mv-moss)]/30 shadow-[var(--mv-shadow-soft)]' : 'border-[var(--mv-line)]'}`}
      onClick={() => selectionMode && onSelect?.(!selected)}
      onKeyDown={(event) => {
        if (selectionMode && event.target === event.currentTarget && (event.key === ' ' || event.key === 'Enter')) {
          event.preventDefault();
          onSelect(!selected);
        }
      }}
      role={selectionMode ? 'group' : undefined}
      aria-label={selectionMode ? `${word.word}, ${selected ? 'selected' : 'not selected'}. Press Enter or Space to toggle selection.` : undefined}
      tabIndex={selectionMode ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {selectionMode && selected && <CheckCircleIcon className="h-5 w-5 text-[var(--mv-moss)]" aria-hidden="true" />}
          <span className="rounded-full bg-[var(--mv-paper-deep)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--mv-ink-soft)]">{word.entryType === 'PHRASE' ? 'Phrase' : 'Word'}</span>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${stageClass}`}>{stage}</span>
          {word.difficultyTier && <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">{word.difficultyTier.replace('_', ' ').toLowerCase()}</span>}
        </div>
        <div className="relative flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {supported && <button type="button" aria-label={`Read ${word.word} aloud`} onClick={(event) => { event.stopPropagation(); speak(word.word); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><SpeakerWaveIcon className={`h-4 w-4 ${speaking ? 'text-[var(--mv-moss)]' : ''}`} /></button>}
          <button type="button" aria-label={`Actions for ${word.word}`} onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><EllipsisHorizontalIcon className="h-5 w-5" /></button>
          {menuOpen && <div className="absolute right-0 top-10 z-10 w-36 rounded-xl border border-[var(--mv-line)] bg-[var(--mv-paper)] p-1 shadow-xl" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => onView?.(word)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-[var(--mv-ink)] hover:bg-[var(--mv-paper-deep)]"><EyeIcon className="h-4 w-4" />Read</button><button type="button" onClick={() => onEdit?.(word)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-[var(--mv-ink)] hover:bg-[var(--mv-paper-deep)]"><PencilIcon className="h-4 w-4" />Edit</button><button type="button" onClick={() => onDelete?.(word.id)} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-[var(--mv-terracotta)] hover:bg-[var(--mv-paper-deep)]">Delete</button></div>}
        </div>
      </div>
      <button type="button" onClick={(event) => { event.stopPropagation(); selectionMode ? onSelect?.(!selected) : onView?.(word); }} className="mt-5 text-left"><h2 className="mv-display text-3xl leading-tight text-[var(--mv-ink)]">{word.word}</h2>{(word.partOfSpeech || word.pronunciation) && <p className="mt-1 text-xs italic text-[var(--mv-ink-soft)]">{word.pronunciation}{word.pronunciation && word.partOfSpeech ? ' · ' : ''}{word.partOfSpeech}</p>}<p className={`mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--mv-ink-soft)] ${recallMode && coverDefinitions ? 'select-none blur-sm' : ''}`}>{word.definition || 'No definition yet.'}</p></button>
      {word.categoryName && <p className="mt-4 text-xs font-semibold text-[var(--mv-ink-soft)]">{word.categoryName}</p>}
      {expanded && <div className="mt-4 space-y-4 border-t border-[var(--mv-line)] pt-4">{examples.length > 0 && <div><p className="mv-eyebrow mb-2">Examples</p><ul className="space-y-2 text-sm italic text-[var(--mv-ink-soft)]">{examples.map((example, index) => <li key={index} className="border-l-2 border-[var(--mv-moss)] pl-3">{example}</li>)}</ul></div>}{word.notes && <div><p className="mv-eyebrow mb-2">Notes</p><p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--mv-ink-soft)]">{word.notes}</p></div>}</div>}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--mv-line)] pt-4"><button type="button" onClick={(event) => { event.stopPropagation(); setExpanded((open) => !open); }} className="min-h-10 text-xs font-bold text-[var(--mv-moss)]">{expanded ? 'Show less' : 'Examples & notes'}</button><span title={word.nextReviewDate ? `Next review ${word.nextReviewDate}` : 'No review scheduled'} className={`text-xs font-semibold ${isProblem ? 'text-[var(--mv-terracotta)]' : 'text-[var(--mv-ink-soft)]'}`}>{dueLabel(word.nextReviewDate, word.localToday)}</span></div>
    </article>
  );
}
