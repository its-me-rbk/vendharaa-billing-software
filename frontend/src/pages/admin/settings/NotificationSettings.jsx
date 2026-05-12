import React, { useState } from 'react';
import { Bell } from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    lowStock: true,
    expiryAlerts: true,
    newOrders: false,
    dailySales: true,
  });

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when products fall below minimum threshold' },
    { key: 'expiryAlerts', label: 'Expiry Alerts', desc: 'Notifications for products approaching expiration date' },
    { key: 'newOrders', label: 'Inventory Orders', desc: 'Alert when automated supplier purchase orders are generated' },
    { key: 'dailySales', label: 'Performance Summary', desc: 'Receive end-of-day performance digest via email' },
  ];

  return (
    <div className="card-pro" style={{ padding: 24 }}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <Bell size={20} className="text-emerald-600" />
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Notification Preferences</h2>
          <p className="text-[11px] text-slate-500">Configure how you receive system alerts</p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-all">
            <div>
              <p className="text-sm font-bold text-slate-800">{item.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}
