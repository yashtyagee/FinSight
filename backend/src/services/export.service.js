const XLSX = require('xlsx');

/**
 * Formats invoices into a flat object suitable for export.
 */
const flattenInvoice = (inv, i) => ({
  'Sr. No.':           i + 1,
  'Date':              inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '',
  'Vendor Name':       inv.vendor || '',
  'Invoice No.':       inv.invoice_number || '',
  'Vendor GSTIN':      inv.gstin || '',
  'Buyer GSTIN':       inv.buyer_gstin || '',
  'Category':          inv.category || '',
  'Taxable Value':     parseFloat(inv.taxable_value || 0).toFixed(2),
  'CGST Amount':       parseFloat(inv.cgst_amount || 0).toFixed(2),
  'SGST Amount':       parseFloat(inv.sgst_amount || 0).toFixed(2),
  'IGST Amount':       parseFloat(inv.igst_amount || 0).toFixed(2),
  'Total Tax':         parseFloat(inv.tax || 0).toFixed(2),
  'Invoice Amount':    parseFloat(inv.amount || 0).toFixed(2),
  'GST Type':          inv.gst_type || '',
  'Transaction Type':  inv.transaction_type || '',
  'Anomaly Flagged':   inv.is_anomaly ? 'YES' : 'NO',
  'Anomaly Reasons':   inv.anomaly_reasons || '',
});

/**
 * Generate Excel (XLSX) buffer.
 */
const generateXLSX = (invoices) => {
  const rows = invoices.map(flattenInvoice);
  const wb   = XLSX.utils.book_new();
  const ws   = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    { wch: 10 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'GST Filing Data');

  // Summary sheet
  const total = invoices.reduce((acc, inv) => ({
    taxable:  acc.taxable  + parseFloat(inv.taxable_value || 0),
    cgst:     acc.cgst     + parseFloat(inv.cgst_amount || 0),
    sgst:     acc.sgst     + parseFloat(inv.sgst_amount || 0),
    igst:     acc.igst     + parseFloat(inv.igst_amount || 0),
    tax:      acc.tax      + parseFloat(inv.tax || 0),
    amount:   acc.amount   + parseFloat(inv.amount || 0),
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, amount: 0 });

  const b2bCount  = invoices.filter(i => i.transaction_type === 'B2B').length;
  const b2cCount  = invoices.filter(i => i.transaction_type === 'B2C').length;
  const summary = [
    { 'Field': 'Total Invoices',       'Value': invoices.length },
    { 'Field': 'B2B Invoices',         'Value': b2bCount },
    { 'Field': 'B2C Invoices',         'Value': b2cCount },
    { 'Field': 'Total Taxable Value',  'Value': total.taxable.toFixed(2) },
    { 'Field': 'Total CGST',           'Value': total.cgst.toFixed(2) },
    { 'Field': 'Total SGST',           'Value': total.sgst.toFixed(2) },
    { 'Field': 'Total IGST',           'Value': total.igst.toFixed(2) },
    { 'Field': 'Total Tax',            'Value': total.tax.toFixed(2) },
    { 'Field': 'Total Invoice Amount', 'Value': total.amount.toFixed(2) },
    { 'Field': 'Generated On',         'Value': new Date().toLocaleString('en-IN') },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summary);
  ws2['!cols'] = [{ wch: 24 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Generate CSV string.
 */
const generateCSV = (invoices) => {
  const rows = invoices.map(flattenInvoice);
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines   = [headers.join(',')];
  rows.forEach(row => {
    lines.push(headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','));
  });
  return lines.join('\n');
};

/**
 * Generate JSON export.
 */
const generateJSON = (invoices) => {
  return {
    generated_at:   new Date().toISOString(),
    total_invoices: invoices.length,
    summary: {
      b2b: invoices.filter(i => i.transaction_type === 'B2B').length,
      b2c: invoices.filter(i => i.transaction_type === 'B2C').length,
      total_taxable:  invoices.reduce((s, i) => s + parseFloat(i.taxable_value || 0), 0).toFixed(2),
      total_cgst:     invoices.reduce((s, i) => s + parseFloat(i.cgst_amount   || 0), 0).toFixed(2),
      total_sgst:     invoices.reduce((s, i) => s + parseFloat(i.sgst_amount   || 0), 0).toFixed(2),
      total_igst:     invoices.reduce((s, i) => s + parseFloat(i.igst_amount   || 0), 0).toFixed(2),
      total_tax:      invoices.reduce((s, i) => s + parseFloat(i.tax           || 0), 0).toFixed(2),
      total_amount:   invoices.reduce((s, i) => s + parseFloat(i.amount        || 0), 0).toFixed(2),
    },
    invoices: invoices.map(flattenInvoice),
  };
};

module.exports = { generateXLSX, generateCSV, generateJSON };
