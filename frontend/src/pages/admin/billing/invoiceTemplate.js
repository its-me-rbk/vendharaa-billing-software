// Invoice print/PDF template — Restored to exact structure of invoice.html.
// Dynamically scales down the entire page for print using CSS zoom if items exceed standard capacity.
// Adjusted zoom formula and @page margins to strictly prevent 2nd-page overflow.

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
    return { 
      ...item, 
      subtotal: sub, 
      cgst: cgst.toFixed(2), 
      sgst: sgst.toFixed(2), 
      total: (sub + cgst + sgst).toFixed(2),
      batch: item.batchNumber || '—',
      exp: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '—',
      manufacturer: item.manufacturer || '—'
    };
  });
  const grandSub = bill.items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalGst = itemsWithTaxes.reduce((s, i) => s + parseFloat(i.cgst) + parseFloat(i.sgst), 0);
  const grandTotal = parseFloat(bill.total.toFixed(2));

  return {
    invoice: { 
      number: bill.invoice, 
      date: new Date(bill.createdAt).toLocaleDateString('en-IN'), 
      dueDate: new Date(Date.now() + 7*86400000).toLocaleDateString('en-IN') 
    },
    business: { 
      name: generalSettings?.pharmacyName || 'Vendharaa Pharmaceuticals', 
      address: generalSettings?.address || '1/167 Ground Floor, Ungaranahalli Village & Panchayat, Dharmapuri (Taluk), Dharmapuri - 636704', 
      dlNo: generalSettings?.licenseNumber || 'TN/DPI/20B&21B/01959', 
      gstin: generalSettings?.gstNumber || '', 
      contact: generalSettings?.phone || '+91 94429 59826', 
      email: generalSettings?.email || 'vendharaapharmaceuticals@gmail.com' 
    },
    customer: { 
      name: bill.customerName || "Walk-in Customer", 
      phone: bill.customerPhone || "N/A", 
      address: bill.customerAddress || "", 
      email: bill.customerEmail || "",
      gstin: bill.customerGst || 'NIL',
      dl: bill.customerDl || 'NIL'
    },
    items: itemsWithTaxes,
    summary: { 
      subtotal: grandSub.toFixed(2), 
      discount: bill.discount || 0, 
      discountAmount: ((grandSub*(bill.discount||0))/100).toFixed(2), 
      taxableAmount: (grandSub - (grandSub*(bill.discount||0))/100).toFixed(2), 
      cgstTotal: (totalGst/2).toFixed(2), 
      sgstTotal: (totalGst/2).toFixed(2), 
      totalGst: totalGst.toFixed(2), 
      grandTotal: grandTotal.toFixed(2) 
    },
    payment: { 
      method: bill.paymentMethod || "Cash", 
      status: bill.paid ? "Paid" : (bill.status || "Pending"),
      bankName: generalSettings?.bankName || 'Indian Bank',
      branchName: generalSettings?.branchName || 'Harur Branch',
      accountNumber: generalSettings?.accountNumber || '6021234678',
      ifsc: generalSettings?.ifsc || 'IDIB000012',
    },
    formatted: { 
      subtotal: grandSub.toLocaleString('en-IN',{minimumFractionDigits:2}), 
      grandTotal: grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2}), 
      words: numberToWords(grandTotal) 
    },
    settings: {
      showLogo: generalSettings?.showLogo !== false,
      printGST: generalSettings?.printGST !== false,
      autoPrint: !!generalSettings?.autoPrint
    },
    bank: { 
      accountHolder: generalSettings?.accountHolder||"Farm Business", 
      accountNumber: generalSettings?.accountNumber||'6021234678', 
      ifsc: generalSettings?.ifsc||'IDIB000012', 
      accountType: "Current", 
      bankName: generalSettings?.bankName||'Indian Bank', 
      upi: generalSettings?.upiId||"greendwarftech@uboi" 
    }
  };
}

export function buildInvoiceHTML(pd, logoSrc, qrUrl, paperSize = 'a4') {
  const itemRows = pd.items.map((item, idx) => `
    <tr>
      <td class="sno">${String(idx + 1).padStart(2, '0')}</td>
      <td class="mfr">${item.manufacturer}</td>
      <td class="desc">${item.name}</td>
      <td class="center">${item.hsn}</td>
      <td class="center">${item.batch}</td>
      <td class="center">${item.exp}</td>
      <td class="center">${item.qty}</td>
      <td class="center">${item.freeQty}</td>
      <td class="center">${pd.summary.discount}%</td>
      <td class="right">${parseFloat(item.price).toFixed(2)}</td>
      <td class="center">${item.gst}%</td>
      <td class="total">₹${item.total}</td>
    </tr>
  `).join('');

  // Calculate dynamic zoom based on item count to prevent second page.
  // Made more aggressive to ensure no overlap on standard A4 printers.
  const itemCount = pd.items.length;
  const printZoom = itemCount > 8 ? Math.max(0.50, 1 - ((itemCount - 8) * 0.04)).toFixed(2) : 1;
  const printMinHeight = Math.round(1122 / printZoom);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice - ${pd.invoice.number}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy:       #1B3685;
    --navy-dark:  #142966;
    --blue-amt:   #1D4ED8;
    --blue-badge: #2563EB;
    --panel-bg:   #1E3A6E;
    --panel-text: #FFFFFF;
    --ink:        #1A1A2E;
    --ink-mid:    #374151;
    --ink-light:  #6B7280;
    --ink-faint:  #9CA3AF;
    --border:     #E5E7EB;
    --border-mid: #D1D5DB;
    --row-alt:    #F8FAFD;
    --row-white:  #FFFFFF;
    --header-bg:  #F1F5FD;
    --stamp-red:  #C0392B;
    --card-bg:    #F4F6FA;
    --tag-bg:     #2563EB;
    --tag-text:   #FFFFFF;
    --shadow-sm:  0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
    --shadow-md:  0 4px 12px rgba(0,0,0,.09);
  }
  body { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); background: #E8ECF4; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 860px; min-height: 1122px; margin: 32px auto; background: #FFFFFF; border-radius: 12px; box-shadow: var(--shadow-md); padding: 36px 40px 40px; position: relative; overflow: hidden; display: flex; flex-direction: column; }
  .page::before, .page::after { content: ''; position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
  .page::before { width: 420px; height: 420px; background: radial-gradient(circle, rgba(27,54,133,.045) 0%, transparent 70%); right: -100px; bottom: 220px; }
  .page::after { width: 300px; height: 300px; background: radial-gradient(circle, rgba(27,54,133,.04) 0%, transparent 70%); left: -60px; bottom: 120px; }
  .page > * { position: relative; z-index: 1; }
  .processed-stamp { position: absolute; top: 0; right: 0; width: 100px; height: 100px; overflow: hidden; z-index: 10; }
  .processed-stamp span { position: absolute; top: 22px; right: -22px; background: #C0392B; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 28px; transform: rotate(45deg); transform-origin: center center; white-space: nowrap; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 24px; }
  .company-block h1 { font-size: 28px; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 10px; }
  .company-meta { display: flex; flex-direction: column; gap: 4px; }
  .meta-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--ink-mid); }
  .meta-row svg { flex-shrink: 0; color: var(--ink-light); }
  .invoice-box { background: var(--header-bg); border-radius: 8px; padding: 14px 20px 16px; text-align: right; min-width: 220px; border: 1px solid #DDE3F3; flex-shrink: 0; }
  .invoice-box .label-sm { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 3px; }
  .invoice-box .invoice-num { font-size: 18px; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 10px; }
  .invoice-box .bill-date { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 0; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .bill-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 26px; }
  .bill-card { background: var(--card-bg); border-radius: 8px; padding: 14px 18px; min-width: 300px; border: 1px solid #E2E8F2; }
  .bill-card .label-sm { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 5px; }
  .bill-card .company-name { font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 5px; }
  .bill-card .bill-addr { font-size: 12px; color: var(--ink-mid); line-height: 1.6; }
  .amount-block { text-align: right; flex-shrink: 0; }
  .amount-block .amt-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 4px; }
  .amount-block .amt-value { font-size: 36px; font-weight: 700; color: var(--blue-amt); letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 8px; }
  .net-badge { display: inline-block; background: var(--tag-bg); color: var(--tag-text); font-size: 10px; font-weight: 600; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; }
  .table-wrap { width: 100%; overflow: hidden; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 32px; }
  table.items { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.items thead tr { background: var(--header-bg); }
  table.items thead th { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-light); padding: 10px 8px; text-align: left; border-bottom: 1px solid var(--border-mid); white-space: nowrap; }
  table.items thead th.right, table.items tbody td.right { text-align: right; }
  table.items thead th.center, table.items tbody td.center { text-align: center; }
  table.items tbody tr:nth-child(odd) { background: var(--row-alt); }
  table.items tbody tr:nth-child(even) { background: var(--row-white); }
  table.items tbody td { padding: 9px 8px; border-bottom: 1px solid var(--border); color: var(--ink-mid); vertical-align: middle; }
  table.items tbody tr:last-child td { border-bottom: none; }
  table.items tbody td.sno { color: var(--ink-light); font-weight: 500; font-size: 11px; padding-left: 14px; width: 36px; }
  table.items tbody td.mfr { font-weight: 600; color: var(--navy); font-size: 11px; width: 40px; }
  table.items tbody td.desc { font-weight: 500; color: var(--ink); min-width: 170px; }
  table.items tbody td.total { font-weight: 700; color: var(--ink); text-align: right; padding-right: 14px; white-space: nowrap; }
  .bottom-section { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 28px; align-items: start; margin-top: auto; }
  .section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 10px; }
  .payment-box { background: #fff; border: 1px solid var(--border-mid); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
  .payment-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid var(--border); }
  .payment-row:last-child { border-bottom: none; }
  .payment-row .pk { color: var(--ink-light); }
  .payment-row .pv { font-weight: 700; color: var(--ink); }
  .payment-notes { font-size: 10.5px; color: var(--ink-faint); line-height: 1.6; margin-top: 8px; }
  .tax-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid var(--border); }
  .tax-row:last-child { border-bottom: none; font-weight: 700; font-size: 14px; color: var(--ink); padding-top: 10px; }
  .tax-row:last-child .tv { color: var(--blue-amt); }
  .tax-row .tk { color: var(--ink-mid); }
  .tax-row .tv { font-weight: 500; color: var(--ink); }
  .grand-total-box { background: var(--panel-bg); border-radius: 10px; padding: 20px 18px; color: var(--panel-text); }
  .grand-total-box .gt-label { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 5px; }
  .grand-total-box .gt-value { font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 14px; }
  .grand-total-box .words-label { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.50); margin-bottom: 5px; }
  .grand-total-box .words-text { font-size: 12.5px; color: rgba(255,255,255,0.85); line-height: 1.55; }
  .personnel-section { border-top: 1px solid var(--border); padding-top: 20px; margin-bottom: 28px; }
  .personnel-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 24px; background: #F8FAFD; border: 1px solid var(--border); border-radius: 8px; padding: 14px 18px; }
  .personnel-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; border-bottom: 1px solid var(--border); }
  .personnel-row:last-child { border-bottom: none; }
  .personnel-row .prl { color: var(--ink-light); }
  .personnel-row .prv { font-weight: 700; color: var(--ink); }
  .signature-section { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: flex-end; padding-top: 16px; gap: 20px; }
  .sig-block { display: flex; flex-direction: column; gap: 4px; }
  .sig-line { border-top: 1px solid var(--border-mid); margin-bottom: 4px; }
  .sig-label { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); }
  .sig-for { font-size: 11px; font-weight: 600; color: var(--ink-mid); text-align: center; margin-bottom: 4px; }
  .sig-block.center { align-items: center; }

  @media print {
    @page { size: A4; margin: 4mm; }
    body { background: #fff; margin: 0; }
    .page { 
      width: 100%; 
      min-height: ${printMinHeight}px;
      margin: 0; 
      padding: 0; 
      box-shadow: none; 
      border-radius: 0;
      zoom: ${printZoom};
    }
    .page::before, .page::after { display: none; }
    table.items tbody tr, .bottom-section, .personnel-section, .signature-section { page-break-inside: avoid; }
  }

</style>
</head>
<body>
<div class="page">
  <div class="processed-stamp" aria-label="Processed"><span>PROCESSED</span></div>
  <header class="header">
    <div class="company-block">
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:10px">
        ${pd.settings.showLogo && logoSrc ? `<img src="${logoSrc}" style="height:56px;width:56px;object-fit:contain" />` : ''}
        <h1>${pd.business.name}</h1>
      </div>
      <div class="company-meta">
        <div class="meta-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>${pd.business.address}</span></div>
        <div class="meta-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><span>DL No: ${pd.business.dlNo}</span></div>
        <div class="meta-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>GSTIN: ${pd.business.gstin}</span></div>
        <div class="meta-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.21 3.53 2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l1.42-1.42a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>${pd.business.contact} &nbsp;|&nbsp; ${pd.business.email}</span></div>
      </div>
    </div>
    <div class="invoice-box">
      <div class="label-sm">Invoice Number</div><div class="invoice-num">${pd.invoice.number}</div>
      <div class="label-sm">Billing Date</div><div class="bill-date">${pd.invoice.date}</div>
    </div>
  </header>
  <hr class="divider">
  <section class="bill-section">
    <div class="bill-card">
      <div class="label-sm">Bill To (Customer)</div><div class="company-name">${pd.customer.name}</div>
      <div class="bill-addr">${pd.customer.address}<br>GSTIN: ${pd.customer.gstin} &nbsp;|&nbsp; DL: ${pd.customer.dl}<br>Phone: ${pd.customer.phone}</div>
    </div>
    <div class="amount-block">
      <div class="amt-label">Amount Due</div><div class="amt-value">₹${pd.summary.grandTotal}</div>
      <span class="net-badge">${pd.payment.status}</span>
    </div>
  </section>
  <div class="table-wrap">
    <table class="items">
      <thead><tr><th style="padding-left:14px; width:36px">S.No</th><th style="width:42px">MFR</th><th>Description & Packing</th><th class="center" style="width:46px">HSN</th><th class="center" style="width:62px">Batch</th><th class="center" style="width:44px">Exp</th><th class="center" style="width:38px">Qty</th><th class="center" style="width:42px">Free</th><th class="center" style="width:46px">Dis%</th><th class="right"  style="width:56px">MRP</th><th class="center" style="width:44px">GST%</th><th class="right"  style="padding-right:14px; width:80px">Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>
  <div class="bottom-section">
    <div>
      <div class="section-title">Payment Details</div>
      <div class="payment-box">
        <div class="payment-row"><span class="pk">Bank:</span><span class="pv">${pd.payment.bankName}</span></div>
        <div class="payment-row"><span class="pk">IFSC:</span><span class="pv">${pd.payment.ifsc}</span></div>
        <div class="payment-row"><span class="pk">Account:</span><span class="pv">${pd.payment.accountNumber}</span></div>
      </div>
      <div class="payment-notes">* Medicine once sold will not be taken back.<br>* Interest @18% will be charged for delayed payments.</div>
    </div>
    <div>
      <div class="section-title">Tax Summary</div>
      <div class="tax-row"><span>Taxable Amount</span><span>${pd.summary.taxableAmount}</span></div>
      <div class="tax-row"><span>Total GST</span><span>₹${pd.summary.totalGst}</span></div>
      <div class="tax-row"><span>Grand Total</span><span>₹${pd.summary.grandTotal}</span></div>
    </div>
    <div class="grand-total-box"><div class="gt-label">Grand Total</div><div class="gt-value">₹${pd.summary.grandTotal}</div><div class="words-label">Amount in Words</div><div class="words-text">${pd.formatted.words}</div></div>
  </div>
  <section class="personnel-section">
    <div class="section-title" style="margin-bottom:12px">Personnel & Order Details</div>
    <div class="personnel-grid">
      <div><div class="personnel-row"><span>Billed By:</span><span class="prv">ADMIN</span></div><div class="personnel-row"><span>Packed By:</span><span class="prv">—</span></div></div>
      <div><div class="personnel-row"><span>Checked By:</span><span class="prv">—</span></div><div class="personnel-row"><span>Delivery:</span><span class="prv">LOCAL</span></div></div>
      <div><div class="personnel-row"><span>Salesman:</span><span class="prv">—</span></div><div class="personnel-row"><span>Contact:</span><span class="prv">—</span></div></div>
    </div>
  </section>
  <div class="signature-section">
    <div class="sig-block"><div style="height:36px"></div><div class="sig-line"></div><div class="sig-label">Receiver's Signature</div></div>
    <div class="sig-block center"><div style="height:36px"></div><div class="sig-for">for ${pd.business.name}</div></div>
    <div class="sig-block" style="align-items:flex-end"><div style="height:36px"></div><div class="sig-line"></div><div class="sig-label">Authorized Signatory</div></div>
  </div>
</div>
</body>
</html>`;
}
