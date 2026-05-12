import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Package, Tag, Hash, BarChart2, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import { FARM_CATEGORIES } from '../../config/constants';

export default function AddProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: '', category: '', manufacturer: '',
    price: '', gst: '0', hsn: '', barcode: '',
    quantity: '', description: '',
  });
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
    }
  }, [product]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }, [errors]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price is required';
    if (form.gst && (Number(form.gst) < 0 || Number(form.gst) > 100)) e.gst = 'GST must be 0–100';
    if (form.quantity && Number(form.quantity) < 0) e.quantity = 'Cannot be negative';
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
        quantity: Number(form.quantity) || 0,
        description: form.description.trim(),
      };

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

  const fieldClasses = (field) =>
    `pro-input ${errors[field] ? '!border-red-400 !ring-red-100' : ''}`;

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
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Package size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEdit ? 'Edit Product' : 'New Product'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isEdit ? 'Update the product information below' : 'Enter product details to add to inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="action-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="p-6 space-y-5">
            {/* Product Name */}
            <div>
              <label className="pro-label">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={fieldClasses('name')}
                placeholder="e.g. Urea 50kg, DAP Fertilizer"
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name}</p>}
            </div>

            {/* Category + Manufacturer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="pro-label">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="pro-input bg-white"
                >
                  <option value="">Select Category</option>
                  {FARM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="pro-label">Manufacturer</label>
                <input
                  value={form.manufacturer}
                  onChange={(e) => updateField('manufacturer', e.target.value)}
                  className="pro-input"
                  placeholder="Brand name"
                />
              </div>
            </div>

            {/* Price + GST + Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="pro-label">Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className={`${fieldClasses('price')} !pl-7`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.price}</p>}
              </div>
              <div>
                <label className="pro-label">GST (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.gst}
                    onChange={(e) => updateField('gst', e.target.value)}
                    className={`${fieldClasses('gst')} !pr-7`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                </div>
                {errors.gst && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.gst}</p>}
              </div>
              <div>
                <label className="pro-label">Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                  className={fieldClasses('quantity')}
                  placeholder="0"
                />
                {errors.quantity && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.quantity}</p>}
              </div>
            </div>

            {/* HSN + Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="pro-label">HSN Code</label>
                <input
                  value={form.hsn}
                  onChange={(e) => updateField('hsn', e.target.value)}
                  className="pro-input"
                  placeholder="e.g. 31021000"
                />
              </div>
              <div>
                <label className="pro-label">Barcode</label>
                <input
                  value={form.barcode}
                  onChange={(e) => updateField('barcode', e.target.value)}
                  className="pro-input"
                  placeholder="Scan or type barcode"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="pro-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="pro-input resize-none"
                rows={3}
                placeholder="Optional product notes or description"
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  {isEdit ? 'Update Product' : 'Add Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
