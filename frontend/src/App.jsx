import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileUp, MessageSquareMore, LogOut, ChevronDown, FileDigit, Users, ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Home from './pages/Home';
import DashboardPage from './pages/Analytics';
import AdvisorPage from './pages/AdvisorPage';
import InvoiceRecordsPage from './pages/InvoiceRecordsPage';
import VendorIntelligencePage from './pages/VendorIntelligencePage';
import FraudAndAnomalyPage from './pages/FraudAndAnomalyPage';

import StarField from './components/StarField';

function ProtectedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: FileUp, label: 'Upload Invoice' },
    { to: '/analytics', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/invoices', icon: FileDigit, label: 'Invoice Records' },
    { to: '/vendors', icon: Users, label: 'Vendor Intelligence' },
    { to: '/fraud', icon: ShieldAlert, label: 'Fraud & Anomaly Report' },
    { to: '/advisor', icon: MessageSquareMore, label: 'AI Advisor' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#07050d] p-4 pl-0 relative z-0">
      {/* Background Effect */}
      <StarField />
      
      {/* Faint center glow */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[500px] rounded-full bg-purple-900/10 blur-[150px]" />
      </div>

      {/* Sidebar - Make sure it sits above the background with z-10 */}
      <aside className="w-64 flex flex-col h-full pl-4 pr-6 relative z-10">
        <div className="flex items-center gap-3 mb-10 mt-4 px-3">
          <div className="text-purple-500 font-bold text-3xl tracking-tighter w-8 h-8 flex items-center justify-center">
            F
          </div>
          <span className="text-white text-xl tracking-[0.2em] font-medium uppercase">
            FinSight
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-primary-500/10 text-white border border-primary-500/20'
                    : 'hover:bg-surface text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-primary-400'}`} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile + Logout */}
        <div className="border-t border-border/50 pt-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface/50 border border-border/30">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {user?.initials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full bg-slate-900/50 border border-border rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analytics" element={<DashboardPage />} />
            <Route path="/invoices" element={<InvoiceRecordsPage />} />
            <Route path="/vendors" element={<VendorIntelligencePage />} />
            <Route path="/fraud" element={<FraudAndAnomalyPage />} />
            <Route path="/advisor" element={<AdvisorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <ProtectedLayout />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
