import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role: authRole } = useAuth();
  const { pharmacyName, logoUrl } = useApp();

  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(authRole === 'Cashier' ? '/cashier' : '/admin', { replace: true });
    }
  }, [isAuthenticated, authRole, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Please enter email and password');
    setLoading(true);
    try {
      const assignedRole = await login(email, password, role);
      navigate(assignedRole === 'Cashier' ? '/cashier' : '/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bizName = pharmacyName || 'AgroMart';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0d1f1a 0%, #0f2d1f 40%, #0d1f1a 100%)',
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
            background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(45,106,79,0.4)', marginBottom: 20,
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              : <Leaf size={24} color="#fff" />
            }
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
            {bizName}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 400 }}>
            Farm Supply Billing System
          </p>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          Sign in to your account
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
          Enter your credentials to access the portal
        </p>

        {/* Role selector */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Account Type
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['admin', 'cashier'].map(r => (
              <button
                key={r} type="button" onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  border: role === r ? '2px solid #2d6a4f' : '2px solid #e2e8f0',
                  background: role === r ? '#f0fdf4' : '#fff',
                  color: role === r ? '#2d6a4f' : '#64748b',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  textTransform: 'capitalize', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Shield size={13} />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

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
            <label className="pro-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="login-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
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
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : (<><span>Sign In</span><ArrowRight size={16} /></>)}
          </button>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: 36, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          © {new Date().getFullYear()} {bizName} · Powered by Green Dwarf Tech
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
          <Leaf size={36} color="#6ee7b7" />
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1.2, marginBottom: 16 }}>
          Farm Supply<br />Management
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 360, lineHeight: 1.7 }}>
          Complete wholesale billing and inventory management for agricultural supply businesses.
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
          {[
            { label: 'Products', value: '15+' },
            { label: 'GST Ready', value: '100%' },
            { label: 'A4 Invoices', value: '✓' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#6ee7b7' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
