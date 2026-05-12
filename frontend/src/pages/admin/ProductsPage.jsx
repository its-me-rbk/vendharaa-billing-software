import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, Edit, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import AddProductForm from './AddProductForm';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch { setProducts([]); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      notify('Product deleted', 'success');
      fetchProducts();
    } catch { notify('Failed to delete product', 'error'); }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = products.length;
  const criticalStock = products.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
  const outOfStock = products.filter(p => (p.quantity || 0) <= 0).length;
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].length;

  return (
    <div>
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage your farm supply catalog"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Products' }]}
      >
        <button className="btn-primary" onClick={() => { setEditProduct(null); setShowAddForm(true); }}>
          <Plus size={16} /> Add Product
        </button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Package} label="Total SKUs" value={totalProducts} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <StatCard icon={AlertTriangle} label="Critical Stock" value={criticalStock} iconBg="bg-orange-100" iconColor="text-orange-600" />
          <StatCard icon={Package} label="Out of Stock" value={outOfStock} iconBg="bg-red-100" iconColor="text-red-600" />
          <StatCard icon={Package} label="Categories" value={categories} iconBg="bg-blue-100" iconColor="text-blue-600" />
        </div>

        {/* Alert bar */}
        {criticalStock > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 animate-fade-in">
            <AlertTriangle size={18} className="text-orange-600" />
            <span className="text-sm font-bold text-orange-900">{criticalStock} products have critically low stock levels</span>
          </div>
        )}

        {/* Table */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory List</h3>
              <p className="text-[11px] text-slate-500">{filtered.length} products</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text" placeholder="Search products..."
                className="pro-input !pl-9 !py-2 !w-full sm:!w-64"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} title="No products found" subtitle="Add products to get started" />
          ) : (
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-right">Price</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">GST</th>
                    <th>HSN</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{p.name}</span>
                          {p.manufacturer && <span className="text-[10px] text-slate-400">{p.manufacturer}</span>}
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{p.category || 'General'}</span></td>
                      <td className="text-right font-bold">₹{(p.price || 0).toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`font-bold text-sm ${(p.quantity || 0) <= 0 ? 'text-red-600' : (p.quantity || 0) < 10 ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {p.quantity || 0}
                        </span>
                      </td>
                      <td className="text-center">{p.gst || 0}%</td>
                      <td className="font-mono text-xs text-slate-500">{p.hsn || '—'}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditProduct(p); setShowAddForm(true); }} className="action-btn edit"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(p._id)} className="action-btn delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <AddProductForm
          product={editProduct}
          onClose={() => { setShowAddForm(false); setEditProduct(null); }}
          onSaved={() => { setShowAddForm(false); setEditProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}
