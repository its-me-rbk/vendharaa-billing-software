import { numberToWords } from './invoiceTemplate';

export function buildReturnPrintData(returnBill, generalSettings) {
  const returnedItems = (returnBill.returnedItems || []).map(item => {
    return {
      ...item,
      total: Number(item.total).toFixed(2),
      price: Number(item.price).toFixed(2),
      batch: item.batchNumber || '—',
      exp: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '—',
      reason: item.reason || 'Expired'
    };
  });

  const replacementItems = (returnBill.replacementItems || []).map(item => {
    return {
      ...item,
      total: Number(item.total).toFixed(2),
      price: Number(item.price).toFixed(2),
      batch: item.batchNumber || '—',
      exp: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '—'
    };
  });

  const netDiff = returnBill.returnedAmount - returnBill.replacementAmount;
  const netText = netDiff > 0 ? `Refund due: ₹${Math.abs(netDiff).toFixed(2)}` : netDiff < 0 ? `Collect extra: ₹${Math.abs(netDiff).toFixed(2)}` : 'Even Swap';
  const settlementWords = numberToWords(Math.max(returnBill.refundAmount, returnBill.extraCharged));

  return {
    returnInvoiceNumber: returnBill.returnInvoiceNumber,
    originalInvoiceNumber: returnBill.originalInvoiceNumber,
    date: new Date(returnBill.createdAt).toLocaleDateString('en-IN'),
    business: {
      name: generalSettings?.pharmacyName || 'Vendharaa Pharmaceuticals',
      address: generalSettings?.address || '1/167 Ground Floor, Ungaranahalli Village & Panchayat, Dharmapuri (Taluk), Dharmapuri - 636704',
      dlNo: generalSettings?.licenseNumber || 'TN/DPI/20B&21B/01959',
      gstin: generalSettings?.gstNumber || '',
      contact: generalSettings?.phone || '+91 94429 59826',
      email: generalSettings?.email || 'vendharaapharmaceuticals@gmail.com'
    },
    customer: {
      name: returnBill.customerName || "Walk-in Customer",
      phone: returnBill.customerPhone || "N/A"
    },
    returnedItems,
    replacementItems,
    returnedAmount: Number(returnBill.returnedAmount).toFixed(2),
    replacementAmount: Number(returnBill.replacementAmount).toFixed(2),
    refundAmount: Number(returnBill.refundAmount).toFixed(2),
    extraCharged: Number(returnBill.extraCharged).toFixed(2),
    accountName: returnBill.accountName || 'Cash',
    netText,
    settlementWords,
    settings: {
      showLogo: generalSettings?.showLogo !== false
    }
  };
}

export function buildReturnInvoiceHTML(pd, logoSrc, paperSize = 'a4') {
  const showReplacementSection = pd.replacementItems.length > 0;
  const grandTotal = Math.max(pd.refundAmount, pd.extraCharged);

  const returnRows = pd.returnedItems.map((item, idx) => `
    <tr>
      <td class="sno">${String(idx + 1).padStart(2, '0')}</td>
      <td class="desc">${item.name}</td>
      <td class="center">${item.batch}</td>
      <td class="center">${item.exp}</td>
      <td class="center">${item.qty}</td>
      <td class="right">₹${item.price}</td>
      <td class="center">${item.gst}%</td>
      <td class="center"><span class="badge ${item.reason === 'Expired' ? 'badge-red' : item.reason === 'Near Expiry' ? 'badge-orange' : item.reason === 'Defective' ? 'badge-red' : 'badge-blue'}">${item.reason}</span></td>
      <td class="total">₹${item.total}</td>
    </tr>
  `).join('');

  const replacementRows = pd.replacementItems.map((item, idx) => `
    <tr>
      <td class="sno">${String(idx + 1).padStart(2, '0')}</td>
      <td class="desc">${item.name}</td>
      <td class="center">${item.batch}</td>
      <td class="center">${item.exp}</td>
      <td class="center">${item.qty}</td>
      <td class="right">₹${item.price}</td>
      <td class="center">${item.gst}%</td>
      <td class="total">₹${item.total}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Return Bill - ${pd.returnInvoiceNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy:       #E67E22;
    --navy-dark:  #D35400;
    --blue-amt:   #2C3E50;
    --blue-badge: #E67E22;
    --panel-bg:   #2C3E50;
    --panel-text: #FFFFFF;
    --ink:        #1A1A2E;
    --ink-mid:    #374151;
    --ink-light:  #6B7280;
    --ink-faint:  #9CA3AF;
    --border:     #E5E7EB;
    --border-mid: #D1D5DB;
    --row-alt:    #FDF8F5;
    --row-white:  #FFFFFF;
    --header-bg:  #FDF6F0;
    --stamp-red:  #E67E22;
    --card-bg:    #FAF5F0;
    --tag-bg:     #E67E22;
    --tag-text:   #FFFFFF;
    --shadow-sm:  0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
    --shadow-md:  0 4px 12px rgba(0,0,0,.09);
  }
  body { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); background: #E8ECF4; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 860px; min-height: 1122px; margin: 32px auto; background: #FFFFFF; border-radius: 12px; box-shadow: var(--shadow-md); padding: 36px 40px 40px; position: relative; overflow: hidden; display: flex; flex-direction: column; }
  .page::before, .page::after { content: ''; position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
  .page::before { width: 420px; height: 420px; background: radial-gradient(circle, rgba(230,126,34,.045) 0%, transparent 70%); right: -100px; bottom: 220px; }
  .page::after { width: 300px; height: 300px; background: radial-gradient(circle, rgba(230,126,34,.04) 0%, transparent 70%); left: -60px; bottom: 120px; }
  .page > * { position: relative; z-index: 1; }
  .processed-stamp { position: absolute; top: 0; right: 0; width: 100px; height: 100px; overflow: hidden; z-index: 10; }
  .processed-stamp span { position: absolute; top: 22px; right: -22px; background: #E67E22; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 28px; transform: rotate(45deg); transform-origin: center center; white-space: nowrap; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 24px; }
  .company-block h1 { font-size: 28px; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 10px; }
  .company-meta { display: flex; flex-direction: column; gap: 4px; }
  .meta-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--ink-mid); }
  .meta-row svg { flex-shrink: 0; color: var(--ink-light); }
  .invoice-box { background: var(--header-bg); border-radius: 8px; padding: 14px 20px 16px; text-align: right; min-width: 240px; border: 1px solid #F5E3D2; flex-shrink: 0; }
  .invoice-box .label-sm { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 3px; }
  .invoice-box .invoice-num { font-size: 16px; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 8px; }
  .invoice-box .bill-date { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 0; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .bill-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 26px; }
  .bill-card { background: var(--card-bg); border-radius: 8px; padding: 14px 18px; min-width: 300px; border: 1px solid #F5EAE0; }
  .bill-card .label-sm { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 5px; }
  .bill-card .company-name { font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 5px; }
  .bill-card .bill-addr { font-size: 12px; color: var(--ink-mid); line-height: 1.6; }
  .amount-block { text-align: right; flex-shrink: 0; }
  .amount-block .amt-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 4px; }
  .amount-block .amt-value { font-size: 32px; font-weight: 700; color: var(--blue-amt); letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 8px; }
  .net-badge { display: inline-block; background: var(--tag-bg); color: var(--tag-text); font-size: 10px; font-weight: 600; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; }
  .table-title { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--navy); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .table-wrap { width: 100%; overflow: hidden; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 24px; }
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
  table.items tbody td.desc { font-weight: 500; color: var(--ink); min-width: 200px; }
  table.items tbody td.total { font-weight: 700; color: var(--ink); text-align: right; padding-right: 14px; white-space: nowrap; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-orange { background: #ffedd5; color: #ea580c; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .bottom-section { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 24px; margin-bottom: 28px; align-items: start; margin-top: auto; }
  .section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 10px; }
  .payment-box { background: #fff; border: 1px solid var(--border-mid); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
  .payment-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid var(--border); }
  .payment-row:last-child { border-bottom: none; }
  .payment-row .pk { color: var(--ink-light); }
  .payment-row .pv { font-weight: 700; color: var(--ink); }
  .payment-notes { font-size: 10px; color: var(--ink-faint); line-height: 1.6; margin-top: 8px; }
  .tax-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid var(--border); }
  .tax-row:last-child { border-bottom: none; font-weight: 700; font-size: 14px; color: var(--ink); padding-top: 10px; }
  .tax-row:last-child .tv { color: var(--navy); }
  .tax-row .tk { color: var(--ink-mid); }
  .tax-row .tv { font-weight: 500; color: var(--ink); }
  .grand-total-box { background: var(--panel-bg); border-radius: 10px; padding: 20px 18px; color: var(--panel-text); }
  .grand-total-box .gt-label { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 5px; }
  .grand-total-box .gt-value { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 14px; }
  .grand-total-box .words-label { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.50); margin-bottom: 5px; }
  .grand-total-box .words-text { font-size: 12.5px; color: rgba(255,255,255,0.85); line-height: 1.55; }
  .signature-section { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: flex-end; padding-top: 24px; gap: 20px; }
  .sig-block { display: flex; flex-direction: column; gap: 4px; }
  .sig-line { border-top: 1px solid var(--border-mid); margin-bottom: 4px; }
  .sig-label { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); }
  .sig-for { font-size: 11px; font-weight: 600; color: var(--ink-mid); text-align: center; margin-bottom: 4px; }
  .sig-block.center { align-items: center; }

  table.items tbody tr {
    height: 30px;
  }
  table.items tbody tr.dummy-row {
    height: 30px;
    background-image: linear-gradient(172deg, transparent 49.5%, #E5E7EB 49.5%, #E5E7EB 50.5%, transparent 50.5%);
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
  .center-nil {
    text-align: center !important;
  }
  .nil-text {
    font-size: 10px;
    font-weight: 700;
    color: var(--ink-faint);
    background: #fff;
    padding: 0 8px;
    letter-spacing: 0.1em;
  }

  @media print {
    @page { size: ${paperSize ? paperSize.toUpperCase() : 'A4'}; margin: 5mm; }
    body { background: #fff; margin: 0; }
    .page { 
      width: 100% !important; 
      max-width: 100% !important;
      min-height: ${paperSize === 'a3' ? '390mm' : paperSize === 'legal' ? '467mm' : '388mm'} !important;
      height: auto !important;
      margin: 0 !important; 
      padding: 24px 28px !important; 
      box-shadow: none !important; 
      border-radius: 0 !important;
      zoom: ${paperSize === 'a3' ? '1.05' : '0.74'} !important;
    }
    .page::before, .page::after { display: none; }
    table.items tbody tr, .bottom-section, .signature-section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="processed-stamp" aria-label="Returned"><span>RETURNED</span></div>
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
      <div class="label-sm">Return Bill Number</div><div class="invoice-num">${pd.returnInvoiceNumber}</div>
      <div class="label-sm">Original Invoice</div><div class="invoice-num" style="font-size:13px; margin-bottom:10px">#${pd.originalInvoiceNumber}</div>
      <div class="label-sm">Return Date</div><div class="bill-date">${pd.date}</div>
    </div>
  </header>
  <hr class="divider">
  <section class="bill-section">
    <div class="bill-card">
      <div class="label-sm">Customer Info</div><div class="company-name">${pd.customer.name}</div>
      <div class="bill-addr">Phone: ${pd.customer.phone}</div>
    </div>
    <div class="amount-block">
      <div class="amt-label">Net Settlement</div><div class="amt-value" style="font-size: 26px;">₹${grandTotal.toFixed(2)}</div>
      <span class="net-badge">${pd.netText}</span>
    </div>
  </section>

  <!-- Returned items list -->
  <div class="table-title">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
    Returned Stock Items
  </div>
  <div class="table-wrap">
    <table class="items">
      <thead><tr><th style="padding-left:14px; width:36px">S.No</th><th>Medicine Description</th><th class="center" style="width:70px">Batch</th><th class="center" style="width:50px">Exp</th><th class="center" style="width:40px">Qty</th><th class="right" style="width:60px">MRP</th><th class="center" style="width:50px">GST%</th><th class="center" style="width:80px">Reason</th><th class="right" style="padding-right:14px; width:80px">Total</th></tr></thead>
      <tbody>${returnRows}</tbody>
    </table>
  </div>

  <!-- Replacement swaps list (Optional) -->
  ${showReplacementSection ? `
  <div class="table-title" style="color: #27ae60; margin-top: 10px;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
    Provided Swaps / Replacements
  </div>
  <div class="table-wrap" style="border-color: #d4efdf;">
    <table class="items">
      <thead><tr style="background: #eafaf1;"><th style="padding-left:14px; width:36px">S.No</th><th>Medicine Description</th><th class="center" style="width:70px">Batch</th><th class="center" style="width:50px">Exp</th><th class="center" style="width:40px">Qty</th><th class="right" style="width:60px">MRP</th><th class="center" style="width:50px">GST%</th><th class="right" style="padding-right:14px; width:80px">Total</th></tr></thead>
      <tbody>${replacementRows}</tbody>
    </table>
  </div>
  ` : ''}

  <div class="bottom-section">
    <div>
      <div class="section-title">Settlement Account</div>
      <div class="payment-box">
        <div class="payment-row"><span class="pk">Settled Via:</span><span class="pv">${pd.accountName}</span></div>
        <div class="payment-row"><span class="pk">Refund Amt:</span><span class="pv">₹${pd.refundAmount}</span></div>
        <div class="payment-row"><span class="pk">Collected:</span><span class="pv">₹${pd.extraCharged}</span></div>
      </div>
      <div class="payment-notes">* Damaged/expired medicines are quarantined immediately.<br>* Audited under pharma sales ledger entries.</div>
    </div>
    <div>
      <div class="section-title">Summary</div>
      <div class="tax-row"><span>Returned Value (+)</span><span>₹${pd.returnedAmount}</span></div>
      <div class="tax-row"><span>Replacement Value (-)</span><span>₹${pd.replacementAmount}</span></div>
      <div class="tax-row"><span>Net Dynamic Diff</span><span>₹${(pd.returnedAmount - pd.replacementAmount).toFixed(2)}</span></div>
    </div>
    <div class="grand-total-box">
      <div class="gt-label">Settlement Amount</div>
      <div class="gt-value">₹${grandTotal.toFixed(2)}</div>
      <div class="words-label">Amount in Words</div>
      <div class="words-text">${pd.settlementWords}</div>
    </div>
  </div>

  <div class="signature-section">
    <div class="sig-block"><div style="height:36px"></div><div class="sig-line"></div><div class="sig-label">Customer's Signature</div></div>
    <div class="sig-block center"><div style="height:36px"></div><div class="sig-for">for ${pd.business.name}</div></div>
    <div class="sig-block" style="align-items:flex-end"><div style="height:36px"></div><div class="sig-line"></div><div class="sig-label">Authorized Signatory</div></div>
  </div>
</div>
</body>
</html>`;
}
