import React from 'react';
import { Users, Search, X, AlertTriangle, Save } from 'lucide-react';

export default function CustomerPanel({ state, onSaveNew }) {
  const { customer, setCustomer, customerSearch, setCustomerSearch, selectedCustomerId, filteredCustomers, savingCustomer, pendingInfo } = state;

  return (
    <div className="card-pro p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Customer</h3>
        <Users size={15} className="text-slate-400" />
      </div>

      {selectedCustomerId ? (
        <div className="space-y-4">
          {/* Selected customer chip */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-base flex-shrink-0">
              {(customer.name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{customer.name}</p>
              <p className="text-xs text-emerald-700 font-medium">{customer.phone}</p>
            </div>
            <button onClick={state.clearCustomer} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Pending dues alert */}
          {pendingInfo && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Outstanding Dues</p>
                <p className="text-lg font-extrabold text-red-900 mt-0.5">₹{pendingInfo.total.toFixed(2)}</p>
                <p className="text-[10px] text-red-600 mt-0.5">{pendingInfo.count} unpaid {pendingInfo.count === 1 ? 'invoice' : 'invoices'}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Search existing */}
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search registered customers..."
              className="pro-input !pl-9 !text-xs"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
            {customerSearch && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-40 max-h-48 overflow-y-auto">
                {filteredCustomers.map(c => (
                  <div
                    key={c._id}
                    onClick={() => state.selectCustomer(c)}
                    className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-800">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or new</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* New customer fields */}
          <input type="text" placeholder="Full Name *" className="pro-input !text-xs" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
          <input type="text" placeholder="Phone Number *" className="pro-input !text-xs" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
          <button
            onClick={onSaveNew}
            disabled={savingCustomer || !customer.name || !customer.phone}
            className="btn-secondary !w-full !justify-center !text-xs !py-2.5"
          >
            <Save size={13} />
            {savingCustomer ? 'Registering...' : 'Quick Register'}
          </button>
        </div>
      )}
    </div>
  );
}
