export function buildSupplierReportHTML(report, periodLabel) {
  const { business, supplier, startDate, endDate, rows = [], totals = {} } = report;
  const fromStr = new Date(startDate).toLocaleDateString('en-IN');
  const toStr = new Date(endDate).toLocaleDateString('en-IN');

  const bodyRows = rows.map((r) => `
    <tr>
      <td class="c">${r.sl}</td>
      <td class="name">${r.name}</td>
      <td class="r">${r.opening}</td>
      <td class="r">${r.purchase}</td>
      <td class="r">${r.paidSales}</td>
      <td class="r">${r.freeSales}</td>
      <td class="r bold">${r.totalSales}</td>
      <td class="r bold">${r.closing}</td>
      <td class="c">${r.expiry}</td>
      <td class="r bold">₹${Number(r.salesValue || 0).toFixed(2)}</td>
      <td class="r">${r.prevSales}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Stock & Sales Report - ${supplier}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1A1A2E; padding: 20px; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hdr { text-align: center; margin-bottom: 14px; }
  .hdr .biz { font-size: 16px; font-weight: 800; color: #9A3412; }
  .hdr .sub { font-size: 11px; font-weight: 700; color: #15803D; margin-top: 2px; }
  .hdr .sup { font-size: 14px; font-weight: 800; color: #B45309; margin-top: 3px; text-transform: uppercase; }
  .hdr .rng { font-size: 10px; color: #64748B; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #CBD5E1; padding: 5px 7px; }
  thead th { background: #F1F5F9; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0F172A; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  tfoot td { background: #FEF3C7; font-weight: 800; color: #0F172A; border-top: 2px solid #94A3B8; }
  .c { text-align: center; }
  .r { text-align: right; }
  .name { font-weight: 600; color: #0F172A; }
  .bold { font-weight: 700; }
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="hdr">
    <div class="biz">${business?.name || 'Vendharaa Pharmaceuticals'}</div>
    <div class="sub">STOCK &amp; SALES REPORT — ${periodLabel}</div>
    <div class="sup">${supplier}</div>
    <div class="rng">${fromStr} to ${toStr}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="c" style="width:32px">SL</th>
        <th style="text-align:left">Product Name</th>
        <th class="r">Opening</th>
        <th class="r">Purchase</th>
        <th class="r">Paid Sales</th>
        <th class="r">Free Sales</th>
        <th class="r">Total Sales</th>
        <th class="r">Closing</th>
        <th class="c">Expiry</th>
        <th class="r">Sales Value</th>
        <th class="r">Prev Sales</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" class="r">Total :</td>
        <td class="r">${totals.opening || 0}</td>
        <td class="r">${totals.purchase || 0}</td>
        <td class="r">${totals.paidSales || 0}</td>
        <td class="r">${totals.freeSales || 0}</td>
        <td class="r">${totals.totalSales || 0}</td>
        <td class="r">${totals.closing || 0}</td>
        <td class="c">—</td>
        <td class="r">₹${Number(totals.salesValue || 0).toFixed(2)}</td>
        <td class="r">${totals.prevSales || 0}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

export function downloadSupplierReportCSV(report) {
  const { supplier, startDate, endDate, rows = [], totals = {} } = report;
  const headers = ['SL', 'Product Name', 'Opening', 'Purchase', 'Paid Sales', 'Free Sales', 'Total Sales', 'Closing', 'Expiry', 'Sales Value', 'Prev Sales'];
  const csvRows = [
    headers.join(','),
    ...rows.map((r) => [
      r.sl,
      `"${String(r.name || '').replace(/"/g, '""')}"`,
      r.opening,
      r.purchase,
      r.paidSales,
      r.freeSales,
      r.totalSales,
      r.closing,
      `"${r.expiry}"`,
      Number(r.salesValue || 0).toFixed(2),
      r.prevSales,
    ].join(',')),
    [
      '',
      'Total :',
      totals.opening || 0,
      totals.purchase || 0,
      totals.paidSales || 0,
      totals.freeSales || 0,
      totals.totalSales || 0,
      totals.closing || 0,
      '',
      Number(totals.salesValue || 0).toFixed(2),
      totals.prevSales || 0,
    ].join(','),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const from = new Date(startDate).toISOString().slice(0, 10);
  const to = new Date(endDate).toISOString().slice(0, 10);
  a.href = url;
  a.download = `Supplier_Report_${supplier.replace(/\s+/g, '_')}_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
