import React, { useState, useEffect } from 'react';
import { getVendorAnalysis } from '../api/client';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp,
  Building2, Loader2, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

const RISK_CONFIG = {
  HIGH:   { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    bar: 'bg-red-500',    icon: ShieldAlert },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', bar: 'bg-yellow-400', icon: AlertTriangle },
  LOW:    { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  bar: 'bg-green-500',  icon: ShieldCheck },
};

const fmt = (n) =>
  `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function VendorIntelligence() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    getVendorAnalysis()
      .then(res => { setVendors(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v => filter === 'ALL' || v.risk_level === filter);
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  vendors.forEach(v => counts[v.risk_level]++);

  const toggle = (vendor) => setExpanded(e => e === vendor ? null : vendor);

  if (loading) {
    return (
      <div className="glass-panel p-12 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" /> Analyzing vendor history...
      </div>
    );
  }

  if (!vendors.length) {
    return (
      <div className="glass-panel p-8 text-center text-slate-500 italic">
        No vendor data available. Process some invoices first.
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white leading-none">Vendor Intelligence</h3>
              <p className="text-xs text-slate-500 mt-0.5">AI-powered vendor risk analysis</p>
            </div>
          </div>

          {/* Risk Filter Tabs */}
          <div className="flex items-center gap-2 text-xs">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all border ${
                  filter === level
                    ? level === 'ALL'      ? 'bg-primary-500/20 border-primary-500/40 text-primary-400'
                    : level === 'HIGH'   ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : level === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    :                      'bg-green-500/20 border-green-500/40 text-green-400'
                    : 'border-border text-slate-400 hover:border-slate-500'
                }`}
              >
                {level === 'ALL' ? `All (${vendors.length})` : `${level} (${counts[level]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex gap-4 mt-4">
          {counts.HIGH > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              {counts.HIGH} High-risk vendor{counts.HIGH > 1 ? 's' : ''} require immediate review
            </div>
          )}
          {counts.MEDIUM > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {counts.MEDIUM} vendor{counts.MEDIUM > 1 ? 's' : ''} flagged for monitoring
            </div>
          )}
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="divide-y divide-white/5">
        {filtered.map(vendor => {
          const cfg = RISK_CONFIG[vendor.risk_level];
          const Icon = cfg.icon;
          const isOpen = expanded === vendor.vendor;

          return (
            <div key={vendor.vendor} className={`transition-colors ${isOpen ? `${cfg.bg}` : 'hover:bg-white/[0.02]'}`}>
              {/* Main Row */}
              <button
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
                onClick={() => toggle(vendor.vendor)}
              >
                {/* Risk Badge */}
                <div className={`w-10 h-10 shrink-0 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                {/* Vendor Name & Stats */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white truncate">{vendor.vendor}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      {vendor.risk_level} RISK
                    </span>
                    {vendor.ai_insight && (
                      <span className="text-[10px] flex items-center gap-1 text-primary-400">
                        <Sparkles className="w-3 h-3" /> AI Analysis
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                    <span>{vendor.invoice_count} invoice{vendor.invoice_count > 1 ? 's' : ''}</span>
                    <span>{fmt(vendor.total_spent)} total</span>
                    <span>Avg: {fmt(vendor.avg_amount)}</span>
                    {vendor.dup_groups > 0 && <span className="text-red-400">⚠ {vendor.dup_groups} duplicate group{vendor.dup_groups > 1 ? 's' : ''}</span>}
                    {vendor.spike_count > 0 && <span className="text-yellow-400">↑ {vendor.spike_count} price spike{vendor.spike_count > 1 ? 's' : ''}</span>}
                  </div>
                </div>

                {/* Risk Score Bar */}
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-28">
                  <span className="text-xs text-slate-400">Risk Score</span>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                      style={{ width: `${vendor.risk_score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${cfg.color}`}>{vendor.risk_score}/100</span>
                </div>

                {/* Expand toggle */}
                <div className="shrink-0 text-slate-500">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded Detail Panel */}
              {isOpen && (
                <div className="px-5 pb-5 animate-in fade-in duration-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Stats Grid */}
                    <div className={`rounded-xl p-4 border ${cfg.border} bg-surface/30`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Financial Profile</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <Kv label="Total Invoices" value={vendor.invoice_count} />
                        <Kv label="Total Spent"    value={fmt(vendor.total_spent)} />
                        <Kv label="Avg Amount"     value={fmt(vendor.avg_amount)} />
                        <Kv label="Highest Invoice" value={fmt(vendor.max_amount)} />
                        <Kv label="Lowest Invoice"  value={fmt(vendor.min_amount)} />
                        <Kv label="Anomalies"       value={`${vendor.anomaly_count} flagged`} highlight={vendor.anomaly_count > 0} />
                      </div>
                    </div>

                    {/* Warnings + AI Insight */}
                    <div className="space-y-3">
                      {vendor.warnings.length > 0 && (
                        <div className={`rounded-xl p-4 border ${cfg.border} bg-surface/30`}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Flags</p>
                          <ul className="space-y-1.5">
                            {vendor.warnings.map((w, i) => (
                              <li key={i} className={`text-xs flex gap-2 ${cfg.color}`}>
                                <span className="mt-0.5">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {vendor.ai_insight && (
                        <div className="rounded-xl p-4 border border-primary-500/20 bg-primary-500/5">
                          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Recommendation
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed">{vendor.ai_insight}</p>
                        </div>
                      )}

                      {!vendor.warnings.length && !vendor.ai_insight && (
                        <div className="rounded-xl p-4 border border-green-500/20 bg-green-500/5 text-xs text-green-400">
                          ✓ No risk factors detected. This is a trusted vendor.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kv({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-red-400' : 'text-slate-200'}`}>{value}</p>
    </div>
  );
}
