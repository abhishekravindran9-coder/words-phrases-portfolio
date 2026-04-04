import React from 'react';

const SIZE_MAP = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

/**
 * Animated circular loading spinner.
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`
        ${SIZE_MAP[size]} rounded-full
        border-primary-200 border-t-primary-600
        animate-spin ${className}
      `}
      role="status"
      aria-label="Loading…"
    />
  );
}
