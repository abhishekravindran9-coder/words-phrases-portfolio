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
    block w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
    placeholder-gray-400 shadow-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    disabled:bg-gray-50 disabled:cursor-not-allowed
    ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}
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
