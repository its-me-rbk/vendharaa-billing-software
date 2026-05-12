import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  Users as UsersIcon, 
  Search, 
  Trash2, 
  AlertTriangle,
  Download,
  Printer,
  Eye,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  FileText,
  Clock,
  History
} from "lucide-react";
import { UPIQR } from '@adityavijay21/upiqr';
import html2pdf from "html2pdf.js";

import api from "../../services/api";
import notify from "../../components/ui/notify";
import useBillingState from "./billing/useBillingState";
import { buildPrintData, buildInvoiceHTML } from "./billing/invoiceTemplate";

export default function BillingPage() {
  const state = useBillingState();
  const [showPendingDetails, setShowPendingDetails] = useState(false);

  // ── Action Handlers ──

  const addItem = () => {
    const product = state.selectedProduct;
    if (!product) return notify("Select a valid product", 'error');
    if (!state.qty || Number(state.qty) <= 0) return notify("Enter a valid quantity", 'error');
    if (Number(state.qty) > product.quantity) return notify(`Not enough stock! Available: ${product.quantity}`, 'error');

    const freeQty = state.calculateFreeQty(product, state.qty);
    const exists = state.items.find((i) => i._id === product._id);

    if (exists) {
      state.setItems(
        state.items.map((i) =>
          i._id === product._id
            ? (() => {
                const newQty = i.qty + Number(state.qty);
                const newFreeQty = state.calculateFreeQty(product, newQty);
                const itemSubtotal = i.price * newQty;
                const cgst = itemSubtotal * (i.gst / 100) / 2;
                const sgst = itemSubtotal * (i.gst / 100) / 2;
                const total = itemSubtotal + cgst + sgst;
                return { ...i, qty: newQty, freeQty: newFreeQty, cgst, sgst, total };
              })()
            : i
        )
      );
    } else {
      state.setItems([
        ...state.items,
        {
          _id: product._id,
          name: product.name,
          gst: product.gst,
          hsn: product.hsn || "",
          price: product.price,
          cgst: product.price * Number(state.qty) * (product.gst / 100) / 2,
          sgst: product.price * Number(state.qty) * (product.gst / 100) / 2,
          qty: Number(state.qty),
          freeQty: freeQty,
          total: product.price * Number(state.qty) + (product.price * Number(state.qty) * (product.gst / 100)),
        },
      ]);
    }

    state.setQty("");
    state.setProductSearch("");
    state.setSelectedProduct(null);
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    const product = state.products.find(p => p._id === id);
    state.setItems(
      state.items.map((i) =>
        i._id === id
          ? (() => {
              const freeQty = state.calculateFreeQty(product, newQty);
              const itemSubtotal = i.price * newQty;
              const cgst = itemSubtotal * (i.gst / 100) / 2;
              const sgst = itemSubtotal * (i.gst / 100) / 2;
              const total = itemSubtotal + cgst + sgst;
              return { ...i, qty: newQty, freeQty, cgst, sgst, total };
            })()
          : i
      )
    );
  };

  const removeItem = (id) => {
    state.setItems(state.items.filter((i) => i._id !== id));
  };

  const handleSaveNewCustomer = async () => {
    try {
      const name = (state.customer.name || "").trim();
      const phone = String(state.customer.phone || "").trim();
      if (!name || !phone) return notify("Enter name and phone", 'error');

      state.setSavingCustomer(true);
      const res = await api.post("/customers", { ...state.customer, name, phone });
      if (res.data?.success) {
        state.selectCustomer(res.data.data);
        state.fetchCustomers();
        notify("Customer saved", 'success');
      } else {
        notify(res.data?.message || "Failed to save", 'error');
      }
    } catch (err) {
      notify("Error saving customer", 'error');
    } finally {
      state.setSavingCustomer(false);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const periodBills = state.bills.filter(b => b.invoice?.includes(`#${month}${year}`));
    let maxSeq = 0;
    periodBills.forEach(b => {
      const seq = parseInt(b.invoice.slice(-4), 10);
      if (seq > maxSeq) maxSeq = seq;
    });
    return `#${month}${year}${String(maxSeq + 1).padStart(4, '0')}`;
  };

  const handlePayment = async () => {
    if (state.items.length === 0) return notify("Cart is empty", 'error');
    if (!state.selectedCustomerId && !state.customer.name) return notify("Select a customer", 'error');

    const invoiceNo = generateInvoiceNumber();
    const payload = {
      invoice: invoiceNo,
      customerName: state.customer.name,
      customerAddress: state.customer.address,
      customerPhone: state.customer.phone,
      customerEmail: state.customer.email,
      ...(state.selectedCustomerId ? { customerId: state.selectedCustomerId } : {}),
      items: state.items.map(i => ({ ...i, totalQty: i.qty + i.freeQty })),
      subtotal: state.subtotal,
      discount: state.discount,
      gst: state.gst,
      total: state.total,
      paymentMethod: state.payment,
    };

    if (state.paymentType === 'full') {
      payload.paid = true;
      payload.payments = [{ amount: state.total, method: state.payment, date: Date.now() }];
      payload.balance = 0;
      payload.status = 'Paid';
    } else {
      const paidAmt = Number(state.amountPaid) || 0;
      if (paidAmt < 0 || paidAmt > state.total) return notify('Invalid paid amount', 'error');
      payload.paid = false;
      payload.payments = [{ amount: paidAmt, method: state.payment, date: Date.now() }];
      payload.balance = state.total - paidAmt;
      payload.status = payload.balance === 0 ? 'Paid' : 'Partial';
    }

    try {
      const res = await api.post("/bills", payload);
      if (res.status === 201 || res.status === 200) {
        notify("Bill generated", 'success');
        state.setItems([]);
        state.clearCustomer();
        state.setDiscount(0);
        state.setAmountPaid(0);
        state.fetchBills();
        state.fetchProducts();
      }
    } catch {
      notify("Failed to generate bill", 'error');
    }
  };

  // ── Print & PDF ──

  const getQR = async (pd) => {
    try {
      const { qr } = await new UPIQR().set({ 
        upiId: pd.bank.upi, name: pd.business.name, amount: Number(pd.summary.grandTotal), transactionNote: `Inv${pd.invoice.number}`
      }).generate();
      return qr;
    } catch { return ''; }
  };

  const printBill = async (billId) => {
    const bill = state.bills.find(b => b._id === billId);
    if (!bill) return;
    const pd = buildPrintData(bill, state.generalSettings);
    const qr = await getQR(pd);
    const html = buildInvoiceHTML(pd, state.logoSrc, qr);
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const downloadBill = async (billId) => {
    const bill = state.bills.find(b => b._id === billId);
    if (!bill) return;
    const pd = buildPrintData(bill, state.generalSettings);
    const qr = await getQR(pd);
    const html = buildInvoiceHTML(pd, state.logoSrc, qr);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    html2pdf().set({ margin: 0, filename: `${bill.invoice}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' } })
      .from(container).save().then(() => document.body.removeChild(container));
  };

  // ── Render Helpers ──

  const StatusBadge = ({ status }) => {
    const colors = {
      'Paid': 'bg-emerald-100 text-emerald-700',
      'Partial': 'bg-amber-100 text-amber-700',
      'Unpaid': 'bg-red-100 text-red-700'
    };
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
  };

  const filteredBills = state.bills
    .filter(b => {
      const q = state.billSearch.toLowerCase();
      const mSearch = !q || (b.customerName || '').toLowerCase().includes(q) || (b.invoice || '').toLowerCase().includes(q);
      const mStatus = state.billStatusFilter === 'All' || (b.status || (b.paid ? 'Paid' : 'Unpaid')) === state.billStatusFilter;
      return mSearch && mStatus;
    })
    .slice(0, 10);

  return (
    <div className="billing-page flex flex-col min-h-screen bg-slate-50/50">
      <div className="top-bar glass sticky top-0 z-40 border-b border-slate-200/60 px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" size={24} />
            Billing Terminal
          </h1>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">AgroMart Farm Management System</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Live Inventory Sync</span>
          </div>
        </div>
      </div>

      <div className="page-content !p-4 sm:!p-6 lg:!p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ── Left Column: POS Terminal ── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Product Selector Card */}
            <div className="card-pro overflow-visible">
              <div className="p-5 sm:p-6 lg:p-7">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    Product Entry
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 items-start relative">
                  <div className="relative group min-w-0">
                    {state.selectedProduct ? (
                      <div className="flex items-center gap-4 px-6 py-5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-200 flex-shrink-0">
                          {(state.selectedProduct.name[0] || '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-lg truncate leading-tight">{state.selectedProduct.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">₹{state.selectedProduct.price}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {state.selectedProduct.quantity}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => { state.setSelectedProduct(null); state.setProductSearch(''); }} 
                          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input 
                          type="text" 
                          placeholder="Scan or search products..." 
                          className="pro-input !pl-12 !py-4 !text-base shadow-sm hover:border-slate-300 focus:shadow-emerald-100/50"
                          value={state.productSearch}
                          onChange={e => state.setProductSearch(e.target.value)}
                        />
                        
                        {state.productSearch && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-slide-up max-h-64 overflow-y-auto">
                            {state.filteredProducts.map(p => (
                              <div 
                                key={p._id}
                                className="px-5 py-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => state.selectProduct(p)}
                              >
                                <div>
                                  <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{p.name}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{p.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-900 text-sm">₹{p.price}</p>
                                  <p className={`text-[10px] font-bold ${p.quantity < 10 ? 'text-red-500' : 'text-slate-400'}`}>QTY: {p.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="w-full sm:w-28 lg:w-32">
                    <input 
                      type="number" 
                      placeholder="Qty" 
                      className="pro-input !py-4 !text-center !font-extrabold !text-base"
                      value={state.qty}
                      onChange={e => state.setQty(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem()}
                    />
                  </div>

                  <button
                    onClick={addItem}
                    className={`btn-primary !h-12 sm:!h-[76px] !w-full sm:!w-auto !px-6 sm:!px-8 shadow-emerald-200/50 justify-center ${!state.selectedProduct ? 'opacity-30' : ''}`}
                    disabled={!state.selectedProduct}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Table Card */}
            <div className="card-pro overflow-hidden min-h-[340px] sm:min-h-[400px]">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Active Cart ({state.items.length})</h3>
                {state.items.length > 0 && (
                  <button onClick={() => state.setItems([])} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 transition-colors">
                    <Trash2 size={12} /> Clear Cart
                  </button>
                )}
              </div>

              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[280px] sm:h-[350px] opacity-20">
                  <ShoppingCart size={64} className="text-slate-300 mb-4" />
                  <p className="text-lg font-bold text-slate-400">Your cart is empty</p>
                </div>
              ) : (
                <div className="p-3 sm:p-4">
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
                    <table className="pro-table">
                    <thead>
                      <tr>
                        <th className="!bg-white">Product</th>
                        <th className="!bg-white text-center">Price</th>
                        <th className="!bg-white text-center">Quantity</th>
                        <th className="!bg-white text-center">Free</th>
                        <th className="!bg-white text-right">Tax</th>
                        <th className="!bg-white text-right">Total</th>
                        <th className="!bg-white w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.items.map(item => (
                        <tr key={item._id} className="group hover:bg-slate-50/50 transition-colors">
                          <td>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.hsn || 'NO HSN'}</p>
                          </td>
                          <td className="text-center font-medium text-slate-600">₹{item.price}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              <button onClick={() => updateQty(item._id, item.qty - 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:border-emerald-500 transition-all text-slate-400 hover:text-emerald-600">
                                <span className="text-lg leading-none">-</span>
                              </button>
                              <span className="w-8 text-center font-extrabold text-slate-900">{item.qty}</span>
                              <button onClick={() => updateQty(item._id, item.qty + 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:border-emerald-500 transition-all text-slate-400 hover:text-emerald-600">
                                <span className="text-lg leading-none">+</span>
                              </button>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`text-xs font-black ${item.freeQty > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{item.freeQty > 0 ? `+${item.freeQty} Free` : '—'}</span>
                          </td>
                          <td className="text-right">
                            <p className="text-xs font-bold text-slate-800">{item.gst}%</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">₹{(item.cgst + item.sgst).toFixed(2)}</p>
                          </td>
                          <td className="text-right">
                            <span className="font-black text-slate-900">₹{item.total.toFixed(2)}</span>
                          </td>
                          <td className="text-center">
                            <button onClick={() => removeItem(item._id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {state.items.map(item => (
                      <div key={item._id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.hsn || 'NO HSN'}</p>
                          </div>
                          <button onClick={() => removeItem(item._id)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-lg bg-slate-50 p-2.5">
                            <p className="text-slate-400 font-semibold uppercase tracking-wide">Price</p>
                            <p className="font-bold text-slate-800">₹{item.price}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2.5">
                            <p className="text-slate-400 font-semibold uppercase tracking-wide">Total</p>
                            <p className="font-black text-slate-900">₹{item.total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-500 font-semibold">
                            GST {item.gst}% · Tax ₹{(item.cgst + item.sgst).toFixed(2)}
                          </p>
                          <span className={`text-[11px] font-black ${item.freeQty > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                            {item.freeQty > 0 ? `+${item.freeQty} Free` : 'No Free'}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <button onClick={() => updateQty(item._id, item.qty - 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-500">-</button>
                          <span className="min-w-8 text-center font-extrabold text-slate-900">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, item.qty + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-500">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Summary & Checkout ── */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Customer Selector Card */}
            <div className={`card-pro p-4 sm:p-6 transition-all duration-300 ${state.selectedCustomerId ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer Profile</h3>
                <UsersIcon size={16} className={state.selectedCustomerId ? 'text-emerald-600' : 'text-slate-300'} />
              </div>

              {!state.selectedCustomerId ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search existing customer..." 
                      className="pro-input !pl-9 !text-xs !bg-white"
                      value={state.customerSearch}
                      onChange={e => state.setCustomerSearch(e.target.value)}
                    />
                    {state.customerSearch && state.filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                        {state.filteredCustomers.map(c => (
                          <div key={c._id} onClick={() => state.selectCustomer(c)} className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-slate-100 my-2" />
                  <div className="space-y-3">
                    <input type="text" placeholder="Full Name" className="pro-input !text-xs !bg-white" value={state.customer.name} onChange={e => state.setCustomer({...state.customer, name: e.target.value})} />
                    <input type="text" placeholder="Phone Number" className="pro-input !text-xs !bg-white" value={state.customer.phone} onChange={e => state.setCustomer({...state.customer, phone: e.target.value})} />
                    <button 
                      onClick={handleSaveNewCustomer} 
                      disabled={state.savingCustomer || !state.customer.name || !state.customer.phone}
                      className="btn-secondary !w-full !justify-center !text-[11px] !py-2.5 bg-white shadow-sm"
                    >
                      {state.savingCustomer ? 'Registering...' : 'Quick Register'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-200">
                      {(state.customer.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{state.customer.name}</p>
                      <p className="text-xs font-bold text-emerald-600">{state.customer.phone}</p>
                    </div>
                    <button onClick={state.clearCustomer} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  {state.pendingInfo && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-4 animate-pulse">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-red-600" />
                        <span className="text-[10px] font-black text-red-700 uppercase">Outstanding Dues</span>
                      </div>
                      <p className="text-lg font-black text-red-900">₹{state.pendingInfo.total.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checkout Summary Card — Light Theme */}
            <div className="card-pro overflow-hidden shadow-lg">
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Invoice Summary</h3>
              </div>

              {/* Line items summary */}
              <div className="p-5 sm:p-6 space-y-3 border-b border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-800">₹{state.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">GST &amp; Taxes</span>
                  <span className="font-bold text-slate-800">₹{state.gst.toFixed(2)}</span>
                </div>
                {state.discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-600 font-medium">Discount ({state.discount}%)</span>
                    <span className="font-bold text-emerald-600">− ₹{((state.subtotal * state.discount) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total highlight */}
              <div className="px-4 sm:px-6 py-5 bg-emerald-600 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Grand Total</p>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all">₹{state.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-200">{state.items.length} {state.items.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Discount */}
                <div>
                  <label className="pro-label">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      className="pro-input !pr-8"
                      value={state.discount || ''}
                      onChange={e => state.setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="pro-label">Payment Terms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[['full', 'Full Payment'], ['partial', 'Partial']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => state.setPaymentType(val)}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                          state.paymentType === val
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Partial amount */}
                {state.paymentType === 'partial' && (
                  <div className="animate-slide-up">
                    <label className="pro-label">Amount Paid Now</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="pro-input !pl-8"
                        value={state.amountPaid}
                        onChange={e => state.setAmountPaid(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="pro-label">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Cash', icon: Banknote },
                      { id: 'Card', icon: CreditCard },
                      { id: 'UPI', icon: Smartphone },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => state.setPayment(m.id)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-bold transition-all ${
                          state.payment === m.id
                            ? 'border-slate-800 bg-slate-900 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <m.icon size={16} />
                        {m.id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handlePayment}
                  disabled={state.items.length === 0 || (!state.selectedCustomerId && !state.customer.name)}
                  className="btn-primary !w-full !justify-center !py-4 !text-sm !font-black !rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate Invoice
                </button>
                <p className="text-center text-[10px] text-slate-400">All transactions are securely recorded</p>
              </div>
            </div>
          </div>

          {/* ── Bottom Section: History ── */}
          <div className="lg:col-span-12 mt-8 lg:mt-12 space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                  <History size={28} className="text-slate-300" />
                  Recent Transactions
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Real-time ledger of all generated invoices and payments</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="relative group w-full sm:w-auto">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search ledger..." 
                    className="pro-input !pl-10 !py-2.5 !text-xs !bg-white w-full sm:!w-64 shadow-sm"
                    value={state.billSearch}
                    onChange={e => state.setBillSearch(e.target.value)}
                  />
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto overflow-x-auto">
                  {['All', 'Paid', 'Partial'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => state.setBillStatusFilter(f)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        state.billStatusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-pro overflow-hidden border-0 shadow-2xl shadow-slate-200/50 p-3 sm:p-4">
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-100 bg-white">
                <table className="pro-table !text-sm">
                  <thead>
                    <tr className="!bg-slate-900 border-0">
                      <th className="px-8 py-5 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0">Invoice #</th>
                      <th className="px-6 py-5 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0">Customer Details</th>
                      <th className="px-6 py-5 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0">Payment Method</th>
                      <th className="px-6 py-5 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0 text-right">Grand Total</th>
                      <th className="px-6 py-5 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0 text-center">Status</th>
                      <th className="px-8 py-5 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0 text-right w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map(b => (
                        <tr key={b._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-6">
                            <p className="font-mono text-sm font-black text-slate-800">{b.invoice}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
                          </td>
                          <td className="px-6 py-6">
                            <p className="font-extrabold text-slate-900">{b.customerName || 'Walk-in Customer'}</p>
                            <p className="text-xs font-medium text-slate-500">{b.customerPhone || 'NO PHONE'}</p>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-200" />
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{b.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="text-base font-black text-slate-900 tracking-tight">₹{Number(b.total).toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <StatusBadge status={b.status || (b.paid ? 'Paid' : 'Unpaid')} />
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => state.setSelectedBill(b)} className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-500 hover:text-emerald-600 transition-all" title="View Detail"><Eye size={16} /></button>
                              <button onClick={() => printBill(b._id)} className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-500 hover:text-emerald-600 transition-all" title="Print"><Printer size={16} /></button>
                              <button onClick={() => downloadBill(b._id)} className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-500 hover:text-emerald-600 transition-all" title="PDF"><Download size={16} /></button>
                            </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {filteredBills.map(b => (
                  <div key={b._id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-black text-slate-800 truncate">{b.invoice}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {new Date(b.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <StatusBadge status={b.status || (b.paid ? 'Paid' : 'Unpaid')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-semibold uppercase tracking-wide">Customer</p>
                        <p className="font-extrabold text-slate-900 truncate">{b.customerName || 'Walk-in Customer'}</p>
                        <p className="text-slate-500">{b.customerPhone || 'NO PHONE'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-semibold uppercase tracking-wide">Total</p>
                        <p className="text-base font-black text-slate-900">₹{Number(b.total).toFixed(2)}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">{b.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => state.setSelectedBill(b)} className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300"> <Eye size={16} className="mx-auto" /> </button>
                      <button onClick={() => printBill(b._id)} className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300"> <Printer size={16} className="mx-auto" /> </button>
                      <button onClick={() => downloadBill(b._id)} className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300"> <Download size={16} className="mx-auto" /> </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide-Over Bill Detail ── */}
      {state.selectedBill && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-500" onClick={() => state.setSelectedBill(null)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in-right">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Invoice Detail</p>
                <h2 className="text-xl font-black text-slate-900">{state.selectedBill.invoice}</h2>
              </div>
              <button onClick={() => state.setSelectedBill(null)} className="w-10 h-10 rounded-2xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between p-4 sm:p-6 bg-emerald-600 rounded-2xl shadow-md gap-3">
                <div>
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Grand Total</p>
                  <p className="text-2xl sm:text-3xl font-black text-white break-all">₹{state.selectedBill.total.toFixed(2)}</p>
                </div>
                <StatusBadge status={state.selectedBill.status || (state.selectedBill.paid ? 'Paid' : 'Unpaid')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                  <p className="text-sm font-extrabold text-slate-900">{state.selectedBill.customerName || 'Walk-in'}</p>
                  <p className="text-xs text-slate-500 font-medium">{state.selectedBill.customerPhone}</p>
                  {state.selectedBill.customerAddress && <p className="text-[10px] text-slate-400 leading-tight mt-1">{state.selectedBill.customerAddress}</p>}
                  {state.selectedBill.customerEmail && <p className="text-[10px] text-emerald-600 font-medium">{state.selectedBill.customerEmail}</p>}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Info</p>
                  <p className="text-sm font-extrabold text-slate-900">{state.selectedBill.paymentMethod}</p>
                  <p className="text-xs text-slate-500 font-medium">{new Date(state.selectedBill.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itemized Breakdown</p>
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white">
                          <th className="px-4 py-3 text-left font-black text-slate-400 uppercase">Item</th>
                          <th className="px-3 py-3 text-center font-black text-slate-400 uppercase">Price</th>
                          <th className="px-3 py-3 text-center font-black text-slate-400 uppercase">Qty</th>
                          <th className="px-3 py-3 text-center font-black text-slate-400 uppercase">Free</th>
                          <th className="px-3 py-3 text-right font-black text-slate-400 uppercase">Tax</th>
                          <th className="px-4 py-3 text-right font-black text-slate-400 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {state.selectedBill.items.map((item, i) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{item.name}</p>
                              {item.hsn && <p className="text-[9px] text-slate-400 font-mono">HSN: {item.hsn}</p>}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-500 font-medium">₹{item.price}</td>
                            <td className="px-3 py-3 text-center font-black text-slate-700">{item.qty}</td>
                            <td className="px-3 py-3 text-center">
                              {item.freeQty > 0 ? <span className="text-emerald-600 font-bold">+{item.freeQty}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <p className="font-bold text-slate-600">{item.gst}%</p>
                              <p className="text-[8px] text-slate-400 uppercase">₹{((item.cgst || 0) + (item.sgst || 0)).toFixed(2)}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">₹{(item.total || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{state.selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Taxable Amount</span>
                  <span className="text-slate-800">₹{(state.selectedBill.subtotal - (state.selectedBill.subtotal * (state.selectedBill.discount || 0) / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Total Tax (GST)</span>
                  <span className="text-slate-800">₹{state.selectedBill.gst.toFixed(2)}</span>
                </div>
                {state.selectedBill.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Discount ({state.selectedBill.discount}%)</span>
                    <span>-₹{((state.selectedBill.subtotal * state.selectedBill.discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                {state.selectedBill.balance > 0 && (
                  <div className="flex justify-between text-xs font-bold text-red-500 pt-2 border-t border-slate-50">
                    <span>Balance Due</span>
                    <span>₹{state.selectedBill.balance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50/50">
              <button onClick={() => printBill(state.selectedBill._id)} className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-700 hover:bg-white transition-all shadow-sm">
                <Printer size={16} /> Print
              </button>
              <button onClick={() => downloadBill(state.selectedBill._id)} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                <Download size={16} /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
