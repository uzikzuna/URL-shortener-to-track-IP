import React, { useState, useRef } from 'react';
import { 
  Link2, Sparkles, AlertCircle, Copy, Check, QrCode, ArrowRight, 
  RefreshCw, Layers, Calendar, Lock, ChevronDown, ChevronUp, FileText, 
  UploadCloud, Hash, FolderOpen, ToggleLeft, Image, Palette, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, CustomPreview } from '../types';
import PreviewCardTemplates from './PreviewCardTemplates';

interface LinkCreatorProps {
  onLinkCreated: (newLink: Link) => void;
  onBulkLinksCreated: (newLinks: Link[]) => void;
}

export default function LinkCreator({ onLinkCreated, onBulkLinksCreated }: LinkCreatorProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single Link States
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [clicksLimit, setClicksLimit] = useState('');
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [enablePreview, setEnablePreview] = useState(true);
  
  // Advanced Custom Preview states
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewDescription, setPreviewDescription] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewBannerUrl, setPreviewBannerUrl] = useState('');
  const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState('');
  const [previewSiteName, setPreviewSiteName] = useState('');
  const [previewPlatformBadge, setPreviewPlatformBadge] = useState('none');
  const [previewLogoUrl, setPreviewLogoUrl] = useState('');
  const [previewWatermark, setPreviewWatermark] = useState('');
  const [previewBgImageUrl, setPreviewBgImageUrl] = useState('');
  const [previewThemeColor, setPreviewThemeColor] = useState('#06b6d4');
  
  // Preview Card States
  const [templateId, setTemplateId] = useState<'modern' | 'hud' | 'cyberpunk' | 'glassmorphism' | 'minimal'>('modern');
  const [platformId, setPlatformId] = useState<'messenger' | 'facebook' | 'discord' | 'telegram' | 'whatsapp' | 'linkedin' | 'x' | 'reddit'>('discord');

  const [customDescription, setCustomDescription] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<Link | null>(null);
  
  // Bulk Link States
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<number | null>(null);
  const [bulkCreatedCodes, setBulkCreatedCodes] = useState<string[]>([]);
  
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive absolute shortened URL
  const getShortUrl = (code: string) => {
    return `${window.location.origin}/${code}`;
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessLink(null);
    setCopied(false);
    setShowQr(false);

    if (!url.trim()) {
      setError('Please enter a destination URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          customCode: customCode.trim() || null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          password: password.trim() || null,
          enablePreview: enablePreview ? 1 : 0,
          category: category.trim() || null,
          tags: tags.trim() || null,
          clicks_limit: clicksLimit ? parseInt(clicksLimit, 10) : null,
          one_time_use: oneTimeUse ? 1 : 0,
          custom_description: previewDescription.trim() || customDescription.trim() || null,
          custom_image_url: previewImageUrl.trim() || previewBannerUrl.trim() || previewThumbnailUrl.trim() || customImageUrl.trim() || null,
          custom_preview_json: JSON.stringify({
            title: previewTitle.trim() || null,
            description: previewDescription.trim() || null,
            imageUrl: previewImageUrl.trim() || null,
            bannerUrl: previewBannerUrl.trim() || null,
            thumbnailUrl: previewThumbnailUrl.trim() || null,
            siteName: previewSiteName.trim() || null,
            platformBadge: previewPlatformBadge !== 'none' ? previewPlatformBadge : null,
            logoUrl: previewLogoUrl.trim() || null,
            watermark: previewWatermark.trim() || null,
            bgImageUrl: previewBgImageUrl.trim() || null,
            themeColor: previewThemeColor || '#06b6d4',
            templateId
          })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setSuccessLink(data);
      onLinkCreated(data);
      
      // Reset single fields
      setUrl('');
      setCustomCode('');
      setExpiresAt('');
      setPassword('');
      setCategory('');
      setTags('');
      setClicksLimit('');
      setOneTimeUse(false);
      setEnablePreview(true);
      setCustomDescription('');
      setCustomImageUrl('');
      setPreviewTitle('');
      setPreviewDescription('');
      setPreviewImageUrl('');
      setPreviewBannerUrl('');
      setPreviewThumbnailUrl('');
      setPreviewSiteName('');
      setPreviewPlatformBadge('none');
      setPreviewLogoUrl('');
      setPreviewWatermark('');
      setPreviewBgImageUrl('');
      setPreviewThemeColor('#06b6d4');
      setTemplateId('modern');
      setShowAdvanced(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setBulkSuccess(null);
    setBulkCreatedCodes([]);
    
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setBulkError('Please enter at least one target link in bulk registry');
      return;
    }

    setBulkLoading(true);

    // Parse links and optional custom codes
    const linkPairs = lines.map(line => {
      // Split on comma, space, or tab
      const parts = line.split(/[,\s\t]+/);
      const urlPart = parts[0];
      const customPart = parts[1] || null;
      return { url: urlPart, customCode: customPart };
    });

    try {
      const response = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: linkPairs,
          category: bulkCategory.trim() || null,
          tags: bulkTags.trim() || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process bulk campaign index');
      }

      setBulkSuccess(data.createdCount);
      onBulkLinksCreated(data.links);
      setBulkCreatedCodes(data.links.map((l: Link) => l.short_code));
      setBulkText('');
      setBulkCategory('');
      setBulkTags('');
    } catch (err: any) {
      setBulkError(err.message || 'Bulk aggregation failure');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      // Skip header row if present
      if (lines.length > 0 && (lines[0].toLowerCase().includes('url') || lines[0].toLowerCase().includes('http'))) {
        // Simple heuristic check if first line is headers
        if (lines[0].toLowerCase().includes('url') && !lines[0].startsWith('http')) {
          lines.shift();
        }
      }
      setBulkText(lines.join('\n'));
    };
    reader.readAsText(file);
  };

  const handleCopySingle = () => {
    if (!successLink) return;
    const fullUrl = getShortUrl(successLink.short_code);
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="link-creator-panel">
      {/* Laser line scan effect */}
      <div className="hud-laser-line" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-5 text-xs font-mono">
        <button
          onClick={() => setActiveTab('single')}
          className={`pb-2.5 px-4 font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === 'single' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Single Core Shortener
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`pb-2.5 px-4 font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === 'bulk' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Bulk telemetry Registry
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'single' ? (
          <motion.form 
            key="single"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onSubmit={handleSingleSubmit} 
            className="space-y-4"
          >
            {/* Destination URL */}
            <div className="space-y-1.5">
              <label htmlFor="destination-url" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                DESTINATION URL [TARGET]
              </label>
              <input
                id="destination-url"
                type="text"
                required
                placeholder="https://example.com/long/campaign/details"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="w-full glass-input text-sm text-slate-200 px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-600 font-sans stark-border-glow-blue"
              />
            </div>

            {/* Slug / Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="custom-code" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  CUSTOM NODE CODE [SLUG]
                </label>
                <span className="text-[10px] text-slate-500 font-mono">3-15 chars, a-z, 0-9</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xs text-slate-500 font-mono select-none">
                  {window.location.host}/
                </span>
                <input
                  id="custom-code"
                  type="text"
                  placeholder="my-campaign"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  disabled={loading}
                  style={{ paddingLeft: `${(window.location.host.length + 2) * 7.5}px` }}
                  className="w-full glass-input text-xs text-slate-200 py-3 pr-4 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* Category and Tags inline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
                  CATEGORY [SLUG]
                </label>
                <input
                  type="text"
                  placeholder="e.g. youtube, twitch"
                  value={category}
                  onChange={(e) => setCategory(e.target.value.toLowerCase().trim())}
                  disabled={loading}
                  className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Hash className="h-3.5 w-3.5 text-cyan-400" />
                  TAGS [COMMA DIVIDED]
                </label>
                <input
                  type="text"
                  placeholder="e.g. social, bio"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={loading}
                  className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* Advanced Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer focus:outline-none font-mono uppercase tracking-wide"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide Expiry & Security Overrides
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Configure Expiry & Security Overrides
                  </>
                )}
              </button>
            </div>

            {/* Advanced Overlay inputs */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden border-t border-white/5 pt-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expiry */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                        EXPIRATION KEY [UTC]
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        disabled={loading}
                        className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none cursor-pointer scheme-dark"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                        <Lock className="h-3.5 w-3.5 text-cyan-400" />
                        SECURITY PHRASE KEY
                      </label>
                      <input
                        type="password"
                        placeholder="Encrypted passcode"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Click Limit */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                        <Layers className="h-3.5 w-3.5 text-cyan-400" />
                        CLICKS THRESHOLD INDEX
                      </label>
                      <input
                        type="number"
                        placeholder="Max clicks (e.g. 100)"
                        value={clicksLimit}
                        onChange={(e) => setClicksLimit(e.target.value)}
                        disabled={loading}
                        className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none font-mono"
                      />
                    </div>

                    {/* One Time Use Toggle */}
                    <div className="space-y-1.5 flex flex-col justify-end pb-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-xl px-3 py-2">
                        <span className="text-slate-300 text-[10px]">ONE-TIME REDIRECT</span>
                        <button
                          type="button"
                          onClick={() => setOneTimeUse(!oneTimeUse)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            oneTimeUse ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                            oneTimeUse ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Social Preview Scraper */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        SOCIAL META SCRAPER
                      </label>
                      <button
                        type="button"
                        onClick={() => setEnablePreview(!enablePreview)}
                        disabled={loading}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          enablePreview ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                          enablePreview ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      Automatically queries OpenGraph tags for rich embedded tiles on Facebook, Messenger, Discord, Telegram, WhatsApp, X/Twitter, and LinkedIn prior to redirect routing.
                    </p>
                  </div>

                  {/* Custom Preview System & Live Builder */}
                  {enablePreview && (
                    <div className="space-y-5 pt-4 border-t border-white/5" id="smart-preview-builder">
                      
                      <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold border-b border-white/5 pb-2">
                        <Palette className="h-4 w-4" />
                        SMART PREVIEW CARD BUILDER
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Left column: Builder Controls */}
                        <div className="space-y-4 text-xs">
                          {/* Title & Description */}
                          <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Text Customizations</span>
                            
                            <div className="space-y-1.5">
                              <label className="text-slate-300 font-semibold font-mono">PREVIEW TITLE</label>
                              <input
                                type="text"
                                placeholder="e.g. Secret Cyberpunk Console Gateway [A-4]"
                                value={previewTitle}
                                onChange={(e) => setPreviewTitle(e.target.value)}
                                className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-slate-300 font-semibold font-mono">PREVIEW DESCRIPTION</label>
                              <textarea
                                placeholder="e.g. Verified instant delivery node active. Telemetry stream locked."
                                value={previewDescription}
                                onChange={(e) => setPreviewDescription(e.target.value)}
                                rows={2}
                                className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none resize-none placeholder:text-slate-700"
                              />
                            </div>
                          </div>

                          {/* Image Overrides */}
                          <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Image Assets</span>
                            
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-slate-300 font-semibold font-mono">PREVIEW IMAGE URL</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Try to set dynamic sample/placeholder or fetch if available
                                    if (url) {
                                      try {
                                        const domain = new URL(url).hostname;
                                        setPreviewImageUrl(`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80`);
                                        setPreviewSiteName(domain.toUpperCase());
                                      } catch(_) {}
                                    }
                                  }}
                                  className="text-[9px] text-cyan-400 hover:underline font-mono"
                                >
                                  USE SAMPLE ASSET
                                </button>
                              </div>
                              <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={previewImageUrl}
                                onChange={(e) => setPreviewImageUrl(e.target.value)}
                                className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-slate-400 text-[10px] font-mono">BANNER IMAGE URL</label>
                                <input
                                  type="url"
                                  placeholder="Banner URL"
                                  value={previewBannerUrl}
                                  onChange={(e) => setPreviewBannerUrl(e.target.value)}
                                  className="w-full glass-input px-2 py-1.5 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-400 text-[10px] font-mono">THUMBNAIL IMAGE URL</label>
                                <input
                                  type="url"
                                  placeholder="Thumbnail URL"
                                  value={previewThumbnailUrl}
                                  onChange={(e) => setPreviewThumbnailUrl(e.target.value)}
                                  className="w-full glass-input px-2 py-1.5 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Branding & Themes */}
                          <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Metadata Branding</span>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-slate-300 font-semibold font-mono">SITE NAME</label>
                                <input
                                  type="text"
                                  placeholder="e.g. UZK OS CLOUD"
                                  value={previewSiteName}
                                  onChange={(e) => setPreviewSiteName(e.target.value)}
                                  className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-slate-300 font-semibold font-mono">WATERMARK</label>
                                <input
                                  type="text"
                                  placeholder="e.g. INSTANT VERIFIED"
                                  value={previewWatermark}
                                  onChange={(e) => setPreviewWatermark(e.target.value)}
                                  className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-slate-300 font-semibold font-mono">PLATFORM BADGE</label>
                                <select
                                  value={previewPlatformBadge}
                                  onChange={(e) => setPreviewPlatformBadge(e.target.value)}
                                  className="w-full glass-input px-2 py-2 rounded-lg text-slate-300 focus:outline-none select-dark"
                                >
                                  <option value="none">🌐 Standard Web</option>
                                  <option value="youtube">🔴 YouTube Video</option>
                                  <option value="tiktok">⚫ TikTok Post</option>
                                  <option value="facebook">🔵 Facebook link</option>
                                  <option value="discord">🟣 Discord channel</option>
                                  <option value="telegram">✈️ Telegram group</option>
                                  <option value="whatsapp">🟢 WhatsApp group</option>
                                  <option value="linkedin">💼 LinkedIn job</option>
                                  <option value="x">🐦 X / Twitter thread</option>
                                  <option value="reddit">🧡 Reddit post</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-slate-300 font-semibold font-mono">THEME ACCENT</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={previewThemeColor}
                                    onChange={(e) => setPreviewThemeColor(e.target.value)}
                                    className="w-8 h-8 rounded bg-transparent border-none cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={previewThemeColor}
                                    onChange={(e) => setPreviewThemeColor(e.target.value)}
                                    className="w-full glass-input px-2 py-2 rounded-lg text-slate-200 uppercase focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-slate-300 font-semibold font-mono">SITE AVATAR URL</label>
                                <input
                                  type="url"
                                  placeholder="Small icon logo URL"
                                  value={previewLogoUrl}
                                  onChange={(e) => setPreviewLogoUrl(e.target.value)}
                                  className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-slate-300 font-semibold font-mono">CARD BG OVERLAY</label>
                                <input
                                  type="url"
                                  placeholder="Optional background texture"
                                  value={previewBgImageUrl}
                                  onChange={(e) => setPreviewBgImageUrl(e.target.value)}
                                  className="w-full glass-input px-3 py-2 rounded-lg text-slate-200 focus:outline-none placeholder:text-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Interactive Live Canvas */}
                        <div className="space-y-4">
                          
                          {/* Live Config Selectors */}
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-3">
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                              <Eye className="h-3.5 w-3.5" />
                              PREVIEW STAGE SELECTORS
                            </span>
                            
                            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                              <div className="space-y-1">
                                <label className="text-slate-400">CHOOSE CARD TEMPLATE</label>
                                <select
                                  value={templateId}
                                  onChange={(e: any) => setTemplateId(e.target.value)}
                                  className="w-full glass-input px-2 py-1.5 rounded-lg text-slate-300 select-dark"
                                >
                                  <option value="modern">Template 1: Clean Modern</option>
                                  <option value="hud">Template 2: JARVIS HUD</option>
                                  <option value="cyberpunk">Template 3: Cyberpunk</option>
                                  <option value="glassmorphism">Template 4: Glassmorphism</option>
                                  <option value="minimal">Template 5: Minimal</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-slate-400">CHOOSE SOCIAL PLATFORM ENVELOPE</label>
                                <select
                                  value={platformId}
                                  onChange={(e: any) => setPlatformId(e.target.value)}
                                  className="w-full glass-input px-2 py-1.5 rounded-lg text-slate-300 select-dark"
                                >
                                  <option value="discord">🟣 Discord Envelope</option>
                                  <option value="x">🐦 X / Twitter Envelope</option>
                                  <option value="telegram">✈️ Telegram Envelope</option>
                                  <option value="whatsapp">🟢 WhatsApp Envelope</option>
                                  <option value="messenger">🔵 Messenger Envelope</option>
                                  <option value="facebook">🔵 Facebook Envelope</option>
                                  <option value="linkedin">💼 LinkedIn Envelope</option>
                                  <option value="reddit">🧡 Reddit Envelope</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Display the selected template using our PreviewCardTemplates */}
                          <div className="bg-slate-950/20 border border-white/5 p-4 rounded-2xl relative overflow-hidden min-h-[250px] flex items-center justify-center">
                            <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                              Operator Sandbox HUD
                            </div>

                            <div className="w-full max-w-sm">
                              <PreviewCardTemplates
                                preview={{
                                  title: previewTitle,
                                  description: previewDescription,
                                  imageUrl: previewImageUrl,
                                  bannerUrl: previewBannerUrl,
                                  thumbnailUrl: previewThumbnailUrl,
                                  siteName: previewSiteName,
                                  platformBadge: previewPlatformBadge,
                                  logoUrl: previewLogoUrl,
                                  watermark: previewWatermark,
                                  bgImageUrl: previewBgImageUrl,
                                  themeColor: previewThemeColor,
                                  templateId
                                }}
                                templateId={templateId}
                                platformId={platformId}
                                destinationUrl={url || 'https://example.com'}
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error notifications */}
            {error && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl overflow-hidden font-sans">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Shortcode Node...
                </>
              ) : (
                <>
                  Generate Branded Shortcode
                  <ArrowRight className="h-4 w-4 text-slate-950" />
                </>
              )}
            </button>

            {/* Success Single link display panel */}
            <AnimatePresence>
              {successLink && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.98, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/5 space-y-3 overflow-hidden font-mono text-xs"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                        Shortcode Generated
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 p-2 rounded-lg">
                      <span className="text-xs text-cyan-400 font-mono select-all truncate grow pr-2">
                        {getShortUrl(successLink.short_code)}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopySingle}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQr(!showQr)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${showQr ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {showQr && (
                      <div className="flex flex-col items-center justify-center p-3 bg-slate-950 border border-white/5 rounded-lg space-y-2 mt-2">
                        <img
                          src={`/api/links/${successLink.short_code}/qr`}
                          alt="Shortlink QR Code"
                          className="w-28 h-28 rounded-md bg-white p-1"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[9px] text-slate-500 text-center font-sans leading-normal">
                          QR Vector index generated. Direct redirect scan matrix complete.
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        ) : (
          <motion.form 
            key="bulk"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onSubmit={handleBulkSubmit} 
            className="space-y-4"
          >
            {/* CSV uploads handle */}
            <div className="flex items-center justify-between bg-slate-900/30 border border-white/5 rounded-xl p-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <UploadCloud className="h-4 w-4 text-cyan-400" />
                  IMPORT TELEMETRY FILE [CSV]
                </span>
                <p className="text-[10px] text-slate-500 font-sans">
                  Upload CSV format target rows, one mapping entry per row.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 font-mono text-[10px] uppercase font-bold transition-all cursor-pointer"
              >
                Upload CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .txt"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </div>

            {/* Paste Bulk Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  BULK CODES REGISTRY (URL, SLUG)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">One line per URL entry</span>
              </div>
              <textarea
                rows={5}
                placeholder="https://example1.com, custom-slug-1&#10;https://example2.com&#10;https://example3.com, custom-slug-3"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                disabled={bulkLoading}
                className="w-full glass-input text-xs text-slate-200 p-4 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono h-40 leading-relaxed"
              />
            </div>

            {/* Common category & tags metadata for all bulk codes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
                  SHARED CATEGORY [SLUG]
                </label>
                <input
                  type="text"
                  placeholder="e.g. bulk-launch"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value.toLowerCase().trim())}
                  disabled={bulkLoading}
                  className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Hash className="h-3.5 w-3.5 text-cyan-400" />
                  SHARED TAGS [COMMA]
                </label>
                <input
                  type="text"
                  placeholder="e.g. newsletter, auto"
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  disabled={bulkLoading}
                  className="w-full glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* Error notifications */}
            {bulkError && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl overflow-hidden font-sans">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{bulkError}</span>
              </div>
            )}

            {/* Success notification */}
            {bulkSuccess !== null && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-2 font-mono text-xs">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  Bulk registration Successful
                </span>
                <p className="text-[11px] text-slate-300">
                  Bulk shortener registered <span className="text-emerald-400 font-bold">{bulkSuccess}</span> new dynamic shortcode pathways successfully.
                </p>
                <div className="text-[10px] text-slate-500 bg-slate-950/60 p-2.5 rounded border border-white/5 max-h-24 overflow-y-auto">
                  CREATED SLUGS:
                  <ul className="list-disc pl-4 text-slate-400 mt-1">
                    {bulkCreatedCodes.map(code => <li key={code}>/{code}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Bulk Submit */}
            <button
              type="submit"
              disabled={bulkLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {bulkLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing Bulk Registry...
                </>
              ) : (
                <>
                  Register Bulk Campaign Slugs
                  <ArrowRight className="h-4 w-4 text-slate-950" />
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
