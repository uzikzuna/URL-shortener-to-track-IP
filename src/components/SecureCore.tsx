import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Terminal, Download, UploadCloud, Users, 
  Trash2, RefreshCw, KeyRound, Eye, EyeOff, AlertCircle, Sparkles, Server
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminUser, ActivityLog } from '../types';

interface SecureCoreProps {
  onLoginSuccess: (token: string, user: AdminUser) => void;
  onLogout: () => void;
  isAdmin: boolean;
  adminUser: AdminUser | null;
  refreshTrigger: number;
  onRefreshDashboard: () => void;
}

export default function SecureCore({ 
  onLoginSuccess, 
  onLogout, 
  isAdmin, 
  adminUser, 
  refreshTrigger,
  onRefreshDashboard
}: SecureCoreProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Admin privilege states
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  
  // DB status operations
  const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [dbMessage, setDbMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      fetchLogs();
    }
  }, [isAdmin, refreshTrigger]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Failed to load admin nodes:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/activity-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load terminal logs:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication rejected by security firewall');
      }
      onLoginSuccess(data.token, data.user);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'System firewalls rejected verification');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser.trim() || !newAdminPass.trim()) return;
    setCreatingAdmin(true);
    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newAdminUser, password: newAdminPass })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize admin');
      
      setNewAdminUser('');
      setNewAdminPass('');
      fetchAdminData();
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Node authorization failed');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (adminUser && adminUser.id === id) {
      alert('Cannot terminate active system credentials node');
      return;
    }
    if (!confirm('Are you sure you want to terminate this admin node?')) return;
    try {
      const response = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchAdminData();
        fetchLogs();
      }
    } catch (err) {
      console.error('Failed to terminate credential node');
    }
  };

  const handleBackup = () => {
    window.open('/api/database/backup', '_blank');
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDbStatus('idle');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Verify valid JSON
        JSON.parse(text);

        const response = await fetch('/api/database/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupJson: text })
        });
        const data = await response.json();
        if (response.ok) {
          setDbStatus('success');
          setDbMessage('Stark Core Database Restored Successfully');
          onRefreshDashboard();
        } else {
          throw new Error(data.error || 'Database rejected restoration payload');
        }
      } catch (err: any) {
        setDbStatus('failed');
        setDbMessage(err.message || 'Corrupted restoration JSON payload');
      }
    };
    reader.readAsText(file);
  };

  // Filter logs based on search string
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.ip.includes(logSearch)
  );

  if (!isAdmin) {
    return (
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="admin-gate-gating">
        <div className="hud-laser-line" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center py-6 space-y-6">
          <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <KeyRound className="h-7 w-7 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-slate-100 flex items-center justify-center gap-2 tracking-wide uppercase stark-glow-blue">
              Security Protocol
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Enter administrative security passcode keys to authenticate connection.
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Security User ID</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full glass-input text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
              />
            </div>

            <div className="space-y-2 text-left relative">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Security Passcode</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter 2025 security passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full glass-input text-xs text-slate-200 px-4 py-3 pr-10 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl overflow-hidden font-sans text-left">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Decrypting System...
                </>
              ) : (
                <>
                  Verify Credentials
                  <ShieldCheck className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest pt-2">
            STARK INDUSTRIES SYSTEM CORE GATEWAY V4.2
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="secure-admin-panel">
      
      {/* 1. Header Banner */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-md">
            <Server className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-display font-semibold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider leading-none">
              Secured core Console
            </h2>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
              Logged in as: <span className="text-cyan-400 font-bold">{adminUser?.username}</span> [{adminUser?.role}]
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-mono transition-all cursor-pointer"
        >
          Disconnect Terminal
        </button>
      </div>

      {/* 2. Management Controls Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Management */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Users className="h-4.5 w-4.5 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">System Core Node Registry</h3>
          </div>

          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Username"
              value={newAdminUser}
              onChange={(e) => setNewAdminUser(e.target.value)}
              required
              className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none placeholder:text-slate-600 font-mono"
            />
            <input
              type="password"
              placeholder="Password"
              value={newAdminPass}
              onChange={(e) => setNewAdminPass(e.target.value)}
              required
              className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none placeholder:text-slate-600 font-mono"
            />
            <button
              type="submit"
              disabled={creatingAdmin}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Add Admin Node
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[10px]">
                  <th className="py-2">Node ID</th>
                  <th className="py-2">Admin Name</th>
                  <th className="py-2">Node Type</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="py-2.5">#{admin.id}</td>
                    <td className="py-2.5 text-cyan-400 font-semibold">{admin.username}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database backup and restore */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <RefreshCw className="h-4.5 w-4.5 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Central Database Systems</h3>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Safeguard or restore link mappings, visitor click indices, activity logs, and system credentials directly. Backups are formatted as human-readable JSON files.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Download Backup */}
            <button
              onClick={handleBackup}
              className="flex flex-col items-center justify-center p-4 bg-slate-900/30 hover:bg-slate-900/50 border border-white/5 hover:border-cyan-500/20 rounded-xl space-y-2 transition-all group text-center cursor-pointer"
            >
              <div className="p-2 bg-cyan-500/15 text-cyan-400 rounded-lg group-hover:scale-110 transition-transform">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Export Backup</span>
              <span className="text-[9px] text-slate-500 font-mono">Download stark_backup.json</span>
            </button>

            {/* Upload Recovery */}
            <label className="flex flex-col items-center justify-center p-4 bg-slate-900/30 hover:bg-slate-900/50 border border-white/5 hover:border-cyan-500/20 rounded-xl space-y-2 transition-all group text-center cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
              />
              <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Import Restore</span>
              <span className="text-[9px] text-slate-500 font-mono">Drag-and-drop or Browse</span>
            </label>
          </div>

          {dbStatus !== 'idle' && (
            <div className={`text-xs p-3 rounded-lg flex items-center gap-2 font-sans ${
              dbStatus === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{dbMessage}</span>
            </div>
          )}
        </div>

      </div>

      {/* 3. Live terminal Activity Log Stream */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Dynamic Activity Log Feed</h3>
          </div>
          
          <input
            type="text"
            placeholder="Search terminal logs..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="glass-input text-[11px] text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none placeholder:text-slate-600 font-mono w-full sm:max-w-xs"
          />
        </div>

        <div className="w-full bg-slate-950 border border-cyan-500/10 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-[300px] overflow-y-auto hud-scanline" id="activity-terminal">
          <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-white/5 mb-2 text-[10px]">
            <span>STARK PROTOCOL STREAM [STABLE]</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              ONLINE
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              NO ACTIVITY EVENT LOGS RETRIEVED
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="hover:bg-white/[0.02] py-1.5 px-2 rounded transition-colors flex flex-col md:flex-row md:items-start justify-between gap-2 border-b border-white/[0.02]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">[{log.action.toUpperCase()}]</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    {log.details}
                  </p>
                </div>
                <div className="text-slate-500 text-[10px] select-all shrink-0">
                  IP: {log.ip}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
