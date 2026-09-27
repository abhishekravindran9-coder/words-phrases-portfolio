import React, { useState } from 'react';
import { ArrowDownTrayIcon, BookOpenIcon, ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
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
  const [expanded, setExpanded] = useState(false);
  const isJournal = collection === 'journal';
  const collectionCount = isJournal
    ? `${count.toLocaleString()} journal ${count === 1 ? 'entry' : 'entries'}`
    : `${count.toLocaleString()} vocabulary ${count === 1 ? 'entry' : 'entries'}`;
  const Icon = isJournal ? BookOpenIcon : SparklesIcon;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`${collection}-pdf-options`}
        onClick={() => setExpanded((value) => !value)}
        className="group flex min-h-[58px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:hover:bg-gray-700/60 sm:px-5"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-primary-600 dark:bg-indigo-900/30 dark:text-indigo-300">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">Export as PDF</span>
          <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
            {loading ? 'Counting your collection…' : `${collectionCount} · ${pageSize} page`}
          </span>
        </span>
        <span className="hidden rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:inline-flex">
          {expanded ? 'Close options' : 'Page setup'}
        </span>
        <ChevronDownIcon className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-primary-600 ${expanded ? 'rotate-180 text-primary-600 dark:text-primary-300' : ''}`} aria-hidden="true" />
      </button>

      {expanded && (
        <div id={`${collection}-pdf-options`} className="border-t border-gray-100 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30 sm:px-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] xl:items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Print-ready collection</h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Includes your complete collection, not just the items on this page.
              </p>
            </div>
            <div className="grid min-w-0 max-w-2xl gap-4">
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
        </div>
      )}
    </section>
  );
}
