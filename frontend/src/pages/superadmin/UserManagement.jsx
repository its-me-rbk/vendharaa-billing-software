import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, Shield, X, Save, Eye, Calendar, MapPin, Activity } from 'lucide-react';
import superAdminService from '../../services/superAdminService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'sonner';

function UserDetailsModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        <div className="relative h-32 bg-slate-900">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
          <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-3xl bg-white p-2 shadow-xl border border-slate-100">
            <div className="w-full h-full rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 text-3xl font-black uppercase">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 mt-1">
              <Mail size={14} />
              <span className="text-sm font-medium">{user.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Role</div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-slate-900" />
                <span className="font-bold text-slate-700 capitalize">{user.role}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Unit</div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                <span className="font-bold text-slate-700 uppercase">{user.businessType}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.status === 'inactive' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="font-bold text-slate-700 capitalize">{user.status || 'Active'}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined On</div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="font-bold text-slate-700">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}

function UserFormModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'admin', businessType: 'agro', status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'admin',
        businessType: user.businessType || 'agro',
        status: user.status || 'active'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await superAdminService.updateUser(user._id, formData);
        toast.success('User updated successfully');
      } else {
        await superAdminService.addUser(formData);
        toast.success('User invited successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Users size={18} className="text-slate-900" /></div>
            <div><h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit User' : 'Invite New User'}</h2><p className="text-[11px] text-slate-500 mt-0.5">{isEdit ? 'Modify user permissions' : 'Create a new system account'}</p></div>
          </div>
          <button onClick={onClose} className="action-btn"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="pro-label">Full Name</label>
              <input 
                type="text" required className="pro-input" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="pro-label">Email Address</label>
              <input 
                type="email" required className="pro-input" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="name@company.com"
                disabled={isEdit}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="pro-label">Temporary Password</label>
                <input 
                  type="password" required className="pro-input" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="pro-label">System Role</label>
                <select 
                  className="pro-input" 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="admin">Administrator</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              <div>
                <label className="pro-label">Business Unit</label>
                <select 
                  className="pro-input" 
                  value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})}
                >
                  <option value="agro">Agro</option>
                  <option value="pharma">Pharma</option>
                </select>
              </div>
              <div>
                <label className="pro-label">Account Status</label>
                <select 
                  className="pro-input" 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              <Save size={15} /> {submitting ? 'Saving…' : isEdit ? 'Update User' : 'Invite User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, user: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, user: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, user: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getUsers();
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    const user = confirmDelete.user;
    if (!user) return;
    try {
      await superAdminService.deleteUser(user._id);
      toast.success('User deleted successfully');
      setConfirmDelete({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filtered = users.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader 
        title="User Management" 
        subtitle="Manage access across all business units"
        breadcrumbs={[{ label: 'Home', href: '/superadmin' }, { label: 'Users' }]}
      >
        <button className="btn-primary" onClick={() => setModal({ open: true, user: null })}>
          <Plus size={16} /> Invite New User
        </button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Users} label="Total Users" value={users.length} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard icon={Shield} label="Admins" value={users.filter(u => u.role === 'admin').length} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <StatCard icon={Users} label="Cashiers" value={users.filter(u => u.role === 'cashier').length} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        </div>

        {/* User Directory */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ padding: '20px 24px' }}>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">User Directory</h3>
              <p className="text-[11px] text-slate-500">{filtered.length} records found</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" placeholder="Search users..." 
                className="pro-input !pl-9 !py-2 !w-full sm:!w-56" 
                value={search} onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No users found" subtitle="Invite your first staff member to get started" />
          ) : (
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th className="text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-600 text-sm">{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'superadmin' ? 'badge-purple' :
                          u.role === 'admin' ? 'badge-orange' :
                          'badge-gray'
                        }`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.businessType === 'agro' ? 'badge-green' : 'badge-blue'}`}>
                          {u.businessType.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'inactive' ? 'badge-red' : 'badge-green'}`}>
                          {(u.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => setDetailsModal({ open: true, user: u })} 
                            className="action-btn"
                            title="View Details"
                          >
                            <Eye size={14} className="text-blue-600" />
                          </button>
                          <button 
                            onClick={() => setModal({ open: true, user: u })} 
                            className="action-btn edit"
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                          {u.role !== 'superadmin' && (
                            <button 
                              onClick={() => setConfirmDelete({ open: true, user: u })} 
                              className="action-btn delete"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <UserFormModal 
          user={modal.user} 
          onClose={() => setModal({ open: false, user: null })} 
          onSaved={() => { setModal({ open: false, user: null }); fetchUsers(); }} 
        />
      )}

      {detailsModal.open && (
        <UserDetailsModal 
          user={detailsModal.user} 
          onClose={() => setDetailsModal({ open: false, user: null })} 
        />
      )}

      <ConfirmModal 
        open={confirmDelete.open}
        title="Delete User"
        message={`Are you sure you want to remove ${confirmDelete.user?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDelete({ open: false, user: null })}
        confirmText="Delete Account"
        variant="danger"
      />
    </div>
  );
}
