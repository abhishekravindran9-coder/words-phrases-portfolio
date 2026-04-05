import React from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, UserCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFontSize } from '../../context/FontSizeContext';

/**
 * Top navigation bar – shows hamburger menu on mobile, user actions on the right.
 */
export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between
                       border-b border-gray-200 bg-white px-4 md:px-6 shadow-sm
                       dark:bg-gray-900 dark:border-gray-700">
      {/* Left: hamburger (mobile) */}
      <button
        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Centre: brand (visible on mobile when sidebar is hidden) */}
      <span className="text-primary-600 font-bold text-lg lg:hidden">📚 Words &amp; Phrases</span>

      {/* Right: user actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Font size pill */}
        <div
          className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          title="Adjust text size"
        >
          {[{ key: 'sm', size: '10px' }, { key: 'md', size: '13px' }, { key: 'lg', size: '17px' }].map(({ key, size }) => (
            <button
              key={key}
              onClick={() => setFontSize(key)}
              aria-label={`Text size ${key}`}
              className={`px-2 py-1.5 transition-colors ${
                fontSize === key
                  ? 'bg-primary-100 text-primary-700 dark:bg-gray-700 dark:text-primary-400'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span style={{ fontSize: size, fontWeight: 800, lineHeight: 1, display: 'block' }}>A</span>
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                     dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700
                     transition-colors"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light'
            ? <MoonIcon className="h-5 w-5" />
            : <SunIcon  className="h-5 w-5" />}
        </button>

        <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900
                                       dark:text-gray-400 dark:hover:text-gray-200">
          <UserCircleIcon className="h-7 w-7 text-primary-500" />
          <span className="hidden sm:block font-medium">{user?.displayName || user?.username}</span>
        </Link>
      </div>
    </header>
  );
}
