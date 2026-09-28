import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { BRAND } from './utils/brand';

// Pages
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WordsPage = lazy(() => import('./pages/WordsPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const PropertyTrackerPage = lazy(() => import('./pages/PropertyTrackerPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));

const canSignUp = () => false;

function BrandMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const pageTitle = pathname === '/dashboard' || pathname === '/' ? 'Today'
      : pathname.startsWith('/property-tracker') ? 'Portfolio'
        : pathname === '/words' ? 'Words'
          : pathname.replace(/^\//, '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    document.title = `${pageTitle} · ${BRAND.name}`;
  }, [pathname]);

  useEffect(() => {
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = BRAND.description;
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = BRAND.themeColor;
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = `${process.env.PUBLIC_URL || ''}/favicon.svg`;
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    const manifestUrl = URL.createObjectURL(new Blob([JSON.stringify({
      name: BRAND.name,
      short_name: BRAND.name,
      description: BRAND.description,
      start_url: '/',
      display: 'standalone',
      theme_color: BRAND.themeColor,
      background_color: '#fbfaf7',
      icons: [{ src: `${process.env.PUBLIC_URL || ''}/favicon.svg`, sizes: 'any', type: 'image/svg+xml' }],
    })], { type: 'application/manifest+json' }));
    manifestLink.href = manifestUrl;
  }, []);
  return null;
}

export default function App() {
  return (
    <FontSizeProvider>
    <ThemeProvider>
      <BrowserRouter>
        <BrandMetadata />
        <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif' },
          }}
        />
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--mv-paper)]"><LoadingSpinner size="lg" /></div>}>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={canSignUp() ? <RegisterPage /> : <Navigate to="/login" replace />} />

          {/* Protected – wrapped in persistent Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/words"     element={<WordsPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/review"    element={<Navigate to="/practice" replace />} />
              <Route path="/progress"  element={<ProgressPage />} />
              <Route path="/quiz"      element={<Navigate to="/practice" replace />} />
              <Route path="/journal"              element={<JournalPage />} />
              <Route path="/profile"              element={<ProfilePage />} />
              <Route path="/property-tracker"     element={<PropertyTrackerPage />} />
              <Route path="/property-tracker/:id" element={<PropertyDetailPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
    </FontSizeProvider>
  );
}
