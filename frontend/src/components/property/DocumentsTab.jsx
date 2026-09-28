import React, { useEffect, useState } from 'react';
import { CheckIcon, LinkIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const suggestions = ['Sale deed registration', 'Loan closure certificate / NOC', 'Release of original documents', 'Charge release', 'Encumbrance certificate', 'Utility and tax record updates', 'Insurance'];

export default function DocumentsTab({ propertyId }) {
  const storageKey = `mv-property-documents-${propertyId}`;
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      return Array.isArray(stored) ? stored : suggestions.map((label) => ({ label, done: false, link: '' }));
    } catch { return suggestions.map((label) => ({ label, done: false, link: '' })); }
  });
  const [linkingIndex, setLinkingIndex] = useState(null);
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(items)); }, [items, storageKey]);

  const openLinkEditor = (index) => { setLinkingIndex(index); setLinkValue(items[index].link || ''); };
  const saveLink = (event) => {
    event.preventDefault();
    if (linkingIndex == null) return;
    const value = linkValue.trim();
    if (value && !/^https?:\/\//i.test(value)) return;
    setItems((current) => current.map((item, index) => index === linkingIndex ? { ...item, link: value } : item));
    setLinkingIndex(null); setLinkValue('');
  };

  return <div className="space-y-5">
    <div><p className="mv-eyebrow">Post-possession checklist</p><h2 className="mv-display mt-1 text-2xl text-[var(--mv-ink)]">Documents &amp; next steps</h2><p className="mt-1 text-sm text-[var(--mv-ink-soft)]">Suggestions only, not legal or financial advice. Keep your records and links together.</p></div>
    <div className="divide-y divide-[var(--mv-line)] rounded-[var(--mv-radius-lg)] border border-[var(--mv-line)] bg-[var(--mv-paper)]">
      {items.map((item, index) => <div key={`${item.label}-${index}`} className="px-4 py-3 hover:bg-[var(--mv-paper-deep)]">
        <div className="flex min-h-11 items-center gap-3">
          <button type="button" onClick={() => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, done: !entry.done } : entry))} aria-label={`${item.done ? 'Mark incomplete' : 'Mark complete'}: ${item.label}`} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${item.done ? 'border-[var(--mv-moss)] bg-[var(--mv-moss)] text-white' : 'border-[var(--mv-line)] text-transparent hover:border-[var(--mv-moss)]'}`}><CheckIcon className="h-4 w-4" /></button>
          <span className={`min-w-0 flex-1 text-sm font-semibold ${item.done ? 'text-[var(--mv-ink-soft)] line-through' : 'text-[var(--mv-ink)]'}`}>{item.label}</span>
          <button type="button" onClick={() => openLinkEditor(index)} className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[var(--mv-moss)] hover:bg-[var(--mv-paper)]"><LinkIcon className="h-4 w-4" />{item.link ? 'Edit link' : 'Add link'}</button>
          <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.label}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper)] hover:text-[var(--mv-terracotta)]"><TrashIcon className="h-4 w-4" /></button>
        </div>
        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="ml-10 mt-1 flex items-center gap-1 truncate text-xs font-semibold text-[var(--mv-sky)] hover:underline"><LinkIcon className="h-3.5 w-3.5 shrink-0" />{item.link}</a>}
        {linkingIndex === index && <form onSubmit={saveLink} className="ml-10 mt-3 flex flex-wrap gap-2"><input autoFocus type="url" value={linkValue} onChange={(event) => setLinkValue(event.target.value)} placeholder="https://drive.google.com/..." aria-label={`Document link for ${item.label}`} className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--mv-line)] bg-[var(--mv-paper)] px-3 text-sm text-[var(--mv-ink)]" /><button type="submit" className="min-h-11 rounded-lg bg-[var(--mv-moss)] px-3 text-xs font-bold text-white">Save link</button><button type="button" onClick={() => setLinkingIndex(null)} aria-label="Cancel link editing" className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--mv-ink-soft)]"><XMarkIcon className="h-4 w-4" /></button></form>}
      </div>)}
      <button type="button" onClick={() => setItems((current) => [...current, { label: 'New checklist item', done: false, link: '' }])} className="flex min-h-12 w-full items-center gap-2 px-4 text-sm font-bold text-[var(--mv-moss)] hover:bg-[var(--mv-paper-deep)]"><PlusIcon className="h-4 w-4" />Add checklist item</button>
    </div>
  </div>;
}
