import React from 'react';

/**
 * Reusable labelled input field with optional error message.
 */
export default function Input({
  label,
  id,
  error,
  className = '',
  containerClass = '',
  textarea = false,
  ...props
}) {
  const baseClass = `
    block w-full min-h-11 rounded-[var(--mv-radius-sm)] border px-3 py-2.5 text-sm text-[var(--mv-ink)]
    placeholder:text-[var(--mv-ink-soft)] bg-[var(--mv-paper)] transition-colors
    focus:outline-none focus:ring-2 focus:ring-[var(--mv-moss)] focus:border-transparent
    disabled:bg-gray-50 disabled:cursor-not-allowed
    ${error ? 'border-[var(--mv-terracotta)] focus:ring-[var(--mv-terracotta)]' : 'border-[var(--mv-line)]'}
    ${className}
  `;

  return (
    <div className={`space-y-1 ${containerClass}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea id={id} rows={4} className={baseClass} {...props} />
      ) : (
        <input id={id} className={baseClass} {...props} />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
