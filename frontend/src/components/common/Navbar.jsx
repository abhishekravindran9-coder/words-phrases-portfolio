import React from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

/**
 * Top navigation bar – shows hamburger menu on mobile, user actions on the right.
 */
export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 shadow-sm">
      {/* Left: hamburger (mobile) */}
      <button
        className="lg:hidden text-gray-500 hover:text-gray-700"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Centre: brand (visible on mobile when sidebar is hidden) */}
      <span className="text-primary-600 font-bold text-lg lg:hidden">📚 Words &amp; Phrases</span>

      {/* Right: user actions */}
      <div className="flex items-center gap-3 ml-auto">
        <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <UserCircleIcon className="h-7 w-7 text-primary-500" />
          <span className="hidden sm:block font-medium">{user?.displayName || user?.username}</span>
        </Link>
      </div>
    </header>
  );
}
