import React, { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Star, X, Save } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

function CustomerFormModal({ customer, onClose, onSaved }) {
  const isEdit = !!customer;
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) setForm({ name: customer.name||'', phone: customer.phone||'', email: customer.email||'', address: customer.address||'' });
  }, [customer]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = useCallback((f, v) => { setForm(p => ({...p, [f]: v})); if (errors[f]) setErrors(p => ({...p, [f]: null})); }, [errors]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const p = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim() };
      if (isEdit) { await api.put(`/customers/${customer._id}`, p); notify('Customer updated', 'success'); }
      else { await api.post('/customers', p); notify('Customer added', 'success'); }
      onSaved();
    } catch (err) { notify(err.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSubmitting(false); }
  };

  const fc = (f) => `pro-input ${errors[f] ? '!border-red-400' : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><Users size={18} className="text-emerald-600" /></div>
            <div><h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Customer' : 'New Customer'}</h2><p className="text-[11px] text-slate-500 mt-0.5">{isEdit ? 'Update customer info' : 'Register a new customer'}</p></div>
          </div>
          <button onClick={onClose} className="action-btn"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div><label className="pro-label">Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className={fc('name')} placeholder="Customer name" autoFocus />{errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="pro-label">Phone *</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={fc('phone')} placeholder="Phone number" type="tel" />{errors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.phone}</p>}</div>
              <div><label className="pro-label">Email</label><input value={form.email} onChange={e => set('email', e.target.value)} className={fc('email')} placeholder="email@example.com" />{errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}</div>
            </div>
            <div><label className="pro-label">Address</label><textarea value={form.address} onChange={e => set('address', e.target.value)} className="pro-input resize-none" rows={2} placeholder="Full address" /></div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary"><Save size={15} /> {submitting ? 'Saving…' : isEdit ? 'Update' : 'Add Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, customer: null });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try { const r = await api.get('/customers'); const d = r.data; setCustomers(Array.isArray(d) ? d : (d?.data || [])); }
    catch { setCustomers([]); }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/customers/${id}`); notify('Customer removed', 'success'); fetchCustomers(); }
    catch { notify('Failed to delete', 'error'); }
  };

  const filtered = customers.filter(c => { const q = search.toLowerCase(); return !q || (c.name||'').toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.email||'').toLowerCase().includes(q); });
  const totalSpent = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const totalLoyalty = customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage customer relationships and loyalty" breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Customers' }]}>
        <button className="btn-primary" onClick={() => setModal({ open: true, customer: null })}><Plus size={16} /> Add Customer</button>
      </PageHeader>
      <div className="page-content space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Total Customers" value={customers.length} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard icon={Users} label="Active" value={customers.filter(c => (c.totalSpent||0) > 0).length} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <StatCard icon={Star} label="Loyalty Points" value={totalLoyalty.toLocaleString()} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <StatCard icon={Users} label="Total Revenue" value={`₹${totalSpent.toLocaleString()}`} iconBg="bg-purple-100" iconColor="text-purple-600" />
        </div>
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ padding: '20px 24px' }}>
            <div><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Directory</h3><p className="text-[11px] text-slate-500">{filtered.length} records</p></div>
            <div className="relative w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="Search…" className="pro-input !pl-9 !py-2 !w-full sm:!w-56" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          {loading ? (<div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (<EmptyState icon={Users} title="No customers" subtitle="Add customers to build your CRM" />
          ) : (
            <div className="overflow-x-auto"><table className="pro-table"><thead><tr><th>Customer</th><th>Contact</th><th className="text-right">Total Spent</th><th className="text-center">Loyalty</th><th className="text-center w-24">Actions</th></tr></thead><tbody>
              {filtered.map(c => (<tr key={c._id}>
                <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[10px] font-bold">{(c.name||'?')[0].toUpperCase()}</div><div><div className="font-bold text-slate-800">{c.name}</div>{c.address && <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{c.address}</div>}</div></div></td>
                <td><div className="flex flex-col gap-0.5">{c.phone && <span className="text-xs text-slate-600 flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}{c.email && <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} /> {c.email}</span>}</div></td>
                <td className="text-right font-bold text-slate-900">₹{(c.totalSpent||0).toLocaleString()}</td>
                <td className="text-center"><span className="badge badge-orange">{c.loyaltyPoints||0} pts</span></td>
                <td className="text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => setModal({ open: true, customer: c })} className="action-btn edit"><Edit size={14} /></button><button onClick={() => handleDelete(c._id, c.name)} className="action-btn delete"><Trash2 size={14} /></button></div></td>
              </tr>))}
            </tbody></table></div>
          )}
        </div>
      </div>
      {modal.open && <CustomerFormModal customer={modal.customer} onClose={() => setModal({ open: false, customer: null })} onSaved={() => { setModal({ open: false, customer: null }); fetchCustomers(); }} />}
    </div>
  );
}
