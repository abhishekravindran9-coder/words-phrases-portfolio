import React from 'react';

export default function EmptyState({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <section className="mv-empty-state" aria-live="polite">
      {Icon && <span className="mv-empty-state__icon"><Icon className="h-7 w-7" aria-hidden="true" /></span>}
      {eyebrow && <p className="mv-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
