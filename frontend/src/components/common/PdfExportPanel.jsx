import React from 'react';
import { ArrowDownTrayIcon, BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import PdfPageSizePicker from './PdfPageSizePicker';

/** Shared, responsive export panel used by the vocabulary and journal libraries. */
export default function PdfExportPanel({
  collection = 'journal',
  pageSize,
  onPageSizeChange,
  onDownload,
  loading = false,
  exporting = false,
  count = 0,
}) {
  const isJournal = collection === 'journal';
  const title = isJournal ? 'Your story, beautifully printed.' : 'Your words, ready to travel.';
  const description = isJournal
    ? 'Every entry, thoughtfully laid out and ready to keep.'
    : 'Your complete word and phrase collection in a keepsake edition.';
  const collectionCount = isJournal
    ? `${count.toLocaleString()} journal ${count === 1 ? 'entry' : 'entries'}`
    : `${count.toLocaleString()} vocabulary ${count === 1 ? 'entry' : 'entries'}`;
  const Icon = isJournal ? BookOpenIcon : SparklesIcon;

  return (
    <section
      aria-labelledby={`${collection}-pdf-title`}
      className="relative isolate overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/70 to-sky-50/80 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-950/40 sm:p-5"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 h-48 w-48 rounded-full bg-indigo-200/25 blur-3xl dark:bg-indigo-500/10" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] xl:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            Print-ready collection
          </p>
            <h2 id={`${collection}-pdf-title`} className="mt-1 text-base font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-lg">
              {title}
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">
              {description}
            </p>
            <p className="mt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {loading ? 'Counting your collection…' : `${collectionCount} · includes everything, not just this page`}
            </p>
        </div>

        <div className="grid min-w-0 gap-3">
          <PdfPageSizePicker value={pageSize} onChange={onPageSizeChange} disabled={exporting || loading} />
          <Button
            variant="primary"
            size="lg"
            onClick={onDownload}
            loading={exporting}
            disabled={loading || exporting || count === 0}
            className="min-h-[48px] w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-200/60 hover:from-indigo-700 hover:to-violet-700 focus:ring-indigo-500 dark:shadow-indigo-950/50"
          >
            {!exporting && <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />}
            <span>{exporting ? 'Preparing your PDF…' : `Download ${pageSize} PDF`}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
