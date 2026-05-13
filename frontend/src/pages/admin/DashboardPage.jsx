import React, { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, AlertTriangle, Clock, TrendingUp, Package,
  ArrowUp, ArrowDown, Plus, FileText, Users
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import api from '../../services/api';
import { formatCurrency, relativeTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { businessType } = useAuth();
  const isPharma = businessType === 'pharma';

  const [totalSales, setTotalSales] = useState(0);
  const [weeklySales, setWeeklySales] = useState([]);
  const [pendingBills, setPendingBills] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

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
      const weekly = weekDays.map((d) => ({ name: d, sales: salesMap[d] || 0, profit: Math.round((salesMap[d] || 0) * 0.25) }));

      setTotalSales(total);
      setWeeklySales(weekly);
      setPendingBills(bills.filter((b) => !b.paid).length || 0);

      const recent = (bills.slice().reverse() || []).slice(0, 5).map((b) => ({
        id: b.invoice || b._id || '—',
        customer: b.customerName || 'Walk-in',
        amount: formatCurrency(b.total || 0),
        time: relativeTime(b.createdAt),
        status: b.paid ? 'Paid' : 'Pending',
      }));
      setRecentBills(recent);

      const productsRes = await api.get('/products');
      const products = productsRes.data || [];

      let low = 0;
      let expiring = 0;
      const categoryCounts = {};

      products.forEach((p) => {
        if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        if (isPharma) {
          (p.batches || []).forEach((b) => {
            if (b.quantity <= 0) return;
            if (b.quantity < 10) low++;
            if (b.expiryDate) {
              const days = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
              if (days > 0 && days <= 30) expiring++;
            }
          });
        } else {
          if (p.quantity < 10 && p.quantity > 0) low++;
        }
      });

      setLowStock(low);
      setExpiringSoon(expiring);

      const catColors = isPharma ? 
        ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#60a5fa'] :
        ['#10b981', '#059669', '#047857', '#065f46', '#34d399'];

      const categoryArray = Object.entries(categoryCounts).map(([name, count], i) => ({
        name, value: count, color: catColors[i % catColors.length],
      }));
      setCategoryData(categoryArray);

      const custRes = await api.get('/customers');
      setTotalCustomers(Array.isArray(custRes.data) ? custRes.data.length : (custRes.data?.data?.length || 0));

      const top = products
        .map((p) => ({ name: p.name || p._id, sold: p.soldQty || 0, revenue: (p.soldQty || 0) * (p.price || 0) }))
        .sort((a, b) => b.sold - a.sold).slice(0, 5);
      setTopProducts(top);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalSales), icon: DollarSign, iconBg: 'bg-accent-100', iconColor: 'text-accent' },
    { label: 'Pending Bills', value: pendingBills, icon: ShoppingCart, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: isPharma ? 'Short Expiry' : 'Total Customers', value: isPharma ? expiringSoon : totalCustomers, icon: isPharma ? Clock : Users, iconBg: isPharma ? 'bg-purple-100' : 'bg-blue-100', iconColor: isPharma ? 'text-purple-600' : 'text-blue-600' },
    { label: 'Low Stock', value: lowStock, icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  return (
    <div>
      <PageHeader
        title={isPharma ? "Pharma Dashboard" : "Agro Dashboard"}
        subtitle={`Live overview of your ${businessType} business performance`}
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Dashboard' }]}
      />

      <div className="page-content space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value}
              iconBg={s.iconBg} iconColor={s.iconColor}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sales Trend</h3>
                <p className="text-[11px] text-slate-500">Weekly revenue overview</p>
              </div>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: 12 }} />
                <Line type="monotone" dataKey="sales" stroke="var(--accent)" strokeWidth={3} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card-pro" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory Split</h3>
                <p className="text-[11px] text-slate-500">Categorical distribution</p>
              </div>
              <Package className="w-5 h-5 text-accent" />
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

        {/* Top Products + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card-pro lg:col-span-2 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 20 }}>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Performing Items</h3>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Sold</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="font-bold text-slate-700">{p.name}</td>
                      <td className="text-right font-medium text-slate-500">{p.sold}</td>
                      <td className="text-right font-black text-slate-900">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-pro overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between" style={{ padding: 20 }}>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Activity</h3>
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div className="p-4 space-y-4">
              {recentBills.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-hover hover:border-accent/30">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{b.customer}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{b.id} · {b.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{b.amount}</p>
                    <span className={`text-[9px] font-black uppercase ${b.status === 'Paid' ? 'text-emerald-600' : 'text-orange-500'}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
