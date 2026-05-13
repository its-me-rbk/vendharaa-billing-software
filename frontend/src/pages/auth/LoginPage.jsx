import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role: authRole } = useAuth();
  const { pharmacyName, logoUrl } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForceModal, setShowForceModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(authRole === 'Cashier' ? '/cashier' : '/admin', { replace: true });
    }
  }, [isAuthenticated, authRole, navigate]);

  const handleLogin = async (e, force = false) => {
    if (e) e.preventDefault();
    setError('');
    setShowForceModal(false);
    
    if (!email || !password) return setError('Please enter email and password');
    setLoading(true);
    
    try {
      const assignedRole = await login(email, password, force);
      navigate(assignedRole === 'Cashier' ? '/cashier' : '/admin', { replace: true });
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'ALREADY_LOGGED_IN') {
        setShowForceModal(true);
      } else {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const bizName = 'Vendharaa Billing';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      {/* Left panel — login form */}
      <div style={{
        width: 440, background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 40px', minHeight: '100vh',
        boxShadow: '4px 0 40px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1, flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #0f172a, #334155)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(15,23,42,0.3)', marginBottom: 20,
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              : <Shield size={24} color="#fff" />
            }
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
            {bizName}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 400 }}>
            Enterprise Multi-Tenant Billing
          </p>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          Secure Authentication
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
          Enter your credentials to access your business portal
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 16, fontSize: 13, color: '#dc2626',
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label className="pro-label">Account Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="login-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="pro-input" style={{ paddingLeft: 38 }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label className="pro-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="login-password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pro-input" style={{ paddingLeft: 38 }}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14, background: '#0f172a' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (<><span>Log In</span><ArrowRight size={16} /></>)}
          </button>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: 36, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          © {new Date().getFullYear()} {bizName} · Powered by Vendharaa
        </div>
      </div>

      {/* Right hero panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 60, textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, background: 'rgba(255,255,255,0.06)',
          borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <LayoutGrid size={36} color="#94a3b8" />
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1.2, marginBottom: 16 }}>
          Unified Business<br />Operations
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 420, lineHeight: 1.7 }}>
          Access your specialized industry portal. One platform, multiple solutions for Agro, Pharma, and beyond.
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
          {[
            { label: 'Security', value: 'AES-256' },
            { label: 'Latency', value: '<50ms' },
            { label: 'SLA', value: '99.9%' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Single Device Session Modal */}
      {showForceModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: 400, background: '#fff', borderRadius: 16, padding: 32,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, background: '#fff1f2', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#e11d48'
            }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Active Session Detected
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
              You are currently logged in on another device. Would you like to log out of the other session and continue here?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setShowForceModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, background: '#0f172a', padding: '12px' }}
                onClick={() => handleLogin(null, true)}
              >
                Logout Old Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
