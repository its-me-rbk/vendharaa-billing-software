import React, { useState } from 'react';
import { Printer } from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function PrintSettings() {
  const [paperSize, setPaperSize] = useState('a4');
  const [showLogo, setShowLogo] = useState(true);
  const [printGST, setPrintGST] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);

  return (
    <div className="card-pro" style={{ padding: 24 }}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <Printer size={20} className="text-emerald-600" />
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
            <option value="a5">Medium A5 Sheet</option>
            <option value="thermal">POS Thermal (80mm)</option>
          </select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-all">
            <div><p className="text-sm font-bold text-slate-800">Branded Logo Header</p><p className="text-[11px] text-slate-500 mt-0.5">Embed business logo on every printed invoice</p></div>
            <Toggle checked={showLogo} onChange={() => setShowLogo(!showLogo)} />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-all">
            <div><p className="text-sm font-bold text-slate-800">GST Compliance Breakdown</p><p className="text-[11px] text-slate-500 mt-0.5">Show detailed tax distribution (CGST/SGST)</p></div>
            <Toggle checked={printGST} onChange={() => setPrintGST(!printGST)} />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-all">
            <div><p className="text-sm font-bold text-slate-800">Post-Billing Auto-Print</p><p className="text-[11px] text-slate-500 mt-0.5">Trigger print command after invoice finalization</p></div>
            <Toggle checked={autoPrint} onChange={() => setAutoPrint(!autoPrint)} />
          </div>
        </div>
      </div>
    </div>
  );
}
