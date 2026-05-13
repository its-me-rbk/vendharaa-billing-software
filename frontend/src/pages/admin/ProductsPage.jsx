import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, Edit, AlertTriangle, X, Calendar, Database } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import AddProductForm from './AddProductForm';
import { useAuth } from '../../context/AuthContext';

export default function ProductsPage() {
  const { businessType } = useAuth();
  const isPharma = businessType === 'pharma';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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
  
  // Pharma specific stats
  const expiredCount = isPharma ? products.filter(p => 
    p.batches?.some(b => b.expiryDate && new Date(b.expiryDate) < new Date())
  ).length : 0;

  return (
    <div>
      <PageHeader
        title={isPharma ? "Medicine Inventory" : "Products & Inventory"}
        subtitle={isPharma ? "Manage batches, expiry and stock" : "Manage your farm supply catalog"}
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Products' }]}
      >
        <button className="btn-primary" onClick={() => { setEditProduct(null); setShowAddForm(true); }}>
          <Plus size={16} /> Add Product
        </button>
      </PageHeader>

      <div className="page-content space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Package} label="Total SKUs" value={totalProducts} iconBg="bg-accent-100" iconColor="text-accent" />
          <StatCard icon={AlertTriangle} label="Critical Stock" value={criticalStock} iconBg="bg-orange-100" iconColor="text-orange-600" />
          <StatCard icon={Package} label="Out of Stock" value={outOfStock} iconBg="bg-red-100" iconColor="text-red-600" />
          {isPharma ? (
             <StatCard icon={Calendar} label="Expired" value={expiredCount} iconBg="bg-purple-100" iconColor="text-purple-600" />
          ) : (
             <StatCard icon={Database} label="Categories" value={[...new Set(products.map(p => p.category).filter(Boolean))].length} iconBg="bg-blue-100" iconColor="text-blue-600" />
          )}
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          {criticalStock > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 animate-fade-in">
              <AlertTriangle size={18} className="text-orange-600" />
              <span className="text-sm font-bold text-orange-900">{criticalStock} products have low stock</span>
            </div>
          )}
          {isPharma && expiredCount > 0 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 animate-fade-in">
              <AlertTriangle size={18} className="text-purple-600" />
              <span className="text-sm font-bold text-purple-900">{expiredCount} products contain expired batches!</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory List</h3>
              <p className="text-[11px] text-slate-500">{filtered.length} items found</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text" placeholder="Search..."
                className="pro-input !pl-9 !py-2 !w-full sm:!w-64"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
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
                    <th className="text-center">Total Stock</th>
                    {isPharma && <th>Batches</th>}
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <React.Fragment key={p._id}>
                      <tr className={expandedId === p._id ? 'bg-slate-50' : ''}>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.manufacturer || 'No Manufacturer'}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-gray">{p.category || 'General'}</span></td>
                        <td className="text-right font-bold">₹{(p.price || 0).toLocaleString()}</td>
                        <td className="text-center">
                          <span className={`font-bold text-sm ${(p.quantity || 0) <= 0 ? 'text-red-600' : (p.quantity || 0) < 10 ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {p.quantity || 0}
                          </span>
                        </td>
                        {isPharma && (
                          <td>
                            <button 
                              onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}
                              className="text-[11px] font-bold text-accent hover:underline"
                            >
                              {p.batches?.length || 0} Batches {expandedId === p._id ? '▲' : '▼'}
                            </button>
                          </td>
                        )}
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditProduct(p); setShowAddForm(true); }} className="action-btn edit"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(p._id)} className="action-btn delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                      {isPharma && expandedId === p._id && (
                        <tr>
                          <td colSpan={6} className="!p-0 bg-slate-50/50">
                            <div className="px-6 py-4 border-b border-slate-200">
                               <div className="grid grid-cols-3 gap-4">
                                  {p.batches?.map((b, bi) => {
                                    const isExpired = b.expiryDate && new Date(b.expiryDate) < new Date();
                                    return (
                                      <div key={bi} className={`p-3 rounded-lg border ${isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                           <span className="text-xs font-bold text-slate-700">Batch: {b.batchNumber}</span>
                                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isExpired ? 'bg-red-200 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                              {b.quantity} left
                                           </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                          <Calendar size={10} />
                                          Expiry: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'None'}
                                        </div>
                                      </div>
                                    );
                                  })}
                               </div>
                               {(!p.batches || p.batches.length === 0) && <p className="text-xs text-slate-400 italic">No batches found for this medicine</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
