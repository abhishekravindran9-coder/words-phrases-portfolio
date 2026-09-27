import React from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';

const PAGE_SIZES = [
  { value: 'A4', dimension: '210 × 297 mm', description: 'Everyday printing', sheet: 'h-8 w-[23px]' },
  { value: 'A3', dimension: '297 × 420 mm', description: 'Roomier, large format', sheet: 'h-10 w-[29px]' },
];

/** Accessible, compact paper-size choice shared by PDF export screens. */
export default function PdfPageSizePicker({ value, onChange, disabled = false }) {
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-200">
        Choose your page size
      </legend>
      <div role="radiogroup" aria-label="PDF page size" className="grid grid-cols-2 gap-2">
        {PAGE_SIZES.map((size) => {
          const selected = value === size.value;
          return (
            <label
              key={size.value}
              className={`group relative flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200
                focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900
                ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md'}
                ${selected
                  ? 'border-primary-400 bg-primary-50/70 shadow-sm dark:border-primary-500 dark:bg-primary-900/20'
                  : 'border-gray-200 bg-white hover:border-primary-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500'}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="pdf-page-size"
                value={size.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(size.value)}
              />
              <span className="flex h-12 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100/80 dark:bg-gray-700/70">
                <span className={`${size.sheet} relative block rounded-[3px] border shadow-sm transition-colors ${selected ? 'border-primary-300 bg-white dark:border-primary-400' : 'border-gray-300 bg-white dark:border-gray-500'}`}>
                  <span className="absolute left-[4px] right-[4px] top-[7px] h-px bg-gray-200 dark:bg-gray-400" />
                  <span className="absolute left-[4px] right-[4px] top-[11px] h-px bg-gray-200 dark:bg-gray-400" />
                  <span className="absolute bottom-[5px] left-[4px] right-[7px] h-px bg-gray-200 dark:bg-gray-400" />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-gray-900 dark:text-white">{size.value}</span>
                  {selected && <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />}
                </span>
                <span className="mt-0.5 block whitespace-nowrap text-[11px] font-medium text-gray-600 dark:text-gray-300">{size.dimension}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-gray-500 dark:text-gray-400">{size.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
