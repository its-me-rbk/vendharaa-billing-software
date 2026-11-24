import React, { useEffect, useState, useCallback } from 'react';
import { Truck, Plus, Search, Edit, Trash2, Phone, Mail, X, Save, Building2, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';

const SUPPLIER_DRAFT_KEY = 'draft_supplier_form';
const EMPTY_SUPPLIER_FORM = { name: '', company: '', phone: '', email: '', address: '', gst: '' };

function SupplierFormModal({ supplier, onClose, onSaved }) {
  const isEdit = !!supplier;
  const [form, setForm] = useState(() => {
    if (supplier) return EMPTY_SUPPLIER_FORM;
    try {
      const saved = JSON.parse(localStorage.getItem(SUPPLIER_DRAFT_KEY) || 'null');
      return saved ? { ...EMPTY_SUPPLIER_FORM, ...saved } : EMPTY_SUPPLIER_FORM;
    } catch {
      return EMPTY_SUPPLIER_FORM;
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier) setForm({ name: supplier.name||'', company: supplier.company||'', phone: supplier.phone||'', email: supplier.email||'', address: supplier.address||'', gst: supplier.gst||'' });
  }, [supplier]);

  useEffect(() => {
    if (isEdit) return;
    try { localStorage.setItem(SUPPLIER_DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form, isEdit]);

  const handleClear = () => {
    setForm(EMPTY_SUPPLIER_FORM);
    setErrors({});
    try { localStorage.removeItem(SUPPLIER_DRAFT_KEY); } catch { /* ignore */ }
  };

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
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const p = { name: form.name.trim(), company: form.company.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(), gst: form.gst.trim() };
      if (isEdit) { await api.put(`/suppliers/${supplier._id}`, p); notify('Supplier updated', 'success'); }
      else { await api.post('/suppliers', p); try { localStorage.removeItem(SUPPLIER_DRAFT_KEY); } catch { /* ignore */ } notify('Supplier added', 'success'); }
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
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Truck size={18} className="text-blue-600" /></div>
            <div><h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Supplier' : 'New Supplier'}</h2><p className="text-[11px] text-slate-500 mt-0.5">{isEdit ? 'Update supplier details' : 'Add a new vendor'}</p></div>
          </div>
          <button onClick={onClose} className="action-btn"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div><label className="pro-label">Contact Person *</label><input value={form.name} onChange={e => set('name', e.target.value)} className={fc('name')} placeholder="Full name" autoFocus />{errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}</div>
            <div><label className="pro-label">Company</label><input value={form.company} onChange={e => set('company', e.target.value)} className="pro-input" placeholder="Company / Brand" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="pro-label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="pro-input" placeholder="Phone" type="tel" /></div>
              <div><label className="pro-label">Email</label><input value={form.email} onChange={e => set('email', e.target.value)} className={fc('email')} placeholder="email@co.com" />{errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}</div>
            </div>
            <div><label className="pro-label">Address</label><textarea value={form.address} onChange={e => set('address', e.target.value)} className="pro-input resize-none" rows={2} placeholder="Street, City, State" /></div>
            <div><label className="pro-label">GST Number</label><input value={form.gst} onChange={e => set('gst', e.target.value)} className="pro-input font-mono" placeholder="22AAAAA0000A1Z5" /></div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <div>
              {!isEdit && (
                <button type="button" onClick={handleClear} className="btn-secondary !text-xs">
                  <RotateCcw size={14} /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary"><Save size={15} /> {submitting ? 'Saving…' : isEdit ? 'Update' : 'Add Supplier'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, supplier: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, supplier: null });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try { const r = await api.get('/suppliers'); const d = r.data; setSuppliers(Array.isArray(d) ? d : (d?.data || [])); }
    catch { setSuppliers([]); }
    setLoading(false);
  };

  const handleDelete = async () => {
    const supplier = confirmDelete.supplier;
    if (!supplier) return;
    try { 
      await api.delete(`/suppliers/${supplier._id}`); 
      notify('Supplier removed', 'success'); 
      setConfirmDelete({ open: false, supplier: null });
      fetchSuppliers(); 
    }
    catch { notify('Failed to delete', 'error'); }
  };

  const filtered = suppliers.filter(s => { const q = search.toLowerCase(); return !q || (s.name||'').toLowerCase().includes(q) || (s.company||'').toLowerCase().includes(q) || (s.phone||'').includes(q); });

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Manage vendor relationships" breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Suppliers' }]}>
        <button className="btn-primary" onClick={() => setModal({ open: true, supplier: null })}><Plus size={16} /> Add Supplier</button>
      </PageHeader>
      <div className="page-content space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Truck} label="Total Suppliers" value={suppliers.length} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard icon={Building2} label="Companies" value={new Set(suppliers.map(s => s.company).filter(Boolean)).size} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <StatCard icon={Truck} label="GST Registered" value={suppliers.filter(s => s.gst).length} iconBg="bg-purple-100" iconColor="text-purple-600" />
        </div>
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ padding: '20px 24px' }}>
            <div><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Supplier Directory</h3><p className="text-[11px] text-slate-500">{filtered.length} records</p></div>
            <div className="relative w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="Search…" className="pro-input !pl-9 !py-2 !w-full sm:!w-56" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          {loading ? (<div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (<EmptyState icon={Truck} title="No suppliers" subtitle="Add vendors to get started" />
          ) : (
            <div className="overflow-x-auto"><table className="pro-table"><thead><tr><th>Supplier</th><th>Company</th><th>Contact</th><th>GST</th><th className="text-center w-24">Actions</th></tr></thead><tbody>
              {filtered.map(s => (<tr key={s._id}>
                <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">{(s.name||'?')[0].toUpperCase()}</div><span className="font-bold text-slate-800">{s.name}</span></div></td>
                <td className="text-slate-600">{s.company || '—'}</td>
                <td><div className="flex flex-col gap-0.5">{s.phone && <span className="text-xs text-slate-600 flex items-center gap-1"><Phone size={10} /> {s.phone}</span>}{s.email && <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} /> {s.email}</span>}{!s.phone && !s.email && <span className="text-xs text-slate-300 italic">No contact</span>}</div></td>
                <td>{s.gst ? <span className="font-mono text-xs">{s.gst}</span> : <span className="text-xs text-slate-300 italic">N/A</span>}</td>
                <td className="text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => setModal({ open: true, supplier: s })} className="action-btn edit"><Edit size={14} /></button><button onClick={() => setConfirmDelete({ open: true, supplier: s })} className="action-btn delete"><Trash2 size={14} /></button></div></td>
              </tr>))}
            </tbody></table></div>
          )}
        </div>
      </div>
      {modal.open && <SupplierFormModal supplier={modal.supplier} onClose={() => setModal({ open: false, supplier: null })} onSaved={() => { setModal({ open: false, supplier: null }); fetchSuppliers(); }} />}
      
      <ConfirmModal 
        open={confirmDelete.open}
        title="Remove Supplier"
        message={`Are you sure you want to remove ${confirmDelete.supplier?.name}? This will delete their vendor profile.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, supplier: null })}
        confirmText="Remove Supplier"
        variant="danger"
      />
    </div>
  );
}
