import React, { useState, useEffect } from 'react';
import { 
  Globe, RefreshCw, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, Sparkles, Image, FileText, Compass, ExternalLink, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface PreviewDebugPanelProps {
  initialUrl?: string;
  linkId?: number;
  onRefreshSuccess?: () => void;
}

export default function PreviewDebugPanel({ initialUrl = '', linkId, onRefreshSuccess }: PreviewDebugPanelProps) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'og' | 'visual'>('matrix');

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      fetchDebugInfo(initialUrl);
    }
  }, [initialUrl]);

  const fetchDebugInfo = async (testUrl: string) => {
    if (!testUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/metadata/debug?url=${encodeURIComponent(testUrl)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze url metadata');
      }
      setDebugData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during debugging extraction');
      setDebugData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDebugInfo(url);
  };

  const handleForceRefresh = async () => {
    if (!linkId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/links/${linkId}/refresh-metadata`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh metadata');
      }
      if (data.success) {
        // Fetch new debug info
        await fetchDebugInfo(url || data.metadata.url || initialUrl);
        if (onRefreshSuccess) {
          onRefreshSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to force refresh link metadata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="preview-debug-panel" className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Compass className="h-4.5 w-4.5 animate-spin-slow" />
            REAL-TIME METADATA DIAGNOSTIC PANEL
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Analyze Open Graph, verify container image sizes & standard crawler compatibility profiles.
          </p>
        </div>
        
        {linkId && (
          <button
            onClick={handleForceRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 font-mono text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'REGENERATING...' : 'FORCE REFRESH METADATA'}
          </button>
        )}
      </div>

      {/* Input Form for general URL testing */}
      {!linkId && (
        <form onSubmit={handleTestSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste destination URL to inspect (e.g. https://youtube.com/watch?v=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 glass-input text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-600 font-mono"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-mono text-xs font-bold uppercase rounded-xl tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
            ANALYZE
          </button>
        </form>
      )}

      {error && (
        <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl font-mono">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">DIAGNOSTIC ERROR DETECTED:</div>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && !debugData && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3 font-mono text-xs text-slate-400">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          <span>ESTABLISHING REMOTE CONNECTION & EXTRACTING RICH META...</span>
        </div>
      )}

      {debugData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Metadata Preview (4 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl space-y-4 text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block border-b border-white/5 pb-1.5">
                LIVE VISUAL PREVIEW ASSET
              </span>

              {debugData.metadata.image ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/5 bg-slate-900 flex items-center justify-center">
                  <img 
                    src={debugData.metadata.image} 
                    alt="OG Extracted" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/80 border border-white/10 font-mono text-[9px] text-cyan-400 font-bold">
                    {debugData.ogStatus.imageWidth && debugData.ogStatus.imageHeight ? (
                      `${debugData.ogStatus.imageWidth}x${debugData.ogStatus.imageHeight}px`
                    ) : (
                      'LOADED'
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg border border-dashed border-white/10 bg-slate-900/50 flex flex-col items-center justify-center text-center p-4">
                  <Image className="h-8 w-8 text-slate-600 mb-2" />
                  <span className="font-mono text-[10px] text-slate-500">NO DESTINATION OG IMAGE EXTRACTED</span>
                  <span className="font-mono text-[8px] text-cyan-400/50 mt-1 uppercase">Using Server Fallback Generator</span>
                </div>
              )}

              <div className="space-y-2 font-mono">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block">Host Title Block</span>
                  <h4 className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">{debugData.metadata.title}</h4>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block">Host Description Snippet</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{debugData.metadata.description}</p>
                </div>
                <div className="flex items-center gap-3 pt-2 text-[9px] text-slate-500 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-cyan-500" />
                    <span>{debugData.metadata.domain}</span>
                  </div>
                  {debugData.metadata.platform.name !== 'generic' && (
                    <div className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold uppercase text-[8px]">
                      {debugData.metadata.platform.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* OG Status Indicators */}
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl space-y-3 font-mono text-[10px] text-left">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block border-b border-white/5 pb-1.5">
                OPEN GRAPH SPEC STATUS
              </span>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Title Tag Present:</span>
                <span className="flex items-center gap-1 font-bold">
                  {debugData.ogStatus.hasTitle ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">OK</span></>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 text-rose-400" /> <span className="text-rose-400">MISSING</span></>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Description Tag Present:</span>
                <span className="flex items-center gap-1 font-bold">
                  {debugData.ogStatus.hasDescription ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">OK</span></>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 text-rose-400" /> <span className="text-rose-400">MISSING</span></>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Image Tag Present:</span>
                <span className="flex items-center gap-1 font-bold">
                  {debugData.ogStatus.hasImage ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">OK</span></>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 text-rose-400" /> <span className="text-rose-400">MISSING</span></>
                  )}
                </span>
              </div>

              {debugData.metadata.image && (
                <>
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-slate-400">Image Resolution loads:</span>
                    <span className="flex items-center gap-1 font-bold">
                      {debugData.ogStatus.imageLoads ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">YES</span></>
                      ) : (
                        <><XCircle className="h-3.5 w-3.5 text-rose-400" /> <span className="text-rose-400">FAIL</span></>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rich Banner Width &gt; 600px:</span>
                    <span className="flex items-center gap-1 font-bold">
                      {debugData.ogStatus.imageWidth >= 600 ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">YES ({debugData.ogStatus.imageWidth}px)</span></>
                      ) : (
                        <><XCircle className="h-3.5 w-3.5 text-rose-400" /> <span className="text-rose-400">NO ({debugData.ogStatus.imageWidth || 0}px)</span></>
                      )}
                    </span>
                  </div>
                </>
              )}

              {debugData.ogStatus.imageError && (
                <p className="text-[9px] text-amber-400 bg-amber-500/5 p-2 rounded border border-amber-500/10 leading-relaxed">
                  ⚠️ Image Check Alert: {debugData.ogStatus.imageError}
                </p>
              )}
            </div>
          </div>

          {/* Right Detailed Tabs (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex gap-2 bg-slate-950/40 p-1 rounded-xl border border-white/5 font-mono text-[10px]">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex-1 py-2 rounded-lg text-center font-bold tracking-wider cursor-pointer ${
                  activeTab === 'matrix' 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CRAWLER MATRIX
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`flex-1 py-2 rounded-lg text-center font-bold tracking-wider cursor-pointer ${
                  activeTab === 'visual' 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PLATFORM CLONE
              </button>
            </div>

            {activeTab === 'matrix' && (
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 text-left font-mono space-y-4">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 block border-b border-white/5 pb-1.5">
                  SOCIAL CRAWLER ADAPTATION REPORT
                </span>

                <div className="divide-y divide-white/5 space-y-3">
                  {debugData.crawlerStatus.map((crawler: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 first:pt-0">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-100">{crawler.name}</span>
                        <p className="text-[9px] text-slate-500">{crawler.details}</p>
                      </div>
                      
                      <div className={`self-start sm:self-auto px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                        crawler.ok 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/10'
                      }`}>
                        {crawler.ok ? 'COMPATIBLE' : 'FALLBACK'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'visual' && (
              <div className="space-y-4">
                {/* Visualizer clone select */}
                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 text-left font-mono space-y-4">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 block border-b border-white/5 pb-1.5">
                    MOCK SNIPPET CLONER
                  </span>

                  {/* Discord Style Mock */}
                  <div className="bg-[#2f3136] p-4 rounded-lg font-sans border-l-4 border-cyan-400 space-y-2">
                    <span className="text-[10px] text-[#4f545c] font-bold uppercase tracking-wider block">DISCORD CLIENT BOT PREVIEW</span>
                    <div className="space-y-1">
                      <h5 className="text-[14px] text-[#00b0f4] font-semibold hover:underline cursor-pointer">{debugData.metadata.title}</h5>
                      <p className="text-[12px] text-[#dcddde] leading-normal">{debugData.metadata.description}</p>
                    </div>
                    {debugData.metadata.image && (
                      <div className="aspect-video w-full rounded overflow-hidden max-h-56 mt-2">
                        <img 
                          src={debugData.metadata.image} 
                          alt="Discord Mock" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Style Mock */}
                  <div className="bg-[#128c7e]/10 border border-[#128c7e]/20 p-4 rounded-lg font-sans space-y-2">
                    <span className="text-[10px] text-[#075e54] font-bold uppercase tracking-wider block">WHATSAPP PREVIEW CARD</span>
                    <div className="bg-[#e5ddd5]/30 border border-white/5 p-3 rounded-xl flex gap-3">
                      <div className="flex-1 space-y-1">
                        <h5 className="text-[13px] text-[#25d366] font-bold line-clamp-1">{debugData.metadata.title}</h5>
                        <p className="text-[11px] text-[#4a4a4a] dark:text-[#b4b4b4] line-clamp-2 leading-relaxed">{debugData.metadata.description}</p>
                        <span className="text-[9px] text-[#a4a4a4] font-mono block uppercase">{debugData.metadata.domain}</span>
                      </div>
                      {debugData.metadata.image && (
                        <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                          <img 
                            src={debugData.metadata.image} 
                            alt="WA Mock" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
