import React, { useEffect, useState } from 'react';
import { Tag, Search, Plus, Trash2, Save, Package } from 'lucide-react';
import api from '../../services/api';
import notify from '../../components/ui/notify';
import PageHeader from '../../components/common/PageHeader';

export default function OffersPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [saving, setSaving] = useState({});

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch { setProducts([]); }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const addTier = (productId) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      if (existing) {
        return prev.map(p =>
          p.productId === productId
            ? { ...p, offers: [...p.offers, { buyQty: '', freeQty: '' }] }
            : p
        );
      }
      return [...prev, { productId, offers: [{ buyQty: '', freeQty: '' }] }];
    });
  };

  const removeTier = (productId, tierIdx) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.productId !== productId) return p;
        const newOffers = p.offers.filter((_, i) => i !== tierIdx);
        return newOffers.length === 0 ? null : { ...p, offers: newOffers };
      }).filter(Boolean)
    );
  };

  const updateTier = (productId, tierIdx, field, value) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.productId !== productId) return p;
        const newOffers = p.offers.map((o, i) => i === tierIdx ? { ...o, [field]: value } : o);
        return { ...p, offers: newOffers };
      })
    );
  };

  const handleSave = async (productId) => {
    const sp = selectedProducts.find(p => p.productId === productId);
    if (!sp) return;
    const validOffers = sp.offers.filter(o => Number(o.buyQty) > 0 && Number(o.freeQty) > 0)
      .map(o => ({ buyQty: Number(o.buyQty), freeQty: Number(o.freeQty) }));

    setSaving(prev => ({ ...prev, [productId]: true }));
    try {
      await api.put(`/products/${productId}`, { offers: validOffers });
      notify('Offers saved!', 'success');
      fetchProducts();
    } catch { notify('Failed to save offers', 'error'); }
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

  // Merge local edits with product data
  const getProductOffers = (product) => {
    const local = selectedProducts.find(p => p.productId === product._id);
    if (local) return local.offers;
    return product.offers || [];
  };

  const initLocalEdit = (product) => {
    if (!selectedProducts.find(p => p.productId === product._id)) {
      setSelectedProducts(prev => [
        ...prev,
        { productId: product._id, offers: (product.offers || []).map(o => ({ buyQty: String(o.buyQty), freeQty: String(o.freeQty) })) }
      ]);
    }
  };

  return (
    <div>
      <PageHeader title="Promotions & Offers" subtitle="Buy X Get Y Free offer management"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Offers' }]}
      />

      <div className="page-content space-y-8">
        {/* Search */}
        <div className="card-pro" style={{ padding: 24 }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search products to add/manage offers..." className="pro-input !pl-12 !py-3 !text-base" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.filter(p => (p.offers && p.offers.length > 0) || selectedProducts.find(sp => sp.productId === p._id)).map(product => {
            const offers = getProductOffers(product);
            const isEditing = !!selectedProducts.find(sp => sp.productId === product._id);

            return (
              <div key={product._id} className="card-pro overflow-hidden">
                <div className="flex items-center justify-between p-5 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Package size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{product.name}</h3>
                      <p className="text-[10px] text-slate-500 uppercase">{product.category || 'General'} · ₹{product.price}</p>
                    </div>
                  </div>
                  <span className="badge badge-green">{offers.length} tier{offers.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="p-5 space-y-3">
                  {offers.map((offer, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Buy</span>
                        <input type="number" value={offer.buyQty} onChange={e => { initLocalEdit(product); updateTier(product._id, idx, 'buyQty', e.target.value); }}
                          className="pro-input !w-24 !text-center !py-1.5 !font-bold" placeholder="0" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Get</span>
                        <input type="number" value={offer.freeQty} onChange={e => { initLocalEdit(product); updateTier(product._id, idx, 'freeQty', e.target.value); }}
                          className="pro-input !w-24 !text-center !py-1.5 !font-bold" placeholder="0" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Free</span>
                      </div>
                      <button onClick={() => { initLocalEdit(product); removeTier(product._id, idx); }} className="action-btn delete"><Trash2 size={12} /></button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { initLocalEdit(product); addTier(product._id); }} className="btn-secondary !py-1.5 !text-xs flex-1">
                      <Plus size={12} /> Add Tier
                    </button>
                    {isEditing && (
                      <button onClick={() => handleSave(product._id)} disabled={saving[product._id]} className="btn-primary !py-1.5 !text-xs flex-1">
                        <Save size={12} /> {saving[product._id] ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* All products without offers */}
        {(() => {
          const productsWithoutOffers = filtered.filter(p => !(p.offers && p.offers.length > 0) && !selectedProducts.find(sp => sp.productId === p._id));
          if (productsWithoutOffers.length === 0) return null;
          const displayProducts = search ? productsWithoutOffers : productsWithoutOffers.slice(0, 20);
          return (
            <div className="card-pro overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50" style={{ padding: 20 }}>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Other Products</h3>
                <p className="text-[11px] text-slate-500">Click "Add Tier" to create offers {search ? '' : '(Showing top 20)'}</p>
              </div>
              <div className="divide-y divide-slate-50">
                {displayProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-bold text-sm text-slate-700">{p.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{p.category} · ₹{p.price}</span>
                  </div>
                  <button onClick={() => addTier(p._id)} className="btn-secondary !py-1.5 !text-[10px]">
                    <Plus size={10} /> Add Offer
                  </button>
                </div>
              ))}
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
