import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';
import api from '../../../services/api';
import notify from '../../../components/ui/notify';
import { useAuth } from '../../../context/AuthContext';

function Toggle({ checked, onChange, isPharma }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? (isPharma ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SecuritySettings() {
  const { businessType } = useAuth();
  const isPharma = businessType === 'pharma';
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });
  const [changingPwd, setChangingPwd] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/general-settings/get');
        if (res.data?.success && res.data.data) {
          const s = res.data.data;
          if (typeof s.sessionTimeoutEnabled === 'boolean') setSessionTimeout(s.sessionTimeoutEnabled);
          if (s.sessionTimeoutMinutes) setTimeoutMinutes(Number(s.sessionTimeoutMinutes));
        }
      } catch {}
    })();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.newPwd || !passwords.confirm) return notify('All fields required', 'error');
    if (passwords.newPwd !== passwords.confirm) return notify('Passwords do not match', 'error');
    if (passwords.newPwd.length < 6) return notify('Password must be at least 6 characters', 'error');

    setChangingPwd(true);
    try {
      const res = await api.post('/users/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPwd,
        confirmPassword: passwords.confirm,
      });
      if (res.data?.success) { notify('Password updated', 'success'); setPasswords({ current: '', newPwd: '', confirm: '' }); }
      else notify(res.data?.message || 'Failed to update', 'error');
    } catch (err) { notify(err.response?.data?.message || 'Server error', 'error'); }
    setChangingPwd(false);
  };

  const saveTimeout = async (enabled, minutes) => {
    try {
      await api.post('/general-settings/save', {
        sessionTimeoutEnabled: enabled,
        sessionTimeoutMinutes: minutes,
      });
      // Broadcast to other tabs
      try {
        localStorage.setItem('settings_updated', JSON.stringify({ sessionTimeoutEnabled: enabled, sessionTimeoutMinutes: minutes, ts: Date.now() }));
        setTimeout(() => localStorage.removeItem('settings_updated'), 100);
      } catch {}
    } catch (err) { console.error('Failed to save timeout settings:', err); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handlePasswordChange} className="card-pro" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <Lock size={20} className={isPharma ? "text-blue-600" : "text-emerald-600"} />
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account Security</h2>
            <p className="text-[11px] text-slate-500">Change your login credentials</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="md:col-span-2"><label className="pro-label">Current Password</label><input type="password" value={passwords.current} onChange={e => setPasswords(p => ({...p, current: e.target.value}))} className="pro-input" placeholder="••••••••" /></div>
          <div><label className="pro-label">New Password</label><input type="password" value={passwords.newPwd} onChange={e => setPasswords(p => ({...p, newPwd: e.target.value}))} className="pro-input" placeholder="••••••••" /></div>
          <div><label className="pro-label">Confirm New Password</label><input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({...p, confirm: e.target.value}))} className="pro-input" placeholder="••••••••" /></div>
        </div>
        <div className="pt-5 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={changingPwd} className="btn-primary"><Lock size={15} /> {changingPwd ? 'Updating…' : 'Update Password'}</button>
        </div>
      </form>

      <div className="card-pro" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <Shield size={20} className={isPharma ? "text-blue-600" : "text-emerald-600"} />
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">System Guard Settings</h2>
            <p className="text-[11px] text-slate-500">Configure authentication policies</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
            <div><p className="text-sm font-bold text-slate-800">Multi-Factor Authentication</p><p className="text-[11px] text-slate-500 mt-0.5">Extra layer of security for your account</p></div>
            <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} isPharma={isPharma} />
          </div>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
            <div><p className="text-sm font-bold text-slate-800">Auto-Termination Policy</p><p className="text-[11px] text-slate-500 mt-0.5">End sessions after inactivity period</p></div>
            <div className="flex items-center gap-4">
              <Toggle checked={sessionTimeout} onChange={() => { const v = !sessionTimeout; setSessionTimeout(v); saveTimeout(v, timeoutMinutes); }} isPharma={isPharma} />
              <div className="flex items-center gap-2">
                <input type="number" min={1} value={timeoutMinutes}
                  onChange={e => { const v = Number(e.target.value) || 1; setTimeoutMinutes(v); saveTimeout(sessionTimeout, v); }}
                  className="pro-input !py-1.5 !w-16 text-center font-bold" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
