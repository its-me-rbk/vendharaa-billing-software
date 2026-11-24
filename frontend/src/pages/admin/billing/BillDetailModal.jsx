import React from 'react';
import { X, Printer, Download, Clock, CreditCard } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useAuth } from '../../../context/AuthContext';
import { numberToWords } from './invoiceTemplate';

export default function BillDetailModal({ bill, onClose, onPrint, onDownload }) {
  const { businessType } = useAuth();
  const isPharma = businessType === 'pharma';

  if (!bill) return null;

  const items = bill.items || [];
  const grandSub = items.reduce((s, i) => s + (Number(i.ptr ?? i.price) || 0) * (Number(i.qty) || 0), 0);
  const totalGst = items.reduce((s, i) => s + (Number(i.cgst) || 0) + (Number(i.sgst) || 0), 0);
  const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const totalFreeQty = items.reduce((s, i) => s + (Number(i.freeQty) || 0), 0);
  const discountPct = Number(bill.discount) || 0;
  const discountAmt = (grandSub * discountPct) / 100;
  const taxableAmount = grandSub - discountAmt;
  const grandTotal = Number(bill.total) || 0;

  const invDateObj = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const dueDateObj = new Date(invDateObj.getTime() + 60 * 86400000);

  const payments = Array.isArray(bill.payments) ? bill.payments : [];
  const paidAmount = payments.length > 0
    ? payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    : (bill.paid ? grandTotal : 0);
  const dueAmount = bill.balance !== undefined && bill.balance !== null
    ? Math.max(0, Number(bill.balance))
    : Math.max(0, grandTotal - paidAmount);
  const lastPaymentDate = payments.length > 0
    ? new Date(Math.max(...payments.map(p => new Date(p.date || invDateObj).getTime()))).toLocaleDateString('en-IN')
    : (paidAmount > 0 ? invDateObj.toLocaleDateString('en-IN') : '—');
  const status = dueAmount <= 0 ? 'Paid' : (bill.status || 'Pending');

  const StatusBadge = ({ status: st }) => {
    const colors = {
      'Paid': 'bg-emerald-100 text-emerald-700',
      'Partial': 'bg-amber-100 text-amber-700',
      'Unpaid': 'bg-red-100 text-red-700',
      'Pending': 'bg-red-100 text-red-700',
    };
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colors[st] || 'bg-slate-100 text-slate-700'}`}>{st}</span>;
  };

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Invoice Details</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {bill.invoice} &nbsp;·&nbsp; Date: {invDateObj.toLocaleDateString('en-IN')} &nbsp;·&nbsp; Due: {dueDateObj.toLocaleDateString('en-IN')}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrint} title="Print Invoice" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Printer size={18} />
            </button>
            <button onClick={onDownload} title="Download PDF" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bill To */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill To (Customer)</h3>
            <p className="font-bold text-slate-900 text-base">{bill.customerName || 'Walk-in Customer'}</p>
            {bill.customerAddress && <p className="text-xs text-slate-600 mt-1">{bill.customerAddress}</p>}
            <p className="text-xs text-slate-600 mt-1">
              Phone: {bill.customerPhone || 'N/A'}
              {bill.customerEmail ? `  |  Email: ${bill.customerEmail}` : ''}
            </p>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-3 py-3">MFR</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-3 py-3 text-center">HSN</th>
                    {isPharma && <th className="px-3 py-3 text-center">Batch / Exp</th>}
                    <th className="px-3 py-3 text-center">Qty</th>
                    <th className="px-3 py-3 text-center">Free</th>
                    <th className="px-3 py-3 text-right">MRP</th>
                    <th className="px-3 py-3 text-right">PTR</th>
                    <th className="px-3 py-3 text-center">GST%</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const ptr = Number(item.ptr ?? item.price) || 0;
                    const mrp = Number(item.mrp) || 0;
                    const itemTotal = item.total !== undefined
                      ? Number(item.total)
                      : (ptr * (Number(item.qty) || 0)) + (Number(item.cgst) || 0) + (Number(item.sgst) || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400 font-medium">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-3 font-bold text-slate-700">{item.manufacturer || '—'}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-500">{item.hsn || '—'}</td>
                        {isPharma && (
                          <td className="px-3 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                              {item.batchNumber || '—'}
                            </span>
                            {item.expiryDate && (
                              <span className="block text-[9px] text-slate-400 mt-0.5">
                                {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-3 text-center font-bold text-slate-800">{item.qty}</td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600">{item.freeQty > 0 ? `+${item.freeQty}` : '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-500">₹{mrp.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800">₹{ptr.toFixed(2)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-slate-700">{item.gst || 0}%</span>
                          <span className="block text-[9px] text-slate-400">₹{(Number(item.cgst || 0) + Number(item.sgst || 0)).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">₹{itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3-Column Summary (Matching Invoice) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invoice Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Summary</h3>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Taxable Amount</span><span className="font-semibold">₹{taxableAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Total Tax</span><span className="font-semibold">₹{totalGst.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Discount ({discountPct}%)</span><span className="font-semibold">−₹{discountAmt.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Total Qty</span><span className="font-semibold">{totalQty}{totalFreeQty > 0 ? ` (+${totalFreeQty} Free)` : ''}</span></div>
              <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-200 text-slate-900">
                <span>Grand Total</span><span className="text-blue-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Grand Total & Amount in Words */}
            <div className="bg-[#1E3A6E] text-white rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Grand Total</span>
                  <StatusBadge status={status} />
                </div>
                <p className="text-2xl font-black tracking-tight">₹{grandTotal.toFixed(2)}</p>
              </div>
              <div className="pt-3 border-t border-white/15 mt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Amount in Words</p>
                <p className="text-xs text-white/90 mt-0.5 leading-relaxed">{numberToWords(grandTotal)}</p>
              </div>
            </div>

            {/* Payment & Due Status */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment &amp; Due Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200">
                  <div>
                    <p className="text-slate-600">Amount Paid</p>
                    <p className="text-[10px] text-slate-400">Updated: {lastPaymentDate}</p>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">₹{paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200">
                  <span className="text-slate-600">Due Amount</span>
                  {dueAmount <= 0 ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">No Due Pending</span>
                  ) : (
                    <span className="font-bold text-red-600 text-sm">₹{dueAmount.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Due Date (60 Days)</span>
                  <span className="font-bold text-slate-800">{dueDateObj.toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Clock size={16} className="text-slate-400" />
                Payment History
              </h3>
              <div className="space-y-2">
                {payments.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{payment.method}</p>
                        <p className="text-xs text-slate-500">{new Date(payment.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 text-base">₹{Number(payment.amount).toFixed(2)}</span>
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
