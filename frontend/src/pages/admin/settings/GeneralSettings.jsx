import React, { useEffect, useState } from 'react';
import { Save, Upload, Trash2, Clock, Building2, Landmark } from 'lucide-react';
import api from '../../../services/api';
import notify from '../../../components/ui/notify';

export default function GeneralSettings({ businessType }) {
  const isPharma = businessType === 'pharma';
  const [form, setForm] = useState({
    pharmacyName: '', licenseNumber: '', gstNumber: '',
    address: '', phone: '', email: '',
    openingTime: '', closingTime: '',
    bankName: 'Ujjivan Small Finance Bank',
    branchName: 'Krishnagiri',
    accountNumber: '1130120250000479',
    ifsc: 'UJVN0001130',
    accountHolder: '',
    upiId: '',
  });
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const headers = businessType ? { 'x-business-type': businessType } : {};
        const res = await api.get('/general-settings/get', { headers });
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          setForm({
            pharmacyName: d.pharmacyName || '',
            licenseNumber: d.licenseNumber || '',
            gstNumber: d.gstNumber || '',
            address: d.address || '',
            phone: d.phone || '',
            email: d.email || '',
            openingTime: d.openingTime || '',
            closingTime: d.closingTime || '',
            bankName: d.bankName || 'Ujjivan Small Finance Bank',
            branchName: d.branchName || 'Krishnagiri',
            accountNumber: d.accountNumber || '1130120250000479',
            ifsc: d.ifsc || 'UJVN0001130',
            accountHolder: d.accountHolder || '',
            upiId: d.upiId || '',
          });
          if (res.data.data.logo) setLogoPreview(res.data.data.logo);
        }
      } catch (err) { console.error('Load settings:', err); }
    })();
  }, [businessType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          fd.append(k, v);
        }
      });
      if (logoFile) fd.append('logo', logoFile);
      if (removeLogo) fd.append('removeLogo', 'true');
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (businessType) headers['x-business-type'] = businessType;
      await api.post('/general-settings/save', fd, { headers });
      notify('Settings saved', 'success');
    } catch { notify('Failed to save', 'error'); }
    setSaving(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card-pro" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <Building2 size={20} className={isPharma ? "text-blue-600" : "text-emerald-600"} />
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Business Information</h2>
            <p className="text-[11px] text-slate-500">Core details used on invoices and documents</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="pro-label">Business Name</label>
            <input value={form.pharmacyName} onChange={e => update('pharmacyName', e.target.value)} className="pro-input" placeholder="Your business name" />
          </div>

          <div>
            <label className="pro-label">Business Logo</label>
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              {logoPreview && !removeLogo ? (
                <img src={logoPreview} alt="Logo" className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-300">
                  <Upload size={20} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="btn-secondary !py-1.5 !text-xs cursor-pointer inline-flex w-fit">
                  <Upload size={12} /> Choose File
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); setRemoveLogo(false); }
                  }} />
                </label>
                {(logoPreview || logoFile) && !removeLogo && (
                  <button type="button" onClick={() => { setRemoveLogo(true); setLogoFile(null); setLogoPreview(null); }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider">
                    Remove logo
                  </button>
                )}
                <p className="text-[10px] text-slate-400">{logoFile ? logoFile.name : logoPreview ? 'Current logo' : 'No file chosen'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="pro-label">License / Registration No.</label><input value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} className="pro-input" /></div>
            <div><label className="pro-label">GST Number</label><input value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)} className="pro-input font-mono" /></div>
          </div>

          <div><label className="pro-label">Address</label><textarea value={form.address} onChange={e => update('address', e.target.value)} rows={3} className="pro-input resize-none" /></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="pro-label">Phone</label><input value={form.phone} onChange={e => update('phone', e.target.value)} className="pro-input" type="tel" /></div>
            <div><label className="pro-label">Email</label><input value={form.email} onChange={e => update('email', e.target.value)} className="pro-input" type="email" /></div>
          </div>
        </div>
      </div>

      <div className="card-pro" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <Landmark size={20} className={isPharma ? "text-blue-600" : "text-emerald-600"} />
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bank & Payment Details</h2>
            <p className="text-[11px] text-slate-500">Bank credentials printed on invoices and payment receipts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="pro-label">Bank Account Number</label>
            <input
              value={form.accountNumber}
              onChange={e => update('accountNumber', e.target.value)}
              className="pro-input font-mono"
              placeholder="1130120250000479"
            />
          </div>
          <div>
            <label className="pro-label">IFSC Code</label>
            <input
              value={form.ifsc}
              onChange={e => update('ifsc', e.target.value.toUpperCase())}
              className="pro-input font-mono uppercase"
              placeholder="UJVN0001130"
            />
          </div>
          <div>
            <label className="pro-label">Bank Name</label>
            <input
              value={form.bankName}
              onChange={e => update('bankName', e.target.value)}
              className="pro-input"
              placeholder="e.g. Ujjivan Small Finance Bank"
            />
          </div>
          <div>
            <label className="pro-label">Branch Name</label>
            <input
              value={form.branchName}
              onChange={e => update('branchName', e.target.value)}
              className="pro-input"
              placeholder="e.g. Krishnagiri"
            />
          </div>
          <div>
            <label className="pro-label">Account Holder Name</label>
            <input
              value={form.accountHolder}
              onChange={e => update('accountHolder', e.target.value)}
              className="pro-input"
              placeholder="e.g. Vendharaa"
            />
          </div>
          <div>
            <label className="pro-label">UPI ID</label>
            <input
              value={form.upiId}
              onChange={e => update('upiId', e.target.value)}
              className="pro-input font-mono"
              placeholder="e.g. username@bank"
            />
          </div>
        </div>
      </div>

      <div className="card-pro" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <Clock size={20} className={isPharma ? "text-blue-600" : "text-emerald-600"} />
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Business Hours</h2>
            <p className="text-[11px] text-slate-500">Operating hours displayed to customers and staff</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="pro-label">Opening Time</label><input type="time" value={form.openingTime} onChange={e => update('openingTime', e.target.value)} className="pro-input" /></div>
          <div><label className="pro-label">Closing Time</label><input type="time" value={form.closingTime} onChange={e => update('closingTime', e.target.value)} className="pro-input" /></div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
