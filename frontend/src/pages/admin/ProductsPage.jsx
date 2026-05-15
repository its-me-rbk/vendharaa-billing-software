import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, Edit, AlertTriangle, X, Calendar, Database } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import AddProductForm from './AddProductForm';
import { useAuth } from '../../context/AuthContext';

import ConfirmModal from '../../components/common/ConfirmModal';

export default function ProductsPage() {
  const { businessType } = useAuth();
  const isPharma = businessType === 'pharma';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, product: null });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch { setProducts([]); }
    setLoading(false);
  };

  const handleDelete = async () => {
    const product = confirmDelete.product;
    if (!product) return;
    try {
      await api.delete(`/products/${product._id}`);
      notify('Product deleted', 'success');
      setConfirmDelete({ open: false, product: null });
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
                              {p.batches?.length || 0} Active / {p.archivedBatches?.length || 0} Archived {expandedId === p._id ? '▲' : '▼'}
                            </button>
                          </td>
                        )}
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditProduct(p); setShowAddForm(true); }} className="action-btn edit"><Edit size={14} /></button>
                            <button onClick={() => setConfirmDelete({ open: true, product: p })} className="action-btn delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                      {isPharma && expandedId === p._id && (
                        <tr>
                          <td colSpan={6} className="!p-0 bg-slate-50/50">
                            <div className="px-6 py-4 border-b border-slate-200">
                               <div className="flex items-center justify-between mb-4">
                                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Batch Management</h4>
                               </div>
                               
                               {/* Active Batches */}
                               <div className="mb-6">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active Batches
                                 </p>
                                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {p.batches?.map((b, bi) => {
                                      const isExpired = b.expiryDate && new Date(b.expiryDate) < new Date();
                                      return (
                                        <div key={bi} className={`p-4 rounded-xl border group hover:shadow-md transition-all ${isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                                          <div className="flex justify-between items-start mb-2">
                                             <div>
                                               <span className="text-sm font-black text-slate-800 block">{b.batchNumber}</span>
                                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${isExpired ? 'bg-red-200 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                  {b.quantity} in stock
                                               </span>
                                             </div>
                                             <button 
                                               onClick={async () => {
                                                 try {
                                                   await api.post(`/products/${p._id}/batches/${b._id}/archive`);
                                                   notify('Batch archived', 'success');
                                                   fetchProducts();
                                                 } catch { notify('Failed to archive', 'error'); }
                                               }}
                                               className="text-[10px] font-black text-slate-400 hover:text-orange-600 uppercase tracking-tighter transition-colors"
                                             >
                                               Archive
                                             </button>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <Calendar size={12} className={isExpired ? 'text-red-400' : 'text-slate-400'} />
                                            Expiry: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'None'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {(!p.batches || p.batches.length === 0) && <p className="text-xs text-slate-400 italic py-2">No active batches available</p>}
                                 </div>
                               </div>

                               {/* Archived Batches */}
                               {p.archivedBatches?.length > 0 && (
                                 <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Archived Batches
                                   </p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75">
                                      {p.archivedBatches.map((b, bi) => (
                                        <div key={bi} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 group hover:opacity-100 transition-all">
                                          <div className="flex justify-between items-start mb-2">
                                             <div>
                                               <span className="text-sm font-black text-slate-400 block">{b.batchNumber}</span>
                                               <span className="text-[9px] font-black px-2 py-0.5 rounded-full mt-1 inline-block bg-slate-200 text-slate-500">
                                                  {b.quantity} archived
                                               </span>
                                             </div>
                                             <button 
                                               onClick={async () => {
                                                 try {
                                                   await api.post(`/products/${p._id}/archived-batches/${b._id}/restore`);
                                                   notify('Batch restored', 'success');
                                                   fetchProducts();
                                                 } catch { notify('Failed to restore', 'error'); }
                                               }}
                                               className="text-[10px] font-black text-accent hover:text-accent-dark uppercase tracking-tighter"
                                             >
                                               Restore
                                             </button>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            <Calendar size={12} />
                                            Archived: {b.archivedAt ? new Date(b.archivedAt).toLocaleDateString('en-IN') : 'Unknown'}
                                          </div>
                                        </div>
                                      ))}
                                   </div>
                                 </div>
                               )}
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

      <ConfirmModal 
        open={confirmDelete.open}
        title="Delete Product"
        message={`Are you sure you want to delete ${confirmDelete.product?.name}? This action will remove the product and all its batch data.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, product: null })}
        confirmText="Delete Product"
        variant="danger"
      />
    </div>
  );
}
