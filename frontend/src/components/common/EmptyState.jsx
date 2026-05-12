import React from 'react';

export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon size={28} className="text-slate-300" />
        </div>
      )}
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title || 'No data found'}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-2 max-w-xs">{subtitle}</p>}
    </div>
  );
}
