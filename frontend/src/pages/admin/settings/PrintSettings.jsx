import React, { useState, useEffect } from 'react';
import { Printer, Save } from 'lucide-react';
import api from '../../../services/api';
import notify from '../../../components/ui/notify';

function Toggle({ checked, onChange, isPharma }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? (isPharma ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function PrintSettings({ businessType }) {
  const isPharma = businessType === 'pharma';
  const [paperSize, setPaperSize] = useState('a4');
  const [showLogo, setShowLogo] = useState(true);
  const [printGST, setPrintGST] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const headers = businessType ? { 'x-business-type': businessType } : {};
        const res = await api.get('/general-settings/get', { headers });
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          if (d.paperSize) setPaperSize(d.paperSize);
          if (d.showLogo !== undefined) setShowLogo(d.showLogo);
          if (d.printGST !== undefined) setPrintGST(d.printGST);
          if (d.autoPrint !== undefined) setAutoPrint(d.autoPrint);
        }
      } catch (err) { console.error('Load print settings:', err); }
    })();
  }, [businessType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { paperSize, showLogo, printGST, autoPrint };
      const headers = businessType ? { 'x-business-type': businessType } : {};
      await api.post('/general-settings/save', payload, { headers });
      notify('Print settings updated', 'success');
    } catch { notify('Failed to save', 'error'); }
    setSaving(false);
  };

  return (
    <div className="card-pro" style={{ padding: 24 }}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <Printer size={20} className={isPharma ? "text-blue-600" : "text-emerald-600"} />
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Output & Print Preferences</h2>
          <p className="text-[11px] text-slate-500">Configure invoice output settings</p>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <label className="pro-label">Default Paper Size</label>
          <select value={paperSize} onChange={e => setPaperSize(e.target.value)} className="pro-input bg-white">
            <option value="a4">Standard A4 Sheet</option>
            <option value="a3">Standard A3 Sheet</option>
            <option value="legal">Standard Legal Sheet</option>
            <option value="a5">Medium A5 Sheet</option>
            <option value="thermal">POS Thermal (80mm)</option>
          </select>
        </div>
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
            <div><p className="text-sm font-bold text-slate-800">Branded Logo Header</p><p className="text-[11px] text-slate-500 mt-0.5">Embed business logo on every printed invoice</p></div>
            <Toggle checked={showLogo} onChange={() => setShowLogo(!showLogo)} isPharma={isPharma} />
          </div>
          <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
            <div><p className="text-sm font-bold text-slate-800">GST Compliance Breakdown</p><p className="text-[11px] text-slate-500 mt-0.5">Show detailed tax distribution (CGST/SGST)</p></div>
            <Toggle checked={printGST} onChange={() => setPrintGST(!printGST)} isPharma={isPharma} />
          </div>
          <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
            <div><p className="text-sm font-bold text-slate-800">Post-Billing Auto-Print</p><p className="text-[11px] text-slate-500 mt-0.5">Trigger print command after invoice finalization</p></div>
            <Toggle checked={autoPrint} onChange={() => setAutoPrint(!autoPrint)} isPharma={isPharma} />
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
        <button onClick={handleSave} disabled={saving} className={`btn-primary ${isPharma ? '!bg-blue-600 hover:!bg-blue-700' : '!bg-emerald-600 hover:!bg-emerald-700'}`}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

