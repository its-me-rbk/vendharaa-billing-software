import React from 'react';

export default function StatusBadge({ status, size = 'sm' }) {
  const statusMap = {
    Paid: 'badge-green',
    paid: 'badge-green',
    completed: 'badge-green',
    Settled: 'badge-green',
    active: 'badge-green',
    Partial: 'badge-orange',
    partial: 'badge-orange',
    pending: 'badge-orange',
    Unpaid: 'badge-red',
    unpaid: 'badge-red',
    Overdue: 'badge-red',
    Expired: 'badge-red',
    expired: 'badge-red',
    Timeout: 'badge-orange',
    Manual: 'badge-red',
    Terminated: 'badge-red',
    Replaced: 'badge-gray',
    admin: 'badge-green',
    cashier: 'badge-gray',
  };

  const badgeClass = statusMap[status] || 'badge-gray';
  const label = String(status || 'Unknown').charAt(0).toUpperCase() + String(status || 'Unknown').slice(1);

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}
