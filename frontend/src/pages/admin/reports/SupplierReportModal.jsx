import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Printer, FileSpreadsheet, Calendar, Truck } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import api from '../../../services/api';
import notify from '../../../components/ui/notify';
import { buildSupplierReportHTML, downloadSupplierReportCSV } from './supplierReportTemplate';

function getPresetDates(preset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (preset === 'this_month') {
    return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(now), label: now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) };
  }
  if (preset === 'last_month') {
    const s = new Date(y, m - 1, 1);
    const e = new Date(y, m, 0);
    return { startDate: fmt(s), endDate: fmt(e), label: s.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) };
  }
  if (preset === 'last_quarter') {
    const qStartMonth = Math.floor(m / 3) * 3 - 3;
    const s = new Date(y, qStartMonth, 1);
    const e = new Date(y, qStartMonth + 3, 0);
    return { startDate: fmt(s), endDate: fmt(e), label: 'Last Quarter' };
  }
  if (preset === 'last_year') {
    const s = new Date(y - 1, 0, 1);
    const e = new Date(y - 1, 11, 31);
    return { startDate: fmt(s), endDate: fmt(e), label: String(y - 1) };
  }
  return { startDate: fmt(new Date(y, m - 1, 1)), endDate: fmt(new Date(y, m, 0)), label: 'Custom Range' };
}

export default function SupplierReportModal({ open, onClose }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [preset, setPreset] = useState('last_month');
  const initial = getPresetDates('last_month');
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [periodLabel, setPeriodLabel] = useState(initial.label);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/suppliers')
      .then((r) => {
        const d = r.data;
        setSuppliers(Array.isArray(d) ? d : (d?.data || []));
      })
      .catch(() => setSuppliers([]));
  }, [open]);

  const fetchReport = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await api.get('/reports/supplier-stock-sales', {
        params: { supplier: selectedSupplier, startDate, endDate },
      });
      setReport(res.data);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to load supplier report', 'error');
    } finally {
      setLoading(false);
    }
  }, [open, selectedSupplier, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (!open) return null;

  const handlePreset = (p) => {
    setPreset(p);
    if (p !== 'custom') {
      const { startDate: s, endDate: e, label } = getPresetDates(p);
      setStartDate(s);
      setEndDate(e);
      setPeriodLabel(label);
    } else {
      setPeriodLabel('Custom Range');
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const html = buildSupplierReportHTML(report, periodLabel);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const html = buildSupplierReportHTML(report, periodLabel);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    html2pdf()
      .set({
        margin: 8,
        filename: `Supplier_Report_${report.supplier.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save()
      .then(() => document.body.removeChild(container));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Truck size={20} className="text-accent" />
              Supplier Stock &amp; Sales Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Opening, Purchase, Paid/Free Sales, Closing Stock &amp; Sales Value</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => report && downloadSupplierReportCSV(report)} disabled={!report || loading} className="btn-secondary !py-2 !px-3 !text-xs">
              <FileSpreadsheet size={15} /> Download CSV
            </button>
            <button onClick={handlePrint} disabled={!report || loading} className="btn-secondary !py-2 !px-3 !text-xs">
              <Printer size={15} /> Print
            </button>
            <button onClick={handleDownloadPDF} disabled={!report || loading} className="btn-primary !py-2 !px-3.5 !text-xs">
              <Download size={15} /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-wrap items-end gap-4">
          <div className="min-w-[220px]">
            <label className="pro-label">Supplier / Manufacturer</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="pro-input !py-2 !text-xs bg-white"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => {
                const val = s.company || s.name;
                return <option key={s._id} value={val}>{val}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="pro-label">Timeline</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['last_month', 'Last Month'],
                ['this_month', 'This Month'],
                ['last_quarter', 'Last Quarter'],
                ['last_year', 'Last Year'],
                ['custom', 'Date Range'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePreset(key)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    preset === key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <label className="pro-label flex items-center gap-1"><Calendar size={11} /> From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPreset('custom'); setPeriodLabel('Custom Range'); }}
                className="pro-input !py-1.5 !text-xs bg-white"
              />
            </div>
            <div>
              <label className="pro-label flex items-center gap-1"><Calendar size={11} /> To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPreset('custom'); setPeriodLabel('Custom Range'); }}
                className="pro-input !py-1.5 !text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="py-20 text-center text-sm font-bold text-slate-400">Generating report...</div>
          ) : !report || report.rows.length === 0 ? (
            <div className="py-20 text-center text-sm font-bold text-slate-400">No products found for this supplier.</div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-amber-50/70 border-b border-slate-200 px-4 py-3 text-center">
                <p className="text-sm font-black text-amber-900">{report.business?.name}</p>
                <p className="text-[11px] font-bold text-emerald-700">STOCK &amp; SALES REPORT — {periodLabel} ({new Date(report.startDate).toLocaleDateString('en-IN')} to {new Date(report.endDate).toLocaleDateString('en-IN')})</p>
                <p className="text-xs font-extrabold text-amber-700 uppercase mt-0.5">{report.supplier}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-3 py-2.5 text-center">SL</th>
                      <th className="px-4 py-2.5">Product Name</th>
                      <th className="px-3 py-2.5 text-right">Opening</th>
                      <th className="px-3 py-2.5 text-right">Purchase</th>
                      <th className="px-3 py-2.5 text-right">Paid Sales</th>
                      <th className="px-3 py-2.5 text-right">Free Sales</th>
                      <th className="px-3 py-2.5 text-right">Total Sales</th>
                      <th className="px-3 py-2.5 text-right">Closing</th>
                      <th className="px-3 py-2.5 text-center">Expiry</th>
                      <th className="px-4 py-2.5 text-right">Sales Value</th>
                      <th className="px-3 py-2.5 text-right">Prev Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.rows.map((r) => (
                      <tr key={r.productId} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-center text-slate-400">{r.sl}</td>
                        <td className="px-4 py-2 font-bold text-slate-800">{r.name}</td>
                        <td className="px-3 py-2 text-right">{r.opening}</td>
                        <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{r.purchase}</td>
                        <td className="px-3 py-2 text-right">{r.paidSales}</td>
                        <td className="px-3 py-2 text-right text-blue-600">{r.freeSales}</td>
                        <td className="px-3 py-2 text-right font-bold">{r.totalSales}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">{r.closing}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{r.expiry}</td>
                        <td className="px-4 py-2 text-right font-black text-slate-900">₹{Number(r.salesValue).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{r.prevSales}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-50 border-t-2 border-slate-300 font-black text-slate-900">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-right">Total :</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.opening}</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.purchase}</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.paidSales}</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.freeSales}</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.totalSales}</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.closing}</td>
                      <td className="px-3 py-2.5 text-center">—</td>
                      <td className="px-4 py-2.5 text-right">₹{Number(report.totals.salesValue).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right">{report.totals.prevSales}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
