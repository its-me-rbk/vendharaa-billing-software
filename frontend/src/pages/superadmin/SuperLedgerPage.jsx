import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, Calendar, X, Save, Filter, Settings, Info, Building2 } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';

/* ─── MODAL: MANAGE ACCOUNTS ─── */
function AccountsManagerModal({ selectedBusiness, onClose, onSaved }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Bank', initialBalance: '', description: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const headers = { 'x-business-type': selectedBusiness };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts', { headers });
      if (res.data?.success) setAccounts(res.data.data || []);
    } catch { setAccounts([]); }
    setLoading(false);
  }, [selectedBusiness]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleEdit = (acc) => {
    setSelectedAcc(acc);
    setForm({
      name: acc.name,
      type: acc.type,
      initialBalance: acc.initialBalance || '',
      description: acc.description || ''
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setSelectedAcc(null);
    setForm({ name: '', type: 'Bank', initialBalance: '', description: '' });
    setEditMode(false);
    setErrors({});
  };

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Account Name is required';
    if (!form.type) errs.type = 'Type is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        initialBalance: Number(form.initialBalance) || 0,
        description: form.description.trim()
      };

      if (editMode && selectedAcc) {
        await api.put(`/accounts/${selectedAcc._id}`, payload, { headers });
        notify('Account updated successfully', 'success');
      } else {
        await api.post('/accounts', payload, { headers });
        notify('Account added successfully', 'success');
      }
      handleCancelEdit();
      fetchAccounts();
      onSaved();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save account', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (['Cash', 'General Bank'].includes(name)) {
      return notify('Seeded core accounts cannot be deleted', 'error');
    }
    if (!window.confirm(`Are you sure you want to delete account "${name}"?`)) return;

    try {
      await api.delete(`/accounts/${id}`, { headers });
      notify('Account deleted', 'success');
      fetchAccounts();
      onSaved();
    } catch {
      notify('Failed to delete account', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl animate-slide-up overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[600px]">
        {/* Left Side: Create / Edit Account Form */}
        <div className="w-full md:w-5/12 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between bg-slate-50/30">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600"><Settings size={16} /></div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{editMode ? 'Edit Account' : 'New Account'}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="pro-label">Account Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={`pro-input ${errors.name ? '!border-red-400' : ''}`}
                  placeholder="e.g. HDFC Bank, SBI Bank"
                  disabled={selectedAcc && ['Cash', 'General Bank'].includes(selectedAcc.name)}
                />
                {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="pro-label">Account Type *</label>
                <select
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                  className="pro-input"
                >
                  <option value="Cash">Cash Account</option>
                  <option value="Bank">Bank Account</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                  <option value="Other">Other / Assets</option>
                </select>
              </div>

              <div>
                <label className="pro-label">Initial Balance (₹)</label>
                <input
                  type="number"
                  value={form.initialBalance}
                  onChange={e => set('initialBalance', e.target.value)}
                  className="pro-input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="pro-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className="pro-input resize-none"
                  rows={2}
                  placeholder="Account notes/details"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  <Save size={14} /> {submitting ? '...' : editMode ? 'Update' : 'Create'}
                </button>
                {editMode && (
                  <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <p className="text-[9px] text-slate-400 font-medium leading-tight mt-4">
            * Cash and General Bank accounts are seeded core accounts and cannot be deleted or renamed.
          </p>
        </div>

        {/* Right Side: Accounts List */}
        <div className="flex-1 p-6 flex flex-col min-h-0 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Accounts ({accounts.length})</h3>
            <button onClick={onClose} className="action-btn"><X size={16} /></button>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {accounts.map(acc => {
                const isCore = ['Cash', 'General Bank'].includes(acc.name);
                return (
                  <div key={acc._id} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        {acc.name}
                        <span className="text-[9px] font-black uppercase bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-600 tracking-wider">{acc.type}</span>
                      </p>
                      {acc.description && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{acc.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-xs">₹{acc.balance.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(acc)} className="action-btn edit !w-7 !h-7" title="Edit"><Edit size={12} /></button>
                        {!isCore && <button onClick={() => handleDelete(acc._id, acc.name)} className="action-btn delete !w-7 !h-7" title="Delete"><Trash2 size={12} /></button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL: MANUAL TRANSACTION FORM ─── */
function LedgerFormModal({ selectedBusiness, entry, onClose, onSaved }) {
  const isEdit = !!entry;
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'debit',
    amount: '',
    category: 'Expense',
    paymentMethod: 'Cash',
    partyName: '',
    accountId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const headers = { 'x-business-type': selectedBusiness };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts', { headers });
        if (res.data?.success) {
          const list = res.data.data || [];
          setAccounts(list);
          if (list.length > 0 && !isEdit) {
            const defaultAcc = list.find(a => a.name === 'Cash') || list[0];
            setForm(f => ({ ...f, accountId: defaultAcc._id }));
          }
        }
      } catch {}
    };
    fetchAccounts();
  }, [isEdit, selectedBusiness]);

  useEffect(() => {
    if (entry) {
      setForm({
        date: new Date(entry.date).toISOString().split('T')[0],
        description: entry.description || '',
        type: entry.type || 'debit',
        amount: entry.amount || '',
        category: entry.category || 'Expense',
        paymentMethod: entry.paymentMethod || 'Cash',
        partyName: entry.partyName || '',
        accountId: entry.accountId || ''
      });
    }
  }, [entry]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const set = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  }, [errors]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Valid amount is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.accountId) e.accountId = 'Target Account is required';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const payload = {
        date: new Date(form.date),
        description: form.description.trim(),
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        paymentMethod: form.paymentMethod,
        partyName: form.partyName.trim(),
        accountId: form.accountId
      };

      if (isEdit) {
        await api.put(`/ledger/${entry._id}`, payload, { headers });
        notify('Ledger entry updated successfully', 'success');
      } else {
        await api.post('/ledger', payload, { headers });
        notify('Ledger entry added successfully', 'success');
      }
      onSaved();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save ledger entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fc = (f) => `pro-input ${errors[f] ? '!border-red-400' : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BookOpen size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{isEdit ? 'Update transaction details' : 'Record a new ledger transaction'}</p>
            </div>
          </div>
          <button onClick={onClose} className="action-btn"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Type Toggle */}
            <div>
              <label className="pro-label">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => set('type', 'debit')}
                  className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    form.type === 'debit'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownLeft size={16} /> Outflow (Debit)
                </button>
                <button
                  type="button"
                  onClick={() => set('type', 'credit')}
                  className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    form.type === 'credit'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight size={16} /> Inflow (Credit)
                </button>
              </div>
            </div>

            {/* Account Selection */}
            <div>
              <label className="pro-label">Target Account *</label>
              <select
                value={form.accountId}
                onChange={(e) => {
                  set('accountId', e.target.value);
                  const acc = accounts.find(a => a._id === e.target.value);
                  if (acc) {
                    if (acc.type === 'Cash') set('paymentMethod', 'Cash');
                    else if (acc.type === 'UPI') set('paymentMethod', 'UPI');
                    else if (acc.type === 'Bank') set('paymentMethod', 'Bank Transfer');
                  }
                }}
                className={fc('accountId')}
              >
                <option value="">-- Choose Account --</option>
                {accounts.map(acc => (
                  <option key={acc._id} value={acc._id}>{acc.name} ({acc.type}) - Bal: ₹{acc.balance.toLocaleString()}</option>
                ))}
              </select>
              {errors.accountId && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.accountId}</p>}
            </div>

            {/* Date and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="pro-label">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="pro-input"
                />
              </div>
              <div>
                <label className="pro-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  className={fc('amount')}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1 font-medium">{errors.amount}</p>}
              </div>
            </div>

            {/* Category and Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="pro-label">Category *</label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className={fc('category')}
                >
                  <option value="Expense">Expense</option>
                  <option value="Sales">Sales</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Customer Payment">Customer Payment</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Others">Others</option>
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1 font-medium">{errors.category}</p>}
              </div>
              <div>
                <label className="pro-label">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={e => set('paymentMethod', e.target.value)}
                  className="pro-input"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="pro-label">Description *</label>
              <input
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className={fc('description')}
                placeholder="e.g. Electric bill, office supplies"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1 font-medium">{errors.description}</p>}
            </div>

            {/* Party Name */}
            <div>
              <label className="pro-label">Associated Party (Optional)</label>
              <input
                value={form.partyName}
                onChange={e => set('partyName', e.target.value)}
                className="pro-input"
                placeholder="e.g. Tenant, Landlord, Employee, Supplier"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              <Save size={15} /> {submitting ? 'Saving…' : isEdit ? 'Update' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── MAIN SUPER LEDGER PAGE ─── */
export default function SuperLedgerPage() {
  const [selectedBusiness, setSelectedBusiness] = useState('agro');
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, entry: null });
  const [showAccountsMgr, setShowAccountsMgr] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, entry: null });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'All',
    type: 'All',
    search: '',
    accountId: 'All'
  });

  const headers = { 'x-business-type': selectedBusiness };

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounts', { headers });
      if (res.data?.success) setAccounts(res.data.data || []);
    } catch { setAccounts([]); }
  }, [selectedBusiness]);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.category !== 'All') params.category = filters.category;
      if (filters.type !== 'All') params.type = filters.type.toLowerCase();
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.accountId !== 'All') params.accountId = filters.accountId;

      const res = await api.get('/ledger', { params, headers });
      if (res.data?.success) {
        setTransactions(res.data.data || []);
        setStats(res.data.stats || { totalCredit: 0, totalDebit: 0, netBalance: 0 });
      }
    } catch (err) {
      notify('Failed to load ledger transactions', 'error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedBusiness]);

  useEffect(() => {
    fetchLedger();
    fetchAccounts();
  }, [fetchLedger, fetchAccounts]);

  const handleFilterChange = (field, value) => {
    setFilters(p => ({ ...p, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: 'All',
      type: 'All',
      search: '',
      accountId: 'All'
    });
  };

  const handleDelete = async () => {
    const entry = confirmDelete.entry;
    if (!entry) return;
    try {
      await api.delete(`/ledger/${entry._id}`, { headers });
      notify('Ledger transaction deleted', 'success');
      setConfirmDelete({ open: false, entry: null });
      fetchLedger();
      fetchAccounts();
    } catch {
      notify('Failed to delete transaction', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Ledger Management"
        subtitle="Global administrative console to audit Agro and Pharma ledgers"
        breadcrumbs={[{ label: 'Home', href: '/superadmin' }, { label: 'Ledger Audit' }]}
      >
        {/* Business Selector dropdown in PageHeader */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200">
            <Building2 size={14} className="text-slate-500" />
            <select
              value={selectedBusiness}
              onChange={e => {
                setSelectedBusiness(e.target.value);
                handleResetFilters();
              }}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="agro">Vendharaa Agro Store</option>
              <option value="pharma">Vendharaa Pharma Care</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={() => setShowAccountsMgr(true)}>
            <Settings size={15} /> Manage Accounts
          </button>
          <button className="btn-primary" onClick={() => setModal({ open: true, entry: null })}>
            <Plus size={16} /> Record Transaction
          </button>
        </div>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Active Accounts Balance Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Active Accounts & Balances ({selectedBusiness === 'agro' ? 'Agro Store' : 'Pharma Care'})
            </h4>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Info size={11} />Dynamic balances auto-update</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {accounts.map(acc => {
              const bgColors = {
                'Cash': 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/50',
                'Bank': 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/60',
                'UPI': 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/60',
                'Other': 'bg-purple-50/30 border-purple-100 hover:bg-purple-50/60'
              };
              return (
                <div key={acc._id} className={`p-4 border rounded-2xl flex flex-col justify-between transition-all shadow-sm ${bgColors[acc.type] || bgColors.Cash}`}>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 tracking-wider tracking-tighter shadow-sm w-fit">{acc.type}</span>
                    <p className="font-extrabold text-slate-800 text-sm mt-2 truncate">{acc.name}</p>
                    {acc.description && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{acc.description}</p>}
                  </div>
                  <p className="text-base font-black text-slate-900 mt-4">₹{acc.balance.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={ArrowUpRight}
            label="Inflow (Total Credits)"
            value={`₹${stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={ArrowDownLeft}
            label="Outflow (Total Debits)"
            value={`₹${stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            icon={Wallet}
            label="Net Cash Position"
            value={`₹${stats.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            iconBg={stats.netBalance >= 0 ? "bg-emerald-100" : "bg-rose-100"}
            iconColor={stats.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}
            extra={
              <span className={`text-xs font-semibold ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.netBalance >= 0 ? 'Surplus Balance' : 'Deficit Balance'}
              </span>
            }
          />
        </div>

        {/* Filters Toolbar */}
        <div className="card-pro p-5 bg-white border border-slate-100 rounded-xl space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm uppercase tracking-wider">
            <Filter size={16} className="text-slate-500" />
            <span>Search & Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search description..."
                className="pro-input !pl-9"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Account filter */}
            <div>
              <select
                className="pro-input"
                value={filters.accountId}
                onChange={e => handleFilterChange('accountId', e.target.value)}
              >
                <option value="All">All Accounts</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div>
              <select
                className="pro-input"
                value={filters.type}
                onChange={e => handleFilterChange('type', e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Credit">Inflow (Credit)</option>
                <option value="Debit">Outflow (Debit)</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <select
                className="pro-input"
                value={filters.category}
                onChange={e => handleFilterChange('category', e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Expense">Expense</option>
                <option value="Sales">Sales</option>
                <option value="Purchase">Purchase</option>
                <option value="Customer Payment">Customer Payment</option>
                <option value="Supplier Payment">Supplier Payment</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="date"
                className="pro-input !pl-9"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* Date Range End */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="date"
                className="pro-input !pl-9"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="btn-secondary !py-1.5 !px-4 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ padding: '20px 24px' }}>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Ledger Transactions ({selectedBusiness === 'agro' ? 'Agro Store' : 'Pharma Care'})
              </h3>
              <p className="text-[11px] text-slate-500">{transactions.length} transactions found</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState icon={BookOpen} title="No transaction records" subtitle="Adjust filters or add a transaction to begin." />
          ) : (
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Details</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Party</th>
                    <th>Payment Method</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="whitespace-nowrap font-medium text-slate-600">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="font-bold text-slate-800">{tx.description}</div>
                        {tx.referenceType === 'Bill' && (
                          <div className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-block mt-0.5">
                            Auto Invoiced
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                          {tx.accountName || 'General Cash'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          tx.type === 'credit'
                            ? 'badge-green'
                            : 'badge-orange'
                        }`}>
                          {tx.type === 'credit' ? 'Credit (Inflow)' : 'Debit (Outflow)'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {tx.category}
                        </span>
                      </td>
                      <td className="text-slate-600 font-medium">
                        {tx.partyName || '-'}
                      </td>
                      <td className="text-xs font-semibold text-slate-500">
                        {tx.paymentMethod}
                      </td>
                      <td className={`text-right font-extrabold text-sm ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        {tx.referenceType === 'Manual' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setModal({ open: true, entry: tx })}
                              className="action-btn edit"
                              title="Edit Transaction"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ open: true, entry: tx })}
                              className="action-btn delete"
                              title="Delete Transaction"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic select-none">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {modal.open && (
        <LedgerFormModal
          selectedBusiness={selectedBusiness}
          entry={modal.entry}
          onClose={() => setModal({ open: false, entry: null })}
          onSaved={() => {
            setModal({ open: false, entry: null });
            fetchLedger();
            fetchAccounts();
          }}
        />
      )}

      {/* Accounts Manager Modal */}
      {showAccountsMgr && (
        <AccountsManagerModal
          selectedBusiness={selectedBusiness}
          onClose={() => setShowAccountsMgr(false)}
          onSaved={() => {
            fetchLedger();
            fetchAccounts();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Ledger Transaction"
        message="Are you sure you want to delete this ledger transaction? This action is permanent and cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, entry: null })}
        confirmText="Delete Transaction"
        variant="danger"
      />
    </div>
  );
}
