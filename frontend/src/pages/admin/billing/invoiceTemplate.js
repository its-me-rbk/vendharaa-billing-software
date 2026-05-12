// Invoice print/PDF template — extracted from BillingPage.jsx.bak
// Uses the exact same bill theme (green header table, bank details, UPI QR)

export function numberToWords(num) {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + " " + a[n%10];
    if (n < 1000) return a[Math.floor(n/100)] + " Hundred " + inWords(n%100);
    if (n < 100000) return inWords(Math.floor(n/1000)) + " Thousand " + inWords(n%1000);
    if (n < 10000000) return inWords(Math.floor(n/100000)) + " Lakh " + inWords(n%100000);
    return "";
  };
  return inWords(Math.floor(num)) + " Rupees Only";
}

export function buildPrintData(bill, generalSettings) {
  const itemsWithTaxes = bill.items.map(item => {
    const sub = item.price * item.qty;
    const cgst = sub * (item.gst / 2 / 100);
    const sgst = sub * (item.gst / 2 / 100);
    return { ...item, subtotal: sub, cgst: cgst.toFixed(2), sgst: sgst.toFixed(2), total: (sub + cgst + sgst).toFixed(2) };
  });
  const grandSub = bill.items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalGst = itemsWithTaxes.reduce((s, i) => s + parseFloat(i.cgst) + parseFloat(i.sgst), 0);
  const grandTotal = parseFloat(bill.total.toFixed(2));

  return {
    invoice: { number: bill.invoice, date: new Date(bill.createdAt).toLocaleDateString('en-IN'), dueDate: new Date(Date.now() + 7*86400000).toLocaleDateString('en-IN') },
    business: { name: generalSettings?.pharmacyName || '', address: generalSettings?.address || '', dlNo: generalSettings?.licenseNumber || '', gstin: generalSettings?.gstNumber || '', contact: generalSettings?.phone || '', email: generalSettings?.email || '' },
    customer: { name: bill.customerName || "Walk-in Customer", phone: bill.customerPhone || "N/A", address: bill.customerAddress || "", email: bill.customerEmail || "" },
    items: itemsWithTaxes,
    summary: { subtotal: grandSub.toFixed(2), discount: bill.discount || 0, discountAmount: ((grandSub*(bill.discount||0))/100).toFixed(2), taxableAmount: (grandSub - (grandSub*(bill.discount||0))/100).toFixed(2), cgstTotal: (totalGst/2).toFixed(2), sgstTotal: (totalGst/2).toFixed(2), totalGst: totalGst.toFixed(2), grandTotal: grandTotal.toFixed(2) },
    payment: { method: bill.paymentMethod || "Cash", status: bill.paid ? "Paid" : "Pending" },
    formatted: { subtotal: grandSub.toLocaleString('en-IN',{minimumFractionDigits:2}), grandTotal: grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2}), words: numberToWords(grandTotal) },
    placeOfSupply: "Dharmapuri", countryOfSupply: "India",
    bank: { accountHolder: generalSettings?.accountHolder||"Farm Business", accountNumber: generalSettings?.accountNumber||"XXXXXXX", ifsc: generalSettings?.ifsc||"XXXXXXXX", accountType: "Current", bankName: generalSettings?.bankName||"Bank Name", upi: generalSettings?.upiId||"greendwarftech@uboi" }
  };
}

const CSS = `
* { box-sizing:border-box; margin:0; padding:0; font-family:"Helvetica Neue",Arial,sans-serif; }
body { background:#fff; padding:12px; }
.invoice-wrapper { max-width:780px; margin:0 auto; background:#fff; padding:14px 20px; }
.invoice-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
.invoice-title { font-size:18px; font-weight:700; }
.invoice-meta { margin-top:4px; font-size:10px; color:#555; line-height:1.4; }
.logo { text-align:right; }
.top-boxes { display:flex; gap:10px; margin-bottom:8px; }
.card { flex:1; background:#f5f5f5; padding:8px 10px; border-radius:3px; font-size:10px; }
.card-title { font-weight:700; margin-bottom:5px; font-size:10px; }
.label { font-weight:600; margin-top:2px; }
.label span { font-weight:400; }
.sub-header { display:flex; justify-content:space-between; font-size:9px; margin:4px 2px 8px; color:#777; }
.items-table { width:100%; border-collapse:collapse; font-size:10px; }
.items-table thead { background:#2d5a27; color:#fff; }
.items-table th, .items-table td { padding:4px 5px; }
.items-table th { font-weight:500; text-align:left; }
.items-table tbody td { border-bottom:1px solid #e0e0e0; height:22px; }
.bottom-section { display:grid; grid-template-columns:2fr 1.5fr; gap:20px; margin-top:14px; align-items:flex-start; }
.bank-details { font-size:10px; display:grid; grid-template-columns:1fr 90px; column-gap:12px; align-items:start; }
.bank-details h3 { font-size:11px; margin-bottom:6px; }
.bank-details .label { margin-top:3px; }
.upi-qr-wrapper { justify-self:end; align-self:start; text-align:center; font-size:10px; color:#777; }
.upi-caption { margin-bottom:4px; }
.square-box { width:80px; height:80px; background:#222; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; text-align:center; border-radius:3px; }
.terms { margin-top:10px; font-size:10px; grid-column:1/-1; }
.terms .label { margin-bottom:4px; }
.amount-summary { font-size:11px; }
.amount-summary-row { display:flex; justify-content:space-between; margin-bottom:3px; }
.amount-summary-row.total { font-size:14px; font-weight:700; margin-top:6px; padding-top:5px; border-top:1px solid #e0e0e0; }
.amount-summary-row.total span:last-child { font-size:15px; }
.amount-summary h3 { font-size:13px; margin-bottom:6px; }
.invoice-words { margin-top:6px; font-size:10px; color:#777; }
.footer { margin-top:12px; font-size:10px; color:#777; display:flex; justify-content:space-between; border-top:1px solid #eee; padding-top:6px; }
@media print { body { background:#fff; padding:0; -webkit-print-color-adjust:exact !important; } .invoice-wrapper { box-shadow:none; border:none; margin:0; max-width:100%; } }
`;

export function buildInvoiceHTML(pd, logoSrc, qrUrl) {
  const itemRows = pd.items.map(item => `
    <tr>
      <td>${item.name}${item.hsn ? '<br/><small>HSN: '+item.hsn+'</small>' : ''}</td>
      <td>${item.hsn || '—'}</td>
      <td>₹${parseFloat(item.price).toLocaleString('en-IN')}</td>
      <td>${item.qty}${item.freeQty > 0 ? ' <small style="color:#2d5a27">+'+item.freeQty+'F</small>' : ''}</td>
      <td>${item.gst || 0}%</td>
      <td>₹${parseFloat(item.subtotal).toLocaleString('en-IN')}</td>
      <td>₹${parseFloat(item.sgst).toLocaleString('en-IN')}</td>
      <td>₹${parseFloat(item.cgst).toLocaleString('en-IN')}</td>
      <td>₹${item.total}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Invoice ${pd.invoice.number}</title><style>${CSS}</style></head><body>
<div class="invoice-wrapper">
  <div class="invoice-header"><div><div class="invoice-title">Invoice</div><div class="invoice-meta">Invoice: ${pd.invoice.number}<br/>Invoice Date: ${pd.invoice.date}<br/>Due Date: ${pd.invoice.dueDate}</div></div><div class="logo">${logoSrc ? '<img src="'+logoSrc+'" style="max-height:70px" alt="Logo">' : ''}</div></div>
  <div class="top-boxes"><div class="card"><div class="card-title">Billed By</div><div class="label">${pd.business.name}</div>${pd.business.address}<br/><div class="label">DL No: <span>${pd.business.dlNo}</span></div><div class="label">GSTIN: <span>${pd.business.gstin}</span></div><div class="label">Contact: <span>${pd.business.contact}</span></div><div class="label">Email: <span>${pd.business.email}</span></div></div><div class="card"><div class="card-title">Billed To</div><div class="label">${pd.customer.name}</div>${pd.customer.address}<br/><div class="label">Contact: <span>${pd.customer.phone}</span></div><div class="label">Email: <span>${pd.customer.email}</span></div></div></div>
  <div class="sub-header"><span>Place of Supply: ${pd.placeOfSupply}</span><span>Country: ${pd.countryOfSupply}</span></div>
  <table class="items-table"><thead><tr><th>Item</th><th>HSN</th><th>Price</th><th>QTY</th><th>GST</th><th>Taxable</th><th>SGST</th><th>CGST</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
  <div class="bottom-section"><div class="bank-details"><div class="bank-left"><h3>Bank &amp; Payment Details</h3><div class="label">Account Holder: <span>${pd.bank.accountHolder}</span></div><div class="label">Account No: <span>${pd.bank.accountNumber}</span></div><div class="label">IFSC: <span>${pd.bank.ifsc}</span></div><div class="label">Type: <span>${pd.bank.accountType}</span></div><div class="label">Bank: <span>${pd.bank.bankName}</span></div><div class="label">UPI: <span>${pd.bank.upi}</span></div></div><div class="upi-qr-wrapper"><div class="upi-caption">UPI - Scan To Pay</div><div class="square-box">${qrUrl ? '<img src="'+qrUrl+'" alt="QR" width="100" height="100"/>' : 'QR'}</div></div><div class="terms"><div class="label">Terms and Conditions</div>1. Goods once sold will not be taken back<br/>2. Please verify items before leaving counter</div></div>
  <div class="amount-summary"><h3>Summary</h3><div class="amount-summary-row"><span>Sub Total</span><span>₹${pd.summary.subtotal}</span></div><div class="amount-summary-row"><span>Discount (${pd.summary.discount}%)</span><span>₹${pd.summary.discountAmount}</span></div><div class="amount-summary-row"><span>Taxable Amount</span><span>₹${pd.summary.taxableAmount}</span></div><div class="amount-summary-row"><span>CGST</span><span>₹${pd.summary.cgstTotal}</span></div><div class="amount-summary-row"><span>SGST</span><span>₹${pd.summary.sgstTotal}</span></div><div class="amount-summary-row total"><span>Total</span><span>₹${pd.summary.grandTotal}</span></div><div class="invoice-words">Invoice Total (In Words):<br/>${pd.formatted.words}</div></div></div>
  <div class="footer"><div>For enquiries: ${pd.business.email} | ${pd.business.contact}</div></div>
</div></body></html>`;
}
