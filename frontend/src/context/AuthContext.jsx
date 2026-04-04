import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

/**
 * Provides authentication state and actions to the component tree.
 * Persists the JWT token and user info in localStorage.
 */
export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('wp_user')); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('wp_token') || null);
  const [loading, setLoading] = useState(false);

  // Sync to localStorage whenever auth state changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('wp_token', token);
      localStorage.setItem('wp_user',  JSON.stringify(user));
    } else {
      localStorage.removeItem('wp_token');
      localStorage.removeItem('wp_user');
    }
  }, [token, user]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setToken(data.accessToken);
      setUser({
        id:             data.userId,
        username:       data.username,
        email:          data.email,
        displayName:    data.displayName,
        profilePictureUrl: data.profilePictureUrl,
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const data = await authService.register(payload);
      setToken(data.accessToken);
      setUser({
        id:          data.userId,
        username:    data.username,
        email:       data.email,
        displayName: data.displayName,
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
