import React, { useEffect, useState } from 'react';
import { Download, FileText, TrendingUp, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { MdOutlinePlaylistAddCheck } from 'react-icons/md';
import { BarChart as ReBarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { formatDate } from '../../lib/utils';

const pieColors = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#0d9488', '#0e7490'];

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    api.get('/reports/summary').then(r => setSummary(r.data)).catch(console.error);
    api.get('/reports/top-products').then(r => setTopProducts(r.data)).catch(console.error);
    api.get('/reports/expiring-products').then(r => setExpiringProducts(r.data)).catch(console.error);
    api.get('/reports/sales-trend').then(r => setSalesTrend(r.data)).catch(console.error);
    api.get('/reports/category-distribution').then(r => setCategoryData(r.data)).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Generate insights and export reports"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Reports' }]}
      >
        <button className="btn-secondary"><Download className="w-4 h-4" /> Export PDF</button>
        <button className="btn-primary"><FileText className="w-4 h-4" /> Generate Report</button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Filters */}
        <div className="card-pro flex flex-wrap items-center justify-between gap-4" style={{ padding: 16 }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Period</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100">7 Days</button>
                <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-500 text-[11px] font-bold rounded-lg transition-colors">30 Days</button>
                <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-500 text-[11px] font-bold rounded-lg transition-colors">Yearly</button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={DollarSign} label="Total Revenue" value={`₹${(summary?.totalRevenue || 0).toLocaleString()}`} iconBg="bg-emerald-100" iconColor="text-emerald-600"
            extra={<span className="text-emerald-600 flex items-center gap-1"><TrendingUp size={10} /> +{summary?.revenueChange || '0%'}</span>} />
          <StatCard icon={TrendingUp} label="Net Profit" value={`₹${(summary?.totalProfit || 0).toLocaleString()}`} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard icon={Package} label="Units Dispatched" value={summary?.itemsSold || 0} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <StatCard icon={BarChart3} label="Avg. Ticket Size" value={`₹${summary?.avgOrderValue?.toFixed(0) || 0}`} iconBg="bg-slate-100" iconColor="text-slate-600" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue & Profit</h3>
                <p className="text-[11px] text-slate-500">Historical performance</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={salesTrend} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: 12 }} />
                  <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="profit" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory Distribution</h3>
                <p className="text-[11px] text-slate-500">Category-wise allocation</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="sales">
                    {categoryData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="card-pro overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 24 }}>
              <div><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top SKUs</h3><p className="text-[11px] text-slate-500">Highest velocity items</p></div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead><tr><th>Product</th><th className="text-right">Revenue</th><th className="text-right">Sold</th><th className="text-center">Trend</th></tr></thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="font-bold text-slate-700">{p.product || p.name}</td>
                      <td className="text-right font-black text-slate-900">₹{(p.revenue || 0).toLocaleString()}</td>
                      <td className="text-right font-medium text-slate-500">{p.soldQty || p.quantity || 0} units</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${(p.growth || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {p.growth >= 0 ? '+' : ''}{p.growth || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-pro overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 24 }}>
              <div><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory Alerts</h3><p className="text-[11px] text-slate-500">Critical notifications</p></div>
              <AlertTriangle size={16} className="text-orange-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead><tr><th>Product</th><th>Batch</th><th className="text-center">Expiry</th><th className="text-right">Value</th></tr></thead>
                <tbody>
                  {expiringProducts.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center"><MdOutlinePlaylistAddCheck size={32} className="text-slate-200 mb-2" /><span className="text-[10px] font-bold text-slate-300 uppercase">No critical alerts</span></div>
                    </td></tr>
                  ) : expiringProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="font-bold text-slate-700">{p.product || p.name}</td>
                      <td className="text-xs font-mono text-slate-500">{p.batch}</td>
                      <td className="text-center"><span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full">{formatDate(p.expiryDate)}</span></td>
                      <td className="text-right font-black text-slate-900">₹{(p.value || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
