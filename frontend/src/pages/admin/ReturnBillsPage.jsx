import React, { useEffect, useState, useCallback } from 'react';
import { RotateCcw, Search, Plus, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, Calendar, X, Eye, FileText, CheckCircle2, Printer } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import { useApp } from '../../context/AppContext';
import { buildReturnPrintData, buildReturnInvoiceHTML } from './billing/returnInvoiceTemplate';

export default function ReturnBillsPage() {
  const { settings, logoUrl } = useApp();

  // Navigation tabs: 'create' or 'history'
  const [activeTab, setActiveTab] = useState('create');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [returnHistory, setReturnHistory] = useState([]);
  const [selectedHistoryBill, setSelectedHistoryBill] = useState(null);

  // Search invoice state
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [matchingBills, setMatchingBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchingBill, setSearchingBill] = useState(false);

  // Return items selection state
  // Map of productId_batch -> { qty, reason }
  const [returnQuantities, setReturnQuantities] = useState({});

  // Replacement items state (swap cart)
  const [replacementCart, setReplacementCart] = useState([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [swapQty, setSwapQty] = useState(1);
  const [searchingProduct, setSearchingProduct] = useState(false);

  // Settlement accounts state
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial accounts and return history
  useEffect(() => {
    fetchAccounts();
    fetchHistory();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get('/accounts');
      if (res.data?.success) {
        const accs = res.data.data || [];
        setAccounts(accs);
        // Default select Cash account if available
        const cashAcc = accs.find(a => a.name === 'Cash');
        if (cashAcc) {
          setSelectedAccountId(cashAcc._id);
        } else if (accs.length > 0) {
          setSelectedAccountId(accs[0]._id);
        }
      }
    } catch (err) {
      notify('Failed to load accounts', 'error');
    }
    setLoadingAccounts(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/return-bills');
      if (res.data?.success) {
        setReturnHistory(res.data.data || []);
      }
    } catch (err) {
      notify('Failed to load return bills history', 'error');
    }
    setLoadingHistory(false);
  };

  // Search original invoice
  const searchInvoice = async () => {
    if (!invoiceQuery.trim()) return;
    setSearchingBill(true);
    try {
      const res = await api.get('/bills');
      const allBills = Array.isArray(res.data) ? res.data : [];
      // Filter pharma bills and match invoice number
      const matched = allBills.filter(
        b => b.businessType === 'pharma' &&
        (b.invoice || '').toLowerCase().includes(invoiceQuery.toLowerCase())
      );
      setMatchingBills(matched);
      if (matched.length === 0) {
        notify('No matching pharma invoice found', 'warning');
      }
    } catch (err) {
      notify('Failed to search invoices', 'error');
    }
    setSearchingBill(false);
  };

  const handleSelectInvoice = (bill) => {
    setSelectedBill(bill);
    setMatchingBills([]);
    setInvoiceQuery('');
    // Initialize return quantities
    const initQtys = {};
    bill.items.forEach(item => {
      initQtys[`${item._id}_${item.batchNumber}`] = {
        qty: 0,
        reason: 'Expired' // default reason
      };
    });
    setReturnQuantities(initQtys);
  };

  // Update return quantity for a bill item
  const updateReturnQty = (item, delta) => {
    const key = `${item._id}_${item.batchNumber}`;
    const maxQty = item.qty || 0;
    const current = returnQuantities[key] || { qty: 0, reason: 'Expired' };
    const newQty = Math.max(0, Math.min(maxQty, current.qty + delta));
    setReturnQuantities(prev => ({
      ...prev,
      [key]: { ...current, qty: newQty }
    }));
  };

  // Update return reason for a bill item
  const updateReturnReason = (item, reason) => {
    const key = `${item._id}_${item.batchNumber}`;
    const current = returnQuantities[key] || { qty: 0, reason: 'Expired' };
    setReturnQuantities(prev => ({
      ...prev,
      [key]: { ...current, reason }
    }));
  };

  // Product search for replacements
  const searchProduct = async (query) => {
    setSearchProductQuery(query);
    if (query.trim().length < 2) {
      setProductsList([]);
      return;
    }
    setSearchingProduct(true);
    try {
      const res = await api.get('/products');
      const allProducts = Array.isArray(res.data) ? res.data : [];
      // Filter pharma and match name
      const filtered = allProducts.filter(
        p => p.businessType === 'pharma' &&
        p.category !== 'Returned Products' && // Cannot give returned product as a replacement
        (p.name || '').toLowerCase().includes(query.toLowerCase())
      );
      setProductsList(filtered);
    } catch (err) {
      notify('Failed to search products', 'error');
    }
    setSearchingProduct(false);
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setProductsList([]);
    setSearchProductQuery('');
    // Auto select first batch if exists
    if (prod.batches && prod.batches.length > 0) {
      setSelectedBatch(prod.batches[0]);
    } else {
      setSelectedBatch(null);
    }
    setSwapQty(1);
  };

  const handleAddReplacement = () => {
    if (!selectedProduct) return;
    if (selectedProduct.batches && selectedProduct.batches.length > 0 && !selectedBatch) {
      notify('Please select a medicine batch', 'warning');
      return;
    }

    const maxStock = selectedBatch ? selectedBatch.quantity : selectedProduct.quantity;
    if (swapQty > maxStock) {
      notify(`Only ${maxStock} items available in selected batch/stock`, 'error');
      return;
    }

    // Check if already in cart
    const existingIndex = replacementCart.findIndex(
      item => item.productId === selectedProduct._id && item.batchNumber === (selectedBatch?.batchNumber || '')
    );

    if (existingIndex > -1) {
      const currentCart = [...replacementCart];
      const newQty = currentCart[existingIndex].qty + Number(swapQty);
      if (newQty > maxStock) {
        notify(`Cannot exceed batch stock of ${maxStock}`, 'error');
        return;
      }
      currentCart[existingIndex].qty = newQty;
      currentCart[existingIndex].taxableAmount = newQty * (selectedProduct.price / (1 + (selectedProduct.gst || 0) / 100));
      currentCart[existingIndex].total = newQty * selectedProduct.price;
      setReplacementCart(currentCart);
    } else {
      const price = selectedProduct.price || 0;
      const gst = selectedProduct.gst || 0;
      const total = price * swapQty;
      const taxable = total / (1 + gst / 100);

      setReplacementCart(prev => [
        ...prev,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          batchNumber: selectedBatch?.batchNumber || '',
          expiryDate: selectedBatch?.expiryDate || null,
          qty: Number(swapQty),
          price,
          gst,
          taxableAmount: Number(taxable.toFixed(2)),
          total: Number(total.toFixed(2))
        }
      ]);
    }

    // Reset select fields
    setSelectedProduct(null);
    setSelectedBatch(null);
    setSwapQty(1);
    notify('Added replacement medicine to cart', 'success');
  };

  const handleRemoveReplacement = (index) => {
    setReplacementCart(prev => prev.filter((_, i) => i !== index));
  };

  // Compute live calculations
  const calculateTotals = () => {
    let returnedAmount = 0;
    const returnedItemsList = [];

    if (selectedBill) {
      selectedBill.items.forEach(item => {
        const key = `${item._id}_${item.batchNumber}`;
        const selection = returnQuantities[key];
        if (selection && selection.qty > 0) {
          const itemTotal = item.price * selection.qty;
          const gst = item.gst || 0;
          const taxable = itemTotal / (1 + gst / 100);

          returnedAmount += itemTotal;
          returnedItemsList.push({
            productId: item._id,
            name: item.name,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            qty: selection.qty,
            price: item.price,
            taxableAmount: Number(taxable.toFixed(2)),
            gst,
            total: Number(itemTotal.toFixed(2)),
            reason: selection.reason
          });
        }
      });
    }

    const replacementAmount = replacementCart.reduce((sum, item) => sum + item.total, 0);
    let refundAmount = 0;
    let extraCharged = 0;

    if (returnedAmount > replacementAmount) {
      refundAmount = returnedAmount - replacementAmount;
    } else {
      extraCharged = replacementAmount - returnedAmount;
    }

    return {
      returnedAmount: Number(returnedAmount.toFixed(2)),
      replacementAmount: Number(replacementAmount.toFixed(2)),
      refundAmount: Number(refundAmount.toFixed(2)),
      extraCharged: Number(extraCharged.toFixed(2)),
      returnedItemsList
    };
  };

  const totals = calculateTotals();

  const handleProcessReturn = async () => {
    if (!selectedBill) return;
    if (totals.returnedItemsList.length === 0) {
      notify('Please select at least 1 item to return', 'warning');
      return;
    }
    if (!selectedAccountId) {
      notify('Please select a settlement account', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        originalBillId: selectedBill._id,
        returnedItems: totals.returnedItemsList,
        replacementItems: replacementCart,
        returnedAmount: totals.returnedAmount,
        replacementAmount: totals.replacementAmount,
        refundAmount: totals.refundAmount,
        extraCharged: totals.extraCharged,
        accountId: selectedAccountId
      };

      const res = await api.post('/return-bills', payload);
      if (res.data?.success) {
        notify('Sales Return processed successfully!', 'success');
        const createdBill = res.data.data;
        if (window.confirm("Do you want to print the Return Bill?")) {
          handlePrintReturn(createdBill);
        }
        // Reset state
        setSelectedBill(null);
        setReplacementCart([]);
        setReturnQuantities({});
        // Reload details
        fetchAccounts();
        fetchHistory();
        setActiveTab('history');
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to process Sales Return', 'error');
    }
    setSubmitting(false);
  };

  const handlePrintReturn = (returnBill) => {
    try {
      const pd = buildReturnPrintData(returnBill, settings);
      const html = buildReturnInvoiceHTML(pd, logoUrl, settings?.paperSize);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => { win.print(); }, 500);
      } else {
        notify('Popup blocked! Please allow popups to print.', 'warning');
      }
    } catch (err) {
      console.error(err);
      notify('Failed to generate print layout', 'error');
    }
  };

  const activeAccount = accounts.find(a => a._id === selectedAccountId);

  return (
    <div>
      <PageHeader
        title="Sales Return Terminal"
        subtitle="Process pharmaceutical sales returns, replacements and settlements"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Return Bills' }]}
      />

      <div className="page-content space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'create'
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Process Return & Replacements
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Returns Directory & History
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left/Middle Panels */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Search Invoice Panel */}
              <div className="card-pro p-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Step 1: Search Invoice</h3>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Enter Invoice Number (e.g. INV-1002)..."
                      className="pro-input !pl-9"
                      value={invoiceQuery}
                      onChange={(e) => setInvoiceQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchInvoice()}
                    />
                  </div>
                  <button
                    onClick={searchInvoice}
                    disabled={searchingBill}
                    className="btn-primary !py-2.5"
                  >
                    {searchingBill ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Matching Bills Dropdown List */}
                {matchingBills.length > 0 && (
                  <div className="mt-3 border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-lg bg-white">
                    {matchingBills.map((b) => (
                      <div
                        key={b._id}
                        onClick={() => handleSelectInvoice(b)}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800">#{b.invoice}</span>
                          <span className="text-xs text-slate-400 ml-3">Customer: {b.customerName || 'Walk-in'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <span>₹{(b.total || 0).toLocaleString()}</span>
                          <span className="badge badge-green">Select</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedBill && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      <div>
                        <p className="text-sm font-bold text-emerald-950">Active Invoice: #{selectedBill.invoice}</p>
                        <p className="text-[11px] text-emerald-800">
                          {selectedBill.customerName} ({selectedBill.customerPhone || 'No Phone'}) • Purchased: {new Date(selectedBill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Items Return List */}
              {selectedBill && (
                <div className="card-pro overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/50 p-5">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Step 2: Select Items to Return</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Specify returned quantity and return reason</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Batch</th>
                          <th className="text-center">Orig Qty</th>
                          <th className="text-right">Price</th>
                          <th className="text-center w-36">Return Qty</th>
                          <th className="w-44">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, index) => {
                          const key = `${item._id}_${item.batchNumber}`;
                          const selection = returnQuantities[key] || { qty: 0, reason: 'Expired' };
                          return (
                            <tr key={index}>
                              <td>
                                <div className="font-bold text-slate-800">{item.name}</div>
                                <div className="text-[10px] text-slate-400">GST: {item.gst}%</div>
                              </td>
                              <td>
                                <span className="badge badge-gray">{item.batchNumber || 'N/A'}</span>
                                {item.expiryDate && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="text-center font-bold text-slate-700">{item.qty}</td>
                              <td className="text-right font-bold text-slate-800">₹{(item.price || 0).toLocaleString()}</td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateReturnQty(item, -1)}
                                    className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center font-black text-slate-600 hover:bg-slate-200"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-bold text-sm text-slate-800">
                                    {selection.qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateReturnQty(item, 1)}
                                    className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center font-black text-slate-600 hover:bg-slate-200"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td>
                                <select
                                  value={selection.reason}
                                  onChange={(e) => updateReturnReason(item, e.target.value)}
                                  className="pro-input !py-1 !px-2 bg-white !text-xs !w-full"
                                  disabled={selection.qty === 0}
                                >
                                  <option value="Expired">Expired</option>
                                  <option value="Near Expiry">Near Expiry</option>
                                  <option value="Defective">Defective</option>
                                  <option value="Others">Others (Undamaged)</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Replacements Section */}
              {selectedBill && (
                <div className="card-pro p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Step 3: Add Swaps / Replacements</h3>
                    <p className="text-[11px] text-slate-500">Add medicines that the customer wants in exchange</p>
                  </div>

                  {/* Replacement Cart Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="md:col-span-2 relative">
                      <label className="pro-label !text-[10px]">Search Stock Medicine</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Type name (e.g. Paracetamol)..."
                          className="pro-input !pl-9 !py-1.5 !text-xs bg-white"
                          value={searchProductQuery}
                          onChange={(e) => searchProduct(e.target.value)}
                        />
                      </div>

                      {productsList.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-lg bg-white z-40 max-h-48 overflow-y-auto">
                          {productsList.map(p => (
                            <div
                              key={p._id}
                              onClick={() => handleSelectProduct(p)}
                              className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div className="text-xs">
                                <span className="font-bold text-slate-800 block">{p.name}</span>
                                <span className="text-[9px] text-slate-400">{p.manufacturer || 'No Brand'} • Price: ₹{p.price}</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600">Qty: {p.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="pro-label !text-[10px]">Select Batch</label>
                      <select
                        className="pro-input !py-1.5 !text-xs bg-white"
                        value={selectedBatch ? JSON.stringify(selectedBatch) : ''}
                        onChange={(e) => setSelectedBatch(e.target.value ? JSON.parse(e.target.value) : null)}
                        disabled={!selectedProduct || !selectedProduct.batches?.length}
                      >
                        {selectedProduct && selectedProduct.batches?.map((b, bi) => (
                          <option key={bi} value={JSON.stringify(b)}>
                            {b.batchNumber} (Stock: {b.quantity})
                          </option>
                        ))}
                        {!selectedProduct && <option value="">Select Medicine First</option>}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="pro-label !text-[10px]">Replacement Qty</label>
                      <input
                        type="number"
                        min="1"
                        className="pro-input !py-1.5 !text-xs bg-white"
                        value={swapQty}
                        onChange={(e) => setSwapQty(Math.max(1, Number(e.target.value)))}
                        disabled={!selectedProduct}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddReplacement}
                        disabled={!selectedProduct}
                        className="btn-primary !py-2 !w-full !text-xs flex items-center justify-center gap-1.5"
                      >
                        <Plus size={14} /> Add Swap
                      </button>
                    </div>
                  </div>

                  {/* Selected Product Highlight Card */}
                  {selectedProduct && (
                    <div className="p-3.5 bg-accent-50 border border-accent-100 rounded-xl flex items-center justify-between animate-fade-in">
                      <div className="text-xs">
                        <span className="font-bold text-accent-950 block">Selected: {selectedProduct.name}</span>
                        <span className="text-slate-500 font-medium">Price: ₹{selectedProduct.price} | GST: {selectedProduct.gst}%</span>
                      </div>
                      {selectedBatch && (
                        <span className="text-[10px] font-black bg-accent text-white px-2 py-0.5 rounded-full">
                          Batch: {selectedBatch.batchNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Swaps Cart List */}
                  {replacementCart.length > 0 ? (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="pro-table !text-xs">
                        <thead>
                          <tr>
                            <th>Replacement Medicine</th>
                            <th>Batch</th>
                            <th className="text-center">Qty</th>
                            <th className="text-right">Price</th>
                            <th className="text-right">Total</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {replacementCart.map((item, index) => (
                            <tr key={index}>
                              <td className="font-bold text-slate-800">{item.name}</td>
                              <td><span className="badge badge-gray">{item.batchNumber || 'N/A'}</span></td>
                              <td className="text-center font-bold text-slate-700">{item.qty}</td>
                              <td className="text-right font-bold text-slate-800">₹{(item.price || 0).toLocaleString()}</td>
                              <td className="text-right font-bold text-accent">₹{(item.total || 0).toLocaleString()}</td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReplacement(index)}
                                  className="text-red-500 hover:text-red-700 action-btn"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No replacement items added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Settlement/Summary Column */}
            <div className="space-y-6">
              
              {/* Financial Balances Calculator */}
              <div className="card-pro p-6 space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Summary & Settlement
                </h3>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">Return Value (+)</span>
                    <span className="font-bold text-slate-800">₹{(totals.returnedAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">Replacement Value (-)</span>
                    <span className="font-bold text-slate-800">₹{(totals.replacementAmount || 0).toLocaleString()}</span>
                  </div>

                  <hr className="border-slate-100" />

                  {totals.refundAmount > 0 ? (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-orange-800 uppercase block tracking-wider">Refund Due to Customer</span>
                        <span className="text-lg font-black text-orange-950">₹{(totals.refundAmount).toLocaleString()}</span>
                      </div>
                      <ArrowDownLeft size={24} className="text-orange-600" />
                    </div>
                  ) : totals.extraCharged > 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-emerald-800 uppercase block tracking-wider">Collect Extra Charge</span>
                        <span className="text-lg font-black text-emerald-950">₹{(totals.extraCharged).toLocaleString()}</span>
                      </div>
                      <ArrowUpRight size={24} className="text-emerald-600" />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-800 uppercase block tracking-wider">Net Settlement Balance</span>
                        <span className="text-lg font-black text-slate-950">₹0.00</span>
                      </div>
                      <CheckCircle2 size={24} className="text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Settlement Account Selector */}
                <div className="space-y-3">
                  <label className="pro-label">Settlement Store Account *</label>
                  <select
                    className="pro-input bg-white w-full"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({acc.type} • Bal: ₹{(acc.balance || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {activeAccount && (
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Estimated Dynamic Balance</span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Current Balance:</span>
                        <span className="font-bold text-slate-800">₹{(activeAccount.balance || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">After Adjustment:</span>
                        <span className={`font-black ${totals.refundAmount > 0 ? 'text-red-600' : totals.extraCharged > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          ₹{((activeAccount.balance || 0) + totals.extraCharged - totals.refundAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Terminal Trigger */}
                <button
                  type="button"
                  onClick={handleProcessReturn}
                  disabled={submitting || !selectedBill || totals.returnedItemsList.length === 0}
                  className="btn-primary !w-full !py-3 flex items-center justify-center gap-2 font-black tracking-wide text-sm"
                >
                  {submitting ? 'Processing Return...' : 'Process Sales Return'}
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* Return Bills Directory / History Tab */
          <div className="card-pro overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Return Invoices Directory</h3>
                <p className="text-[11px] text-slate-500 mt-1">{returnHistory.length} returns logged</p>
              </div>
              <button
                onClick={fetchHistory}
                className="text-xs font-bold text-accent flex items-center gap-1 hover:underline"
              >
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
              </div>
            ) : returnHistory.length === 0 ? (
              <EmptyState
                icon={RotateCcw}
                title="No Return History"
                subtitle="Process returns under the first tab to build this directory"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Return Invoice</th>
                      <th>Original Invoice</th>
                      <th>Customer</th>
                      <th className="text-right">Return Value</th>
                      <th className="text-right">Net Settlement</th>
                      <th className="text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnHistory.map((ret) => (
                      <tr key={ret._id}>
                        <td>
                          <div className="font-bold text-slate-800">{ret.returnInvoiceNumber}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(ret.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gray font-bold">#{ret.originalInvoiceNumber}</span>
                        </td>
                        <td>
                          <div className="font-bold text-slate-800">{ret.customerName || 'Walk-in Customer'}</div>
                          <div className="text-[10px] text-slate-400">{ret.customerPhone || 'No Phone'}</div>
                        </td>
                        <td className="text-right font-bold text-slate-700">₹{(ret.returnedAmount || 0).toLocaleString()}</td>
                        <td className="text-right">
                          {ret.refundAmount > 0 ? (
                            <span className="text-xs font-black text-orange-600 flex items-center justify-end gap-1">
                              <ArrowDownLeft size={12} /> Refunded: ₹{(ret.refundAmount).toLocaleString()}
                            </span>
                          ) : ret.extraCharged > 0 ? (
                            <span className="text-xs font-black text-emerald-600 flex items-center justify-end gap-1">
                              <ArrowUpRight size={12} /> Collected: ₹{(ret.extraCharged).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs font-black text-slate-500">Even Swap</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedHistoryBill(ret)}
                              className="action-btn edit"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handlePrintReturn(ret)}
                              className="action-btn edit !text-blue-600 hover:!bg-blue-50"
                              title="Print Return Bill"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Detail Modal */}
      {selectedHistoryBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => e.target === e.currentTarget && setSelectedHistoryBill(null)}
        >
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Return Bill: {selectedHistoryBill.returnInvoiceNumber}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Original Bill: #{selectedHistoryBill.originalInvoiceNumber} • Processed via {selectedHistoryBill.accountName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintReturn(selectedHistoryBill)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Print Return Bill"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => setSelectedHistoryBill(null)}
                  className="action-btn"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Return Items list */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Returned Stock Items
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="pro-table !text-xs">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Batch</th>
                        <th className="text-center">Returned Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-center">Reason</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistoryBill.returnedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-slate-800">{item.name}</td>
                          <td><span className="badge badge-gray">{item.batchNumber || 'N/A'}</span></td>
                          <td className="text-center font-bold text-slate-700">{item.qty}</td>
                          <td className="text-right font-bold text-slate-800">₹{(item.price || 0).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${
                              item.reason === 'Expired' ? 'badge-red' :
                              item.reason === 'Near Expiry' ? 'badge-orange' :
                              item.reason === 'Defective' ? 'badge-red' : 'badge-blue'
                            }`}>
                              {item.reason}
                            </span>
                          </td>
                          <td className="text-right font-bold text-slate-800">₹{(item.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Replacement Items list */}
              {selectedHistoryBill.replacementItems?.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Provided Swaps / Replacements
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="pro-table !text-xs">
                      <thead>
                        <tr>
                          <th>Medicine Name</th>
                          <th>Batch</th>
                          <th className="text-center">Qty Given</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistoryBill.replacementItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="font-bold text-slate-800">{item.name}</td>
                            <td><span className="badge badge-gray">{item.batchNumber || 'N/A'}</span></td>
                            <td className="text-center font-bold text-slate-700">{item.qty}</td>
                            <td className="text-right font-bold text-slate-800">₹{(item.price || 0).toLocaleString()}</td>
                            <td className="text-right font-bold text-accent">₹{(item.total || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Breakdowns */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Return Value:</span>
                    <span className="font-bold text-slate-800">₹{(selectedHistoryBill.returnedAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Replacement Value:</span>
                    <span className="font-bold text-slate-800">₹{(selectedHistoryBill.replacementAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-4 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 block uppercase">Final Adjustment</span>
                  {selectedHistoryBill.refundAmount > 0 ? (
                    <span className="text-sm font-black text-orange-600 flex items-center gap-1 mt-0.5">
                      <ArrowDownLeft size={16} /> Refunded Customer: ₹{(selectedHistoryBill.refundAmount).toLocaleString()}
                    </span>
                  ) : selectedHistoryBill.extraCharged > 0 ? (
                    <span className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight size={16} /> Collected Extra: ₹{(selectedHistoryBill.extraCharged).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm font-black text-slate-700 mt-0.5">Even Swap (₹0.00 Balance)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setSelectedHistoryBill(null)}
                className="btn-secondary"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
