import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, Bars3Icon, BookOpenIcon, BuildingOffice2Icon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, CommandLineIcon, HomeIcon, MoonIcon, PencilSquareIcon, PlusIcon, SparklesIcon, SunIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFontSize } from '../../context/FontSizeContext';
import api from '../../services/api';
import CommandPalette from './CommandPalette';
import QuickAddSheet from './QuickAddSheet';

const spaces = [
  { label: 'Learn', items: [{ to: '/dashboard', label: 'Today', Icon: HomeIcon }, { to: '/words', label: 'My Words', Icon: BookOpenIcon }, { to: '/practice', label: 'Practice', Icon: SparklesIcon }, { to: '/progress', label: 'Progress', Icon: ChartBarIcon }] },
  { label: 'Write', items: [{ to: '/journal', label: 'Journal', Icon: PencilSquareIcon }] },
  { label: 'Portfolio', items: [{ to: '/property-tracker', label: 'Property Tracker', Icon: BuildingOffice2Icon }] },
];

function isCurrentPath(pathname, to) { return pathname === to || pathname.startsWith(`${to}/`); }

export default function AppShell() {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mv_sidebar_collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [apiVersion, setApiVersion] = useState(null);

  useEffect(() => { localStorage.setItem('mv_sidebar_collapsed', String(collapsed)); }, [collapsed]);
  useEffect(() => { api.get('/version').then((response) => setApiVersion(response.data.version)).catch(() => {}); }, []);
  useEffect(() => {
    const onKeyDown = (event) => {
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true); }
      if (command && event.shiftKey && event.key.toLowerCase() === 'a') { event.preventDefault(); setQuickAddOpen(true); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const signOut = () => { logout(); navigate('/login'); };
  const toggleCollapse = () => setCollapsed((value) => !value);

  return (
    <div className="min-h-screen bg-[var(--mv-paper)] text-[var(--mv-ink)]">
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-[var(--mv-line)] bg-[var(--mv-paper)] transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${collapsed ? 'lg:w-[5.5rem]' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex h-[4.75rem] items-center border-b border-[var(--mv-line)] ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
          <button type="button" onClick={() => navigate('/dashboard')} className={`flex items-center gap-3 text-left ${collapsed ? 'justify-center' : ''}`} aria-label="Go to Today">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mv-moss)] text-white"><BookOpenIcon className="h-5 w-5" /></span>
            {!collapsed && <span><span className="mv-display block text-xl leading-none">My Vault</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mv-ink-soft)]">A personal dictionary</span></span>}
          </button>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)] lg:hidden"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className={`border-b border-[var(--mv-line)] py-4 ${collapsed ? 'px-3' : 'px-4'}`}>
          <button type="button" onClick={() => setQuickAddOpen(true)} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--mv-radius-md)] bg-[var(--mv-terracotta)] px-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 ${collapsed ? 'px-0' : ''}`} title={collapsed ? 'Add a word' : undefined}>
            <PlusIcon className="h-5 w-5" />{!collapsed && 'Add a word'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
          {spaces.map((space) => <div key={space.label} className="mb-6"><p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mv-ink-soft)] ${collapsed ? 'text-center' : ''}`}>{collapsed ? space.label.slice(0, 1) : space.label}</p><div className="space-y-1">{space.items.map(({ to, label, Icon }) => <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => `group relative flex min-h-11 items-center gap-3 rounded-[var(--mv-radius-sm)] px-3 text-sm font-semibold transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-[var(--mv-paper-deep)] text-[var(--mv-moss)]' : 'text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)] hover:text-[var(--mv-ink)]'}`}><span className={`absolute left-0 h-6 w-1 rounded-r-full bg-[var(--mv-moss)] ${isCurrentPath(location.pathname, to) ? 'opacity-100' : 'opacity-0'}`} /><Icon className="h-5 w-5 shrink-0" /><span className={collapsed ? 'sr-only' : ''}>{label}</span></NavLink>)}</div></div>)}
        </nav>
        <div className={`border-t border-[var(--mv-line)] py-3 ${collapsed ? 'px-3' : 'px-4'}`}>
          <button type="button" onClick={signOut} title={collapsed ? 'Log out' : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--mv-radius-sm)] px-3 text-sm font-semibold text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)] hover:text-[var(--mv-terracotta)] ${collapsed ? 'justify-center' : ''}`}><ArrowLeftOnRectangleIcon className="h-5 w-5" /><span className={collapsed ? 'sr-only' : ''}>Log out</span></button>
          {!collapsed && <p className="mt-2 px-3 text-[10px] text-[var(--mv-ink-soft)]">{user?.displayName || user?.username} · v{process.env.REACT_APP_VERSION || '1.0.0'}{apiVersion ? ` · API ${apiVersion}` : ''}</p>}
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-300 lg:pl-[17rem] ${collapsed ? 'lg:pl-[5.5rem]' : ''}`}>
        <header className="sticky top-0 z-30 flex h-[4.75rem] items-center justify-between border-b border-[var(--mv-line)] bg-[var(--mv-paper)]/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)] lg:hidden"><Bars3Icon className="h-6 w-6" /></button><button type="button" onClick={toggleCollapse} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)] lg:flex">{collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}</button><button type="button" onClick={() => setPaletteOpen(true)} className="flex min-h-10 items-center gap-2 rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] px-3 text-sm text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><CommandLineIcon className="h-4 w-4" /><span className="hidden sm:inline">Search or jump to…</span><kbd className="hidden rounded border border-[var(--mv-line)] px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd></button></div>
          <div className="flex items-center gap-1"><div className="hidden items-center rounded-lg border border-[var(--mv-line)] sm:flex">{['sm', 'md', 'lg'].map((size) => <button key={size} type="button" onClick={() => setFontSize(size)} aria-label={`Text size ${size}`} className={`flex h-9 w-9 items-center justify-center text-xs font-bold ${fontSize === size ? 'bg-[var(--mv-paper-deep)] text-[var(--mv-moss)]' : 'text-[var(--mv-ink-soft)]'}`}>A</button>)}</div><button type="button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]">{theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}</button><button type="button" onClick={() => navigate('/profile')} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mv-paper-deep)] text-sm font-bold text-[var(--mv-moss)]" aria-label="Open profile">{(user?.displayName || user?.username || 'M').slice(0, 1).toUpperCase()}</button></div>
        </header>
        <main className="min-h-[calc(100vh-4.75rem)] px-4 py-6 pb-24 md:px-8 md:py-9 lg:pb-10"><Outlet /></main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-[4.5rem] grid-cols-5 border-t border-[var(--mv-line)] bg-[var(--mv-paper)]/95 px-2 pb-safe backdrop-blur lg:hidden" aria-label="Mobile navigation">
        {[{ to: '/dashboard', label: 'Today', Icon: HomeIcon }, { to: '/words', label: 'Words', Icon: BookOpenIcon }, { to: '/practice', label: 'Practice', Icon: SparklesIcon }, { to: '/journal', label: 'Journal', Icon: PencilSquareIcon }, { to: '/property-tracker', label: 'More', Icon: CommandLineIcon }].map(({ to, label, Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${isActive ? 'text-[var(--mv-moss)]' : 'text-[var(--mv-ink-soft)]'}`}><Icon className="h-5 w-5" /><span>{label}</span></NavLink>)}
      </nav>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddSheet isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
