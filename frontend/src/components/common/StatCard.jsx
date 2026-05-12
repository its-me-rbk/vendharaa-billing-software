import React from 'react';

export default function StatCard({ icon: Icon, label, value, iconBg, iconColor, extra }) {
  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-icon ${iconBg || 'bg-emerald-100'} ${iconColor || 'text-emerald-600'}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {extra && <div className="stat-change">{extra}</div>}
      </div>
    </div>
  );
}
