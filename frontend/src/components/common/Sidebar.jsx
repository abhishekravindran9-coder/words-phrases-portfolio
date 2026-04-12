import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  HomeIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
  ChartBarIcon, PencilSquareIcon, XMarkIcon, AcademicCapIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

const LINKS = [
  { to: '/dashboard',        label: 'Dashboard',         Icon: HomeIcon },
  { to: '/words',            label: 'My Words',          Icon: BookOpenIcon },
  { to: '/review',           label: 'Review',            Icon: ClipboardDocumentCheckIcon },
  { to: '/quiz',             label: 'Quiz',              Icon: AcademicCapIcon },
  { to: '/progress',         label: 'Progress',          Icon: ChartBarIcon },
  { to: '/journal',          label: 'Journal',           Icon: PencilSquareIcon },
  { to: '/property-tracker', label: 'Property Tracker',  Icon: BuildingOffice2Icon },
];

/**
 * Responsive sidebar navigation.
 * On mobile it slides in as an overlay; on lg+ it is always visible.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [apiVersion, setApiVersion] = useState(null);

  useEffect(() => {
    api.get('/version')
      .then(r => setApiVersion(r.data.version))
      .catch(() => {});
  }, []);

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
          dark:bg-gray-800 dark:border-gray-700
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xl font-bold text-primary-600">&#x1F511; My Vault</span>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* User badge */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {user?.displayName || user?.username}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
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
                   ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                   : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'}`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Version badge */}
        <div className="px-4 pb-4 text-center border-t border-gray-100 dark:border-gray-700 pt-2">
          <p className="text-xs text-gray-400 dark:text-gray-600 tabular-nums">
            UI&nbsp;v{process.env.REACT_APP_VERSION || '1.0.0'}
            {apiVersion && <>&nbsp;·&nbsp;API&nbsp;v{apiVersion}</>}
          </p>
        </div>
      </aside>
    </>
  );
}
