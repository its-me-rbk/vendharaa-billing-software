import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import authService from '../services/authService';
import { broadcastAndClear, clearTransientLocalStorage } from '../utils/storageCleanup';

const AuthContext = createContext(null);

const AUTH_KEYS = ['token', 'tokenExpiry', 'user', 'role', 'businessType'];
const clearAuthStorage = () => {
  AUTH_KEYS.forEach((k) => {
    try { localStorage.removeItem(k); } catch (_) {}
    try { sessionStorage.removeItem(k); } catch (_) {}
  });
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem('user') || sessionStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [role, setRole] = useState(() => {
    const r = localStorage.getItem('role') || sessionStorage.getItem('role') || '';
    if (r.toLowerCase() === 'superadmin') return 'SuperAdmin';
    if (r.toLowerCase() === 'admin') return 'Admin';
    if (r.toLowerCase() === 'cashier') return 'Cashier';
    return r;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(localStorage.getItem('token') || sessionStorage.getItem('token')));
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [businessType, setBusinessType] = useState(() => localStorage.getItem('businessType') || sessionStorage.getItem('businessType') || 'agro');
  const timeoutRef = useRef(null);

  const login = useCallback(async (email, password, force = false) => {
    const res = await authService.login(email, password, force);
    const { user: userData, token, timeoutMinutes } = res.data;
    const roleLower = (userData.role || '').toLowerCase();
    
    // Use timeoutMinutes from settings (via server response)
    const minutes = timeoutMinutes || 30;
    const expiry = new Date(Date.now() + minutes * 60 * 1000);

    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiry', expiry.toISOString());
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', roleLower);
    localStorage.setItem('businessType', userData.businessType || 'agro');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userData);
    setBusinessType(userData.businessType || 'agro');
    setSessionTimeoutMinutes(minutes);
    setIsAuthenticated(true);
    try { clearTransientLocalStorage(); } catch (_) {}

    if (roleLower === 'superadmin') {
      setRole('SuperAdmin');
      return 'SuperAdmin';
    } else if (roleLower === 'cashier') {
      setRole('Cashier');
      return 'Cashier';
    } else {
      setRole('Admin');
      return 'Admin';
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch (_) {}
    clearAuthStorage();
    try { broadcastAndClear('app_logout_handled', { reason: 'manual', ts: Date.now() }); } catch (_) {}
    try { clearTransientLocalStorage(); } catch (_) {}
    setUser(null);
    setRole('');
    setIsAuthenticated(false);
    window.location.href = '/';
  }, []);

  const forceLogout = useCallback((reason = 'expired') => {
    try { broadcastAndClear('app_logout_handled', { reason, ts: Date.now() }); } catch (_) {}
    clearAuthStorage();
    setUser(null);
    setRole('');
    setIsAuthenticated(false);
    window.location.reload();
  }, []);

  // Token expiry check on mount + auto-logout timer
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry') || sessionStorage.getItem('tokenExpiry');
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
        clearAuthStorage();
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

  // Theme application
  useEffect(() => {
    if (role === 'SuperAdmin') {
      document.body.setAttribute('data-theme', 'superadmin');
    } else {
      document.body.setAttribute('data-theme', businessType);
    }
  }, [businessType, role]);

  return (
    <AuthContext.Provider value={{
      user, role, isAuthenticated, businessType,
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
