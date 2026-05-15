import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, ArrowLeft, Save, UserCircle } from 'lucide-react';
import api from '../../../services/api';
import notify from '../../../components/ui/notify';
import ConfirmModal from '../../../components/common/ConfirmModal';

function UserAddEditForm({ initialData, onDone }) {
  const isEdit = !!initialData;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || '');
      if (initialData.logo) {
        const url = initialData.logo.startsWith('http') || initialData.logo.startsWith('data:')
          ? initialData.logo
          : `${window.location.protocol}//${window.location.hostname}:5000${initialData.logo.startsWith('/') ? '' : '/'}${initialData.logo}`;
        setPreview(url);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || (!isEdit && !password) || !role) return notify('All fields are required', 'error');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      if (!isEdit) fd.append('password', password);
      fd.append('role', role);
      if (logo) fd.append('logo', logo);
      if (removeLogo) fd.append('removeLogo', 'true');

      if (isEdit) await api.put(`/users/${initialData._id}`, fd);
      else await api.post('/users/add', fd);

      notify(isEdit ? 'User updated' : 'User created', 'success');
      onDone();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save user', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="card-pro" style={{ padding: 24 }}>
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">
        {isEdit ? 'Edit User Account' : 'Create New User'}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div><label className="pro-label">Full Name *</label><input value={name} onChange={e => setName(e.target.value)} className="pro-input" placeholder="John Doe" required /></div>
        <div><label className="pro-label">Email Address *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pro-input" placeholder="user@company.com" required /></div>
        <div><label className="pro-label">Password {isEdit ? '(leave blank to keep)' : '*'}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="pro-input" placeholder="••••••••" required={!isEdit} /></div>
        <div><label className="pro-label">Role *</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="pro-input bg-white" required>
            <option value="">Select role</option><option value="admin">Administrator</option><option value="cashier">Cashier</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="pro-label">Profile Image</label>
          <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
            {preview && !removeLogo ? (
              <img src={preview} alt="Avatar" className="h-16 w-16 rounded-lg object-cover border border-slate-200 shadow-sm" onError={() => setPreview(null)} />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-300"><UserCircle size={28} /></div>
            )}
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setLogo(f); setPreview(URL.createObjectURL(f)); setRemoveLogo(false); } }}
                className="block text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
              {preview && !removeLogo && <button type="button" onClick={() => { setPreview(null); setLogo(null); setRemoveLogo(true); }} className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Remove image</button>}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100">
          {isEdit && <button type="button" onClick={onDone} className="btn-secondary">Cancel</button>}
          <button type="submit" disabled={saving} className="btn-primary"><Save size={15} /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}</button>
        </div>
      </form>
    </div>
  );
}

export default function UserRoleSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, user: null });

  const fetchUsers = async () => {
    try { const r = await api.get('/users'); setUsers(Array.isArray(r.data?.users) ? r.data.users : []); }
    catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  if (showForm) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setShowForm(false); setEditUser(null); fetchUsers(); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors font-medium">
          <ArrowLeft size={16} /> Back to User List
        </button>
        <UserAddEditForm initialData={editUser} onDone={() => { setShowForm(false); setEditUser(null); fetchUsers(); }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0">
        <div className="card-pro" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">User Management</h2><p className="text-[11px] text-slate-500 mt-1">Manage user accounts and permissions</p></div>
            <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add User</button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" /></div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200"><p className="text-sm text-slate-400 italic">No users found</p></div>
            ) : users.map(u => (
              <div key={u._id} className="flex items-center justify-between bg-white hover:bg-slate-50/80 border border-slate-100 rounded-xl p-4 transition-all hover:shadow-sm">
                <div className="flex items-center gap-4">
                  {u.logo ? (
                    <img src={u.logo.startsWith('http') ? u.logo : `${window.location.protocol}//${window.location.hostname}:5000${u.logo.startsWith('/') ? '' : '/'}${u.logo}`} alt="" className="h-10 w-10 rounded-lg object-cover border border-slate-200" onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">{(u.name||'?')[0].toUpperCase()}</div>
                  )}
                  <div><p className="font-bold text-slate-800 text-sm">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${u.businessType === 'agro' ? 'badge-green' : 'badge-blue'}`}>{u.businessType?.toUpperCase()}</span>
                  <span className={`badge ${u.status === 'inactive' ? 'badge-red' : 'badge-green'}`}>{u.status || 'active'}</span>
                  <span className={`badge ${u.role === 'admin' ? 'badge-green' : 'badge-gray'}`}>{u.role}</span>
                  <button onClick={() => { setEditUser(u); setShowForm(true); }} className="action-btn edit"><Edit size={14} /></button>
                  <button onClick={() => setConfirmDelete({ open: true, user: u })} className="action-btn delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="card-pro" style={{ padding: 24 }}>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Role Permissions</h2>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:border-emerald-200 transition-colors"><h3 className="text-sm font-bold text-slate-800 mb-1">Administrator</h3><p className="text-[11px] text-slate-500 leading-relaxed">Full access to all modules, financial data, and system configurations.</p></div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:border-emerald-200 transition-colors"><h3 className="text-sm font-bold text-slate-800 mb-1">Cashier</h3><p className="text-[11px] text-slate-500 leading-relaxed">Access to billing, inventory lookup, and daily checkout summary.</p></div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        open={confirmDelete.open}
        title="Delete User Account"
        message={`Are you sure you want to delete ${confirmDelete.user?.name}? This will permanently remove their access.`}
        onConfirm={async () => {
          try { 
            await api.delete(`/users/${confirmDelete.user._id}`); 
            notify('User deleted', 'success'); 
            setConfirmDelete({ open: false, user: null });
            fetchUsers(); 
          } catch { notify('Failed to delete', 'error'); }
        }}
        onCancel={() => setConfirmDelete({ open: false, user: null })}
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
}
