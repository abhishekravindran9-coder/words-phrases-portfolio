import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

export default function PageHeader({ space = 'Learn', title, description, action, breadcrumbs = [] }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-[var(--mv-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mv-ink-soft)]">
          <span>{space}</span>
          {breadcrumbs.map((crumb) => <React.Fragment key={crumb.label}><ChevronRightIcon className="h-3.5 w-3.5" /><Link to={crumb.to} className="hover:text-[var(--mv-moss)]">{crumb.label}</Link></React.Fragment>)}
        </nav>
        <h1 className="mv-display text-3xl text-[var(--mv-ink)] sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--mv-ink-soft)]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
