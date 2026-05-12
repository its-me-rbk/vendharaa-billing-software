import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import logo from '../../../assets/logo.png';

export default function useBillingState() {
  const [generalSettings, setGeneralSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [qty, setQty] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', email: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('Cash');
  const [paymentType, setPaymentType] = useState('full');
  const [amountPaid, setAmountPaid] = useState(0);
  const [billSearch, setBillSearch] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [pendingInfo, setPendingInfo] = useState(null);
  const [logoSrc, setLogoSrc] = useState('');

  const fetchProducts = useCallback(async () => { try { const r = await api.get('/products'); setProducts(Array.isArray(r.data) ? r.data : []); } catch { setProducts([]); } }, []);
  const fetchCustomers = useCallback(async () => { try { const r = await api.get('/customers'); const d = r.data; setCustomers(Array.isArray(d) ? d : (d?.data || [])); } catch { setCustomers([]); } }, []);
  const fetchBills = useCallback(async () => { try { const r = await api.get('/bills'); setBills(Array.isArray(r.data) ? r.data : []); } catch { setBills([]); } }, []);
  const fetchSettings = useCallback(async () => { try { const r = await api.get('/general-settings/get'); setGeneralSettings(r.data?.success ? r.data.data : null); } catch { setGeneralSettings(null); } }, []);

  useEffect(() => { fetchProducts(); fetchBills(); fetchSettings(); fetchCustomers(); }, []);
  useEffect(() => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); setLogoSrc(c.toDataURL('image/png')); }; img.src = logo; }, []);

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()));
  
  const selectProduct = useCallback((p) => {
    setSelectedProduct(p);
    setProductSearch('');
  }, []);
  const filteredCustomers = customers.filter(c => { const q = customerSearch.trim().toLowerCase(); return q && ((c.name||'').toLowerCase().includes(q) || String(c.phone||'').includes(q)); });

  const getPendingInfo = useCallback((cid) => {
    if (!cid || !bills.length) return null;
    const pb = bills.filter(b => b.customerId === cid && (!b.paid || Number(b.balance||0) > 0 || b.status === 'Partial' || b.status === 'Unpaid'));
    if (!pb.length) return null;
    const total = pb.reduce((s, b) => s + Number(b.balance || b.total || 0), 0);
    return { count: pb.length, total, bills: pb };
  }, [bills]);

  const selectCustomer = useCallback((c) => {
    const id = c._id || c.id;
    setSelectedCustomerId(id);
    setCustomer({ name: c.name||'', address: c.address||'', phone: c.phone||c.mobile||'', email: c.email||'' });
    setCustomerSearch(`${c.name}${c.phone ? ` (${c.phone})` : ''}`);
    setPendingInfo(id ? getPendingInfo(id) : null);
  }, [getPendingInfo]);

  const clearCustomer = useCallback(() => { setSelectedCustomerId(null); setCustomerSearch(''); setPendingInfo(null); setCustomer({ name:'', phone:'', address:'', email:'' }); }, []);

  const calculateFreeQty = (product, q) => {
    if (!product?.offers?.length) return 0;
    let rem = Number(q), free = 0;
    const sorted = [...product.offers].filter(o => Number(o.buyQty) > 0).sort((a, b) => Number(b.buyQty) - Number(a.buyQty));
    for (const o of sorted) { if (rem <= 0) break; const c = Math.floor(rem / Number(o.buyQty)); if (c > 0) { free += c * Number(o.freeQty); rem -= c * Number(o.buyQty); } }
    return free;
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = items.reduce((s, i) => s + i.cgst + i.sgst, 0);
  const total = subtotal - (subtotal * discount) / 100 + gst;

  return {
    generalSettings, products, customers, bills, items, setItems,
    selectedProduct, setSelectedProduct, selectProduct, productSearch, setProductSearch,
    qty, setQty, customer, setCustomer, customerSearch, setCustomerSearch,
    selectedCustomerId, discount, setDiscount, payment, setPayment,
    paymentType, setPaymentType, amountPaid, setAmountPaid,
    billSearch, setBillSearch, billStatusFilter, setBillStatusFilter,
    selectedBill, setSelectedBill, savingCustomer, setSavingCustomer,
    pendingInfo, setPendingInfo, logoSrc,
    filteredProducts, filteredCustomers,
    selectCustomer, clearCustomer, calculateFreeQty,
    subtotal, gst, total,
    fetchProducts, fetchBills, fetchCustomers, fetchSettings,
  };
}
