import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import StarField from '../components/StarField';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Landing() {
  const { login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('nitin@gmail.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const demoRef = useRef(null);
  const teamRef = useRef(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTeam = () => {
    teamRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // small delay to feel realistic
    await new Promise(r => setTimeout(r, 600));

    const result = login(email, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#07050d] text-slate-200 font-sans overflow-hidden">
      {/* Background Effect */}
      <StarField />
      
      {/* Very faint purple gradient overlay to match the image's center glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[500px] rounded-full bg-purple-900/10 blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 w-full max-w-[1400px] mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="text-purple-500 font-bold text-3xl tracking-tighter w-8 h-8 flex items-center justify-center">
            F
          </div>
          <span className="text-white text-xl tracking-[0.2em] font-medium uppercase">
            FinSight
          </span>
        </div>

        {/* Links Section */}
        <div className="hidden lg:flex items-center gap-10">
          {[
            { label: 'FEATURES', desc: 'Invoice Processing' },
            { label: 'DASHBOARD', desc: 'Financial Health', action: scrollToDemo },
            { label: 'AI ADVISOR', desc: 'Forensic Assistant' },
            { label: 'OUR TEAM', desc: 'The Builders', action: scrollToTeam }
          ].map(item => (
            <button 
              key={item.label} 
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
              className="group flex flex-col items-start transition-colors text-left bg-transparent border-none p-0 cursor-pointer"
            >
              <span className="text-slate-300 group-hover:text-white text-[11px] font-bold tracking-[0.15em] uppercase transition-colors">
                {item.label}
              </span>
              <span className="text-slate-500 group-hover:text-purple-400 text-[9px] tracking-widest uppercase mt-1 transition-colors">
                {item.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-8">
          <button onClick={() => setShowLoginModal(true)} className="text-slate-300 hover:text-white text-[11px] tracking-widest uppercase transition-colors">
            LOGIN
          </button>
          <button 
            onClick={() => setShowLoginModal(true)} 
            className="px-6 py-2.5 rounded-full border border-purple-500/50 text-purple-300 text-[11px] font-semibold tracking-widest uppercase hover:bg-purple-900/40 transition-colors"
          >
            UPLOAD INVOICE
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 py-24 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-[76px] font-light text-white leading-tight mb-8">
          Transform Invoice<br />
          Processing with AI
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl font-light max-w-3xl leading-relaxed mb-14">
          Upload invoices and let AI automatically extract data, detect fraud, categorize<br className="hidden md:block"/>
          expenses, and generate financial insights.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="px-8 py-3.5 rounded-full bg-[#9b5de5] hover:bg-[#8338ec] text-white text-sm font-semibold tracking-widest transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            UPLOAD INVOICE
          </button>
          
          <button 
            onClick={scrollToDemo}
            className="px-8 py-3.5 rounded-full border border-slate-700 bg-[#161421]/60 hover:bg-[#161421] text-white text-sm font-semibold tracking-widest transition-colors"
          >
            VIEW DASHBOARD DEMO
          </button>
        </div>
      </main>

      {/* Demo Section */}
      <section ref={demoRef} className="relative z-10 max-w-5xl mx-auto px-4 pb-32 pt-12 text-center">
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-purple-900/20 bg-[#0a0f1e]">
          <div className="absolute top-0 left-0 w-full h-12 bg-[#0f172a] border-b border-slate-800 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          </div>
          <img src="/dashboard-demo.png" alt="FinSight Dashboard" className="w-full pt-12 object-cover rounded-2xl" />
          <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none"></div>
        </div>
        <p className="mt-10 text-slate-400 max-w-3xl mx-auto text-lg font-light leading-relaxed">
          Experience real-time AI-driven financial insights. View automated spending categorization, intelligent vendor risk assessments, and compliance health scoring—all directly from one unified dashboard.
        </p>
      </section>

      {/* Our Team Section */}
      <section ref={teamRef} className="relative z-10 max-w-6xl mx-auto px-4 pb-32 pt-12 text-center">
        <h2 className="text-4xl font-light text-white mb-16 tracking-wide">
          Meet the <span className="font-semibold text-purple-500">Team</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Nitin Mall', role: 'Core Contributor' },
            { name: 'Yashashvi Tyagi', role: 'Core Contributor' },
            { name: 'Nilesh Gupta', role: 'Core Contributor' }
          ].map(member => (
            <div key={member.name} className="p-8 rounded-3xl border border-slate-800 bg-[#161421]/60 hover:bg-[#161421] transition-all duration-300 hover:-translate-y-2 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-900/10">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#1a1727] to-[#2d2545] border border-slate-700/50 flex items-center justify-center mb-6 shadow-inner">
                <span className="text-2xl font-bold text-white tracking-wider">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
              <p className="text-slate-500 text-xs tracking-[0.2em] uppercase font-semibold">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Basic Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#110f1a] border border-slate-800 rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            
            <div className="text-center mb-8">
               <div className="mx-auto text-purple-500 font-bold text-4xl tracking-tighter w-12 h-12 flex items-center justify-center mb-4">
                F
              </div>
              <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
              <p className="text-slate-400 mt-2 text-sm">FinSight AI Platform</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1a1727] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-[#9b5de5] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#1a1727] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-[#9b5de5] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#9b5de5] hover:bg-[#8338ec] disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-colors mt-2 flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
