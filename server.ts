import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { 
  getDb, 
  createLink, 
  getLinkByCode, 
  getLinks, 
  deleteLink, 
  recordVisit, 
  getLinkAnalytics, 
  getAggregateAnalytics,
  seedMockDataIfEmpty,
  updateLink,
  createActivityLog,
  getActivityLogs,
  getAdmins,
  createAdmin,
  deleteAdmin,
  validateAdmin,
  backupDatabase,
  restoreDatabase
} from './src/db.ts';

// New security, validation, generation and caching packages
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import QRCode from 'qrcode';
import { z } from 'zod';
import axios from 'axios';
import sharp from 'sharp';

// Metadata parser modules
import ogs from 'open-graph-scraper';
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperUrl from 'metascraper-url';

// Privacy-safe IP hashing variables
const IP_SALT = crypto.randomBytes(16).toString('hex');

function getIpHash(ip: string): string {
  return crypto.createHash('sha256').update(ip + IP_SALT).digest('hex').slice(0, 16);
}

// Redirect Templates for Expiration and Password protection
function renderDisabledPage(code: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Access Suspended // Node Deactivated</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght=400;500;600&family=JetBrains+Mono:wght=400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
        .glow-text { text-shadow: 0 0 10px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2); }
        .holo-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(245, 158, 11, 0.2); }
      </style>
    </head>
    <body class="bg-[#020617] text-slate-100 flex items-center justify-center min-h-screen relative overflow-hidden p-4">
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-amber-600/5 blur-[120px]"></div>
      </div>
      <div class="max-w-md w-full holo-panel p-8 rounded-2xl shadow-2xl relative z-10 text-center space-y-6 font-sans">
        <div class="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div class="space-y-2">
          <h1 class="text-xl font-bold tracking-tight text-amber-400 font-mono uppercase tracking-wide glow-text">Node Suspended</h1>
          <p class="text-[10px] text-slate-400 font-mono">STATUS: NODE_DEACTIVATED_BY_ADMIN [/${code}]</p>
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">
          Access to this link has been temporarily suspended or deactivated by the Stark security administrator.
        </p>
        <div class="pt-4 border-t border-white/5">
          <p class="text-[10px] text-slate-500 font-mono">SECURE ROUTER GATEWAY // SYSTEM ACCESS: REVOKED</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderExpiredPage(code: string, expiresAt: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Access Denied // Campaign Expired</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght=400;500;600&family=JetBrains+Mono:wght=400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
        .glow-text { text-shadow: 0 0 10px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.2); }
        .holo-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.2); }
      </style>
    </head>
    <body class="bg-[#020617] text-slate-100 flex items-center justify-center min-h-screen relative overflow-hidden p-4">
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-rose-600/5 blur-[120px]"></div>
      </div>
      <div class="max-w-md w-full holo-panel p-8 rounded-2xl shadow-2xl relative z-10 text-center space-y-6 font-sans">
        <div class="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h1 class="text-xl font-bold tracking-tight text-rose-400 font-mono uppercase tracking-wide glow-text">Campaign Expired</h1>
          <p class="text-[10px] text-slate-400 font-mono">CODE: LINK_LIFETIME_EXCEEDED [/${code}]</p>
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">
          The shortlink lifetime limit has been reached. This campaign ended on <br/>
          <span class="text-rose-300 font-mono text-xs">${new Date(expiresAt).toLocaleString()}</span>.
        </p>
        <div class="pt-4 border-t border-white/5">
          <p class="text-[10px] text-slate-500 font-mono">SECURE ROUTER GATEWAY // SYSTEM STATUS: TERMINATED</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderLockScreen(code: string, hasError = false): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Access Authorization Required</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght=400;500;600&family=JetBrains+Mono:wght=400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
        .glow-text { text-shadow: 0 0 10px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, 0.2); }
        .holo-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .holo-input { background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); }
        .holo-input:focus { border-color: rgba(99, 102, 241, 0.5); box-shadow: 0 0 15px rgba(99, 102, 241, 0.15); }
      </style>
    </head>
    <body class="bg-[#020617] text-slate-100 flex items-center justify-center min-h-screen relative overflow-hidden p-4">
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-[120px]"></div>
        <div class="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[120px]"></div>
      </div>

      <div class="max-w-md w-full holo-panel p-8 rounded-2xl shadow-2xl relative z-10 text-center space-y-6">
        <div class="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div class="space-y-1.5">
          <h1 class="text-lg font-bold tracking-tight text-slate-100 font-mono uppercase tracking-wider flex items-center justify-center gap-2">
            Secure Link Access
          </h1>
          <p class="text-xs text-slate-400 font-mono">ENCRYPTED GATEWAY FOR /${code}</p>
        </div>

        <p class="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
          This short link is protected by a dynamic campaign security protocol. Please provide the authorized access passphrase below.
        </p>

        <form method="POST" action="/${code}" class="space-y-4 pt-2">
          <div class="space-y-2">
            <input 
              type="password" 
              name="password" 
              placeholder="Enter authorization passphrase"
              required
              class="w-full holo-input text-sm text-slate-200 px-4 py-3.5 rounded-xl focus:outline-none placeholder:text-slate-600 font-sans text-center transition-all duration-300"
            />
            ${hasError ? `
              <div class="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-sans mt-2 bg-rose-500/5 border border-rose-500/10 py-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Incorrect access password. Try again.</span>
              </div>
            ` : ''}
          </div>

          <button 
            type="submit" 
            class="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm font-sans transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            Authorize Connection
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <div class="pt-4 border-t border-white/5">
          <p class="text-[9px] text-slate-600 font-mono uppercase tracking-widest">Tony Stark Holographic Security Systems</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- Intelligent Preview System & Scraper ---

interface PlatformMeta {
  name: string;
  icon: string;
  color: string;
  badgeColor: string;
}

function detectPlatform(urlStr: string): PlatformMeta {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return { name: 'YouTube', icon: 'youtube', color: '#ef4444', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }
    if (host.includes('tiktok.com')) {
      return { name: 'TikTok', icon: 'tiktok', color: '#00f2fe', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
    if (host.includes('instagram.com')) {
      return { name: 'Instagram', icon: 'instagram', color: '#ec4899', badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20' };
    }
    if (host.includes('spotify.com')) {
      return { name: 'Spotify', icon: 'spotify', color: '#1db954', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
    if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.watch')) {
      return { name: 'Facebook', icon: 'facebook', color: '#3b82f6', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
    if (host.includes('twitter.com') || host.includes('x.com')) {
      return { name: 'X (Twitter)', icon: 'twitter', color: '#f8fafc', badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
    }
    if (host.includes('linkedin.com')) {
      return { name: 'LinkedIn', icon: 'linkedin', color: '#0a66c2', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    }
    if (host.includes('github.com')) {
      return { name: 'GitHub', icon: 'github', color: '#c084fc', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    }
    if (host.includes('vimeo.com')) {
      return { name: 'Vimeo', icon: 'video', color: '#00adef', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
    if (host.includes('twitch.tv') || host.includes('twitch.com')) {
      return { name: 'Twitch', icon: 'twitch', color: '#a855f7', badgeColor: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' };
    }
    if (host.includes('reddit.com') || host.includes('redd.it')) {
      return { name: 'Reddit', icon: 'message-square', color: '#ff4500', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    }
    if (host.includes('medium.com')) {
      return { name: 'Medium', icon: 'book-open', color: '#10b981', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
    if (host.includes('discord.gg') || host.includes('discord.com')) {
      return { name: 'Discord', icon: 'message-circle', color: '#5865f2', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    }
    
    // News sites list
    const newsKeywords = ['nytimes', 'cnn', 'bbc', 'techcrunch', 'theverge', 'forbes', 'bloomberg', 'reuters', 'wsj', 'wired', 'guardian', 'independent', 'huffpost', 'economist'];
    for (const kw of newsKeywords) {
      if (host.includes(kw)) {
        return { name: 'News Portal', icon: 'newspaper', color: '#f59e0b', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      }
    }
    
    // Blogs
    if (host.includes('blog') || host.includes('substack') || host.includes('wordpress')) {
      return { name: 'Blog', icon: 'pen-tool', color: '#14b8a6', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
    }

    return { name: 'External Link', icon: 'globe', color: '#6366f1', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  } catch (e) {
    return { name: 'External Link', icon: 'globe', color: '#6366f1', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  }
}

function getPlatformSvg(iconName: string): string {
  const baseClass = "h-10 w-10 text-slate-300 transition-transform duration-300 group-hover:scale-110";
  
  switch (iconName) {
    case 'youtube':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    case 'github':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;
    case 'tiktok':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14.99 1.13 2.37 1.84 3.86 2.02v3.91c-1.34-.05-2.67-.44-3.83-1.14-.99-.61-1.81-1.47-2.39-2.5-.07 1.94-.03 3.89-.04 5.83-.05 1.97-.54 3.93-1.46 5.63-1.11 2.08-3.04 3.66-5.3 4.31-2.22.64-4.62.43-6.69-.6-2.12-1.05-3.76-2.92-4.49-5.18-.73-2.25-.49-4.73.69-6.8 1.14-2.02 3.09-3.52 5.37-4.1 1.56-.4 3.2-.3 4.69.29V11.1c-.81-.39-1.72-.51-2.6-.33-.86.18-1.64.67-2.16 1.39-.52.71-.73 1.6-.58 2.47.14.86.63 1.63 1.34 2.12.7.49 1.57.65 2.41.44.81-.2 1.51-.72 1.94-1.45.39-.68.56-1.46.52-2.24-.01-4.44-.01-8.88-.01-13.32-.01-.06-.02-.12-.03-.18z"/></svg>`;
    case 'instagram':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
    case 'spotify':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 6.627 5.373 12 12 12 6.628 0 12-5.373 12-12 0-6.628-5.372-12-12-12zm5.501 17.311c-.22.359-.691.474-1.05.251-2.901-1.772-6.551-2.172-10.852-1.191-.409.093-.82-.162-.913-.571-.093-.409.162-.82.571-.913 4.711-1.071 8.74-1.619 12.012.381.359.219.474.691.251 1.05zm1.469-3.26c-.279.449-.868.599-1.319.32-3.321-2.04-8.38-2.63-12.3-1.441-.501.15-1.03-.13-1.181-.631-.15-.502.13-1.031.631-1.181 4.479-1.359 10.061-.71 13.849 1.62.45.279.6.868.32 1.319v.013zm.12-3.39c-3.979-2.361-10.551-2.58-14.36-1.421-.61.181-1.25-.17-1.43-.78-.18-.61.17-1.251.78-1.431 4.38-1.329 11.629-1.07 16.2 1.651.55.33.73 1.04.41 1.59-.33.55-1.04.73-1.6.411z"/></svg>`;
    case 'facebook':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`;
    case 'twitter':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
    case 'linkedin':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
    case 'twitch':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>`;
    case 'message-square':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    case 'book-open':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
    case 'message-circle':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/></svg>`;
    case 'newspaper':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`;
    case 'pen-tool':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-1.5"/><path d="M14 5h8v4h-8z"/><path d="m2 22 5-5c1-1 3-1 4 0l1 1c1 1 1 3 0 4l-5 5H2v-5Z"/><path d="m5 17 3 3"/></svg>`;
    case 'video':
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><path d="m22 8-6 4 6 4V8Z"/></svg>`;
    case 'globe':
    default:
      return `<svg class="${baseClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  }
}

function decodeHtmlEntities(str: string): string {
  return str.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ');
}

function resolveUrl(baseUrl: string, relativeUrl: string): string {
  if (!relativeUrl) return '';
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    return relativeUrl;
  }
}

interface DestinationMetadata {
  title: string;
  description: string;
  image: string;
  favicon: string;
  domain: string;
  platform: PlatformMeta;
  url: string;
}

// Instantiate metascraper with essential plugins
const mScraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperUrl()
]);

// 24 Hours Cache Instance using node-cache (stdTTL in seconds: 24 * 60 * 60 = 86400)
const metadataCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

async function fetchWithOgs(urlStr: string): Promise<any> {
  try {
    const { result }: any = await ogs({ url: urlStr });
    if (result && result.success) {
      return {
        title: result.ogTitle || result.twitterTitle || '',
        description: result.ogDescription || result.twitterDescription || '',
        image: result.ogImage?.[0]?.url || result.ogImage?.url || result.twitterImage?.[0]?.url || result.twitterImage?.url || '',
        favicon: result.favicon || ''
      };
    }
  } catch (e) {
    // Fail silently
  }
  return null;
}

async function fetchWithMetascraper(html: string, urlStr: string): Promise<any> {
  try {
    const data = await mScraper({ html, url: urlStr });
    return {
      title: data.title || '',
      description: data.description || '',
      image: data.image || '',
      favicon: data.logo || ''
    };
  } catch (e) {
    // Fail silently
  }
  return null;
}

async function fetchLinkMetadata(urlStr: string): Promise<DestinationMetadata> {
  const domain = (() => {
    try {
      return new URL(urlStr).hostname;
    } catch (e) {
      return '';
    }
  })();
  
  const platform = detectPlatform(urlStr);

  let title = '';
  let description = '';
  let image = '';
  let favicon = '';

  // 1. Try fetching with open-graph-scraper
  const ogsData = await fetchWithOgs(urlStr);
  if (ogsData) {
    title = ogsData.title;
    description = ogsData.description;
    image = ogsData.image;
    favicon = ogsData.favicon;
  }

  // 2. Fetch raw HTML for metascraper and regex as robust fallbacks
  if (!title || !description || !image) {
    try {
      const response = await axios.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 4000
      });

      if (response.status === 200) {
        const html = response.data;

        // Try metascraper
        const msData = await fetchWithMetascraper(html, urlStr);
        if (msData) {
          if (!title) title = msData.title;
          if (!description) description = msData.description;
          if (!image) image = msData.image;
          if (!favicon) favicon = msData.favicon;
        }

        // Regex fallbacks
        if (!title) {
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          title = titleMatch ? titleMatch[1].trim() : '';
        }
        if (!description) {
          const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
          description = descMatch ? descMatch[1].trim() : '';
        }
        if (!image) {
          const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          image = ogImgMatch ? ogImgMatch[1].trim() : '';
        }
        if (!favicon) {
          const favMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
          favicon = favMatch ? favMatch[1].trim() : '';
        }
      }
    } catch (err) {
      // Ignore network errors
    }
  }

  // Sanitizations & fallback resolutions
  if (title) {
    title = decodeHtmlEntities(title);
  } else {
    title = domain || 'Secure Redirect';
  }

  if (description) {
    description = decodeHtmlEntities(description);
  } else {
    description = `Establish dynamic connection tunnel to external host ${domain}. Verify connection coordinates to continue safely.`;
  }

  if (image) {
    image = resolveUrl(urlStr, image);
  }

  if (favicon) {
    favicon = resolveUrl(urlStr, favicon);
  } else {
    favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  return {
    title,
    description,
    image,
    favicon,
    domain,
    platform,
    url: urlStr
  };
}

async function getCachedLinkMetadata(urlStr: string): Promise<DestinationMetadata> {
  const cached = metadataCache.get<DestinationMetadata>(urlStr);
  if (cached) {
    return cached;
  }
  const data = await fetchLinkMetadata(urlStr);
  metadataCache.set(urlStr, data);
  return data;
}

async function generateFallbackImage(title: string, domain: string, code: string): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  
  const escapeSvg = (str: string) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  };

  const escapedTitle = escapeSvg(title.length > 55 ? title.slice(0, 52) + '...' : title);
  const escapedDomain = escapeSvg(domain.toUpperCase());
  const escapedCode = escapeSvg(code);

  const svgString = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="60%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="50%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>

        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.015)" stroke-width="1"/>
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#bgGrad)" />
      <rect width="100%" height="100%" fill="url(#grid)" />

      <circle cx="150" cy="150" r="120" fill="#6366f1" opacity="0.12" filter="blur(80px)" />
      <circle cx="1050" cy="480" r="150" fill="#06b6d4" opacity="0.1" filter="blur(100px)" />

      <path d="M 30,60 L 30,30 L 60,30" fill="none" stroke="rgba(6, 182, 212, 0.4)" stroke-width="3" />
      <path d="M 1170,60 L 1170,30 L 1140,30" fill="none" stroke="rgba(6, 182, 212, 0.4)" stroke-width="3" />
      <path d="M 30,570 L 30,600 L 60,600" fill="none" stroke="rgba(6, 182, 212, 0.4)" stroke-width="3" />
      <path d="M 1170,570 L 1170,600 L 1140,600" fill="none" stroke="rgba(6, 182, 212, 0.4)" stroke-width="3" />

      <line x1="50" y1="50" x2="1150" y2="50" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />
      <line x1="50" y1="580" x2="1150" y2="580" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />

      <text x="70" y="90" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#06b6d4" letter-spacing="4">SECURE REDIRECT GATEWAY // ARCHITECTURE ACTIVE</text>
      <text x="1130" y="90" font-family="'Courier New', monospace" font-size="12" fill="rgba(255, 255, 255, 0.4)" text-anchor="end" letter-spacing="1">COORD: /${escapedCode}</text>

      <g transform="translate(100, 200)">
        <polygon points="40,0 120,0 160,70 120,140 40,140 0,70" fill="rgba(99, 102, 241, 0.1)" stroke="url(#accentGrad)" stroke-width="2" />
        <text x="80" y="85" font-family="'Trebuchet MS', sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">URL</text>
      </g>

      <g transform="translate(300, 200)">
        <rect x="0" y="0" width="280" height="32" rx="6" fill="rgba(6, 182, 212, 0.1)" stroke="rgba(6, 182, 212, 0.2)" stroke-width="1" />
        <circle cx="16" cy="16" r="4" fill="#06b6d4" />
        <text x="32" y="21" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#22d3ee" letter-spacing="2">${escapedDomain}</text>

        <text x="0" y="90" font-family="'Segoe UI', Helvetica, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" width="750">${escapedTitle}</text>
        <text x="0" y="145" font-family="'Segoe UI', sans-serif" font-size="18" fill="rgba(255, 255, 255, 0.4)">Establish dynamic connection tunnel to external host.</text>
      </g>

      <rect x="70" y="520" width="1060" height="4" fill="rgba(255, 255, 255, 0.05)" rx="2" />
      <rect x="70" y="520" width="450" height="4" fill="url(#accentGrad)" rx="2" />

      <text x="70" y="555" font-family="'Courier New', monospace" font-size="10" fill="rgba(255, 255, 255, 0.3)">GATEWAY: ACTIVE // CONNECTION: VERIFIED</text>
      <text x="1130" y="555" font-family="'Courier New', monospace" font-size="10" fill="rgba(255, 255, 255, 0.3)" text-anchor="end">SECURE REDIRECT SERVICE</text>
    </svg>
  `;

  return await sharp(Buffer.from(svgString))
    .png({ compressionLevel: 8 })
    .toBuffer();
}

function renderSocialPreviewPage(link: any, metadata: DestinationMetadata, shortUrl: string, imageUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${metadata.title}</title>
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website">
      <meta property="og:url" content="${shortUrl}">
      <meta property="og:title" content="${metadata.title}">
      <meta property="og:description" content="${metadata.description}">
      <meta property="og:image" content="${imageUrl}">
      
      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:url" content="${shortUrl}">
      <meta name="twitter:title" content="${metadata.title}">
      <meta name="twitter:description" content="${metadata.description}">
      <meta name="twitter:image" content="${imageUrl}">
      
      <!-- Meta Fallbacks / Standard -->
      <meta name="description" content="${metadata.description}">
      <link rel="icon" type="image/png" href="${metadata.favicon}">
    </head>
    <body>
      <p>Redirecting to <a href="${link.original_url}">${metadata.title}</a>...</p>
      <script>
        window.location.replace("${link.original_url}");
      </script>
    </body>
    </html>
  `;
}

function renderPreviewPage(code: string, link: any, metadata: DestinationMetadata, shortUrl: string, imageUrl: string): string {
  const platformSvg = getPlatformSvg(metadata.platform.icon);
  
  let displayUrl = metadata.url || link.original_url;
  if (displayUrl.length > 55) {
    displayUrl = displayUrl.slice(0, 52) + '...';
  }

  const previewImageHtml = metadata.image 
    ? `<div class="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950/80 rounded-2xl border border-white/5 shadow-inner">
         <img src="${imageUrl}" alt="Destination Preview" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105" onerror="this.style.display='none'; document.getElementById('image-fallback').style.display='flex';" referrerPolicy="no-referrer" />
         <div class="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent"></div>
       </div>`
    : '';

  const fallbackDisplayClass = metadata.image ? 'hidden' : 'flex';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Holographic Rerouting Gate // ${metadata.title}</title>
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website">
      <meta property="og:url" content="${shortUrl}">
      <meta property="og:title" content="${metadata.title}">
      <meta property="og:description" content="${metadata.description}">
      <meta property="og:image" content="${imageUrl}">
      
      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:url" content="${shortUrl}">
      <meta name="twitter:title" content="${metadata.title}">
      <meta name="twitter:description" content="${metadata.description}">
      <meta name="twitter:image" content="${imageUrl}">
      
      <!-- Meta Fallbacks / Standard -->
      <meta name="description" content="${metadata.description}">
      <link rel="icon" type="image/png" href="${metadata.favicon}">

      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
        .hud-font { font-family: 'JetBrains Mono', monospace; }
        .glass-panel { 
          background: rgba(15, 23, 42, 0.55); 
          backdrop-filter: blur(20px); 
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08); 
        }
        .glow-text-cyan { text-shadow: 0 0 10px rgba(6, 182, 212, 0.4), 0 0 20px rgba(6, 182, 212, 0.2); }
        .scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.15) 50%
          );
          background-size: 100% 4px;
        }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      </style>
    </head>
    <body class="bg-[#020617] text-slate-100 min-h-screen relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none grid-bg">
      
      <!-- Holographic Scanning Overlays -->
      <div class="absolute inset-0 pointer-events-none z-50 scanlines opacity-25"></div>
      
      <!-- Ambient light nodes -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[130px] animate-pulse-slow"></div>
        <div class="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[130px] animate-pulse-slow" style="animation-delay: 2s;"></div>
      </div>

      <!-- Header HUD Info -->
      <header class="w-full max-w-2xl mx-auto flex items-center justify-between text-[10px] text-slate-500 hud-font border-b border-white/5 pb-3 z-10">
        <div class="flex items-center gap-2">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>SYSTEM GATEWAY: ACTIVE</span>
        </div>
        <div>
          <span>PORT: 3000 // ROUTE: /${code}</span>
        </div>
        <div class="hidden sm:block">
          <span>SECURE ENCRYPTED PROXY</span>
        </div>
      </header>

      <!-- Main Hub Container -->
      <main class="w-full max-w-lg mx-auto my-auto py-6 z-10 flex flex-col items-center">
        
        <!-- Platform Specific Holographic Pulse Orb -->
        <div class="mb-4 flex items-center justify-center relative">
          <div class="absolute inset-0 rounded-full bg-indigo-500/15 blur-xl scale-125 animate-pulse"></div>
          <div class="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-lg relative group">
            <span class="absolute top-1 right-1 flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            ${platformSvg}
          </div>
        </div>

        <!-- Glassmorphic Preview Deck -->
        <div class="w-full glass-panel rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
          
          <!-- Large image section -->
          ${previewImageHtml}

          <!-- Large image fallback container (when image metadata fails or is unavailable) -->
          <div id="image-fallback" class="${fallbackDisplayClass} flex-col items-center justify-center text-center py-8 px-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
            <div class="p-3 bg-white/5 border border-white/5 rounded-full text-slate-400">
              ${platformSvg}
            </div>
            <div class="space-y-1">
              <p class="text-[10px] text-slate-400 hud-font uppercase tracking-wider">${metadata.platform.name} Gateway</p>
              <p class="text-[9px] text-slate-600 font-sans">No preview image broadcasted by the host</p>
            </div>
          </div>

          <!-- Metadata Deck -->
          <div class="space-y-3 pt-1">
            <!-- Favicon & Site Name Badge Row -->
            <div class="flex flex-wrap items-center gap-2">
              <div class="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 text-[10px] font-medium text-slate-300">
                <img src="${metadata.favicon}" alt="Favicon" class="h-3.5 w-3.5 object-contain rounded" onerror="this.src='https://www.google.com/s2/favicons?domain=${metadata.domain}&sz=64'" />
                <span class="font-sans font-medium tracking-wide text-slate-200">${metadata.domain}</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full border text-[9px] hud-font uppercase tracking-widest ${metadata.platform.badgeColor}">
                ${metadata.platform.name}
              </span>
            </div>

            <!-- Page Title -->
            <h1 class="text-sm sm:text-base font-bold tracking-tight text-slate-100 leading-snug">
              ${metadata.title}
            </h1>

            <!-- Description -->
            <p class="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
              ${metadata.description}
            </p>
          </div>

          <!-- Target URL Box (Holographic details) -->
          <div class="p-3 bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div class="space-y-0.5 overflow-hidden">
              <span class="text-[8px] hud-font text-slate-500 uppercase tracking-widest block">DESTINATION URL COORDINATES</span>
              <span class="text-slate-300 font-mono truncate block break-all text-[11px]">${displayUrl}</span>
            </div>
            <a href="${link.original_url}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 p-1 shrink-0 transition-colors" title="Open directly in new tab">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <!-- Active Dispatch Panel & Live Progress -->
          <div class="space-y-2 pt-2">
            <!-- Time Indicator -->
            <div class="flex items-center justify-between text-xs hud-font">
              <div class="flex items-center gap-1.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-cyan-400 animate-spin" style="animation-duration: 3s" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span id="dispatch-status">DISPATCH IN PROGRESS...</span>
              </div>
              <div class="text-cyan-400 font-bold flex items-center gap-1">
                <span>00:0</span><span id="countdown-num">5</span>
              </div>
            </div>

            <!-- Custom Cyberpunk Progress Bar -->
            <div class="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-white/5 relative p-[1px]">
              <div id="progress-fill" class="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 ease-out" style="width: 0%;"></div>
            </div>
          </div>

          <!-- Controls Button Deck -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <button id="btn-pause-play" class="py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-medium text-xs hud-font flex items-center justify-center gap-1.5 transition-all focus:outline-none cursor-pointer">
              <!-- Pause SVG Icon -->
              <svg id="icon-pause" class="h-3.5 w-3.5 text-cyan-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              <!-- Play SVG Icon (hidden initially) -->
              <svg id="icon-play" class="h-3.5 w-3.5 text-emerald-400 hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg>
              <span id="txt-pause">PAUSE ENGINE</span>
            </button>

            <button onclick="dispatchImmediate()" class="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs hud-font flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 focus:outline-none cursor-pointer">
              <span>BYPASS GATEWAY</span>
              <svg class="h-3.5 w-3.5 text-slate-950" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

        </div>

        <!-- Cancel Deck -->
        <div class="mt-5">
          <a href="/" class="text-[10px] hud-font text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-1 border-b border-dashed border-slate-700 pb-0.5 hover:border-rose-500">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Cancel & Terminate Routing</span>
          </a>
        </div>

      </main>

      <!-- Footer HUD -->
      <footer class="w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-600 hud-font pt-3 border-t border-white/5 z-10 gap-2">
        <div>
          <span>SECURITY CLASSIFICATION: CLASS III PROTOCOL</span>
        </div>
        <div>
          <span>JARVIS INTELLIGENT DISPATCH GATEWAY © 2026</span>
        </div>
      </footer>

      <!-- JavaScript Logic inside preview page -->
      <script>
        const totalDuration = 5; // 5 seconds
        let timeLeft = totalDuration;
        let isPaused = false;
        const targetUrl = "${link.original_url}";

        const countdownNum = document.getElementById('countdown-num');
        const progressFill = document.getElementById('progress-fill');
        const dispatchStatus = document.getElementById('dispatch-status');
        
        const btnPausePlay = document.getElementById('btn-pause-play');
        const iconPause = document.getElementById('icon-pause');
        const iconPlay = document.getElementById('icon-play');
        const txtPause = document.getElementById('txt-pause');

        // Primary interval loop
        const timer = setInterval(() => {
          if (!isPaused) {
            timeLeft -= 0.1;
            if (timeLeft <= 0) {
              timeLeft = 0;
              clearInterval(timer);
              dispatchImmediate();
            }
            
            // Update Text & Progress Width
            countdownNum.innerText = Math.ceil(timeLeft).toString();
            const pct = ((totalDuration - timeLeft) / totalDuration) * 100;
            progressFill.style.width = pct + '%';
          }
        }, 100);

        // Pause/Play Engine Handler
        btnPausePlay.addEventListener('click', () => {
          isPaused = !isPaused;
          if (isPaused) {
            iconPause.classList.add('hidden');
            iconPlay.classList.remove('hidden');
            txtPause.innerText = "RESUME ENGINE";
            dispatchStatus.innerText = "ROUTING GATEWAY PAUSED";
            dispatchStatus.classList.remove('text-slate-400');
            dispatchStatus.classList.add('text-amber-400');
          } else {
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
            txtPause.innerText = "PAUSE ENGINE";
            dispatchStatus.innerText = "DISPATCH IN PROGRESS...";
            dispatchStatus.classList.remove('text-amber-400');
            dispatchStatus.classList.add('text-slate-400');
          }
        });

        // Direct Redirection Action
        function dispatchImmediate() {
          clearInterval(timer);
          dispatchStatus.innerText = "ROUTING COUPLING ESTABLISHED... REDIRECTING";
          dispatchStatus.classList.remove('text-slate-400', 'text-amber-400');
          dispatchStatus.classList.add('text-emerald-400');
          window.location.replace(targetUrl);
        }
      </script>
    </body>
    </html>
  `;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB & Seed Data
  try {
    await getDb();
    await seedMockDataIfEmpty();
  } catch (err) {
    console.error('Failed to initialize or seed SQLite database:', err);
  }

  app.use(express.json());

  // Set up helmet for strong HTTP security headers, making sure we disable CSP so we do not block dev previews
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // 1. IP Rate Limiter implementation using express-rate-limit
  function rateLimiter(limit: number, windowMs: number) {
    return rateLimit({
      windowMs,
      max: limit,
      message: { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
      }
    });
  }

  // 2. Helper parsers for analytics tracking
  function isBot(userAgent: string): boolean {
    if (!userAgent) return false;
    const botRegex = /bot|crawler|spider|slurp|crawl|mediapartners|facebookexternalhit|slackbot|discordbot|twitterbot/i;
    return botRegex.test(userAgent);
  }

  function parseUserAgent(userAgent: string): { browser: string; device: string } {
    if (!userAgent) {
      return { browser: 'Unknown', device: 'Desktop' };
    }
    
    let device = 'Desktop';
    if (/ipad/i.test(userAgent)) {
      device = 'Tablet';
    } else if (/iphone|ipod/i.test(userAgent)) {
      device = 'Mobile';
    } else if (/android/i.test(userAgent)) {
      if (/mobile/i.test(userAgent)) {
        device = 'Mobile';
      } else {
        device = 'Tablet';
      }
    } else if (/mobile|phone/i.test(userAgent)) {
      device = 'Mobile';
    }

    let browser = 'Unknown';
    if (/edg/i.test(userAgent)) {
      browser = 'Edge';
    } else if (/opr|opera/i.test(userAgent)) {
      browser = 'Opera';
    } else if (/chrome|crios/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/firefox|fxios/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/msie|trident/i.test(userAgent)) {
      browser = 'IE';
    }

    return { browser, device };
  }

  function parseReferrer(referrerUrl: string): string {
    if (!referrerUrl) return 'Direct';
    try {
      const url = new URL(referrerUrl);
      const host = url.hostname.toLowerCase();
      if (host.includes('linkedin.com')) return 'LinkedIn';
      if (host.includes('twitter.com') || host.includes('t.co')) return 'Twitter';
      if (host.includes('facebook.com') || host.includes('fb.com')) return 'Facebook';
      if (host.includes('google.com')) return 'Google';
      if (host.includes('github.com')) return 'GitHub';
      if (host.includes('reddit.com')) return 'Reddit';
      if (host.includes('youtube.com')) return 'YouTube';
      
      const cleanHost = host.startsWith('www.') ? host.slice(4) : host;
      return cleanHost;
    } catch (e) {
      return 'External';
    }
  }

  async function getIpGeo(ip: string): Promise<{ country: string; region: string; city: string; lat: number | null; lon: number | null }> {
    const isLocal = !ip || 
                    ip === '::1' || 
                    ip === '127.0.0.1' || 
                    ip.startsWith('::ffff:127.0.0.1') ||
                    ip.startsWith('10.') || 
                    ip.startsWith('192.168.') || 
                    ip.startsWith('172.16.') || 
                    ip.startsWith('fe80:');
                    
    if (isLocal) {
      const devLocations = [
        { country: 'Philippines', region: 'Metro Manila', city: 'Quezon City', lat: 14.6760, lon: 121.0437 },
        { country: 'Philippines', region: 'Metro Manila', city: 'Manila', lat: 14.5995, lon: 120.9842 },
        { country: 'Philippines', region: 'Metro Manila', city: 'Makati', lat: 14.5547, lon: 121.0244 },
        { country: 'Philippines', region: 'Cebu', city: 'Cebu City', lat: 10.3157, lon: 123.8854 },
        { country: 'United States', region: 'California', city: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
        { country: 'United States', region: 'New York', city: 'New York City', lat: 40.7128, lon: -74.0060 },
        { country: 'United Kingdom', region: 'Greater London', city: 'London', lat: 51.5074, lon: -0.1278 },
        { country: 'Japan', region: 'Tokyo', city: 'Shibuya', lat: 35.6580, lon: 139.7016 }
      ];
      return devLocations[Math.floor(Math.random() * devLocations.length)];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
      const res = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json() as any;
        if (data && data.status === 'success') {
          return {
            country: data.country || 'Unknown',
            region: data.regionName || 'Unknown',
            city: data.city || 'Unknown',
            lat: typeof data.lat === 'number' ? data.lat : null,
            lon: typeof data.lon === 'number' ? data.lon : null
          };
        }
      }
    } catch (error) {
      console.warn(`GeoIP lookup failed for IP ${ip}:`, error);
    }

    return { country: 'Unknown', region: 'Unknown', city: 'Unknown', lat: null, lon: null };
  }

  // Helper: Try to extract title of target URL
  async function fetchPageTitle(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) return null;
      const text = await res.text();
      const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1]) {
        // Decode simple HTML entities if any
        return match[1].replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#039;/g, "'")
                       .trim();
      }
    } catch (error) {
      // Fail silently, returning null
    }
    return null;
  }

  // --- API Routes ---

  // Create a new shortened link
  app.post('/api/links', rateLimiter(15, 60 * 1000), async (req, res) => {
    // 1. Validate request body using Zod
    const bodySchema = z.object({
      url: z.string().min(1, 'Original URL is required'),
      customCode: z.string().regex(/^[a-zA-Z0-9_-]*$/, 'Custom code must be alphanumeric, dashes, or underscores').max(20, 'Custom code must be at most 20 characters').optional().nullable().or(z.string().length(0).optional().nullable()),
      expiresAt: z.string().optional().nullable().or(z.string().length(0).optional().nullable()),
      password: z.string().max(32, 'Password must be at most 32 characters').optional().nullable().or(z.string().length(0).optional().nullable()),
      enablePreview: z.union([z.boolean(), z.number()]).optional(),
      is_active: z.number().optional(),
      one_time_use: z.number().optional(),
      category: z.string().optional().nullable(),
      tags: z.string().optional().nullable(),
      clicks_limit: z.number().optional().nullable(),
      custom_description: z.string().optional().nullable().or(z.string().length(0).optional().nullable()),
      custom_image_url: z.string().optional().nullable().or(z.string().length(0).optional().nullable()),
      custom_preview_json: z.string().optional().nullable().or(z.string().length(0).optional().nullable()),
      custom_theme_json: z.string().optional().nullable().or(z.string().length(0).optional().nullable())
    });

    const parseResult = bodySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    let { 
      url, 
      customCode, 
      expiresAt, 
      password, 
      enablePreview,
      is_active,
      one_time_use,
      category,
      tags,
      clicks_limit,
      custom_description,
      custom_image_url,
      custom_preview_json,
      custom_theme_json
    } = parseResult.data;

    // Validate URL structure
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL. Please enter a valid URL with http or https' });
      return;
    }

    // Process short code
    let shortCode = customCode?.trim().toLowerCase();
    
    if (shortCode) {
      // Validate custom code length
      if (shortCode.length < 3 || shortCode.length > 15) {
        res.status(400).json({ error: 'Custom code must be 3-15 characters long' });
        return;
      }

      // Check reserved names
      const reserved = ['api', 'assets', 'src', 'index.html', 'favicon.ico', 'vite', 'data.db'];
      if (reserved.includes(shortCode)) {
        res.status(400).json({ error: 'This custom code is reserved' });
        return;
      }

      // Check duplicate
      const existing = await getLinkByCode(shortCode);
      if (existing) {
        res.status(400).json({ error: 'This custom code is already taken' });
        return;
      }
    } else {
      // Generate unique random 6-character short code
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let attempts = 0;
      while (attempts < 10) {
        shortCode = '';
        for (let i = 0; i < 6; i++) {
          shortCode += chars[Math.floor(Math.random() * chars.length)];
        }
        const existing = await getLinkByCode(shortCode);
        if (!existing) break;
        attempts++;
      }
    }

    try {
      // Fetch rich metadata including fallback title, domain and custom platforms
      const metadata = await getCachedLinkMetadata(formattedUrl).catch(() => null);
      const cleanTitle = metadata?.title || new URL(formattedUrl).hostname;
      
      const newLink = await createLink(
        shortCode!, 
        formattedUrl, 
        cleanTitle, 
        expiresAt || null, 
        password || null,
        enablePreview !== undefined ? (typeof enablePreview === 'boolean' ? (enablePreview ? 1 : 0) : enablePreview) : 1,
        is_active !== undefined ? is_active : 1,
        one_time_use !== undefined ? one_time_use : 0,
        category || 'Uncategorized',
        tags || null,
        clicks_limit || null,
        custom_description || null,
        custom_image_url || null,
        custom_preview_json || null,
        custom_theme_json || null
      );
      
      // Log event
      await createActivityLog('Link Created', `Created short link /${shortCode} pointing to ${formattedUrl}`, req.ip || '127.0.0.1');

      res.status(201).json(newLink);
    } catch (error: any) {
      console.error('Error creating link:', error);
      res.status(500).json({ error: 'Failed to create shortened link' });
    }
  });

  // Get list of all links
  app.get('/api/links', rateLimiter(60, 60 * 1000), async (req, res) => {
    try {
      const links = await getLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve links' });
    }
  });

  // Bulk create links
  app.post('/api/links/bulk', rateLimiter(15, 60 * 1000), async (req, res) => {
    const { items, category, tags, enablePreview } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Array of items is required' });
      return;
    }

    const results = [];
    const ip = req.ip || '127.0.0.1';

    for (const item of items) {
      let { url, customCode } = item;
      if (!url) continue;

      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }

      try {
        new URL(formattedUrl);
      } catch (e) {
        results.push({ url, error: 'Invalid URL structure' });
        continue;
      }

      let shortCode = customCode?.trim().toLowerCase();
      if (shortCode) {
        if (shortCode.length < 3 || shortCode.length > 15) {
          results.push({ url, error: 'Custom code must be 3-15 characters' });
          continue;
        }
        const existing = await getLinkByCode(shortCode);
        if (existing) {
          results.push({ url, error: `Custom code "${shortCode}" already taken` });
          continue;
        }
      } else {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let attempts = 0;
        while (attempts < 10) {
          shortCode = '';
          for (let i = 0; i < 6; i++) {
            shortCode += chars[Math.floor(Math.random() * chars.length)];
          }
          const existing = await getLinkByCode(shortCode);
          if (!existing) break;
          attempts++;
        }
      }

      try {
        const metadata = await getCachedLinkMetadata(formattedUrl).catch(() => null);
        const cleanTitle = metadata?.title || new URL(formattedUrl).hostname;
        
        const newLink = await createLink(
          shortCode,
          formattedUrl,
          cleanTitle,
          null,
          null,
          enablePreview !== undefined ? (enablePreview ? 1 : 0) : 1,
          1, // is_active
          0, // one_time_use
          category || 'Uncategorized',
          tags || null,
          null
        );
        results.push({ url, success: true, link: newLink });
      } catch (err: any) {
        results.push({ url, error: err.message || 'Creation error' });
      }
    }

    await createActivityLog('Bulk Links Created', `Created ${results.filter(r => r.success).length} bulk shortened links`, ip);
    res.json(results);
  });

  // Edit/update a link
  app.put('/api/links/:id', rateLimiter(45, 60 * 1000), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const b = req.body;
      const mappedFields: any = {};
      
      if (b.url !== undefined) mappedFields.original_url = b.url;
      if (b.category !== undefined) mappedFields.category = b.category;
      if (b.tags !== undefined) mappedFields.tags = b.tags;
      if (b.password !== undefined) mappedFields.password = b.password;
      if (b.expiresAt !== undefined) mappedFields.expires_at = b.expiresAt;
      if (b.clicks_limit !== undefined) mappedFields.clicks_limit = b.clicks_limit;
      if (b.one_time_use !== undefined) mappedFields.one_time_use = b.one_time_use;
      if (b.enable_preview !== undefined) mappedFields.enable_preview = b.enable_preview;
      if (b.enablePreview !== undefined) mappedFields.enable_preview = b.enablePreview;
      if (b.is_active !== undefined) mappedFields.is_active = b.is_active;
      if (b.custom_description !== undefined) mappedFields.custom_description = b.custom_description;
      if (b.custom_image_url !== undefined) mappedFields.custom_image_url = b.custom_image_url;
      if (b.custom_preview_json !== undefined) mappedFields.custom_preview_json = b.custom_preview_json;
      if (b.custom_theme_json !== undefined) mappedFields.custom_theme_json = b.custom_theme_json;

      const updated = await updateLink(id, mappedFields);
      if (updated) {
        await createActivityLog('Link Updated', `Updated link ID ${id} parameters`, req.ip || '127.0.0.1');
        res.json({ success: true, message: 'Link successfully updated' });
      } else {
        res.status(404).json({ error: 'Link not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update link' });
    }
  });

  // Delete a link
  app.delete('/api/links/:id', rateLimiter(30, 60 * 1000), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid link ID' });
      return;
    }

    try {
      const deleted = await deleteLink(id);
      if (deleted) {
        await createActivityLog('Link Deleted', `Deleted link ID ${id}`, req.ip || '127.0.0.1');
        res.json({ success: true, message: 'Link successfully deleted' });
      } else {
        res.status(404).json({ error: 'Link not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  // Secure administrative login
  app.post('/api/auth/login', rateLimiter(10, 60 * 1000), async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    try {
      const admin = await validateAdmin(username, password);
      if (admin) {
        await createActivityLog('Admin Login', `User ${username} authenticated successfully`, req.ip || '127.0.0.1');
        res.json({ success: true, user: admin, token: 'stark_token_' + Date.now() });
      } else {
        await createActivityLog('Admin Login Failed', `Failed login attempt for user ${username}`, req.ip || '127.0.0.1');
        res.status(401).json({ error: 'Invalid security code credentials' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Authentication error' });
    }
  });

  // Get activity logs
  app.get('/api/activity-logs', rateLimiter(60, 60 * 1000), async (req, res) => {
    try {
      const logs = await getActivityLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve activity logs' });
    }
  });

  // Manage administrative users
  app.get('/api/admins', rateLimiter(30, 60 * 1000), async (req, res) => {
    try {
      const adminsList = await getAdmins();
      res.json(adminsList);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve administrators' });
    }
  });

  app.post('/api/admins', rateLimiter(15, 60 * 1000), async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    try {
      const newAdmin = await createAdmin(username, password);
      await createActivityLog('Admin Created', `Administrator "${username}" registered`, req.ip || '127.0.0.1');
      res.status(201).json(newAdmin);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create administrator' });
    }
  });

  app.delete('/api/admins/:id', rateLimiter(15, 60 * 1000), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid administrator ID' });
      return;
    }
    try {
      const deleted = await deleteAdmin(id);
      if (deleted) {
        await createActivityLog('Admin Deleted', `Deleted admin ID ${id}`, req.ip || '127.0.0.1');
        res.json({ success: true, message: 'Administrator deleted' });
      } else {
        res.status(404).json({ error: 'Administrator not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete administrator' });
    }
  });

  // Database Backup and Restore
  app.get('/api/database/backup', rateLimiter(10, 60 * 1000), async (req, res) => {
    try {
      const backupData = await backupDatabase();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=stark_links_backup.json');
      res.send(backupData);
    } catch (error) {
      res.status(500).json({ error: 'Backup generation failed' });
    }
  });

  app.post('/api/database/restore', rateLimiter(10, 60 * 1000), async (req, res) => {
    const { backupJson } = req.body;
    if (!backupJson) {
      res.status(400).json({ error: 'Backup JSON payload is required' });
      return;
    }
    try {
      const restored = await restoreDatabase(backupJson);
      if (restored) {
        await createActivityLog('Database Restored', 'Platform database restored from external backup', req.ip || '127.0.0.1');
        res.json({ success: true, message: 'Database successfully restored' });
      } else {
        res.status(400).json({ error: 'Invalid backup format' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database restore operation failed' });
    }
  });

  // Get specific link analytics
  app.get('/api/links/:id/analytics', rateLimiter(60, 60 * 1000), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid link ID' });
      return;
    }

    try {
      const analytics = await getLinkAnalytics(id);
      res.json(analytics);
    } catch (error: any) {
      if (error.message === 'Link not found') {
        res.status(404).json({ error: 'Link not found' });
      } else {
        res.status(500).json({ error: 'Failed to retrieve analytics' });
      }
    }
  });

  // Get aggregate dashboard analytics
  app.get('/api/analytics', rateLimiter(60, 60 * 1000), async (req, res) => {
    try {
      const analytics = await getAggregateAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve aggregate analytics' });
    }
  });

  // Generate PNG QR Code locally using qrcode package
  app.get('/api/links/:code/qr', rateLimiter(100, 60 * 1000), async (req, res) => {
    try {
      const { code } = req.params;
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const url = `${protocol}://${host}/${code}`;
      
      const qrBuffer = await QRCode.toBuffer(url, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(qrBuffer);
    } catch (error) {
      console.error('QR code generation error:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  // Serve destination preview image or dynamic fallback image using sharp
  app.get('/api/images/preview/:code.png', rateLimiter(120, 60 * 1000), async (req, res) => {
    try {
      const { code } = req.params;
      const link = await getLinkByCode(code);
      if (!link) {
        res.status(404).send('Shortlink Not Found');
        return;
      }

      const metadata = await getCachedLinkMetadata(link.original_url).catch(() => ({
        title: link.title || '',
        description: link.custom_description || '',
        image: link.custom_image_url || '',
        favicon: '',
        url: link.original_url,
        domain: new URL(link.original_url).hostname,
        platform: { name: 'generic', icon: 'link' }
      }));

      if (link.custom_image_url) {
        metadata.image = link.custom_image_url;
      }
      if (link.custom_description) {
        metadata.description = link.custom_description;
      }
      if (link.title) {
        metadata.title = link.title;
      }

      // Override with custom_preview_json if available
      let customPreview: any = null;
      if (link.custom_preview_json) {
        try {
          customPreview = JSON.parse(link.custom_preview_json);
        } catch (_) {}
      }

      if (customPreview) {
        if (customPreview.title) metadata.title = customPreview.title;
        if (customPreview.description) metadata.description = customPreview.description;
        if (customPreview.imageUrl) metadata.image = customPreview.imageUrl;
        else if (customPreview.bannerUrl) metadata.image = customPreview.bannerUrl;
        else if (customPreview.thumbnailUrl) metadata.image = customPreview.thumbnailUrl;
      }

      if (metadata.image) {
        try {
          const imageRes = await axios.get(metadata.image, { responseType: 'arraybuffer', timeout: 3500 });
          const compressed = await sharp(Buffer.from(imageRes.data))
            .resize(1200, 630, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();

          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
          res.send(compressed);
          return;
        } catch (err) {
          // Fallback if loading or processing external image fails
        }
      }

      // Generate a stunning tech SVG and render as PNG via sharp
      const fallbackPng = await generateFallbackImage(metadata.title, metadata.domain || new URL(link.original_url).hostname, code);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(fallbackPng);
    } catch (error) {
      console.error('Preview image generation error:', error);
      res.status(500).send('Server Error');
    }
  });

  // Helper: record visit cleanly
  async function handleRecordVisit(req: express.Request, link: any) {
    const userAgent = req.headers['user-agent'] || '';
    if (!isBot(userAgent)) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
      const ipHash = getIpHash(ip);
      const geo = await getIpGeo(ip);
      const uaParsed = parseUserAgent(userAgent);
      const referrer = parseReferrer(req.headers['referer'] || req.headers['referrer'] as string || '');

      recordVisit(link.id, {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        latitude: geo.lat,
        longitude: geo.lon,
        browser: uaParsed.browser,
        device: uaParsed.device,
        referrer,
        ip_hash: ipHash
      }).catch(err => console.error('Failed to log visit asynchronously:', err));
    }
  }

  // --- Dynamic Redirection Handling at Root ---

  function isSocialCrawler(userAgent: string): boolean {
    if (!userAgent) return false;
    const crawlerKeywords = [
      'facebookexternalhit',
      'twitterbot',
      'discordbot',
      'telegrambot',
      'whatsapp',
      'linkedinbot',
      'slackbot',
      'pinterest',
      'googlebot',
      'bingbot',
      'embedly'
    ];
    const ua = userAgent.toLowerCase();
    return crawlerKeywords.some(keyword => ua.includes(keyword));
  }

  // Handle password submission form (Express urlencoded parsed)
  app.post('/:code', express.urlencoded({ extended: true }), async (req, res, next) => {
    const { code } = req.params;
    const { password } = req.body;

    try {
      const link = await getLinkByCode(code);
      if (!link) {
        next();
        return;
      }

      // Check if link is disabled/deactivated
      if (link.is_active === 0) {
        res.status(403).send(renderDisabledPage(code));
        return;
      }

      // Check Expiration
      if (link.expires_at) {
        const expiry = new Date(link.expires_at);
        if (expiry.getTime() < Date.now()) {
          res.status(410).send(renderExpiredPage(code, link.expires_at));
          return;
        }
      }

      // Check Password
      if (link.password && link.password !== password) {
        res.send(renderLockScreen(code, true));
        return;
      }

      // Valid: Record visit and redirect immediately
      await handleRecordVisit(req, link);
      res.redirect(link.original_url);
    } catch (error) {
      console.error('Password redirect page error:', error);
      next();
    }
  });

  app.get('/:code', async (req, res, next) => {
    const { code } = req.params;

    // Skip static assets, reserved words, or file-like requests
    if (
      code.includes('.') || 
      ['api', 'assets', 'src', 'index.html', 'favicon.ico', 'vite', 'data.db'].includes(code.toLowerCase())
    ) {
      next();
      return;
    }

    try {
      const link = await getLinkByCode(code);
      if (link) {
        const userAgent = req.headers['user-agent'] || '';
        
        // Check if link is disabled/deactivated
        if (link.is_active === 0) {
          res.status(403).send(renderDisabledPage(code));
          return;
        }

        // 1. Crawler support: Serve raw Open Graph / Twitter tags immediately for social rich previews
        if (isSocialCrawler(userAgent)) {
          const metadata: DestinationMetadata = await getCachedLinkMetadata(link.original_url).catch(() => ({
            title: link.title || '',
            description: link.custom_description || '',
            image: link.custom_image_url || '',
            favicon: '',
            url: link.original_url,
            domain: new URL(link.original_url).hostname,
            platform: { name: 'generic', icon: 'link', color: 'bg-cyan-500/10', badgeColor: 'border-cyan-500/30' }
          }));

          if (link.custom_image_url) {
            metadata.image = link.custom_image_url;
          }
          if (link.custom_description) {
            metadata.description = link.custom_description;
          }
          if (link.title) {
            metadata.title = link.title;
          }

          // Parse custom_preview_json if available
          let customPreview: any = null;
          if (link.custom_preview_json) {
            try {
              customPreview = JSON.parse(link.custom_preview_json);
            } catch (_) {}
          }

          if (customPreview) {
            if (customPreview.title) metadata.title = customPreview.title;
            if (customPreview.description) metadata.description = customPreview.description;
            if (customPreview.imageUrl) metadata.image = customPreview.imageUrl;
            else if (customPreview.bannerUrl) metadata.image = customPreview.bannerUrl;
            else if (customPreview.thumbnailUrl) metadata.image = customPreview.thumbnailUrl;
          }

          const host = req.headers.host || 'localhost:3000';
          const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          const shortUrl = `${protocol}://${host}/${code}`;
          const imageUrl = metadata.image || `${protocol}://${host}/api/images/preview/${code}.png`;
          
          res.send(renderSocialPreviewPage(link, metadata, shortUrl, imageUrl));
          return;
        }

        // Check Expiration first
        if (link.expires_at) {
          const expiry = new Date(link.expires_at);
          if (expiry.getTime() < Date.now()) {
            res.status(410).send(renderExpiredPage(code, link.expires_at));
            return;
          }
        }

        // Check Password protection
        if (link.password && link.password.trim() !== '') {
          // Serve beautiful security lock screen page
          res.send(renderLockScreen(code, false));
          return;
        }

        // Record visit asynchronously (non-blocking for redirect speed)
        await handleRecordVisit(req, link);

        // Perform redirect immediately
        res.redirect(link.original_url);
        return;
      }
    } catch (error) {
      console.error(`Redirection error for /${code}:`, error);
    }

    // If no matching code, let Vite SPA routing take over
    next();
  });


  // --- Vite Dev Server Middleware Integration / Static Server ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
