import React from 'react';
import { X, Printer, Download, Clock, CreditCard } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useAuth } from '../../../context/AuthContext';

export default function BillDetailModal({ bill, onClose, onPrint, onDownload }) {
  const { businessType } = useAuth();
  const isPharma = businessType === 'pharma';

  if (!bill) return null;

  const StatusBadge = ({ status }) => {
    const colors = {
      'Paid': 'bg-emerald-100 text-emerald-700',
      'Partial': 'bg-amber-100 text-amber-700',
      'Unpaid': 'bg-red-100 text-red-700'
    };
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
  };

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900">Invoice Details</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{bill.invoice}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onPrint} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Printer size={18} />
            </button>
            <button onClick={onDownload} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Info */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Information</h3>
              <p className="font-bold text-slate-900">{bill.customerName || 'Walk-in Customer'}</p>
              {bill.customerPhone && <p className="text-sm text-slate-600 mt-1">{bill.customerPhone}</p>}
              {bill.customerAddress && <p className="text-sm text-slate-600 mt-1">{bill.customerAddress}</p>}
            </div>

            {/* Bill Summary */}
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Total Amount:</span>
                  <span className="font-bold text-slate-900">₹{Number(bill.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Paid Amount:</span>
                  <span className="font-bold text-emerald-600">₹{(Number(bill.total) - Number(bill.balance || 0)).toFixed(2)}</span>
                </div>
                {Number(bill.balance) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Balance Due:</span>
                    <span className="font-bold text-red-600">₹{Number(bill.balance).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-blue-100 flex justify-between items-center mt-2">
                  <span className="text-slate-600 text-sm">Status:</span>
                  <StatusBadge status={bill.status || (bill.paid ? 'Paid' : 'Unpaid')} />
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    {isPharma && <th className="px-6 py-4">Batch</th>}
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Tax</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bill.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        {item.hsn && <p className="text-[10px] text-slate-400 mt-0.5">HSN: {item.hsn}</p>}
                      </td>
                      {isPharma && (
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                            {item.batchNumber || '-'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-700">{item.qty}</span>
                        {item.freeQty > 0 && <span className="block text-[10px] font-bold text-blue-500 mt-0.5">+{item.freeQty} Free</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">₹{item.price}</td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-bold text-slate-700">{item.gst}%</p>
                        <p className="text-[10px] text-slate-400">₹{(Number(item.cgst || 0) + Number(item.sgst || 0)).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">₹{Number(item.total !== undefined ? item.total : ((item.price * item.qty) + (item.cgst || 0) + (item.sgst || 0))).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          {bill.payments && bill.payments.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Clock size={16} className="text-slate-400" />
                Payment History
              </h3>
              <div className="space-y-3">
                {bill.payments.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{payment.method}</p>
                        <p className="text-xs text-slate-500">{new Date(payment.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 text-lg">₹{Number(payment.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
