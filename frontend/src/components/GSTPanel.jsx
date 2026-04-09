import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const BASE_URL = 'http://localhost:5001';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const GST_COLORS = {
  CGST_SGST: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'CGST + SGST', sub: 'Intra-State' },
  IGST:      { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'IGST', sub: 'Inter-State' },
};

const TXN_COLORS = {
  B2B: 'bg-green-500/10 text-green-400 border-green-500/20',
  B2C: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

/**
 * Displays a GST breakdown panel for a single extracted invoice.
 */
export function GSTSummaryPanel({ gstData, invoiceData }) {
  if (!gstData) return null;

  const gstCfg = GST_COLORS[gstData.gst_type] || GST_COLORS['CGST_SGST'];

  return (
    <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-sm font-bold text-primary-400 uppercase tracking-widest flex items-center gap-2">
          🏛 GST Classification
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${TXN_COLORS[gstData.transaction_type]}`}>
            {gstData.transaction_type}
            <span className="font-normal ml-1 text-[10px]">
              {gstData.transaction_type === 'B2B' ? '· Registered Buyer' : '· Unregistered Buyer'}
            </span>
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${gstCfg.badge}`}>
            {gstCfg.label}
            <span className="font-normal ml-1 text-[10px]">· {gstCfg.sub}</span>
          </span>
        </div>
      </div>

      {/* State routing logic */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-surface/50 rounded-xl px-4 py-2">
        <span className="font-medium text-slate-300">{gstData.vendor_state || 'Unknown State'}</span>
        <ArrowRight className="w-3 h-3 shrink-0" />
        <span className="font-medium text-slate-300">{gstData.buyer_state || 'Your State'}</span>
        <span className="ml-auto text-slate-500 text-[10px]">{gstData.gst_reason}</span>
      </div>

      {/* Tax breakdown grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TaxCard label="Taxable Value"  value={fmt(gstData.taxable_value)} color="text-slate-200" />
        {gstData.gst_type === 'CGST_SGST' ? (
          <>
            <TaxCard label="CGST"    value={fmt(gstData.cgst_amount)} color="text-blue-400" />
            <TaxCard label="SGST"    value={fmt(gstData.sgst_amount)} color="text-blue-400" />
            <TaxCard label="IGST"    value="₹0.00"                    color="text-slate-500" dim />
          </>
        ) : (
          <>
            <TaxCard label="CGST"    value="₹0.00"                    color="text-slate-500" dim />
            <TaxCard label="SGST"    value="₹0.00"                    color="text-slate-500" dim />
            <TaxCard label="IGST"    value={fmt(gstData.igst_amount)} color="text-purple-400" />
          </>
        )}
      </div>

      {/* GSTIN info */}
      <div className="grid md:grid-cols-2 gap-3 text-xs">
        <div className="bg-surface/50 rounded-xl px-4 py-2.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Vendor GSTIN</p>
          <p className="font-mono text-slate-200 flex items-center gap-1">
            {invoiceData?.gstin
              ? <><CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> {invoiceData.gstin}</>
              : <><AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0" /> Not found</>
            }
          </p>
        </div>
        <div className="bg-surface/50 rounded-xl px-4 py-2.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Buyer GSTIN</p>
          <p className="font-mono text-slate-200 flex items-center gap-1">
            {gstData.buyer_gstin
              ? <><CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> {gstData.buyer_gstin}</>
              : <span className="text-slate-500">Not configured (set COMPANY_GSTIN in .env)</span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function TaxCard({ label, value, color, dim }) {
  return (
    <div className={`rounded-xl p-3 text-center ${dim ? 'bg-surface/20 opacity-40' : 'bg-surface/50 border border-border/50'}`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

/**
 * Standalone "Download Filing Data" button that triggers export.
 */
export function FilingExportButton() {
  const [loading, setLoading] = useState(null);

  const download = async (format) => {
    setLoading(format);
    try {
      const url = `${BASE_URL}/api/invoices/export?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const ext  = format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'json';
      const date = new Date().toISOString().split('T')[0];
      const filename = `FinSight_GST_Filing_${date}.${ext}`;

      const objUrl = URL.createObjectURL(blob);
      const link   = document.createElement('a');
      link.href     = objUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    { format: 'xlsx', label: 'Excel',  icon: FileSpreadsheet, color: 'text-green-400  border-green-500/30  bg-green-500/10  hover:bg-green-500/20'  },
    { format: 'csv',  label: 'CSV',    icon: FileText,        color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20' },
    { format: 'json', label: 'JSON',   icon: FileJson,        color: 'text-blue-400   border-blue-500/30   bg-blue-500/10   hover:bg-blue-500/20'   },
  ];

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-primary-400" />
            Download Filing Data
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Export all invoices for GST portal upload</p>
        </div>
        <div className="flex items-center gap-2">
          {buttons.map(({ format, label, icon: Icon, color }) => (
            <button
              key={format}
              onClick={() => download(format)}
              disabled={loading !== null}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${color} disabled:opacity-50`}
            >
              {loading === format ? (
                <span className="animate-spin text-xs">⟳</span>
              ) : (
                <Icon className="w-4 h-4" />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
