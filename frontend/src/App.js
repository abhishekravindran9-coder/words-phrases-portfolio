import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

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

export default function App() {
  return (
    <FontSizeProvider>
    <ThemeProvider>
      <BrowserRouter>
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
