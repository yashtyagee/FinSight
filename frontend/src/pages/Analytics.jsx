import React, { useEffect, useState } from 'react';
import { getDashboardStats, getFinancialHealth, getInvoices } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, AlertTriangle, Loader2, Activity, FileDigit, Receipt, ShieldAlert, Download } from 'lucide-react';
import { generateFinancialReport } from '../utils/generateReport';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getFinancialHealth(),
      getInvoices(),
    ]).then(([statsRes, healthRes, invRes]) => {
      setData(statsRes.data);
      setHealthData(healthRes.data);
      setInvoices(invRes.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('Analytics Loading Error:', err);
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

  if (!data) return <div className="p-8">Failed to load payload</div>;

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

  const handleDownloadReport = async () => {
    setGenerating(true);
    // small delay to let spinner render
    await new Promise(res => setTimeout(res, 50));
    try {
      generateFinancialReport(data, healthData, invoices);
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 relative">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light text-white mb-2">
            Financial <span className="font-semibold text-primary-500">Analytics</span>
          </h2>
          <p className="text-slate-400">Your AI-generated spending overview.</p>
        </div>
        <button
          onClick={handleDownloadReport}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary-500/20 shrink-0"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Download className="w-4 h-4" /> Download Report</>
          )}
        </button>
      </header>

      {/* Top Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Spent" value={`₹${data.total_expenses.toFixed(2)}`} icon={<IndianRupee />} />
        <StatCard title="Avg Invoice" value={`₹${data.avg_invoice_value.toFixed(2)}`} icon={<Activity />} />
        <StatCard title="Total Tax" value={`₹${data.total_tax.toFixed(2)}`} icon={<Receipt />} />
        <StatCard title="Total Invoices" value={data.invoice_count} icon={<FileDigit />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Expected Spend (Next Month)" value={`₹${data.next_month_forecast.toFixed(2)}`} icon={<TrendingUp className="text-blue-500" />} />
        <StatCard title="Top Category" value={data.by_category[0]?.category || 'N/A'} icon={<TrendingUp />} />
        <StatCard title="Most Frequent Vendor" value={data.frequent_vendors?.[0]?.vendor || 'N/A'} icon={<AlertTriangle />} />
      </div>

      {healthData && (
        <div className="glass-panel p-6 mb-8 border-primary-500/30 shadow-lg shadow-primary-500/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Activity className="text-primary-400" />
                Financial Health Score
              </h3>
              <p className="text-slate-300 leading-relaxed mb-4">{healthData.explanation}</p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cost Optimizations & Insights</h4>
                <ul className="space-y-1">
                  {(healthData.insights || []).map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-surface/80 rounded-full border-4 border-primary-500/50 w-40 h-40 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
               <span className="text-5xl font-bold text-white shadow-sm">{healthData.score}</span>
               <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest mt-1">out of 100</span>
            </div>
          </div>
        </div>
      )}


      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-8">
        {/* Category Breakdown (Bar) */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium text-white mb-6">Spending by Category</h3>
          <div className="h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_category} margin={{ top: 10, right: 10, left: -10, bottom: 85 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val}`} 
                />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Spent']}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={28}>
                  {data.by_category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend (Line) */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium text-white mb-6">Monthly Trend</h3>
          <div className="h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_trend} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Amount']}
                />
                <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} dot={{ stroke: '#0ea5e9', strokeWidth: 2, fill: '#0f172a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 mb-12 border-primary-500/10 hover:border-primary-500/30 transition-colors">
        <h3 className="text-lg font-medium text-white mb-6">Top Vendors by Spending</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_vendors} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis dataKey="vendor" type="category" stroke="#94a3b8" tick={{fill: '#e2e8f0'}} axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                cursor={{fill: '#1e293b'}}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Spent']}
              />
              <Bar dataKey="total_spent" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="glass-panel p-6 flex items-center gap-4 min-w-0 group relative transition-all duration-300 hover:scale-[1.02] hover:z-10 bg-[#0f172a]/80 hover:bg-[#1e293b] hover:shadow-2xl hover:shadow-primary-500/10 cursor-default border border-transparent hover:border-slate-700">
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-400 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-colors group-hover:text-slate-300">
          {title}
        </p>
        <p className="text-2xl font-bold text-white mt-1 truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
