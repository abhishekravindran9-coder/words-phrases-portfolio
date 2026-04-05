import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Pages
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import WordsPage             from './pages/WordsPage';
import ReviewPage            from './pages/ReviewPage';
import ProgressPage          from './pages/ProgressPage';
import JournalPage           from './pages/JournalPage';
import ProfilePage           from './pages/ProfilePage';
import QuizPage              from './pages/QuizPage';
import PropertyTrackerPage   from './pages/PropertyTrackerPage';
import PropertyDetailPage    from './pages/PropertyDetailPage';

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
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={canSignUp() ? <RegisterPage /> : <Navigate to="/login" replace />} />

          {/* Protected – wrapped in persistent Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/words"     element={<WordsPage />} />
              <Route path="/review"    element={<ReviewPage />} />
              <Route path="/progress"  element={<ProgressPage />} />
              <Route path="/quiz"      element={<QuizPage />} />
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
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
    </FontSizeProvider>
  );
}
