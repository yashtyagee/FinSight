import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../api/client';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function FraudAndAnomalyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 relative">
      <header className="mb-10">
        <h2 className="text-3xl font-light text-white mb-2">
          Fraud & <span className="font-semibold text-primary-500">Anomaly Report</span>
        </h2>
        <p className="text-slate-400">ML-powered compliance checks and flagged invoices.</p>
      </header>

      <div className="glass-panel p-6 mb-12 border-red-500/30 overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Flagged Records
        </h3>
        {(!data || !data.anomalies || data.anomalies.length === 0) ? (
          <p className="text-slate-400 italic">No anomalies or suspicious invoices detected. Your finances are clean.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm text-slate-300" style={{tableLayout: 'fixed'}}>
              <thead className="text-xs text-slate-400 uppercase bg-surface border-b border-border">
                <tr>
                  <th className="px-4 py-3 w-28">Date</th>
                  <th className="px-4 py-3 w-36">Vendor</th>
                  <th className="px-4 py-3 w-32">Amount</th>
                  <th className="px-4 py-3">Reasons Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.anomalies.map((invoice, idx) => (
                  <tr key={idx} className="hover:bg-surface/30">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 truncate max-w-0" title={invoice.vendor}>{invoice.vendor}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-white">₹{parseFloat(invoice.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-red-400 break-words whitespace-pre-wrap text-xs leading-relaxed">{invoice.anomaly_reasons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
