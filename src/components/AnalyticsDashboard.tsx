import React, { useState, useEffect } from 'react';
import { 
  BarChart3, RefreshCw, Globe, Smartphone, Compass, Link2, 
  Calendar, CheckCircle2, ChevronRight, Share2, HelpCircle, MapPin, 
  Layers, ShieldAlert, Monitor, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Link, AnalyticsSummary, Visit } from '../types';
import HoloMap from './HoloMap';

interface AnalyticsDashboardProps {
  selectedLink: Link | null;
  onClearSelection: () => void;
  refreshTrigger: number;
}

export default function AnalyticsDashboard({ selectedLink, onClearSelection, refreshTrigger }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightedVisit, setHighlightedVisit] = useState<Visit | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedLink, refreshTrigger]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = selectedLink 
        ? `/api/links/${selectedLink.id}/analytics`
        : '/api/analytics';

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to retrieve telemetry analytics data');
      }
      const analyticsData = await response.json();
      setData(analyticsData);
      setHighlightedVisit(null);
    } catch (err: any) {
      setError(err.message || 'Error loading telemetry dashboard');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBarList = (
    items: { label: string; count: number }[], 
    icon: React.ReactNode, 
    title: string,
    colorClass: string = 'bg-cyan-500'
  ) => {
    const maxVal = items.length > 0 ? Math.max(...items.map(i => i.count)) : 1;

    return (
      <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          {icon}
          <h3 className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">{title}</h3>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 text-slate-600">
            NO INTERACTION TELEMETRY RECORDED
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const percentage = Math.round((item.count / maxVal) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 truncate max-w-[150px]" title={item.label}>
                      {item.label || 'Direct / Other'}
                    </span>
                    <span className="text-cyan-400 font-bold">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getShortUrl = (code: string) => {
    return `${window.location.origin}/${code}`;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden h-full border border-cyan-500/10" id="analytics-telemetry-cockpit">
      {/* Background radial soft lightings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header controls HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-display font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider stark-glow-blue">
              <BarChart3 className="h-4 w-4 text-cyan-400 animate-pulse" />
              {selectedLink ? 'Specific slug telemetry' : 'STARK COGNITIVE GRID METRICS'}
            </h2>
            {selectedLink && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-[9px] text-cyan-300 font-mono font-bold uppercase">
                /{selectedLink.short_code}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            {selectedLink 
              ? `Real-time redirect mapping metrics logged for slug index /${selectedLink.short_code}.`
              : 'Global interactive network overlays and visitor category distributions.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedLink && (
            <button
              onClick={onClearSelection}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reset View
            </button>
          )}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer border border-white/5"
            title="Refresh Core Demographics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-16 text-rose-400 text-xs flex flex-col items-center justify-center gap-2">
          <HelpCircle className="h-7 w-7 text-rose-500 animate-pulse" />
          <span>{error}</span>
        </div>
      ) : loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-xs font-mono">RETRIEVING STARK CORES TELEMETRY...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Active Specific Link Details Banner */}
          {selectedLink && (
            <div className="bg-cyan-500/5 border border-cyan-500/15 p-4 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">
                <Link2 className="h-3.5 w-3.5" />
                <span>Slug Core Link Attributes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-500 uppercase">Short URL Slugs</span>
                  <div className="text-xs text-cyan-300 truncate select-all font-semibold">
                    {getShortUrl(selectedLink.short_code)}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-500 uppercase">Rerouting targets</span>
                  <div className="text-xs text-slate-300 truncate select-all hover:underline cursor-pointer">
                    {selectedLink.original_url}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Holographic dark Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                GLOBAL INTERACTION HUD PLOT [CYAN MARKERS]
              </span>
              <span className="text-[10px] uppercase text-cyan-500 tracking-wider">
                Active geolocated visits mapped
              </span>
            </div>
            
            <HoloMap 
              visits={data.rawVisits || []} 
              onMarkerClick={(visit) => setHighlightedVisit(visit)}
            />

            {/* Marker click HUD Detail drawer */}
            {highlightedVisit && (
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/25 rounded-xl font-mono text-[11px] space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-1">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Telemetry Node Selected
                  </span>
                  <button 
                    onClick={() => setHighlightedVisit(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    CLOSE [X]
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Location</span>
                    <span className="font-semibold">{highlightedVisit.city}, {highlightedVisit.country}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Device Node</span>
                    <span className="font-semibold">{highlightedVisit.device} ({highlightedVisit.browser})</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Timestamp</span>
                    <span>{new Date(highlightedVisit.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Referrer</span>
                    <span className="truncate block font-semibold text-indigo-400">{highlightedVisit.referrer || 'Direct'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metric Cards Cockpit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Click Metric */}
            <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl relative overflow-hidden font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                TELEMETRY CLICKS INDEX
              </span>
              <div className="text-2xl font-bold text-cyan-400 mt-1 stark-glow-blue">
                {data.totalClicks}
              </div>
              <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1 font-sans">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>80+ Crawler bots blocked</span>
              </div>
            </div>

            {/* Links / Domain Metric */}
            <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl relative overflow-hidden font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                {selectedLink ? 'REDIRECT DOMAIN TARGET' : 'TOTAL CORES IN SERVICE'}
              </span>
              <div className="text-sm font-bold text-slate-100 mt-2.5 truncate font-mono uppercase tracking-wide">
                {selectedLink 
                  ? new URL(selectedLink.original_url).hostname 
                  : `${data.totalLinks} Short Slugs`}
              </div>
              <div className="text-[9px] text-slate-500 mt-1 font-sans">
                {selectedLink ? 'Secure redirection destination' : 'Active active shortcode paths'}
              </div>
            </div>

            {/* Uniques Metric */}
            <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl relative overflow-hidden font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                UNIQUE VISITOR NODES
              </span>
              <div className="text-2xl font-bold text-cyan-400 mt-1 stark-glow-blue">
                {data.uniqueVisits ?? 0}
              </div>
              <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1 font-sans">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>GDPR hash anonymized</span>
              </div>
            </div>
          </div>

          {/* Click Trends Area Chart */}
          <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Calendar className="h-4 w-4 text-cyan-400" />
                7-DAY CLICKS TELEMETRY TRENDS
              </span>
              <span className="text-[9px] text-cyan-500 uppercase">Chronological indices</span>
            </div>

            <div className="h-48 w-full pt-1">
              {data.clicksOverTime.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-600">
                  NO CHRONOLOGICAL CLICKS TELEMETRY DETECTED
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.clicksOverTime}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCyanClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={8} 
                      fontFamily="JetBrains Mono" 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={8} 
                      fontFamily="JetBrains Mono" 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(2, 6, 23, 0.95)',
                        borderColor: 'rgba(6, 182, 212, 0.3)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono',
                        color: '#f1f5f9'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      name="Visitor Clicks"
                      stroke="#06b6d4" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorCyanClicks)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Demographic Progress Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Countries */}
            {renderProgressBarList(
              data.topCountries.map(c => ({ label: c.country, count: c.clicks })),
              <Globe className="h-4 w-4 text-cyan-400" />,
              'Top Visitor Countries',
              'bg-cyan-500'
            )}

            {/* Referrers */}
            {renderProgressBarList(
              data.topReferrers.map(r => ({ label: r.referrer, count: r.clicks })),
              <Share2 className="h-4 w-4 text-indigo-400" />,
              'Top Referrer channels',
              'bg-indigo-500'
            )}

            {/* Browsers */}
            {renderProgressBarList(
              data.topBrowsers.map(b => ({ label: b.browser, count: b.clicks })),
              <Compass className="h-4 w-4 text-cyan-400" />,
              'Top Browser nodes',
              'bg-cyan-400'
            )}

            {/* Devices */}
            {renderProgressBarList(
              data.topDevices.map(d => ({ label: d.device, count: d.clicks })),
              <Smartphone className="h-4 w-4 text-indigo-400" />,
              'Top Device nodes',
              'bg-indigo-400'
            )}

          </div>

        </div>
      ) : null}
    </div>
  );
}
