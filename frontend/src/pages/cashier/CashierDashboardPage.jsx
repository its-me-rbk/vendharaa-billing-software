import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Clock, TrendingUp, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, relativeTime } from '../../lib/utils';

export default function CashierDashboardPage() {
  const [totalSales, setTotalSales] = useState(0);
  const [weeklySales, setWeeklySales] = useState([]);
  const [pendingBills, setPendingBills] = useState(0);
  const [recentBills, setRecentBills] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const billsRes = await api.get('/bills');
        const bills = billsRes.data || [];
        let total = 0;
        const salesMap = {};
        bills.forEach(bill => {
          total += bill.total || 0;
          const day = new Date(bill.createdAt).toLocaleString('en-US', { weekday: 'short' });
          salesMap[day] = (salesMap[day] || 0) + (bill.total || 0);
        });
        setTotalSales(total);
        setPendingBills(bills.filter(b => !b.paid).length);
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setWeeklySales(weekDays.map(d => ({ name: d, sales: salesMap[d] || 0 })));
        setRecentBills(bills.slice().reverse().slice(0, 5).map(b => ({
          id: b.invoiceId || b._id, customer: b.customerName || 'Walk-in',
          amount: formatCurrency(b.total || 0), time: relativeTime(b.createdAt),
          status: b.paid ? 'completed' : 'pending',
        })));
      } catch { /* fail silently */ }
    };
    fetchData();
  }, []);

  return (
    <div>
      <PageHeader title="Cashier Dashboard" subtitle="Quick overview of sales activity"
        breadcrumbs={[{ label: 'Cashier' }, { label: 'Dashboard' }]}
      />
      <div className="page-content space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={DollarSign} label="Total Sales" value={formatCurrency(totalSales)} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <StatCard icon={ShoppingCart} label="Pending Bills" value={pendingBills} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard icon={Clock} label="Today" value={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })} iconBg="bg-slate-100" iconColor="text-slate-600" />
        </div>

        <div className="card-pro" style={{ padding: 24 }}>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50" style={{ padding: 20 }}>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Transactions</h3>
          </div>
          <table className="pro-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {recentBills.map(b => (
                <tr key={b.id}>
                  <td className="font-bold text-slate-700">{b.id}</td>
                  <td>{b.customer}</td>
                  <td className="font-bold">{b.amount}</td>
                  <td className="text-slate-500 text-xs">{b.time}</td>
                  <td><span className={`badge ${b.status === 'completed' ? 'badge-green' : 'badge-orange'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
