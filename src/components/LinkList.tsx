import React, { useState } from 'react';
import { 
  Search, Link2, ExternalLink, BarChart3, Copy, Check, QrCode, Trash2, 
  Calendar, AlertCircle, Lock, Sparkles, Filter, Edit3, ShieldAlert,
  Power, PowerOff, Hash, FolderOpen, AlertTriangle, Eye, FileText, Image, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from '../types';

interface LinkListProps {
  links: Link[];
  onSelectLink: (link: Link) => void;
  onLinkDeleted: (id: number) => void;
  onLinkUpdated: (updatedLink: Link) => void;
  onDebugLink?: (link: Link) => void;
  selectedLinkId?: number;
  isAdmin: boolean;
}

export default function LinkList({ 
  links, 
  onSelectLink, 
  onLinkDeleted, 
  onLinkUpdated,
  onDebugLink,
  selectedLinkId,
  isAdmin
}: LinkListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showQrId, setShowQrId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Edit Panel State
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editClicksLimit, setEditClicksLimit] = useState('');
  const [editOneTimeUse, setEditOneTimeUse] = useState(false);
  const [editEnablePreview, setEditEnablePreview] = useState(true);
  const [editCustomDescription, setEditCustomDescription] = useState('');
  const [editCustomImageUrl, setEditCustomImageUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Extract unique categories and tags for filter panels
  const categories = Array.from(new Set(links.map(l => l.category).filter(Boolean))) as string[];
  const tagsSet = new Set<string>();
  links.forEach(l => {
    if (l.tags) {
      l.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagsSet.add(t));
    }
  });
  const tags = Array.from(tagsSet);

  const getShortUrl = (code: string) => {
    return `${window.location.origin}/${code}`;
  };

  const handleCopy = (id: number, code: string) => {
    const fullUrl = getShortUrl(code);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link: Link) => {
    if (!isAdmin) return;
    const newStatus = link.is_active === 0 ? 1 : 0;
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      if (response.ok) {
        const updated = await response.json();
        onLinkUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to toggle active state:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 4000); // auto-reset
      return;
    }

    try {
      const response = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onLinkDeleted(id);
      }
    } catch (err) {
      console.error('Error deleting link:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditPanel = (link: Link) => {
    if (!isAdmin) return;
    setEditingLink(link);
    setEditUrl(link.original_url);
    setEditCategory(link.category || '');
    setEditTags(link.tags || '');
    setEditPassword(link.password || '');
    setEditExpiresAt(link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '');
    setEditClicksLimit(link.clicks_limit ? String(link.clicks_limit) : '');
    setEditOneTimeUse(link.one_time_use === 1);
    setEditEnablePreview(link.enable_preview !== 0);
    setEditCustomDescription(link.custom_description || '');
    setEditCustomImageUrl(link.custom_image_url || '');
    setEditError(null);
  };

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setUpdating(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editUrl,
          category: editCategory.trim() || null,
          tags: editTags.trim() || null,
          password: editPassword.trim() || null,
          expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
          clicks_limit: editClicksLimit ? parseInt(editClicksLimit, 10) : null,
          one_time_use: editOneTimeUse ? 1 : 0,
          enable_preview: editEnablePreview ? 1 : 0,
          custom_description: editCustomDescription.trim() || null,
          custom_image_url: editCustomImageUrl.trim() || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply configuration override');
      }

      // Merge updated fields back into the link on client side
      const mergedLink: Link = {
        ...editingLink,
        original_url: editUrl,
        category: editCategory.trim() || 'Uncategorized',
        tags: editTags.trim() || null,
        password: editPassword.trim() || null,
        expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        clicks_limit: editClicksLimit ? parseInt(editClicksLimit, 10) : null,
        one_time_use: editOneTimeUse ? 1 : 0,
        enable_preview: editEnablePreview ? 1 : 0,
        custom_description: editCustomDescription.trim() || null,
        custom_image_url: editCustomImageUrl.trim() || null
      };

      onLinkUpdated(mergedLink);
      setEditingLink(null);
    } catch (err: any) {
      setEditError(err.message || 'Error saving link variables');
    } finally {
      setUpdating(false);
    }
  };

  const filteredLinks = links.filter((link) => {
    // Search filter
    const query = search.toLowerCase();
    const matchesSearch = 
      link.short_code.toLowerCase().includes(query) ||
      link.original_url.toLowerCase().includes(query) ||
      (link.title && link.title.toLowerCase().includes(query)) ||
      (link.category && link.category.toLowerCase().includes(query)) ||
      (link.tags && link.tags.toLowerCase().includes(query));

    // Category filter
    const matchesCategory = selectedCategory === 'ALL' || link.category === selectedCategory;

    // Tag filter
    const matchesTag = selectedTag === 'ALL' || (link.tags && link.tags.split(',').map(t => t.trim()).includes(selectedTag));

    return matchesSearch && matchesCategory && matchesTag;
  });

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="links-directory-panel-hub">
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-display font-semibold text-slate-100 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-cyan-400" />
            Link Registry Directory ({links.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active indexed shortcodes, categorical taxonomies, and permission guards.
          </p>
        </div>

        {/* Search */}
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search slugs, urls, categories, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input text-xs text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-500 font-mono"
          />
        </div>
      </div>

      {/* Interactive Cyber Filter Rails */}
      {(categories.length > 0 || tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/20 border border-white/5 p-3 rounded-xl mb-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="h-3 w-3 text-cyan-400" />
            <span>Node Sort:</span>
          </div>

          {/* Categories select */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-[11px] text-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL">ALL CORES</option>
                {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
          )}

          {/* Tags select */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">Tag:</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-[11px] text-indigo-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL">ALL TAGS</option>
                {tags.map(t => <option key={t} value={t}>#{t}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Directory items stream */}
      {filteredLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 border border-dashed border-white/5 rounded-xl">
          <AlertCircle className="h-8 w-8 text-slate-600 animate-pulse" />
          <span className="text-xs text-slate-400 font-sans">No shortcodes found matching filters.</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredLinks.map((link) => {
            const isSelected = selectedLinkId === link.id;
            const shortUrl = getShortUrl(link.short_code);
            const isSuspended = link.is_active === 0;
            const isExpired = link.expires_at ? new Date(link.expires_at).getTime() < Date.now() : false;

            return (
              <div
                key={link.id}
                className={`p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-500/5 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                    : isSuspended 
                      ? 'bg-slate-950/80 border-rose-500/10 opacity-70'
                      : 'bg-slate-900/40 border-white/5 hover:border-cyan-500/10'
                }`}
              >
                {isSuspended && (
                  <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-400 border-l border-b border-rose-500/10 px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest">
                    SUSPENDED
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Link details card */}
                  <div className="space-y-1.5 grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-xs font-bold select-all truncate ${isSuspended ? 'text-rose-400 line-through' : 'text-cyan-400'}`}>
                        /{link.short_code}
                      </span>
                      {link.category && (
                        <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded uppercase">
                          {link.category}
                        </span>
                      )}
                      {link.title && (
                        <span className="text-[11px] text-slate-300 font-sans font-medium truncate max-w-[150px] md:max-w-[250px]">
                          {link.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono truncate">
                      <span className="shrink-0">DEST_IP:</span>
                      <a
                        href={link.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline text-slate-400 flex items-center gap-1 font-sans"
                      >
                        {link.original_url}
                        <ExternalLink className="h-2.5 w-2.5 inline shrink-0 text-cyan-500" />
                      </a>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 font-sans text-[10px]">
                      
                      {link.tags && link.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 px-1.5 py-0.2 rounded font-mono">
                          #{t}
                        </span>
                      ))}

                      {link.one_time_use === 1 && (
                        <span className="bg-amber-500/15 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono" title="One-time-use link">
                          ONCE
                        </span>
                      )}

                      {link.clicks_limit && (
                        <span className="bg-pink-500/15 text-pink-300 border border-pink-500/20 px-1.5 py-0.2 rounded font-mono" title={`Clicks Limit: ${link.clicks_limit}`}>
                          LIMIT: {link.clicks_count}/{link.clicks_limit}
                        </span>
                      )}

                      {link.password && (
                        <div className="flex items-center gap-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/15 px-1.5 py-0.2 rounded font-mono" title="Access passphrase protected">
                          <Lock className="h-2.5 w-2.5 text-cyan-400" />
                          <span>SECURE</span>
                        </div>
                      )}

                      {link.expires_at && (
                        <div 
                          className={`flex items-center gap-1 px-1.5 py-0.2 rounded border font-mono ${
                            isExpired 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/10 animate-pulse' 
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/10'
                          }`}
                        >
                          <Calendar className={`h-2.5 w-2.5 ${isExpired ? 'text-rose-400' : 'text-amber-400'}`} />
                          <span>
                            {isExpired ? 'EXPIRED' : `EXP: ${new Date(link.expires_at).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}

                      <div className="bg-white/5 border border-white/5 px-1.5 py-0.2 rounded font-mono text-slate-400">
                        {link.enable_preview !== 0 ? 'PREVIEW: ON' : 'PREVIEW: OFF'}
                      </div>

                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-start md:items-end pr-2 border-r border-white/5 mr-1 font-mono">
                      <span className="text-[9px] text-slate-500 leading-none">CLICKS</span>
                      <span className="text-sm font-bold text-cyan-400 mt-1 leading-none">{link.clicks_count}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Select Analytics */}
                      <button
                        onClick={() => onSelectLink(link)}
                        className={`p-2 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100'
                        }`}
                        title="View HUD Analytics"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(link.id, link.short_code)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                        title="Copy short link"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* QR Toggle */}
                      <button
                        onClick={() => setShowQrId(showQrId === link.id ? null : link.id)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          showQrId === link.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100'
                        }`}
                        title="Toggle QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>

                      {/* EDIT (Gated by admin role) */}
                      {isAdmin && (
                        <>
                          {onDebugLink && (
                            <button
                              onClick={() => onDebugLink(link)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                              title="Inspect in Metadata Diagnostic HUD"
                            >
                              <Compass className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => openEditPanel(link)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Edit shortcode variables"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {/* Toggle active state */}
                          <button
                            onClick={() => handleToggleActive(link)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                              isSuspended
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={isSuspended ? "Enable shortcode" : "Disable shortcode"}
                          >
                            {isSuspended ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      )}

                      {/* Delete (Always available to everyone to delete previously shortened links) */}
                      <button
                        onClick={() => handleDelete(link.id)}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${
                          deletingId === link.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400'
                        }`}
                        title={deletingId === link.id ? 'Click again to confirm terminal deletion' : 'Delete short link'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR drawer */}
                {showQrId === link.id && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/5 rounded-lg mt-3 space-y-2">
                    <img
                      src={`/api/links/${link.short_code}/qr`}
                      alt="QR Code"
                      className="w-24 h-24 rounded bg-white p-1"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[9px] text-slate-500 text-center font-sans">
                      Right-click or hold to save QR code vector asset for /{link.short_code}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Holographic Edit Panel Overlays */}
      <AnimatePresence>
        {editingLink && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLink(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Slideout Editor */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md bg-slate-950 border-l border-cyan-500/20 p-6 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                    <Edit3 className="h-4.5 w-4.5 text-cyan-400" />
                    Overriding Shortcode: /{editingLink.short_code}
                  </h3>
                  <button
                    onClick={() => setEditingLink(null)}
                    className="text-slate-400 hover:text-slate-200 font-sans text-xs"
                  >
                    CLOSE [X]
                  </button>
                </div>

                <form onSubmit={handleUpdateLink} className="space-y-4">
                  {/* Destination URL */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Destination URL</label>
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      required
                      className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Category & Tags row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Category Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. youtube, spotify"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Tags (comma split)</label>
                      <input
                        type="text"
                        placeholder="e.g. promo, share"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Passcode Protection */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Access Passphrase</label>
                    <input
                      type="text"
                      placeholder="Enter protection passphrase"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  {/* Expiration date */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Expiration date & Time</label>
                    <input
                      type="datetime-local"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                      className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none font-sans cursor-pointer scheme-dark"
                    />
                  </div>

                  {/* Click Limits */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Max click limit index</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={editClicksLimit}
                      onChange={(e) => setEditClicksLimit(e.target.value)}
                      className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                    <span className="text-slate-300">ONE-TIME-USE ONLY:</span>
                    <button
                      type="button"
                      onClick={() => setEditOneTimeUse(!editOneTimeUse)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editOneTimeUse ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        editOneTimeUse ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs font-mono">
                    <span className="text-slate-300">RICH SOCIAL PREVIEW:</span>
                    <button
                      type="button"
                      onClick={() => setEditEnablePreview(!editEnablePreview)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editEnablePreview ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        editEnablePreview ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Custom Preview Fields */}
                  {editEnablePreview && (
                    <div className="space-y-4 pt-3 border-t border-white/5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                          <Image className="h-3.5 w-3.5 text-cyan-400" />
                          CUSTOM PREVIEW PIC URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/image.png"
                          value={editCustomImageUrl}
                          onChange={(e) => setEditCustomImageUrl(e.target.value)}
                          className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-600"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                          <FileText className="h-3.5 w-3.5 text-cyan-400" />
                          CUSTOM PREVIEW DESCRIPTION
                        </label>
                        <textarea
                          placeholder="Write a custom description"
                          value={editCustomDescription}
                          onChange={(e) => setEditCustomDescription(e.target.value)}
                          rows={2}
                          className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none resize-none placeholder:text-slate-600 font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {editError && (
                    <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg overflow-hidden font-sans">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors shadow-lg cursor-pointer"
                  >
                    {updating ? 'Applying override overrides...' : 'Save Configuration Override'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
