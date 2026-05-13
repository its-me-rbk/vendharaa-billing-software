import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Package, Tag, Hash, BarChart2, IndianRupee, Plus, Trash2, Calendar } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import { FARM_CATEGORIES, PHARMA_CATEGORIES } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';

export default function AddProductForm({ product, onClose, onSaved }) {
  const { businessType } = useAuth();
  const isEdit = !!product;
  const isPharma = businessType === 'pharma';

  const [form, setForm] = useState({
    name: '', category: '', manufacturer: '',
    price: '', gst: '0', hsn: '', barcode: '',
    quantity: '', description: '',
  });
  const [batches, setBatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || '',
        manufacturer: product.manufacturer || '',
        price: String(product.price ?? ''),
        gst: String(product.gst ?? '0'),
        hsn: product.hsn || '',
        barcode: product.barcode || '',
        quantity: String(product.quantity ?? ''),
        description: product.description || '',
      });
      if (product.batches) {
        setBatches(product.batches.map(b => ({
          ...b,
          expiryDate: b.expiryDate ? b.expiryDate.split('T')[0] : ''
        })));
      }
    } else {
      if (isPharma) {
        setBatches([{ batchNumber: '', expiryDate: '', quantity: '' }]);
      }
    }
  }, [product, isPharma]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }, [errors]);

  const addBatch = () => setBatches([...batches, { batchNumber: '', expiryDate: '', quantity: '' }]);
  const removeBatch = (idx) => setBatches(batches.filter((_, i) => i !== idx));
  const updateBatch = (idx, field, value) => {
    const newBatches = [...batches];
    newBatches[idx][field] = value;
    setBatches(newBatches);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price is required';
    
    if (isPharma) {
      if (batches.length === 0) e.batches = 'At least one batch is required for Pharma';
      batches.forEach((b, i) => {
        if (!b.batchNumber) e[`batch_${i}_num`] = 'Batch # required';
        if (!b.quantity || Number(b.quantity) < 0) e[`batch_${i}_qty`] = 'Qty required';
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        manufacturer: form.manufacturer.trim(),
        price: Number(form.price),
        gst: Number(form.gst) || 0,
        hsn: form.hsn.trim(),
        barcode: form.barcode.trim(),
        quantity: isPharma ? batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0) : (Number(form.quantity) || 0),
        description: form.description.trim(),
      };

      if (isPharma) {
        payload.batches = batches.map(b => ({
          ...b,
          quantity: Number(b.quantity)
        }));
      }

      if (isEdit) {
        await api.put(`/products/${product._id}`, payload);
        notify('Product updated successfully', 'success');
      } else {
        await api.post('/products', payload);
        notify('Product created successfully', 'success');
      }
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save product';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = isPharma ? PHARMA_CATEGORIES : FARM_CATEGORIES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-xl animate-slide-up overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center">
              <Package size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEdit ? 'Edit Product' : 'New Product'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isPharma ? 'Manage medicine inventory and batches' : 'Enter product details to add to inventory'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="action-btn"><X size={18} /></button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="p-6 space-y-5">
            <div>
              <label className="pro-label">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`pro-input ${errors.name ? '!border-red-400' : ''}`}
                placeholder={isPharma ? 'e.g. Paracetamol 500mg' : 'e.g. Urea 50kg'}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="pro-label">Category</label>
                <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="pro-input bg-white">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="pro-label">Manufacturer</label>
                <input value={form.manufacturer} onChange={(e) => updateField('manufacturer', e.target.value)} className="pro-input" placeholder="Brand name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="pro-label">Price (₹) *</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} className={`pro-input ${errors.price ? '!border-red-400' : ''}`} placeholder="0.00" />
              </div>
              <div>
                <label className="pro-label">GST (%)</label>
                <input type="number" value={form.gst} onChange={(e) => updateField('gst', e.target.value)} className="pro-input" placeholder="0" />
              </div>
            </div>

            {!isPharma && (
              <div>
                <label className="pro-label">Stock Quantity</label>
                <input type="number" value={form.quantity} onChange={(e) => updateField('quantity', e.target.value)} className="pro-input" placeholder="0" />
              </div>
            )}

            {isPharma && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="pro-label !mb-0">Batches & Expiry *</label>
                  <button type="button" onClick={addBatch} className="text-[11px] font-bold text-accent flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Add Batch
                  </button>
                </div>
                {batches.map((b, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          placeholder="Batch #"
                          value={b.batchNumber}
                          onChange={(e) => updateBatch(idx, 'batchNumber', e.target.value)}
                          className={`pro-input !py-1.5 !text-xs ${errors[`batch_${idx}_num`] ? '!border-red-400' : ''}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={b.quantity}
                          onChange={(e) => updateBatch(idx, 'quantity', e.target.value)}
                          className={`pro-input !py-1.5 !text-xs ${errors[`batch_${idx}_qty`] ? '!border-red-400' : ''}`}
                        />
                        {batches.length > 1 && (
                          <button type="button" onClick={() => removeBatch(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={b.expiryDate}
                        onChange={(e) => updateBatch(idx, 'expiryDate', e.target.value)}
                        className="pro-input !py-1.5 !pl-8 !text-xs"
                      />
                    </div>
                  </div>
                ))}
                {errors.batches && <p className="text-xs text-red-500 font-medium">{errors.batches}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="pro-label">HSN Code</label>
                <input value={form.hsn} onChange={(e) => updateField('hsn', e.target.value)} className="pro-input" placeholder="HSN" />
              </div>
              <div>
                <label className="pro-label">Barcode</label>
                <input value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} className="pro-input" placeholder="Scan..." />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : (isEdit ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
