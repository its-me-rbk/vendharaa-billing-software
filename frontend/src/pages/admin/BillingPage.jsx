import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Package, Plus, ShoppingCart, Users as UsersIcon, Search, Trash2, 
  AlertTriangle, X, CreditCard, Banknote, 
  Smartphone, FileText, RotateCcw
} from "lucide-react";

import api from "../../services/api";
import notify from "../../components/ui/notify";
import useBillingState from "./billing/useBillingState";
import { useAuth } from "../../context/AuthContext";

export default function BillingPage() {
  const { role, businessType } = useAuth();
  const isPharma = businessType === 'pharma';
  const invoicesPath = role === 'Cashier' ? '/cashier/invoices' : '/admin/invoices';
  const state = useBillingState();
  const [showPendingDetails, setShowPendingDetails] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [draft, setDraft] = useState({ ptr: '', mrp: '', qty: '1', freeQty: '0', gst: '0' });

  const handleSelectEntryProduct = (p) => {
    state.selectProduct(p);
    const ptrVal = p.ptr ?? p.price ?? 0;
    const mrpVal = p.mrp ?? 0;
    const gstVal = p.gst ?? 0;
    const initialQty = 1;
    const freeVal = state.calculateFreeQty(p, initialQty);
    setDraft({
      ptr: String(ptrVal),
      mrp: String(mrpVal),
      qty: String(initialQty),
      freeQty: String(freeVal),
      gst: String(gstVal),
    });
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts');
        if (res.data?.success) {
          const list = res.data.data || [];
          setAccounts(list);
          if (list.length > 0) {
            const defaultAcc = list.find(a => a.name === "Cash") || list[0];
            setSelectedAccount(defaultAcc);
          }
        }
      } catch (err) {
        console.error("Failed to load accounts in BillingPage", err);
      }
    };
    fetchAccounts();
  }, []);

  // ── Action Handlers ──

  const addItem = () => {
    const product = state.selectedProduct;
    if (!product) return notify("Select a valid product", 'error');
    
    if (isPharma && !state.selectedBatch) {
      return notify("Please select a batch", 'error');
    }

    const qtyToDeduct = Number(draft.qty);
    if (!qtyToDeduct || qtyToDeduct <= 0) return notify("Enter a valid quantity", 'error');
    
    const available = isPharma ? state.selectedBatch.quantity : product.quantity;

    if (qtyToDeduct > available) {
      return notify(`Not enough stock! Available: ${available}`, 'error');
    }

    const ptrVal = Number(draft.ptr) || 0;
    const mrpVal = Number(draft.mrp) || 0;
    const gstVal = Number(draft.gst) || 0;
    const freeQty = Number(draft.freeQty) || 0;
    const itemKey = isPharma ? `${product._id}-${state.selectedBatch.batchNumber}` : product._id;
    
    const exists = state.items.find((i) => (isPharma ? `${i._id}-${i.batchNumber}` : i._id) === itemKey);

    if (exists) {
      state.setItems(
        state.items.map((i) =>
          (isPharma ? `${i._id}-${i.batchNumber}` : i._id) === itemKey
            ? (() => {
                const newQty = i.qty + qtyToDeduct;
                const newFreeQty = (i.freeQty || 0) + freeQty;
                const itemSubtotal = ptrVal * newQty;
                const cgst = itemSubtotal * (gstVal / 100) / 2;
                const sgst = itemSubtotal * (gstVal / 100) / 2;
                const total = itemSubtotal + cgst + sgst;
                return { ...i, price: ptrVal, ptr: ptrVal, mrp: mrpVal, gst: gstVal, qty: newQty, freeQty: newFreeQty, cgst, sgst, total };
              })()
            : i
        )
      );
    } else {
      const itemSubtotal = ptrVal * qtyToDeduct;
      const cgst = itemSubtotal * (gstVal / 100) / 2;
      const sgst = itemSubtotal * (gstVal / 100) / 2;
      
      const newItem = {
        _id: product._id,
        name: product.name,
        gst: gstVal,
        hsn: product.hsn || "",
        price: ptrVal,
        ptr: ptrVal,
        mrp: mrpVal,
        manufacturer: product.manufacturer || "",
        cgst,
        sgst,
        qty: qtyToDeduct,
        freeQty,
        total: itemSubtotal + cgst + sgst,
      };

      if (isPharma) {
        newItem.batchNumber = state.selectedBatch.batchNumber;
        newItem.expiryDate = state.selectedBatch.expiryDate;
      }

      state.setItems([...state.items, newItem]);
    }

    setDraft({ ptr: '', mrp: '', qty: '1', freeQty: '0', gst: '0' });
    state.setQty("");
    state.setProductSearch("");
    state.setSelectedProduct(null);
    state.setSelectedBatch(null);
  };

  const updateCartItem = (id, batchNumber, patch, recalcFree = false) => {
    const itemKey = isPharma ? `${id}-${batchNumber}` : id;
    state.setItems(
      state.items.map((i) => {
        if ((isPharma ? `${i._id}-${i.batchNumber}` : i._id) !== itemKey) return i;
        const updated = { ...i, ...patch };
        if (patch.ptr !== undefined) updated.price = Number(patch.ptr) || 0;
        const qtyVal = Math.max(1, Number(updated.qty) || 1);
        updated.qty = qtyVal;
        if (recalcFree) {
          const product = state.products.find(p => p._id === id);
          updated.freeQty = state.calculateFreeQty(product, qtyVal);
        }
        const ptrVal = Number(updated.ptr ?? updated.price) || 0;
        const gstVal = Number(updated.gst) || 0;
        const itemSubtotal = ptrVal * qtyVal;
        const cgst = itemSubtotal * (gstVal / 100) / 2;
        const sgst = itemSubtotal * (gstVal / 100) / 2;
        updated.cgst = cgst;
        updated.sgst = sgst;
        updated.total = itemSubtotal + cgst + sgst;
        return updated;
      })
    );
  };

  const updateQty = (id, batchNumber, newQty) => {
    if (newQty < 1) return;
    updateCartItem(id, batchNumber, { qty: newQty }, true);
  };

  const removeItem = (id, batchNumber) => {
    const itemKey = isPharma ? `${id}-${batchNumber}` : id;
    state.setItems(state.items.filter((i) => (isPharma ? `${i._id}-${i.batchNumber}` : i._id) !== itemKey));
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
      items: state.items.map(i => ({ 
        ...i, 
        totalQty: i.qty + i.freeQty,
        businessType
      })),
      subtotal: state.subtotal,
      discount: state.discount,
      gst: state.gst,
      total: state.total,
      paymentMethod: state.payment,
      businessType
    };

    if (state.paymentType === 'full') {
      payload.paid = true;
      payload.payments = [{ 
        amount: state.total, 
        method: state.payment, 
        accountId: selectedAccount?._id || null,
        accountName: selectedAccount?.name || 'Cash',
        date: Date.now() 
      }];
      payload.balance = 0;
      payload.status = 'Paid';
    } else {
      const paidAmt = Number(state.amountPaid) || 0;
      if (paidAmt < 0 || paidAmt > state.total) return notify('Invalid paid amount', 'error');
      payload.paid = false;
      payload.payments = [{ 
        amount: paidAmt, 
        method: state.payment, 
        accountId: selectedAccount?._id || null,
        accountName: selectedAccount?.name || 'Cash',
        date: Date.now() 
      }];
      payload.balance = state.total - paidAmt;
      payload.status = payload.balance === 0 ? 'Paid' : 'Partial';
    }

    try {
      const res = await api.post("/bills", payload);
      if (res.status === 201 || res.status === 200) {
        notify("Bill generated", 'success');
        state.clearBillingDraft();
        state.fetchBills();
        state.fetchProducts();
      }
    } catch (err) {
      notify(err.response?.data?.error || "Failed to generate bill", 'error');
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
    const html = buildInvoiceHTML(pd, state.logoSrc, qr, state.generalSettings?.paperSize);
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
    const html = buildInvoiceHTML(pd, state.logoSrc, qr, state.generalSettings?.paperSize);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    html2pdf().set({ 
      margin: 0, 
      filename: `${bill.invoice}.pdf`, 
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { format: state.generalSettings?.paperSize || 'a4', orientation: 'portrait' } 
    })
      .from(container).save().then(() => document.body.removeChild(container));
  };

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
            <ShoppingCart className="text-accent" size={24} />
            {isPharma ? 'Pharma Billing Terminal' : 'Agro Billing Terminal'}
          </h1>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
            {isPharma ? 'Vendharaa Pharma Care' : 'Vendharaa Agro Store'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-50 rounded-full border border-accent-100">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Live Inventory Sync</span>
          </div>
          <button
            type="button"
            onClick={() => {
              state.clearBillingDraft();
              setDraft({ ptr: '', mrp: '', qty: '1', freeQty: '0', gst: '0' });
            }}
            className="btn-secondary !py-2 !px-3.5 !text-xs"
            title="Clear form & start new bill"
          >
            <RotateCcw size={14} /> Clear
          </button>
          <Link to={invoicesPath} className="btn-secondary !py-2 !px-3.5 !text-xs">
            <FileText size={14} /> View Invoices
          </Link>
        </div>
      </div>

      <div className="page-content !p-4 sm:!p-6 lg:!p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ── Left Column: POS Terminal ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Selector Card */}
            <div className={`card-pro p-4 sm:p-5 transition-all duration-300 overflow-visible ${state.selectedCustomerId ? 'border-accent-200 bg-accent-50/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer Profile</h3>
                <div className="flex items-center gap-3">
                  {state.selectedCustomerId && state.pendingInfo && (
                    <div className="px-2.5 py-1 bg-red-50 rounded-md border border-red-100 flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-red-600" />
                      <span className="text-[10px] font-black text-red-700 uppercase">Dues: ₹{state.pendingInfo.total.toFixed(2)}</span>
                    </div>
                  )}
                  {state.selectedCustomerId ? (
                    <button onClick={state.clearCustomer} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                      <X size={15} /> Change
                    </button>
                  ) : (
                    <UsersIcon size={16} className="text-slate-300" />
                  )}
                </div>
              </div>

              {!state.selectedCustomerId ? (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search existing customer..." 
                      className="pro-input !pl-9 !text-xs !bg-white"
                      value={state.customerSearch}
                      onChange={e => state.setCustomerSearch(e.target.value)}
                    />
                    {state.customerSearch && state.filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-56 overflow-y-auto">
                        {state.filteredCustomers.map(c => (
                          <div key={c._id} onClick={() => state.selectCustomer(c)} className="px-4 py-2.5 hover:bg-accent-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="text" placeholder="Full Name" className="pro-input !text-xs !bg-white" value={state.customer.name} onChange={e => state.setCustomer({...state.customer, name: e.target.value})} />
                  <input type="text" placeholder="Phone Number" className="pro-input !text-xs !bg-white" value={state.customer.phone} onChange={e => state.setCustomer({...state.customer, phone: e.target.value})} />
                  <button 
                    onClick={handleSaveNewCustomer} 
                    disabled={state.savingCustomer || !state.customer.name || !state.customer.phone}
                    className="btn-secondary !justify-center !text-[11px] !py-2.5 !px-4 bg-white shadow-sm whitespace-nowrap"
                  >
                    {state.savingCustomer ? 'Registering...' : 'Quick Register'}
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</p>
                    <p className="text-sm font-black text-slate-900 truncate">{state.customer.name}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                    <p className="text-sm font-bold text-accent truncate">{state.customer.phone}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">{state.customer.email || '—'}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p>
                    <p className="text-xs font-semibold text-slate-700 truncate" title={state.customer.address || ''}>{state.customer.address || '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Active Cart & Inline Product Entry Table */}
            <div className="card-pro overflow-visible min-h-[380px]">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingCart size={15} className="text-accent" />
                  Active Cart ({state.items.length})
                </h3>
                {state.items.length > 0 && (
                  <button onClick={() => state.setItems([])} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 transition-colors">
                    <Trash2 size={12} /> Clear Cart
                  </button>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <div className="hidden md:block overflow-visible rounded-xl border border-slate-100">
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th className="!bg-white min-w-[180px]">Product</th>
                        <th className="!bg-white text-center w-20">HSN</th>
                        {isPharma && <th className="!bg-white text-center min-w-[125px]">Batch</th>}
                        <th className="!bg-white text-right w-20">MRP</th>
                        <th className="!bg-white text-right w-20">PTR</th>
                        <th className="!bg-white text-center w-28">Qty</th>
                        <th className="!bg-white text-center w-16">Free</th>
                        <th className="!bg-white text-center w-16">GST%</th>
                        <th className="!bg-white text-right w-24">Total</th>
                        <th className="!bg-white w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.items.map(item => {
                        const prod = state.products.find(p => p._id === item._id);
                        const validBatches = (prod?.batches || []).filter(b => b.quantity > 0 && (!b.expiryDate || new Date(b.expiryDate) >= new Date()));
                        return (
                          <tr key={isPharma ? `${item._id}-${item.batchNumber}` : item._id} className="group hover:bg-slate-50/50 transition-colors">
                            <td>
                              <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                            </td>
                            <td className="text-center text-xs font-mono text-slate-500">
                              {item.hsn || '—'}
                            </td>
                            {isPharma && (
                              <td className="text-center">
                                {validBatches.length > 0 ? (
                                  <select
                                    value={item.batchNumber || ''}
                                    onChange={(e) => {
                                      const chosen = validBatches.find(b => b.batchNumber === e.target.value);
                                      if (chosen) {
                                        updateCartItem(item._id, item.batchNumber, { batchNumber: chosen.batchNumber, expiryDate: chosen.expiryDate });
                                      }
                                    }}
                                    className="pro-input !py-1 !px-2 !text-xs bg-white font-semibold"
                                  >
                                    {validBatches.map(b => (
                                      <option key={b.batchNumber} value={b.batchNumber}>
                                        {b.batchNumber} ({b.quantity})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="badge badge-blue !text-[10px]">{item.batchNumber}</span>
                                )}
                                {item.expiryDate && (
                                  <p className="text-[9px] text-slate-400 mt-0.5">Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                                )}
                              </td>
                            )}
                            <td className="text-right text-xs font-semibold text-slate-500">
                              ₹{Number(item.mrp || 0).toFixed(2)}
                            </td>
                            <td className="text-right text-xs font-bold text-slate-800">
                              ₹{Number(item.ptr ?? item.price ?? 0).toFixed(2)}
                            </td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => updateQty(item._id, item.batchNumber, item.qty - 1)} className="w-6 h-7 rounded border border-slate-200 flex items-center justify-center hover:bg-white hover:border-accent text-slate-500">-</button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => updateCartItem(item._id, item.batchNumber, { qty: Math.max(1, Number(e.target.value) || 1) }, true)}
                                  className="pro-input !py-1 !px-1 !text-xs text-center font-extrabold w-12"
                                />
                                <button onClick={() => updateQty(item._id, item.batchNumber, item.qty + 1)} className="w-6 h-7 rounded border border-slate-200 flex items-center justify-center hover:bg-white hover:border-accent text-slate-500">+</button>
                              </div>
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                min="0"
                                value={item.freeQty ?? 0}
                                onChange={(e) => updateCartItem(item._id, item.batchNumber, { freeQty: Math.max(0, Number(e.target.value) || 0) })}
                                className="pro-input !py-1 !px-1 !text-xs text-center w-14"
                              />
                            </td>
                            <td className="text-center">
                              <p className="text-xs font-bold text-slate-700">{item.gst ?? 0}%</p>
                              <p className="text-[9px] text-slate-400">₹{(item.cgst + item.sgst).toFixed(2)}</p>
                            </td>
                            <td className="text-right">
                              <span className="font-black text-slate-900 text-sm">₹{Number(item.total).toFixed(2)}</span>
                            </td>
                            <td className="text-center">
                              <button onClick={() => removeItem(item._id, item.batchNumber)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* ── Inline Product Entry Row ── */}
                      {(() => {
                        const dPtr = Number(state.selectedProduct?.ptr ?? state.selectedProduct?.price) || 0;
                        const dMrp = Number(state.selectedProduct?.mrp) || 0;
                        const dGst = Number(state.selectedProduct?.gst) || 0;
                        const dQty = Number(draft.qty) || 0;
                        const dSub = dPtr * dQty;
                        const dTotal = dSub + dSub * (dGst / 100);
                        const validEntryBatches = (state.selectedProduct?.batches || []).filter(b => b.quantity > 0 && (!b.expiryDate || new Date(b.expiryDate) >= new Date()));
                        return (
                          <tr className="bg-accent-50/40 border-t-2 border-accent-100">
                            <td className="relative">
                              {state.selectedProduct ? (
                                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-accent-200 rounded-lg">
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-xs truncate">{state.selectedProduct.name}</p>
                                    <p className="text-[10px] text-slate-400">Stock: {state.selectedProduct.quantity}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      state.setSelectedProduct(null);
                                      state.setProductSearch('');
                                      state.setSelectedBatch(null);
                                      setDraft({ ptr: '', mrp: '', qty: '1', freeQty: '0', gst: '0' });
                                    }}
                                    className="text-slate-400 hover:text-red-500 p-0.5"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                  <input
                                    type="text"
                                    placeholder={isPharma ? "Select medicine or barcode..." : "Select product or barcode..."}
                                    className="pro-input !pl-8 !py-1.5 !text-xs bg-white"
                                    value={state.productSearch}
                                    onChange={e => state.setProductSearch(e.target.value)}
                                  />
                                  {state.productSearch && (
                                    <div className="absolute top-full left-0 w-80 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-60 overflow-y-auto">
                                      {state.filteredProducts.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">No products found</p>
                                      ) : state.filteredProducts.map(p => (
                                        <div
                                          key={p._id}
                                          className="px-3.5 py-2.5 hover:bg-accent-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                                          onClick={() => handleSelectEntryProduct(p)}
                                        >
                                          <div className="min-w-0 pr-2">
                                            <p className="font-bold text-slate-800 text-xs truncate">{p.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">{p.category || 'General'}</p>
                                          </div>
                                          <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-slate-900 text-xs">PTR ₹{p.ptr ?? p.price ?? 0} {p.mrp ? <span className="text-slate-400 font-normal">| MRP ₹{p.mrp}</span> : ''}</p>
                                            <p className={`text-[10px] font-bold ${p.quantity < 10 ? 'text-red-500' : 'text-slate-400'}`}>QTY: {p.quantity}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="text-center text-xs font-mono text-slate-500">
                              {state.selectedProduct ? (state.selectedProduct.hsn || '—') : '—'}
                            </td>
                            {isPharma && (
                              <td className="text-center">
                                <select
                                  disabled={!state.selectedProduct || validEntryBatches.length === 0}
                                  value={state.selectedBatch?.batchNumber || ''}
                                  onChange={(e) => {
                                    const b = validEntryBatches.find(x => x.batchNumber === e.target.value);
                                    state.setSelectedBatch(b || null);
                                  }}
                                  className="pro-input !py-1.5 !px-2 !text-xs bg-white disabled:opacity-50"
                                >
                                  <option value="">{state.selectedProduct ? (validEntryBatches.length ? 'Select Batch' : 'No Stock') : '—'}</option>
                                  {validEntryBatches.map(b => (
                                    <option key={b.batchNumber} value={b.batchNumber}>
                                      {b.batchNumber} ({b.quantity})
                                    </option>
                                  ))}
                                </select>
                              </td>
                            )}
                            <td className="text-right text-xs font-semibold text-slate-500">
                              {state.selectedProduct ? `₹${dMrp.toFixed(2)}` : '—'}
                            </td>
                            <td className="text-right text-xs font-bold text-slate-800">
                              {state.selectedProduct ? `₹${dPtr.toFixed(2)}` : '—'}
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                disabled={!state.selectedProduct}
                                value={draft.qty}
                                onChange={e => {
                                  const q = e.target.value;
                                  const f = state.selectedProduct ? state.calculateFreeQty(state.selectedProduct, q) : 0;
                                  setDraft(d => ({ ...d, qty: q, freeQty: String(f) }));
                                }}
                                onKeyDown={e => e.key === 'Enter' && addItem()}
                                className="pro-input !py-1.5 !px-1.5 !text-xs text-center font-extrabold w-20 bg-white disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                disabled={!state.selectedProduct}
                                value={draft.freeQty}
                                onChange={e => setDraft(d => ({ ...d, freeQty: e.target.value }))}
                                className="pro-input !py-1.5 !px-1.5 !text-xs text-center w-14 bg-white disabled:opacity-50"
                              />
                            </td>
                            <td className="text-center text-xs font-bold text-slate-600">
                              {state.selectedProduct ? `${dGst}%` : '—'}
                            </td>
                            <td className="text-right font-black text-slate-700 text-xs">
                              {state.selectedProduct ? `₹${dTotal.toFixed(2)}` : '—'}
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={addItem}
                                disabled={!state.selectedProduct || (isPharma && !state.selectedBatch)}
                                className="btn-primary !p-2 !rounded-lg disabled:opacity-30"
                                title="Add to cart"
                              >
                                <Plus size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden space-y-3">
                  <div className="rounded-xl border border-accent-200 bg-accent-50/30 p-3 space-y-2.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder={isPharma ? "Select medicine..." : "Select product..."}
                        className="pro-input !pl-9 !py-2 !text-xs bg-white"
                        value={state.productSearch}
                        onChange={e => state.setProductSearch(e.target.value)}
                      />
                      {state.productSearch && !state.selectedProduct && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-52 overflow-y-auto">
                          {state.filteredProducts.map(p => (
                            <div key={p._id} onClick={() => handleSelectEntryProduct(p)} className="px-3 py-2 hover:bg-accent-50 cursor-pointer flex justify-between border-b border-slate-50">
                              <span className="text-xs font-bold text-slate-800">{p.name}</span>
                              <span className="text-xs font-bold text-slate-900">PTR ₹{p.ptr ?? p.price ?? 0}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {state.selectedProduct && (
                      <div className="grid grid-cols-2 gap-2">
                        {isPharma && (
                          <select
                            value={state.selectedBatch?.batchNumber || ''}
                            onChange={(e) => {
                              const validB = (state.selectedProduct.batches || []).filter(b => b.quantity > 0);
                              state.setSelectedBatch(validB.find(x => x.batchNumber === e.target.value) || null);
                            }}
                            className="col-span-2 pro-input !py-1.5 !text-xs bg-white"
                          >
                            <option value="">Select Batch</option>
                            {(state.selectedProduct.batches || []).filter(b => b.quantity > 0).map(b => (
                              <option key={b.batchNumber} value={b.batchNumber}>{b.batchNumber} (Qty: {b.quantity})</option>
                            ))}
                          </select>
                        )}
                        <div className="col-span-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span>HSN: {state.selectedProduct.hsn || '—'}</span>
                          <span>· PTR: ₹{state.selectedProduct.ptr ?? state.selectedProduct.price ?? 0}</span>
                          <span>· MRP: ₹{state.selectedProduct.mrp || 0}</span>
                          <span>· GST: {state.selectedProduct.gst || 0}%</span>
                        </div>
                        <input type="number" min="1" placeholder="Qty" value={draft.qty} onChange={e => setDraft(d => ({ ...d, qty: e.target.value }))} className="pro-input !py-1.5 !text-xs bg-white" />
                        <input type="number" min="0" placeholder="Free" value={draft.freeQty} onChange={e => setDraft(d => ({ ...d, freeQty: e.target.value }))} className="pro-input !py-1.5 !text-xs bg-white" />
                        <button type="button" onClick={addItem} className="col-span-2 btn-primary !py-1.5 !text-xs justify-center"><Plus size={14} /> Add</button>
                      </div>
                    )}
                  </div>

                  {state.items.map(item => (
                    <div key={isPharma ? `${item._id}-${item.batchNumber}` : item._id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          {isPharma && <span className="inline-block mt-1 badge badge-blue !text-[9px]">Batch: {item.batchNumber}</span>}
                        </div>
                        <button onClick={() => removeItem(item._id, item.batchNumber)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">PTR</p>
                          <p className="font-bold text-slate-800">₹{item.ptr ?? item.price}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">MRP</p>
                          <p className="font-bold text-slate-600">₹{item.mrp || 0}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">Total</p>
                          <p className="font-black text-slate-900">₹{item.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button onClick={() => updateQty(item._id, item.batchNumber, item.qty - 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-accent hover:border-accent">-</button>
                        <span className="min-w-8 text-center font-extrabold text-slate-900">{item.qty}</span>
                        <button onClick={() => updateQty(item._id, item.batchNumber, item.qty + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-accent hover:border-accent">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Summary & Checkout ── */}
          <div className="lg:col-span-4 space-y-8">
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
                    <span className="text-accent font-medium">Discount ({state.discount}%)</span>
                    <span className="font-bold text-accent">− ₹{((state.subtotal * state.discount) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total highlight */}
              <div className="px-4 sm:px-6 py-5 bg-accent flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-accent-100 uppercase tracking-widest">Grand Total</p>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all">₹{state.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-accent-100">{state.items.length} {state.items.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Discount */}
                <div>
                  <label className="pro-label">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number" min="0" max="100" placeholder="0" className="pro-input !pr-8"
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
                            ? 'border-accent bg-accent-50 text-accent'
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
                        type="number" placeholder="0.00" className="pro-input !pl-8"
                        value={state.amountPaid}
                        onChange={e => state.setAmountPaid(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Target Account Selector */}
                <div>
                  <label className="pro-label">Target Account *</label>
                  <select
                    className="pro-input"
                    value={selectedAccount?._id || ''}
                    onChange={(e) => {
                      const acc = accounts.find(a => a._id === e.target.value);
                      setSelectedAccount(acc);
                      if (acc) {
                        if (acc.type === 'Cash') state.setPayment('Cash');
                        else if (acc.type === 'UPI') state.setPayment('UPI');
                        else if (acc.type === 'Bank') state.setPayment('Card');
                      }
                    }}
                  >
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({acc.type}) - Bal: ₹{acc.balance}
                      </option>
                    ))}
                  </select>
                </div>

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
                  className="btn-primary !w-full !justify-center !py-4 !text-sm !font-black !rounded-xl shadow-lg shadow-accent-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
