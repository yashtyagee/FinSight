import React, { useState, useEffect } from 'react';
import { getInvoices } from '../api/client';
import {
  Loader2, Search, ShieldCheck, ShieldAlert, ArrowUpDown, Receipt, ExternalLink, X, FileText, FileImage
} from 'lucide-react';

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [viewFile, setViewFile] = useState(null); // { url, name, isPdf }

  useEffect(() => {
    getInvoices()
      .then(res => {
        setInvoices(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = invoices
    .filter(inv =>
      [inv.vendor, inv.invoice_number, inv.category, inv.gstin]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortBtn = ({ col, label }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold text-slate-400 hover:text-primary-400 transition-colors group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? 'text-primary-400' : 'text-slate-600 group-hover:text-primary-400'}`} />
    </button>
  );

  if (loading) {
    return (
      <div className="glass-panel p-12 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" /> Loading invoices...
      </div>
    );
  }

  return (
    <>
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white leading-none">Invoice Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">{invoices.length} invoices total</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor, category, GSTIN..."
            className="bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col className="w-10" />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-36" />
            <col className="w-20" />
          </colgroup>
          <thead className="bg-slate-800/50 border-b border-border/50">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3"><SortBtn col="vendor" label="Vendor" /></th>
              <th className="px-4 py-3"><SortBtn col="invoice_number" label="Invoice No." /></th>
              <th className="px-4 py-3"><SortBtn col="date" label="Date" /></th>
              <th className="px-4 py-3"><SortBtn col="amount" label="Amount" /></th>
              <th className="px-4 py-3"><SortBtn col="category" label="Category" /></th>
              <th className="px-4 py-3"><SortBtn col="gstin" label="GSTIN" /></th>
              <th className="px-4 py-3 text-center"><SortBtn col="is_anomaly" label="Status" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500 italic">
                  {search ? 'No invoices match your search.' : 'No invoices processed yet.'}
                </td>
              </tr>
            ) : filtered.map((inv, idx) => (
              <tr
                key={inv.id}
                onClick={() => setSelected(selected?.id === inv.id ? null : inv)}
                className={`cursor-pointer transition-colors ${selected?.id === inv.id ? 'bg-primary-500/10' : 'hover:bg-white/5'} ${inv.is_anomaly ? 'border-l-2 border-red-500/60' : ''}`}
              >
                <td className="px-4 py-3 text-slate-500 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-white truncate" title={inv.vendor}>{inv.vendor}</td>
                <td className="px-4 py-3 text-slate-300 truncate font-mono text-xs" title={inv.invoice_number}>{inv.invoice_number || '—'}</td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">₹{parseFloat(inv.amount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-xs rounded-full truncate inline-block max-w-full" title={inv.category}>
                    {inv.category || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400 truncate" title={inv.gstin}>{inv.gstin || '—'}</td>
                <td className="px-4 py-3 text-center">
                  {inv.is_anomaly
                    ? <span title={inv.anomaly_reasons}><ShieldAlert className="w-5 h-5 text-red-500 mx-auto" /></span>
                    : <ShieldCheck className="w-5 h-5 text-green-500 mx-auto" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Detail Row */}
      {selected && (
        <div className="border-t border-primary-500/20 bg-primary-500/5 p-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-primary-400 uppercase tracking-widest">Invoice Details — {selected.vendor}</h4>
            <div className="flex items-center gap-2">
              {selected.file_url && (
                <button
                  onClick={() => setViewFile({
                    url: selected.file_url,
                    name: selected.vendor,
                    isPdf: selected.file_url?.endsWith('.pdf')
                  })}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-400 hover:bg-primary-500/20 transition-colors"
                >
                  {selected.file_url?.endsWith('.pdf') ? <FileText className="w-3.5 h-3.5" /> : <FileImage className="w-3.5 h-3.5" />}
                  View Original
                </button>
              )}
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs">✕ Close</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Invoice Number" value={selected.invoice_number} />
            <Detail label="Date" value={selected.date ? new Date(selected.date).toLocaleDateString('en-IN') : '—'} />
            <Detail label="Amount" value={`₹${parseFloat(selected.amount).toFixed(2)}`} />
            <Detail label="Tax" value={`₹${parseFloat(selected.tax || 0).toFixed(2)}`} />
            <Detail label="Category" value={selected.category} />
            <Detail label="GSTIN" value={selected.gstin} mono />
            <Detail label="Email" value={selected.email} />
            <Detail label="Added On" value={selected.created_at ? new Date(selected.created_at).toLocaleString('en-IN') : '—'} />
          </div>
          {selected.is_anomaly && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Anomaly Reasons
              </p>
              <p className="text-xs text-red-400/80 leading-relaxed">{selected.anomaly_reasons}</p>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Full-screen file viewer modal */}
      {viewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewFile(null)}>
          <div className="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2">
                {viewFile.isPdf ? <FileText className="w-4 h-4 text-red-400" /> : <FileImage className="w-4 h-4 text-primary-400" />}
                <span className="text-sm font-medium text-white">Original Invoice — {viewFile.name}</span>
                <span className="text-xs text-slate-500">{viewFile.isPdf ? 'PDF Document' : 'Image'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface border border-border text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                </a>
                <button onClick={() => setViewFile(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-checkerboard flex items-center justify-center" style={{ minHeight: '400px' }}>
              {viewFile.isPdf ? (
                <iframe
                  src={viewFile.url}
                  title="Invoice PDF"
                  className="w-full border-0"
                  style={{ height: '75vh' }}
                />
              ) : (
                <img
                  src={viewFile.url}
                  alt={`Invoice from ${viewFile.name}`}
                  className="max-w-full object-contain p-4"
                  style={{ maxHeight: '75vh' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>  
  );
}

function Detail({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
      <p className={`text-slate-200 truncate ${mono ? 'font-mono text-xs' : 'text-sm'}`} title={value || '—'}>{value || '—'}</p>
    </div>
  );
}
