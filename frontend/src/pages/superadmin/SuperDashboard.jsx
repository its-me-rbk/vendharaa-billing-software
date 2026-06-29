import React, { useState, useEffect } from 'react';
import { LayoutGrid, TrendingUp, Users, ShoppingCart, ArrowUpRight, ArrowDownRight, Activity, Wallet } from 'lucide-react';
import superAdminService from '../../services/superAdminService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function SuperDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await superAdminService.getSummary();
      setSummary(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing enterprise data...</div>;

  const chartData = [
    { name: 'Agro', value: summary?.agroRevenue || 0, color: '#0f172a' },
    { name: 'Pharma', value: summary?.pharmaRevenue || 0, color: '#334155' },
  ];

  return (
    <div>
      <PageHeader 
        title="Consolidated Dashboard" 
        subtitle="Real-time performance metrics across all business units"
        breadcrumbs={[{ label: 'Home', href: '/superadmin' }, { label: 'Dashboard' }]}
      />

      <div className="page-content space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Global Revenue" 
            value={`₹${(summary?.totalRevenue || 0).toLocaleString()}`} 
            icon={TrendingUp} 
            iconBg="bg-slate-900/10"
            iconColor="text-slate-900"
            extra={<span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={10} /> +12.5%</span>}
          />
          <StatCard 
            label="Total Transactions" 
            value={summary?.totalBills || 0} 
            icon={ShoppingCart} 
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard 
            label="Agro Performance" 
            value={`₹${(summary?.agroRevenue || 0).toLocaleString()}`} 
            icon={Activity} 
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard 
            label="Pharma Performance" 
            value={`₹${(summary?.pharmaRevenue || 0).toLocaleString()}`} 
            icon={Activity} 
            iconBg="bg-slate-800/10"
            iconColor="text-slate-800"
          />
        </div>

        {/* Dynamic Cash Ledger Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Consolidated Inflow (Credits)" 
            value={`₹${(summary?.ledgerInsights?.totalCredits || 0).toLocaleString()}`} 
            icon={ArrowUpRight} 
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard 
            label="Consolidated Outflow (Debits)" 
            value={`₹${(summary?.ledgerInsights?.totalDebits || 0).toLocaleString()}`} 
            icon={ArrowDownRight} 
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard 
            label="Agro Ledger Net Position" 
            value={`₹${(summary?.ledgerInsights?.agroNet || 0).toLocaleString()}`} 
            icon={Wallet} 
            iconBg="bg-green-50"
            iconColor="text-green-700"
            extra={<span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Cash surplus</span>}
          />
          <StatCard 
            label="Pharma Ledger Net Position" 
            value={`₹${(summary?.ledgerInsights?.pharmaNet || 0).toLocaleString()}`} 
            icon={Wallet} 
            iconBg="bg-blue-50"
            iconColor="text-blue-700"
            extra={<span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Cash surplus</span>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Distribution */}
          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Distribution</h3>
                <p className="text-[11px] text-slate-500">Agro vs Pharma contribution</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Unit Comparison */}
          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Unit Comparisons</h3>
                <p className="text-[11px] text-slate-500">Transaction volume analysis</p>
              </div>
            </div>
            <div className="space-y-8">
              <BusinessProgress 
                label="Agro Mart" 
                value={summary?.agroRevenue} 
                total={summary?.totalRevenue} 
                color="#0f172a" 
                count={summary?.agroBillsCount}
              />
              <BusinessProgress 
                label="Pharma Care" 
                value={summary?.pharmaRevenue} 
                total={summary?.totalRevenue} 
                color="#334155" 
                count={summary?.pharmaBillsCount}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Accounts Asset Allocations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agro Accounts */}
          <div className="card-pro" style={{ padding: 24 }}>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Agro Store Accounts Allocation</h3>
            <div className="space-y-3">
              {summary?.ledgerInsights?.agroAccounts?.map(acc => (
                <div key={acc._id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <span className="font-bold text-slate-800 text-xs">{acc.name} ({acc.type})</span>
                  <span className="font-extrabold text-slate-900 text-xs">₹{acc.balance.toLocaleString()}</span>
                </div>
              ))}
              {(!summary?.ledgerInsights?.agroAccounts || summary.ledgerInsights.agroAccounts.length === 0) && (
                <p className="text-xs text-slate-400 italic">No Agro accounts found.</p>
              )}
            </div>
          </div>

          {/* Pharma Accounts */}
          <div className="card-pro" style={{ padding: 24 }}>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pharma Care Accounts Allocation</h3>
            <div className="space-y-3">
              {summary?.ledgerInsights?.pharmaAccounts?.map(acc => (
                <div key={acc._id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <span className="font-bold text-slate-800 text-xs">{acc.name} ({acc.type})</span>
                  <span className="font-extrabold text-slate-900 text-xs">₹{acc.balance.toLocaleString()}</span>
                </div>
              ))}
              {(!summary?.ledgerInsights?.pharmaAccounts || summary.ledgerInsights.pharmaAccounts.length === 0) && (
                <p className="text-xs text-slate-400 italic">No Pharma accounts found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessProgress({ label, value, total, color, count }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-3">
        <div>
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{count} Invoices</div>
        </div>
        <div className="text-sm font-black text-slate-900">₹{value?.toLocaleString()}</div>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div 
          className="h-full transition-all duration-1000 ease-out" 
          style={{ width: `${percentage}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
        />
      </div>
    </div>
  );
}
