import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Search, Eye, Printer, Download, Trash2, Plus
} from "lucide-react";
import { UPIQR } from "@adityavijay21/upiqr";
import html2pdf from "html2pdf.js";

import api from "../../services/api";
import notify from "../../components/ui/notify";
import useBillingState from "./billing/useBillingState";
import { buildPrintData, buildInvoiceHTML } from "./billing/invoiceTemplate";
import { useAuth } from "../../context/AuthContext";
import BillDetailModal from "./billing/BillDetailModal";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function InvoicesPage() {
  const { role, businessType } = useAuth();
  const isPharma = businessType === "pharma";
  const state = useBillingState();
  const [confirmDelete, setConfirmDelete] = useState({ open: false, bill: null });
  const [deleting, setDeleting] = useState(false);

  const createBillPath = role === "Cashier" ? "/cashier/billing" : "/admin/billing";

  const getQR = async (pd) => {
    try {
      const { qr } = await new UPIQR().set({
        upiId: pd.bank.upi,
        name: pd.business.name,
        amount: Number(pd.summary.grandTotal),
        transactionNote: `Inv${pd.invoice.number}`,
      }).generate();
      return qr;
    } catch {
      return "";
    }
  };

  const printBill = async (billId) => {
    const bill = state.bills.find((b) => b._id === billId);
    if (!bill) return;
    const pd = buildPrintData(bill, state.generalSettings);
    const qr = await getQR(pd);
    const html = buildInvoiceHTML(pd, state.logoSrc, qr, state.generalSettings?.paperSize);
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const downloadBill = async (billId) => {
    const bill = state.bills.find((b) => b._id === billId);
    if (!bill) return;
    const pd = buildPrintData(bill, state.generalSettings);
    const qr = await getQR(pd);
    const html = buildInvoiceHTML(pd, state.logoSrc, qr, state.generalSettings?.paperSize);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    html2pdf()
      .set({
        margin: 0,
        filename: `${bill.invoice}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { format: state.generalSettings?.paperSize || "a4", orientation: "portrait" },
      })
      .from(container)
      .save()
      .then(() => document.body.removeChild(container));
  };

  const handleDeleteBill = async () => {
    if (!confirmDelete.bill) return;
    setDeleting(true);
    try {
      await api.delete(`/bills/${confirmDelete.bill._id}`);
      notify(`Invoice ${confirmDelete.bill.invoice} deleted & stock restored`, "success");
      if (state.selectedBill?._id === confirmDelete.bill._id) {
        state.setSelectedBill(null);
      }
      setConfirmDelete({ open: false, bill: null });
      state.fetchBills();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete invoice", "error");
    } finally {
      setDeleting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      Paid: "bg-emerald-100 text-emerald-700",
      Partial: "bg-amber-100 text-amber-700",
      Unpaid: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colors[status] || "bg-slate-100"}`}>
        {status}
      </span>
    );
  };

  const filteredBills = state.bills.filter((b) => {
    const q = state.billSearch.toLowerCase();
    const mSearch = !q || (b.customerName || "").toLowerCase().includes(q) || (b.invoice || "").toLowerCase().includes(q);
    const mStatus = state.billStatusFilter === "All" || (b.status || (b.paid ? "Paid" : "Unpaid")) === state.billStatusFilter;
    return mSearch && mStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <div className="top-bar glass sticky top-0 z-40 border-b border-slate-200/60 px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-accent" size={24} />
            Invoices
          </h1>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
            {isPharma ? "Vendharaa Pharma Care" : "Vendharaa Agro Store"} — {filteredBills.length} {filteredBills.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>
        <Link to={createBillPath} className="btn-primary !py-2.5 !px-4 !text-xs">
          <Plus size={15} /> Create Bill
        </Link>
      </div>

      <div className="page-content !p-4 sm:!p-6 lg:!p-8 max-w-[1600px] mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Paid", "Partial", "Unpaid"].map((st) => (
              <button
                key={st}
                onClick={() => state.setBillStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  state.billStatusFilter === st
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search invoice # or customer..."
              className="pro-input !pl-10 !py-2.5 !text-xs !bg-white w-full shadow-sm"
              value={state.billSearch}
              onChange={(e) => state.setBillSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card-pro overflow-hidden border-0 shadow-xl shadow-slate-200/50 p-3 sm:p-4">
          {filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm font-bold">No invoices found</p>
              <Link to={createBillPath} className="mt-3 text-xs font-bold text-accent hover:underline">
                Create a new bill →
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-100 bg-white">
                <table className="pro-table !text-sm">
                  <thead>
                    <tr className="!bg-slate-900 border-0">
                      <th className="px-6 py-4 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0">Invoice #</th>
                      <th className="px-6 py-4 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0">Customer</th>
                      <th className="px-6 py-4 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0">Method</th>
                      <th className="px-6 py-4 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0 text-right">Total</th>
                      <th className="px-6 py-4 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0 text-center">Status</th>
                      <th className="px-6 py-4 !text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-0 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-black text-slate-800">{b.invoice}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {new Date(b.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-slate-900">{b.customerName || "Walk-in"}</p>
                          {b.customerPhone && <p className="text-[11px] text-slate-400">{b.customerPhone}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-700 uppercase">{b.paymentMethod}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-base font-black text-slate-900 tracking-tight">₹{Number(b.total).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={b.status || (b.paid ? "Paid" : "Unpaid")} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => state.setSelectedBill(b)} title="View" className="p-2 text-slate-500 hover:text-accent rounded-lg hover:bg-slate-100 transition-colors">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => printBill(b._id)} title="Print" className="p-2 text-slate-500 hover:text-accent rounded-lg hover:bg-slate-100 transition-colors">
                              <Printer size={16} />
                            </button>
                            <button onClick={() => downloadBill(b._id)} title="Download PDF" className="p-2 text-slate-500 hover:text-accent rounded-lg hover:bg-slate-100 transition-colors">
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ open: true, bill: b })}
                              title="Delete Invoice"
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {filteredBills.map((b) => (
                  <div key={b._id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm font-black text-slate-800">{b.invoice}</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{b.customerName || "Walk-in"}</p>
                        <p className="text-[10px] text-slate-400">{new Date(b.createdAt).toLocaleDateString("en-IN")} · {b.paymentMethod}</p>
                      </div>
                      <StatusBadge status={b.status || (b.paid ? "Paid" : "Unpaid")} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-base font-black text-slate-900">₹{Number(b.total).toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => state.setSelectedBill(b)} className="p-2 text-slate-500 hover:text-accent"><Eye size={16} /></button>
                        <button onClick={() => printBill(b._id)} className="p-2 text-slate-500 hover:text-accent"><Printer size={16} /></button>
                        <button onClick={() => downloadBill(b._id)} className="p-2 text-slate-500 hover:text-accent"><Download size={16} /></button>
                        <button onClick={() => setConfirmDelete({ open: true, bill: b })} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {state.selectedBill && (
        <BillDetailModal
          bill={state.selectedBill}
          onClose={() => state.setSelectedBill(null)}
          onPrint={() => printBill(state.selectedBill._id)}
          onDownload={() => downloadBill(state.selectedBill._id)}
        />
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${confirmDelete.bill?.invoice}? Stock quantities and ledger entries will be reverted.`}
        confirmText={deleting ? "Deleting..." : "Delete Invoice"}
        onConfirm={handleDeleteBill}
        onCancel={() => setConfirmDelete({ open: false, bill: null })}
      />
    </div>
  );
}
