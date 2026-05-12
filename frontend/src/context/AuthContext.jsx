import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import authService from '../services/authService';
import { broadcastAndClear, clearTransientLocalStorage } from '../utils/storageCleanup';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = sessionStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [role, setRole] = useState(() => {
    const r = sessionStorage.getItem('role') || '';
    if (r.toLowerCase() === 'admin') return 'Admin';
    if (r.toLowerCase() === 'cashier') return 'Cashier';
    return r;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('token'));
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const timeoutRef = useRef(null);

  const login = useCallback(async (email, password, roleType) => {
    const res = await authService.login(email, password, roleType);
    const { user: userData, token } = res.data;
    const roleLower = (userData.role || '').toLowerCase();
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('tokenExpiry', expiry);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('role', roleLower);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userData);
    setIsAuthenticated(true);
    try { clearTransientLocalStorage(); } catch (_) {}

    if (roleLower === 'cashier') {
      setRole('Cashier');
      return 'Cashier';
    } else {
      setRole('Admin');
      return 'Admin';
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch (_) {}
    sessionStorage.clear();
    try { clearTransientLocalStorage(); } catch (_) {}
    setUser(null);
    setRole('');
    setIsAuthenticated(false);
    window.location.href = '/';
  }, []);

  const forceLogout = useCallback((reason = 'expired') => {
    try { broadcastAndClear('app_logout_handled', { reason, ts: Date.now() }); } catch (_) {}
    sessionStorage.clear();
    setUser(null);
    setRole('');
    setIsAuthenticated(false);
    window.location.reload();
  }, []);

  // Token expiry check on mount + auto-logout timer
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const expiry = sessionStorage.getItem('tokenExpiry');
    if (token && expiry) {
      const expiryTime = new Date(expiry).getTime();
      const now = Date.now();
      if (now >= expiryTime) {
        forceLogout('expired');
        return;
      }
      if (sessionTimeoutEnabled) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => forceLogout('expired'), expiryTime - now);
      }
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [sessionTimeoutEnabled, forceLogout]);

  // Cross-tab logout listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'app_logout_handled' && e.newValue) {
        try { sessionStorage.clear(); } catch (_) {}
        setUser(null); setRole(''); setIsAuthenticated(false);
        window.location.reload();
      }
      if (e.key === 'settings_updated' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (typeof payload.sessionTimeoutEnabled === 'boolean') setSessionTimeoutEnabled(payload.sessionTimeoutEnabled);
          if (typeof payload.sessionTimeoutMinutes !== 'undefined') setSessionTimeoutMinutes(Number(payload.sessionTimeoutMinutes) || 30);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, role, isAuthenticated,
      login, logout, forceLogout,
      sessionTimeoutEnabled, setSessionTimeoutEnabled,
      sessionTimeoutMinutes, setSessionTimeoutMinutes,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
