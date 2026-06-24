import React, { useState, useEffect } from 'react';
import { 
  Link2, Sparkles, Cloud, BarChart3, Shield, BookOpen, 
  HelpCircle, ChevronRight, Menu, X, ArrowUpRight, Terminal, 
  Settings, Radio, Activity, RefreshCw, Cpu, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, AdminUser } from './types';
import LinkCreator from './components/LinkCreator';
import LinkList from './components/LinkList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PrivacyBanner from './components/PrivacyBanner';
import DeploymentGuide from './components/DeploymentGuide';
import SecureCore from './components/SecureCore';
import ThemeEditor, { applyThemeToCSSVariables, THEME_PRESETS } from './components/ThemeEditor';

export default function App() {
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(true);
  
  // Tab control: 'workspace' | 'analytics' | 'theme' | 'admin'
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics' | 'theme' | 'admin'>('workspace');

  // Load and apply custom theme from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('uzk_active_theme');
    if (saved) {
      try {
        const theme = JSON.parse(saved);
        applyThemeToCSSVariables(theme);
      } catch (_) {}
    } else {
      applyThemeToCSSVariables(THEME_PRESETS.jarvis);
    }
  }, []);

  // Theme state
  const [activeTheme, setActiveTheme] = useState<'cyan' | 'green' | 'amber' | 'purple' | 'red'>(() => {
    return (localStorage.getItem('uzk_theme') as any) || 'cyan';
  });

  const handleThemeChange = (theme: 'cyan' | 'green' | 'amber' | 'purple' | 'red') => {
    setActiveTheme(theme);
    localStorage.setItem('uzk_theme', theme);
  };

  // Admin authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('stark_admin_token'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('stark_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Time-ticker for Jarvis clock HUD
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial links list
  useEffect(() => {
    fetchLinks();
  }, [refreshTrigger]);

  const fetchLinks = async () => {
    setLoadingLinks(true);
    try {
      const response = await fetch('/api/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      } else {
        console.error('Failed to retrieve campaign links registry');
      }
    } catch (err) {
      console.error('Error contacting campaign links API:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleLinkCreated = (newLink: Link) => {
    setLinks(prev => [newLink, ...prev]);
    setSelectedLink(newLink);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBulkLinksCreated = (newLinks: Link[]) => {
    setLinks(prev => [...newLinks, ...prev]);
    if (newLinks.length > 0) {
      setSelectedLink(newLinks[0]);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLinkDeleted = (id: number) => {
    setLinks(prev => prev.filter(l => l.id !== id));
    if (selectedLink && selectedLink.id === id) {
      setSelectedLink(null);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLinkUpdated = (updatedLink: Link) => {
    setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
    if (selectedLink && selectedLink.id === updatedLink.id) {
      setSelectedLink(updatedLink);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLoginSuccess = (newToken: string, user: AdminUser) => {
    setToken(newToken);
    setAdminUser(user);
    localStorage.setItem('stark_admin_token', newToken);
    localStorage.setItem('stark_admin_user', JSON.stringify(user));
    // Log active log
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('stark_admin_token');
    localStorage.removeItem('stark_admin_user');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefreshDashboard = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const isAdmin = !!token;

  return (
    <div className={`theme-${activeTheme} min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200`}>
      
      {/* Dynamic Cyber Grid overlay covering entire dashboard background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0 opacity-45" />

      {/* Futuristic Radial Background Glowing Orbs */}
      <div className="absolute top-0 left-0 right-0 h-[650px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[15%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[130px] animate-glow-1" />
        <div className="absolute top-[100px] right-[10%] w-[550px] h-[550px] rounded-full bg-indigo-600/8 blur-[160px] animate-glow-2" />
      </div>

      {/* Interactive Sticky Glass Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/10 shadow-lg shadow-cyan-950/10" id="app-main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* UZK OS Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 shadow-md animate-pulse">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm tracking-widest text-slate-100 flex items-center gap-2 leading-none stark-glow-blue uppercase">
                UZK OS LINKER
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono uppercase font-bold border border-cyan-500/30">
                  SYSTEM CORE
                </span>
              </h1>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider leading-none block mt-1.5 uppercase">
                HOLOGRAPHIC OPERATING SYSTEM
              </span>
            </div>
          </div>

          {/* Core HUD diagnostics */}
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-500 border-l border-white/5 pl-4 mr-auto ml-6">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400 animate-ping" />
              <span>CORES: <span className="text-emerald-400 font-semibold">STABLE</span></span>
            </div>
            <div className="h-3.5 w-px bg-white/5" />
            <div>
              <span>NODE CLOCK: <span className="text-slate-300 font-semibold">{systemTime.toLocaleTimeString()}</span></span>
            </div>
            <div className="h-3.5 w-px bg-white/5" />
            <div>
              <span>PRIVACY MODE: <span className="text-cyan-400 font-semibold uppercase">ACTIVE (ZERO COOKIES)</span></span>
            </div>
          </div>

          {/* 5 Theme Colors Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-white/10 px-2.5 py-1.5 rounded-xl shrink-0">
            <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider hidden lg:inline uppercase mr-1">OS THEME:</span>
            <div className="flex items-center gap-1.5">
              {[
                { name: 'cyan', color: 'bg-cyan-500', title: 'Cyber Cyan' },
                { name: 'green', color: 'bg-emerald-500', title: 'Matrix Green' },
                { name: 'amber', color: 'bg-amber-500', title: 'Solar Amber' },
                { name: 'purple', color: 'bg-purple-500', title: 'Royal Purple' },
                { name: 'red', color: 'bg-rose-500', title: 'Ruby Red' },
              ].map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleThemeChange(t.name as any)}
                  className={`w-3.5 h-3.5 rounded-full ${t.color} transition-all duration-200 cursor-pointer hover:scale-125 focus:outline-none relative flex items-center justify-center`}
                  title={t.title}
                >
                  {activeTheme === t.name && (
                    <span className="absolute inset-0 rounded-full border border-white scale-110 animate-ping opacity-60" />
                  )}
                  {activeTheme === t.name && (
                    <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeploymentGuide(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <Cloud className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline uppercase tracking-wider text-[10px] font-bold">Deploy Guide</span>
            </button>
            
            <a
              href="#privacy-section"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
              title="GDPR Privacy Guard"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('privacy-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Shield className="h-4.5 w-4.5 text-cyan-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8" id="main-content-layout">
        
        {/* Welcome HUD panel */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-cyan-500/10">
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2 uppercase">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              UZK Link OS Console v5.0
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-2xl leading-relaxed">
              Route target links, configure real-time encryption codes, and review aggregate geographical demographics with 100% database privacy.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 shrink-0 font-mono text-xs">
            <div className="text-left">
              <span className="text-[9px] text-slate-500 block leading-none uppercase font-bold">PATHWAYS DETECTED</span>
              <span className="text-lg font-bold text-cyan-400 leading-none mt-2 block stark-glow-blue">
                {links.length}
              </span>
            </div>
            <div className="h-8 w-px bg-white/5 mx-2" />
            <div className="text-left">
              <span className="text-[9px] text-slate-500 block leading-none uppercase font-bold">TELEMETRY CLICKS</span>
              <span className="text-lg font-bold text-indigo-400 leading-none mt-2 block">
                {links.reduce((sum, l) => sum + l.clicks_count, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* High-tech workspace navigation rail */}
        <div className="flex items-center gap-2 bg-slate-900/30 border border-white/5 p-1 rounded-xl max-w-lg font-mono text-[11px]">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-2 rounded-lg text-center font-bold uppercase transition-all tracking-wider cursor-pointer ${
              activeTab === 'workspace' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WORKSPACE
          </button>
          
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-2 rounded-lg text-center font-bold uppercase transition-all tracking-wider cursor-pointer ${
              activeTab === 'theme' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            THEME ENGINE
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-lg text-center font-bold uppercase transition-all tracking-wider cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HUD ANALYTICS
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 rounded-lg text-center font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SECURE CORES
            {isAdmin && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </button>
        </div>

        {/* Tab contents with smooth sliding transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'workspace' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left side inputs */}
                <div className="lg:col-span-5 space-y-6">
                  <LinkCreator 
                    onLinkCreated={handleLinkCreated} 
                    onBulkLinksCreated={handleBulkLinksCreated}
                  />
                </div>

                {/* Right side directories */}
                <div className="lg:col-span-7">
                  <LinkList
                    links={links}
                    onSelectLink={(link) => {
                      setSelectedLink(link);
                      setActiveTab('analytics'); // Swapping tabs to focus map instantly
                    }}
                    onLinkDeleted={handleLinkDeleted}
                    onLinkUpdated={handleLinkUpdated}
                    selectedLinkId={selectedLink?.id}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="max-w-7xl">
                <ThemeEditor />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="max-w-7xl">
                <AnalyticsDashboard
                  selectedLink={selectedLink}
                  onClearSelection={() => setSelectedLink(null)}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="max-w-7xl">
                <SecureCore
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  isAdmin={isAdmin}
                  adminUser={adminUser}
                  refreshTrigger={refreshTrigger}
                  onRefreshDashboard={handleRefreshDashboard}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Deep Privacy Commitment Documentation Block */}
        <section 
          id="privacy-section" 
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/10 relative overflow-hidden font-sans space-y-4"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 pb-2 border-b border-white/5 font-mono">
            <Shield className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">Zero-Trust Privacy Analytics Protocol</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-200 font-mono text-[11px] uppercase tracking-wider text-cyan-400">Zero Raw IP retention</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                IP addresses are decrypted inside transient container RAM solely to parse city, region, and geographical coordinate indexes. Raw IPs are instantly scrubbed and never stored.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-200 font-mono text-[11px] uppercase tracking-wider text-cyan-400">Device fingerprint hashing</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Visitor uniqueness index is computed using one-way cryptographic SHA-256 hashes salts that rotate daily. Cookie-less, track-less, aggregate metrics only.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-200 font-mono text-[11px] uppercase tracking-wider text-cyan-400">Telemetry bot filtration</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                System employs multi-tier user agent scanners to identify automated search web crawlers, crawlers, and scrapers, delivering high-fidelity human telemetry.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Deploy Guide Slideout Drawer */}
      <AnimatePresence>
        {showDeploymentGuide && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeploymentGuide(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Slideout */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-lg bg-slate-950 border-l border-cyan-500/20 p-6 z-50 shadow-2xl overflow-y-auto"
            >
              <button
                onClick={() => setShowDeploymentGuide(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                aria-label="Close Deployment Guide"
              >
                <X className="h-5 w-5" />
              </button>

              <DeploymentGuide onClose={() => setShowDeploymentGuide(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Consent Banner */}
      <PrivacyBanner />

      {/* Subtle HUD Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 text-center text-[10px] text-slate-500 font-mono space-y-2 relative z-10">
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <span className="hover:text-cyan-400 transition-colors">STARK CORE SQLITE ENGINE</span>
          <span>•</span>
          <span className="hover:text-cyan-400 transition-colors">CSRF RATE-LIMIT API CORES</span>
          <span>•</span>
          <span className="hover:text-cyan-400 transition-colors">GDPR DEMOGRAPHICS SYSTEM</span>
        </div>
        <div>
          © {new Date().getFullYear()} STARK INDUSTRIES. JARVIS REDIRECT COCKPIT ONLINE.
        </div>
      </footer>

    </div>
  );
}
