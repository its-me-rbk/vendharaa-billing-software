import React, { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, AlertTriangle, Clock, TrendingUp, Package,
  ArrowUp, ArrowDown, Plus, FileText,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import api from '../../services/api';
import { formatCurrency, relativeTime } from '../../lib/utils';

export default function DashboardPage() {
  const [totalSales, setTotalSales] = useState(0);
  const [weeklySales, setWeeklySales] = useState([]);
  const [pendingBills, setPendingBills] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const billsRes = await api.get('/bills');
      const bills = billsRes.data || [];

      let total = 0;
      const salesMap = {};
      bills.forEach((bill) => {
        total += bill.total || 0;
        const day = new Date(bill.createdAt).toLocaleString('en-US', { weekday: 'short' });
        salesMap[day] = (salesMap[day] || 0) + (bill.total || 0);
      });

      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekly = weekDays.map((d) => ({ name: d, sales: salesMap[d] || 0, profit: Math.round((salesMap[d] || 0) * 0.3) }));

      setTotalSales(total);
      setWeeklySales(weekly);
      setPendingBills(bills.filter((b) => !b.paid).length || 0);

      const recent = (bills.slice().reverse() || []).slice(0, 5).map((b) => ({
        id: b.invoiceId || b._id || '—',
        customer: b.customer?.name || b.customerName || 'Unknown',
        amount: formatCurrency(b.total || 0),
        time: relativeTime(b.createdAt),
        status: b.paid ? 'completed' : 'pending',
      }));
      setRecentBills(recent);

      const productsRes = await api.get('/products');
      const products = productsRes.data || [];

      let low = 0;
      let expiring = 0;
      const categoryCounts = {};

      products.forEach((p) => {
        if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        (p.batches || []).forEach((b) => {
          if (b.quantity <= 0) return;
          if (b.quantity < 10) low++;
          if (b.expiryDate) {
            const days = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
            if (days > 0 && days <= 30) expiring++;
          }
        });
      });

      setLowStock(low);
      setExpiringSoon(expiring);

      const catColors = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#0ea5a4', '#0e7490'];
      const categoryArray = Object.entries(categoryCounts).map(([name, count], i) => ({
        name, value: count, color: catColors[i % catColors.length],
      }));
      setCategoryData(categoryArray.length ? categoryArray : [
        { name: 'Prescription', value: 35, color: '#14b8a6' },
        { name: 'OTC', value: 25, color: '#0d9488' },
        { name: 'Supplements', value: 20, color: '#0f766e' },
      ]);

      try {
        const topRes = await api.get('/products/top-performing');
        setTopProducts(topRes.data || []);
      } catch {
        const top = products
          .map((p) => ({ name: p.name || p._id, sold: p.soldQty || 0, revenue: formatCurrency((p.soldQty || 0) * (p.price || 0)) }))
          .sort((a, b) => b.sold - a.sold).slice(0, 5);
        setTopProducts(top);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total Sales', value: formatCurrency(totalSales), icon: DollarSign, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', extra: <span className="text-emerald-600"><TrendingUp size={10} /> +12.5%</span> },
    { label: 'Pending Bills', value: pendingBills, icon: ShoppingCart, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Low Stock Items', value: lowStock, icon: AlertTriangle, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: 'Expiring Soon', value: expiringSoon, icon: Clock, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Dashboard' }]}
      >
        <button className="btn-primary"><Plus className="w-4 h-4" /> Create Bill</button>
        <button className="btn-secondary"><FileText className="w-4 h-4" /> Export</button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value}
              iconBg={s.iconBg} iconColor={s.iconColor} extra={s.extra}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sales Overview</h3>
                <p className="text-[11px] text-slate-500">Weekly sales and profit trends</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySales} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="profit" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sales by Category</h3>
                <p className="text-[11px] text-slate-500">Product category breakdown</p>
              </div>
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card-pro lg:col-span-2 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 20 }}>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Selling Products</h3>
                <p className="text-[11px] text-slate-500">Best performers this week</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Product</th>
                    <th className="text-right">Units Sold</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-slate-400">No data</td></tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr key={p.name || i}>
                        <td>
                          <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">{i + 1}</div>
                        </td>
                        <td className="font-bold text-slate-700">{p.name || p._id}</td>
                        <td className="text-right font-medium text-slate-500">{p.sold || p.soldQty || 0}</td>
                        <td className="text-right font-black text-slate-900">{p.revenue || formatCurrency((p.sold || p.soldQty || 0) * (p.price || 0))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-pro overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 20 }}>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Alerts</h3>
                <p className="text-[11px] text-slate-500">Requires attention</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div style={{ padding: 20 }} className="space-y-3">
              {expiringSoon > 0 && (
                <div className="p-3 rounded-lg border-l-4 bg-red-50 border-red-500">
                  <p className="text-xs font-bold text-red-900">{expiringSoon} batches expiring within 30 days</p>
                </div>
              )}
              {lowStock > 0 && (
                <div className="p-3 rounded-lg border-l-4 bg-orange-50 border-orange-500">
                  <p className="text-xs font-bold text-orange-900">{lowStock} low stock batches</p>
                </div>
              )}
              {lowStock === 0 && expiringSoon === 0 && (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No alerts — all clear!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 20 }}>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Transactions</h3>
              <p className="text-[11px] text-slate-500">Latest billing activity</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-bold text-slate-700">{bill.id}</td>
                    <td>{bill.customer}</td>
                    <td className="font-bold">{bill.amount}</td>
                    <td className="text-slate-500 text-xs">{bill.time}</td>
                    <td>
                      <span className={`badge ${bill.status === 'completed' ? 'badge-green' : 'badge-orange'}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
