import React from 'react';

export function Skeleton({ className = '' }) {
  return <span className={`mv-skeleton ${className}`} aria-hidden="true" />;
}

export default function SkeletonBlock({ rows = 3 }) {
  return <div className="space-y-3" aria-label="Loading"><Skeleton className="h-8 w-1/3" />{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>;
}
