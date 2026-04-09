import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR = [155, 93, 229];   // #9b5de5 (FinSight Purple)
const DARK_BG    = [7, 5, 13];        // Very dark navy (#07050d) — matched to new landing page
const SURFACE    = [22, 20, 33];      // #161421 (Glass surface)
const TEXT_MAIN  = [226, 232, 240];   // slate-200
const TEXT_MUTED = [148, 163, 184];   // slate-400
const RED        = [239, 68, 68];
const GREEN      = [34, 197, 94];

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n, prefix = '₹') =>
  `${prefix}${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Draw a filled rectangle
const rect = (doc, x, y, w, h, color) => {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
};

// Fill the entire current page with a background color
const fillPageBg = (doc, color = DARK_BG) => {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  rect(doc, 0, 0, w, h, color);
};

// Draw a thin horizontal rule
const rule = (doc, y, x1 = 14, x2 = 196, color = [51, 65, 85]) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
};

// Section heading with accent bar
const sectionHead = (doc, title, y) => {
  rect(doc, 14, y, 4, 7, BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(title, 21, y + 5.5);
  return y + 14;
};

// Key-value pair info row
const infoLine = (doc, label, value, x, y) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(String(value || '—'), x, y + 5);
};

// styled autoTable defaults
const tableStyle = (doc) => ({
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 8.5,
    cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
    textColor: TEXT_MAIN,
    fillColor: SURFACE,
    lineColor: [51, 65, 85],
    lineWidth: 0.1,
    overflow: 'linebreak',
  },
  headStyles: {
    fillColor: [20, 35, 60],
    textColor: BRAND_COLOR,
    fontStyle: 'bold',
    fontSize: 7.5,
  },
  alternateRowStyles: { fillColor: [15, 23, 42] },
  margin: { left: 14, right: 14 },
  // Ensures new pages also get dark background
  didDrawPage: () => {
    fillPageBg(doc);
  },
});

// ─── MAIN GENERATOR ─────────────────────────────────────────────────────────
export const generateFinancialReport = (dashData, healthData, invoices = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const date  = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── FULL PAGE DARK BACKGROUND ──────────────────────────────────────────────
  fillPageBg(doc);

  // ── Cover header ──────────────────────────────────────────────────────────
  rect(doc, 0, 0, pageW, 50, [8, 12, 25]);
  // Brand stripe
  rect(doc, 0, 0, 4, 50, BRAND_COLOR);

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('FinSight', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('AI-Powered Invoice Intelligence Platform', 14, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_MAIN);
  doc.text('Financial Intelligence Report', 14, 40);

  // Date in top right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Generated: ${date}`, pageW - 14, 12, { align: 'right' });
  doc.text(`Total Records: ${invoices.length}`, pageW - 14, 18, { align: 'right' });

  let y = 60;

  // ── Executive Summary ──────────────────────────────────────────────────────
  y = sectionHead(doc, 'Executive Summary', y);

  const summaryCards = [
    ['Total Expenditure',    fmt(dashData.total_expenses)],
    ['Avg Invoice Value',    fmt(dashData.avg_invoice_value)],
    ['Total Tax Paid',       fmt(dashData.total_tax)],
    ['Total Invoices',       String(dashData.invoice_count)],
    ['Next Month Forecast',  fmt(dashData.next_month_forecast)],
    ['Anomalous Invoices',   String(dashData.anomalies?.length ?? 0)],
  ];

  const cw = (pageW - 28) / 3;
  const ch = 20;
  summaryCards.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 14 + col * cw;
    const cy = y + row * (ch + 4);
    rect(doc, cx, cy, cw - 3, ch, SURFACE);
    infoLine(doc, label, value, cx + 5, cy + 6);
  });

  y += Math.ceil(summaryCards.length / 3) * (ch + 4) + 6;
  rule(doc, y); y += 10;

  // ── Health Score ─────────────────────────────────────────────────────────
  if (healthData) {
    y = sectionHead(doc, 'Financial Health Score', y);

    // Score circle (simulated)
    const scoreColor = healthData.score >= 75 ? GREEN : healthData.score >= 50 ? [245, 158, 11] : RED;
    rect(doc, 14, y, 32, 32, SURFACE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...scoreColor);
    doc.text(String(healthData.score), 30, y + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('out of 100', 30, y + 27, { align: 'center' });

    // Explanation
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MAIN);
    const lines = doc.splitTextToSize(healthData.explanation || '', pageW - 60);
    doc.text(lines, 52, y + 6);

    // Insights
    if (healthData.insights?.length) {
      let iy = y + 6 + lines.length * 5 + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_COLOR);
      doc.text('KEY INSIGHTS', 52, iy);
      iy += 5;
      healthData.insights.forEach(insight => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...TEXT_MAIN);
        const iLines = doc.splitTextToSize(`• ${insight}`, pageW - 66);
        doc.text(iLines, 52, iy);
        iy += iLines.length * 4.5;
      });
    }

    y += 42; rule(doc, y); y += 10;
  }

  // ── Spending by Category ──────────────────────────────────────────────────
  if (dashData.by_category?.length) {
    y = sectionHead(doc, 'Spending by Category', y);
    autoTable(doc, {
      ...tableStyle(doc),
      startY: y,
      head: [['Category', 'Total Spent', '% of Total']],
      body: dashData.by_category.map(c => {
        const pct = ((c.value / dashData.total_expenses) * 100).toFixed(1);
        return [c.category || 'Uncategorized', fmt(c.value), `${pct}%`];
      }),
    });
    y = doc.lastAutoTable.finalY + 10;
    rule(doc, y); y += 10;
  }

  // ── Monthly Trend ─────────────────────────────────────────────────────────
  if (dashData.monthly_trend?.length) {
    y = sectionHead(doc, 'Monthly Spending Trend', y);
    autoTable(doc, {
      ...tableStyle(doc),
      startY: y,
      head: [['Month', 'Total Spent']],
      body: dashData.monthly_trend.map(m => [m.month, fmt(m.total)]),
    });
    y = doc.lastAutoTable.finalY + 10;
    rule(doc, y); y += 10;
  }

  // ── Top Vendors ───────────────────────────────────────────────────────────
  if (dashData.top_vendors?.length) {
    y = sectionHead(doc, 'Top Vendors by Spending', y);
    autoTable(doc, {
      ...tableStyle(doc),
      startY: y,
      head: [['Vendor', 'Total Spent']],
      body: dashData.top_vendors.map(v => [v.vendor, fmt(v.total_spent)]),
    });
    y = doc.lastAutoTable.finalY + 10;
    rule(doc, y); y += 10;
  }

  // ── Invoice Register ──────────────────────────────────────────────────────
  if (invoices.length) {
    // start a new page for the full register
    doc.addPage();
    fillPageBg(doc);
    rect(doc, 0, 0, pageW, 14, [8, 12, 25]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_COLOR);
    doc.text('Invoice Register', 14, 9.5);

    autoTable(doc, {
      ...tableStyle(doc),
      startY: 18,
      head: [['#', 'Date', 'Vendor', 'Invoice No.', 'Category', 'Tax', 'Amount', 'Status']],
      body: invoices.map((inv, i) => [
        i + 1,
        fmtDate(inv.date),
        inv.vendor || '—',
        inv.invoice_number || '—',
        inv.category || '—',
        fmt(inv.tax),
        fmt(inv.amount),
        inv.is_anomaly ? 'FLAGGED' : 'CLEAN',
      ]),
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 24 },
        2: { cellWidth: 34 },
        3: { cellWidth: 26 },
        4: { cellWidth: 24 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22 },
        7: { cellWidth: 20 },
      },
      didParseCell(data) {
        if (data.column.index === 7 && data.section === 'body') {
          if (data.cell.raw?.toString() === 'FLAGGED') {
            data.cell.styles.textColor = RED;
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = GREEN;
          }
        }
      },
    });
  }

  // ── Anomaly Report ────────────────────────────────────────────────────────
  const anomalies = invoices.filter(i => i.is_anomaly);
  if (anomalies.length) {
    doc.addPage();
    fillPageBg(doc);
    rect(doc, 0, 0, pageW, 14, [8, 12, 25]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...RED);
    doc.text('⚠  Anomaly & Fraud Detection Report', 14, 9.5);

    autoTable(doc, {
      ...tableStyle(doc),
      startY: 18,
      head: [['Date', 'Vendor', 'Amount', 'Flagged Reasons']],
      body: anomalies.map(inv => [
        fmtDate(inv.date),
        inv.vendor || '—',
        fmt(inv.amount),
        inv.anomaly_reasons || '—',
      ]),
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 36 },
        2: { cellWidth: 26 },
        3: { cellWidth: 96 },
      },
      headStyles: {
        fillColor: [40, 15, 15],
        textColor: RED,
        fontStyle: 'bold',
      },
    });
  }

  // ── Footer on all pages ───────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    rect(doc, 0, pageH - 10, pageW, 10, [8, 12, 25]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('FinSight — AI-Powered Financial Intelligence | Confidential', 14, pageH - 3.5);
    doc.text(`Page ${p} of ${pages}`, pageW - 14, pageH - 3.5, { align: 'right' });
  }

  // ── Save via Blob (works reliably in all browsers + Vite) ─────────────────
  const fileName = `FinSight_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  const blob = doc.output('blob');
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
