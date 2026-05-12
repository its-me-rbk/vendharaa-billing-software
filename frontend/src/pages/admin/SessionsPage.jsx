import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLogoutInfo, setAutoLogoutInfo] = useState(null);

  useEffect(() => {
    try { const raw = localStorage.getItem('app_logout_handled'); if (raw) setAutoLogoutInfo(JSON.parse(raw)); } catch {}
    const handler = (e) => { if (e.key === 'app_logout_handled') { try { setAutoLogoutInfo(e.newValue ? JSON.parse(e.newValue) : null); } catch { setAutoLogoutInfo(null); } } };
    window.addEventListener('storage', handler);

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchEmail) params.email = searchEmail;
        if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;
        const res = await api.get('/users/sessions', { params });
        setSessions(Array.isArray(res.data) ? res.data : []);
      } catch { setSessions([]); }
      setLoading(false);
    };
    fetchSessions();
    return () => window.removeEventListener('storage', handler);
  }, [searchEmail, roleFilter, dateFrom, dateTo]);

  const calculateHours = (loginTime, logoutTime) => {
    const start = new Date(loginTime);
    const end = logoutTime ? new Date(logoutTime) : new Date();
    return `${((end - start) / (1000 * 60 * 60)).toFixed(2)} hrs`;
  };

  const formatRole = (role) => role === 'admin' ? 'Admin' : 'Cashier';
  const nowTs = Date.now();

  const activeSessions = sessions.filter(s => {
    if (s.logoutTime) return false;
    if (s.expiryTime) return new Date(s.expiryTime).getTime() > nowTs;
    return true;
  });

  const inactiveSessions = sessions.filter(s => {
    if (s.logoutTime) return true;
    if (s.expiryTime) return new Date(s.expiryTime).getTime() <= nowTs;
    return false;
  });

  return (
    <div>
      <PageHeader title="Login Session History" subtitle="View active and past user login sessions"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Sessions' }]}
      >
        <input type="text" placeholder="Search by email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} className="pro-input" style={{ minWidth: 160, width: 'auto' }} />
        <select className="pro-input" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option><option value="admin">Admin</option><option value="cashier">Cashier</option>
        </select>
        <input type="date" className="pro-input" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="pro-input" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn-secondary" onClick={() => { setSearchEmail(''); setRoleFilter('all'); setDateFrom(''); setDateTo(''); }}>Clear</button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Summary */}
        <div className="flex items-center gap-4">
          <div className="stat-card !mb-0 !py-3 !px-5"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow"></div><div><div className="stat-label">Active Users</div><div className="stat-value !text-lg">{activeSessions.length}</div></div></div></div>
          <div className="stat-card !mb-0 !py-3 !px-5"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-slate-300"></div><div><div className="stat-label">Total Logins</div><div className="stat-value !text-lg">{sessions.length}</div></div></div></div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="card-pro overflow-hidden border-emerald-100">
            <div className="border-b border-emerald-100 flex items-center gap-2 bg-emerald-50/50" style={{ padding: 24 }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">Live Active Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead><tr className="!bg-emerald-50/30"><th>User</th><th>Role</th><th>Login Time</th><th>Duration</th></tr></thead>
                <tbody>
                  {activeSessions.map(s => (
                    <tr key={s._id} className="hover:bg-emerald-50/30">
                      <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">{s.email?.charAt(0).toUpperCase()}</div><span className="font-bold text-slate-800 text-sm">{s.email}</span></div></td>
                      <td><span className={`badge ${s.role === 'admin' ? 'badge-green' : 'badge-gray'}`}>{formatRole(s.role)}</span></td>
                      <td className="text-sm text-slate-600">{new Date(s.loginTime).toLocaleString()}</td>
                      <td className="text-sm font-black text-emerald-600">{calculateHours(s.loginTime, s.logoutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historical */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50" style={{ padding: 24 }}>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Authentication Logs</h2>
            <p className="text-[11px] text-slate-500">Historical record of all system access</p>
          </div>
          <div className="overflow-x-auto">
            <table className="pro-table">
              <thead><tr><th>User</th><th>Role</th><th>Login</th><th>Logout</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Logs...</td></tr>
                ) : inactiveSessions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 italic">No historical logs found</td></tr>
                ) : inactiveSessions.map(session => {
                  const logoutTs = session.logoutTime ? new Date(session.logoutTime) : (session.expiryTime ? new Date(session.expiryTime) : null);
                  const r = session.logoutReason || session.logoutType || session.logoutStatus || null;
                  const isAuto = (r === 'expired' || r === 'auto' || r === 'timeout') || (autoLogoutInfo && logoutTs && Math.abs(logoutTs.getTime() - autoLogoutInfo.ts) < 5000);
                  let statusBadge;
                  if (isAuto) statusBadge = <span className="badge badge-orange">Timeout</span>;
                  else if (r === 'manual' || session.loggedOutBy === 'user') statusBadge = <span className="badge badge-red">Manual</span>;
                  else if (r === 'replaced') statusBadge = <span className="badge badge-gray">Replaced</span>;
                  else statusBadge = <span className="badge badge-red">Terminated</span>;

                  return (
                    <tr key={session._id}>
                      <td className="font-bold text-slate-700 text-sm">{session.email}</td>
                      <td><span className={`badge ${session.role === 'admin' ? 'badge-green' : 'badge-gray'}`}>{formatRole(session.role)}</span></td>
                      <td className="text-[11px] text-slate-500">{new Date(session.loginTime).toLocaleString()}</td>
                      <td className="text-[11px] text-slate-500">{logoutTs ? logoutTs.toLocaleString() : '—'}</td>
                      <td className="text-sm font-bold text-slate-700">{calculateHours(session.loginTime, logoutTs)}</td>
                      <td>{statusBadge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
