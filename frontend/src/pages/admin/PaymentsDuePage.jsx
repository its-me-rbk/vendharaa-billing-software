import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Users as UsersIcon, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

export default function PaymentsDuePage() {
  const [dueBills, setDueBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsSubmitting, setPaymentsSubmitting] = useState({});
  const [amounts, setAmounts] = useState({});
  const [methods, setMethods] = useState({});
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState({});

  useEffect(() => {
    fetchBills();
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data?.success) {
        setAccounts(res.data.data || []);
      }
    } catch {
      setAccounts([]);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bills');
      setDueBills(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setDueBills([]); }
    setLoading(false);
  };

  const handlePay = async (billId) => {
    const amt = Number(amounts[billId]) || 0;
    if (amt <= 0) return notify('Enter a valid amount', 'error');

    const defaultAccId = accounts.find(a => a.name === "Cash")?._id || accounts[0]?._id;
    const accountId = selectedAccountIds[billId] || defaultAccId;
    const acc = accounts.find(a => a._id === accountId);

    setPaymentsSubmitting(prev => ({ ...prev, [billId]: true }));
    try {
      const res = await api.post(`/bills/${billId}/payments`, { 
        amount: amt, 
        method: acc?.type || 'Cash',
        accountId: acc?._id || null,
        accountName: acc?.name || 'Cash'
      });
      if (res.status >= 200 && res.status < 300) {
        notify('Payment recorded', 'success');
        setAmounts(prev => ({ ...prev, [billId]: '' }));
        fetchBills();
      } else { notify('Failed to record payment', 'error'); }
    } catch { notify('Failed to record payment', 'error'); }
    setPaymentsSubmitting(prev => ({ ...prev, [billId]: false }));
  };

  const filtered = dueBills.filter(b => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (String(b.invoice || '').toLowerCase().includes(q) || String(b.customerName || '').toLowerCase().includes(q) || String(b.customerPhone || '').toLowerCase().includes(q));
  });

  const pending = filtered.filter(b => {
    const bal = Number(b.balance || 0);
    return (!b.paid) || bal > 0 || (b.status && b.status === 'Partial') || (b.status && b.status === 'Unpaid');
  });

  const getAgingDays = (date) => {
    const diff = new Date() - new Date(date);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const overdue15 = pending.filter(b => getAgingDays(b.createdAt) >= 15 && getAgingDays(b.createdAt) < 30).length;
  const overdue30 = pending.filter(b => getAgingDays(b.createdAt) >= 30).length;

  const sortedFiltered = [...filtered].sort((a, b) => {
    // Primary sort: Pending bills first
    const aPending = !a.paid || (a.balance || 0) > 0;
    const bPending = !b.paid || (b.balance || 0) > 0;
    
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    
    // Secondary sort: By Invoice Number (descending to show latest numbers first)
    // Assumes format like INV/1234 or #1234
    const aNum = String(a.invoice || '').match(/\d+/)?.map(Number)[0] || 0;
    const bNum = String(b.invoice || '').match(/\d+/)?.map(Number)[0] || 0;
    
    if (aNum !== bNum) {
      return bNum - aNum;
    }
    
    // Fallback: Date
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div>
      <PageHeader title="Payments Due" subtitle="Pending bills are shown on top for quick action"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Payments' }]}
      >
        <input placeholder="Search invoice or customer" className="pro-input" style={{ maxWidth: 260 }} value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={fetchBills} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={AlertTriangle} label="Total Outstanding" value={`₹${pending.reduce((acc, b) => acc + (b.balance || 0), 0).toLocaleString()}`} iconBg="bg-red-100" iconColor="text-red-600" />
          <StatCard icon={Clock} label="Pending Invoices" value={pending.length} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <StatCard icon={AlertTriangle} label="15+ Days Due" value={overdue15} iconBg="bg-orange-100" iconColor="text-orange-600" />
          <StatCard icon={AlertTriangle} label="30+ Days Due" value={overdue30} iconBg="bg-red-500" iconColor="text-white" />
        </div>

        {/* Urgent Alerts */}
        {(overdue15 > 0 || overdue30 > 0) && (
          <div className="space-y-3">
            {overdue30 > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-red-900 uppercase tracking-tight">Critical Overdue Attention</p>
                    <p className="text-[11px] text-red-700 font-bold">{overdue30} bills are pending for more than 30 days. Priority follow-up required.</p>
                  </div>
                </div>
              </div>
            )}
            {overdue15 > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3">
                <Clock size={18} className="text-orange-600" />
                <p className="text-xs font-bold text-orange-800">{overdue15} bills have crossed the 15-day credit period.</p>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 flex items-center justify-between bg-slate-50/50" style={{ padding: 24 }}>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Due Management</h2>
              <p className="text-[11px] text-slate-500">Record partial or full payments for outstanding bills</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th>Invoice & Date</th>
                  <th>Customer</th>
                  <th>Billing Amounts</th>
                  <th className="w-80">Quick Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map(b => {
                  const aging = getAgingDays(b.createdAt);
                  const isPending = !b.paid || (b.balance || 0) > 0;
                  const isUrgent = isPending && aging >= 30;
                  const isWarning = isPending && aging >= 15;

                  return (
                    <React.Fragment key={b._id}>
                      <tr className={`transition-colors ${isUrgent ? 'bg-red-50/30' : isWarning ? 'bg-orange-50/20' : 'hover:bg-slate-50'}`}>
                      <td>
                        <button onClick={() => setExpandedRows(prev => ({ ...prev, [b._id]: !prev[b._id] }))}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors">
                          {expandedRows[b._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{b.invoice}</span>
                            {isUrgent && <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase">Critical</span>}
                            {isWarning && !isUrgent && <span className="text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">Overdue</span>}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(b.createdAt).toLocaleDateString('en-IN')} 
                            {isPending && <span className="ml-2 font-bold text-slate-400">({aging} days old)</span>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{b.customerName || 'Walk-in'}</span>
                          <span className="text-[10px] text-slate-500">{b.customerPhone || 'No Phone'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">Total: <span className="font-medium text-slate-800">₹{(b.total || 0).toFixed(2)}</span></span>
                          <span className="text-xs text-slate-500">Due: <span className={`font-bold ${Number(b.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{(b.balance || 0).toFixed(2)}</span></span>
                        </div>
                      </td>
                      <td>
                        {Number(b.balance || 0) > 0 ? (
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input type="number" className="pro-input !py-1.5 !pl-6 !text-xs" placeholder="Amount"
                                value={amounts[b._id] || ''} onChange={(e) => setAmounts(prev => ({ ...prev, [b._id]: e.target.value }))} />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                            </div>
                            <select className="pro-input !py-1.5 !text-xs !w-36"
                              value={selectedAccountIds[b._id] || (accounts.find(a => a.name === "Cash")?._id || (accounts[0]?._id || ''))}
                              onChange={(e) => setSelectedAccountIds(prev => ({ ...prev, [b._id]: e.target.value }))}
                            >
                              {accounts.map(a => (
                                <option key={a._id} value={a._id}>{a.name} ({a.type})</option>
                              ))}
                            </select>
                            <button onClick={() => handlePay(b._id)} disabled={paymentsSubmitting[b._id]}
                              className="btn-primary !py-1.5 !px-3 !text-[10px] uppercase font-black">
                              {paymentsSubmitting[b._id] ? '...' : 'Pay'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> SETTLED
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${b.paid ? 'badge-green' : (Number(b.balance || 0) < b.total ? 'badge-orange' : 'badge-red')}`}>
                          {b.status || (b.paid ? 'Paid' : 'Unpaid')}
                        </span>
                      </td>
                    </tr>
                    {expandedRows[b._id] && (
                      <tr className="bg-slate-50/50">
                        <td></td>
                        <td colSpan="5" className="p-0 border-b-0">
                          <div className="animate-fade-in" style={{ padding: 24 }}>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Payment Details</h4>
                            {b.payments && b.payments.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {b.payments.map((p, i) => (
                                  <div key={i} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all" style={{ padding: 20 }}>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800 text-base">₹{p.amount.toFixed(2)}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md uppercase tracking-wider">{p.method}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 italic bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 32 }}>No payment history recorded for this invoice yet.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
