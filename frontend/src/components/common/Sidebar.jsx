import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
  ChartBarIcon, PencilSquareIcon, XMarkIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard',    Icon: HomeIcon },
  { to: '/words',     label: 'My Words',     Icon: BookOpenIcon },
  { to: '/review',    label: 'Review',       Icon: ClipboardDocumentCheckIcon },
  { to: '/quiz',      label: 'Quiz',         Icon: AcademicCapIcon },
  { to: '/progress',  label: 'Progress',     Icon: ChartBarIcon },
  { to: '/journal',   label: 'Journal',      Icon: PencilSquareIcon },
];

/**
 * Responsive sidebar navigation.
 * On mobile it slides in as an overlay; on lg+ it is always visible.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="text-xl font-bold text-primary-600">📚 W&amp;P</span>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* User badge */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user?.displayName || user?.username}
          </p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-primary-50 text-primary-700'
                   : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
