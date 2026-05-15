import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'danger' 
}) {
  if (!open) return null;

  const variants = {
    danger: {
      icon: <AlertTriangle className="text-rose-600" size={24} />,
      bg: 'bg-rose-50',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-600" size={24} />,
      bg: 'bg-amber-50',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    info: {
      icon: <AlertTriangle className="text-blue-600" size={24} />,
      bg: 'bg-blue-50',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const v = variants[variant] || variants.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${v.bg} flex items-center justify-center shrink-0`}>
              {v.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${v.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
