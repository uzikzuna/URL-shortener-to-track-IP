import React from 'react';
import { Cloud, Globe, Database, Terminal, FileText, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface DeploymentGuideProps {
  onClose?: () => void;
}

export default function DeploymentGuide({ onClose }: DeploymentGuideProps) {
  return (
    <div className="space-y-6" id="deployment-instructions-container">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-display font-semibold text-slate-100 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-indigo-400" />
          Deployment Guide
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Follow these steps to deploy this full-stack application to production.
        </p>
      </div>

      {/* Tabs / Sections */}
      <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-2">
        
        {/* Section 1: Netlify (Frontend) */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-display font-medium text-sm">
            <Globe className="h-4 w-4" />
            <span>Frontend: Netlify</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Since this app is a full-stack integrated Node/Express + Vite app, you can either deploy them together as a single full-stack app on a server (Render/Railway), or split them (Netlify for static files, Render for the backend API).
          </p>
          
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-semibold text-slate-200">Option A: Split Deployment (Statics on Netlify)</h4>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1">
              <li>Deploy backend first (see Render/Railway instructions below) to get your <code className="text-indigo-300 font-mono font-semibold">Backend API URL</code>.</li>
              <li>Connect your GitHub repository to Netlify.</li>
              <li>Set <strong>Build Command</strong> to: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">npm run build</code></li>
              <li>Set <strong>Publish Directory</strong> to: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">dist</code></li>
              <li>Add Environment Variable in Netlify:
                <div className="bg-slate-900/80 p-2 rounded font-mono text-[11px] text-slate-300 mt-1 space-y-1 border border-white/5">
                  <span className="text-indigo-300">VITE_API_URL</span> = <span className="text-emerald-300">"https://your-backend-api.onrender.com"</span>
                </div>
              </li>
              <li>Deploy and enjoy fast CDN-loaded static client pages!</li>
            </ol>
          </div>
        </div>

        {/* Section 2: Render/Railway (Backend & Full-stack) */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-display font-medium text-sm">
            <Database className="h-4 w-4" />
            <span>Backend: Render / Railway</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The easiest and most robust method is a <strong>Full-Stack unified deployment</strong> on Render or Railway, running both Express and Vite under a single container port.
          </p>
          
          <div className="space-y-3 pt-1">
            <div>
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-indigo-400" />
                Render Deployment Steps
              </h4>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1 mt-1">
                <li>Create a <strong>Web Service</strong> on Render.</li>
                <li>Connect your Git repository.</li>
                <li>Select <strong>Node</strong> runtime.</li>
                <li>Set <strong>Build Command</strong> to: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">npm run build</code></li>
                <li>Set <strong>Start Command</strong> to: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">npm start</code></li>
                <li>Set the following Environment Variables in Render:
                  <div className="bg-slate-900/80 p-2 rounded font-mono text-[11px] text-slate-300 mt-1 space-y-1 border border-white/5">
                    <div><span className="text-indigo-300">NODE_ENV</span> = <span className="text-emerald-300">"production"</span></div>
                    <div><span className="text-indigo-300">PORT</span> = <span className="text-emerald-300">"3000"</span></div>
                    <div><span className="text-indigo-300">APP_URL</span> = <span className="text-emerald-300">"https://your-shortener.onrender.com"</span></div>
                  </div>
                </li>
                <li>(Optional) Add a **Render Persistent Disk** mounted at <code className="font-mono text-indigo-300">/data</code> and set environment variable <code className="font-mono text-indigo-300">SQLITE_PATH="/data/data.db"</code> to keep short links across backend restarts!</li>
              </ol>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-indigo-400" />
                Railway Deployment Steps
              </h4>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1 mt-1">
                <li>Create a <strong>New Project</strong> on Railway.</li>
                <li>Select <strong>Deploy from GitHub</strong> and select your repo.</li>
                <li>Railway will automatically detect `package.json` scripts and run <code className="font-mono">npm run build</code> and <code className="font-mono">npm start</code>.</li>
                <li>Add Environment Variables: <code className="font-mono">NODE_ENV=production</code> and <code className="font-mono">APP_URL=https://your-app.up.railway.app</code>.</li>
                <li>To persist your SQLite database, click on your service, go to **Settings** → **Volumes** → **Add Volume** and mount it at <code className="font-mono">/app/data</code>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Section 3: SQLite vs Supabase Relational Scaling */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-display font-medium text-sm">
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
            <span>Relational Database Upgrades</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This app is pre-configured with **SQLite** for instant, local zero-setup operation. It runs incredibly fast on single-file read/writes.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            If you wish to scale to thousands of links and need multi-server concurrent connections, we recommend changing the SQL pool in <code className="font-mono text-slate-300">/src/db.ts</code> to connect to a hosted **Supabase** (PostgreSQL) or our **Cloud SQL (PostgreSQL)** database. All schemas remain identical as both databases are SQL-compliant relational engines!
          </p>
        </div>

        {/* Section 4: Architecture Config */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-display font-medium text-sm">
            <Terminal className="h-4 w-4" />
            <span>Configuring Environment Secrets</span>
          </div>
          <p className="text-xs text-slate-300">
            Ensure you declare all environment configurations inside your hosting dashboards. Keep secret keys safe.
          </p>
          <div className="bg-slate-950 p-2.5 rounded font-mono text-[10px] text-indigo-200 border border-white/5 space-y-1 select-all">
            <div># Set to deployment URL to generate correct QR codes and copy links</div>
            <div><span className="text-rose-400">APP_URL</span>=https://your-production-url.com</div>
            <div className="mt-2"># Enable secure full-stack modes</div>
            <div><span className="text-rose-400">NODE_ENV</span>=production</div>
          </div>
        </div>

      </div>
    </div>
  );
}
