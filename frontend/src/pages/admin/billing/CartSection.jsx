import React from 'react';
import { Search, Plus, Trash2, ShoppingCart } from 'lucide-react';

export default function CartSection({ state, onAddItem, onUpdateQty, onRemoveItem }) {
  const { productSearch, setProductSearch, selectedProduct, setSelectedProduct, qty, setQty, filteredProducts, items } = state;

  return (
    <div className="space-y-6">
      {/* Product Search */}
      <div className="card-pro p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Add Product</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live Stock
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or scan barcode..."
              className="pro-input !pl-10"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-56 overflow-y-auto animate-slide-up">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No products found</p>
                ) : filteredProducts.map(p => (
                  <div
                    key={p._id}
                    onClick={() => { setSelectedProduct(p.name); setProductSearch(p.name); }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₹{p.price}</p>
                      <p className={`text-[10px] font-bold ${p.quantity < 10 ? 'text-red-500' : 'text-slate-400'}`}>Stock: {p.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="number"
            placeholder="Qty"
            className="pro-input !w-20 !text-center font-bold"
            value={qty}
            onChange={e => setQty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddItem()}
          />
          <button onClick={onAddItem} className="btn-primary !px-5">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Cart Table */}
      <div className="card-pro overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Cart — {items.length} {items.length === 1 ? 'item' : 'items'}
          </h3>
          {items.length > 0 && (
            <button onClick={() => { items.forEach(i => onRemoveItem(i._id, true)); }} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider flex items-center gap-1">
              <Trash2 size={11} /> Clear All
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <ShoppingCart size={48} className="mb-3" />
            <p className="text-sm font-bold">Cart is empty</p>
            <p className="text-xs mt-1">Search and add products above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-center">Free Qty</th>
                  <th className="text-right">GST</th>
                  <th className="text-right">Amount</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td>
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.hsn || '—'}</p>
                    </td>
                    <td className="text-right text-sm font-semibold text-slate-600">₹{Number(item.price).toFixed(2)}</td>
                    <td className="text-center">
                      <div className="inline-flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1">
                        <button onClick={() => onUpdateQty(item._id, item.qty - 1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 font-bold text-base leading-none">−</button>
                        <span className="w-6 text-center text-sm font-extrabold text-slate-900">{item.qty}</span>
                        <button onClick={() => onUpdateQty(item._id, item.qty + 1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 font-bold text-base leading-none">+</button>
                      </div>
                    </td>
                    <td className="text-center">
                      {item.freeQty > 0
                        ? <span className="badge badge-green text-[10px]">+{item.freeQty} Free</span>
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                    <td className="text-right">
                      <p className="text-xs font-bold text-slate-700">{item.gst}%</p>
                      <p className="text-[10px] text-slate-400">₹{(item.cgst + item.sgst).toFixed(2)}</p>
                    </td>
                    <td className="text-right font-extrabold text-slate-900">₹{Number(item.total).toFixed(2)}</td>
                    <td className="text-center">
                      <button onClick={() => onRemoveItem(item._id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
