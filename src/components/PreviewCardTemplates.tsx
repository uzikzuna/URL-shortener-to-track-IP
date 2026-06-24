import React from 'react';
import { 
  Sparkles, Shield, Compass, Calendar, Layers, ExternalLink, 
  Tv, Film, Globe, MessageSquare, Twitter, MessageCircle, AlertCircle
} from 'lucide-react';
import { CustomPreview } from '../types';

interface PreviewCardProps {
  preview: CustomPreview;
  templateId: 'modern' | 'hud' | 'cyberpunk' | 'glassmorphism' | 'minimal';
  platformId: 'messenger' | 'facebook' | 'discord' | 'telegram' | 'whatsapp' | 'linkedin' | 'x' | 'reddit';
  destinationUrl?: string;
}

// Map platform logos
export const PLATFORM_ICONS: { [key: string]: string } = {
  youtube: '🔴 YouTube',
  tiktok: '⚫ TikTok',
  facebook: '🔵 Facebook',
  discord: '🟣 Discord',
  telegram: '✈️ Telegram',
  whatsapp: '🟢 WhatsApp',
  linkedin: '💼 LinkedIn',
  x: '🐦 X / Twitter',
  reddit: '🧡 Reddit',
  none: '🌐 Standard Web'
};

export default function PreviewCardTemplates({ preview, templateId, platformId, destinationUrl = 'https://example.com' }: PreviewCardProps) {
  const title = preview.title || 'Dynamic Secure Route Gateway';
  const description = preview.description || 'This link is securely routing through UZK OS instant delivery networks. Encrypted telemetry active.';
  const siteName = preview.siteName || new URL(destinationUrl).hostname.toUpperCase();
  const badge = preview.platformBadge || 'none';
  const watermark = preview.watermark || 'UZK SECURE REDIRECT';
  const themeColor = preview.themeColor || '#06b6d4';

  // Derive target image to show
  const displayImage = preview.imageUrl || preview.bannerUrl || preview.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=60';
  const displayBg = preview.bgImageUrl || '';

  // Render Card Content based on Template Selection
  const renderTemplateContent = () => {
    switch (templateId) {
      case 'hud': // JARVIS HUD
        return (
          <div 
            className="border p-4 rounded-xl relative overflow-hidden font-mono text-xs space-y-3 select-none"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: themeColor,
              boxShadow: `0 0 10px ${themeColor}22`
            }}
          >
            {/* Holographic matrix background overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
            {displayBg && (
              <img src={displayBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
            )}

            {/* Top Wireframe HUD */}
            <div className="flex justify-between items-center text-[9px] border-b border-white/5 pb-1.5" style={{ color: themeColor }}>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ backgroundColor: themeColor }} />
                UZK OS REDIRECT GATEWAY
              </span>
              <span>COORD: 3000 // {watermark}</span>
            </div>

            {/* Main Visual */}
            <div className="relative h-32 rounded-lg overflow-hidden border border-white/5 bg-slate-950">
              <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              {badge !== 'none' && (
                <span className="absolute top-2 left-2 bg-slate-900/90 text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 text-slate-200">
                  {PLATFORM_ICONS[badge]}
                </span>
              )}
              {preview.logoUrl && (
                <img src={preview.logoUrl} alt="Logo" className="absolute top-2 right-2 w-6 h-6 rounded-full border border-white/10" />
              )}
            </div>

            {/* Metadata Text */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 leading-none tracking-widest">
                <span>{siteName}</span>
                <span className="text-[8px] opacity-40">•</span>
                <span style={{ color: themeColor }}>ENCRYPTED LINK</span>
              </span>
              <h4 className="text-sm font-bold leading-snug text-white tracking-tight">{title}</h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{description}</p>
            </div>

            {/* Bottom HUD bar */}
            <div className="flex justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5">
              <span>SECURE REDIRECT GATE</span>
              <span>VERIFICATION LEVEL: SECURE</span>
            </div>
          </div>
        );

      case 'cyberpunk': // Cyberpunk Neon
        return (
          <div className="bg-yellow-400 text-slate-950 p-4 border-2 border-black relative overflow-hidden font-mono text-xs select-none shadow-[4px_4px_0px_#000000]">
            {/* Tech line aesthetics */}
            <div className="absolute top-0 right-0 bg-black text-yellow-400 text-[8px] px-2 font-bold uppercase py-0.5 tracking-wider">
              CYBER_GRID_ACTIVE
            </div>

            <div className="space-y-3 text-left">
              {/* Cyber Banner */}
              <div className="relative h-28 border-2 border-black overflow-hidden bg-black">
                <img src={displayImage} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />
                <div className="absolute bottom-1 right-1 bg-yellow-400 text-[8px] font-extrabold px-1 text-slate-950">
                  {watermark.toUpperCase()}
                </div>
              </div>

              {/* Grid content */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-600">
                  <span>{siteName}</span>
                  <span>//</span>
                  <span>TARGET PATH</span>
                </div>
                <h4 className="text-base font-extrabold uppercase leading-none tracking-tighter text-slate-950 font-sans">{title}</h4>
                <p className="text-[11px] text-slate-800 leading-tight font-sans font-medium">{description}</p>
              </div>

              <div className="border-t-2 border-slate-950 pt-2 flex items-center justify-between text-[8px] font-black">
                <span>SYSTEM DESTINATION SECURED</span>
                <span>[{badge.toUpperCase()}]</span>
              </div>
            </div>
          </div>
        );

      case 'glassmorphism': // Glassmorphism
        return (
          <div 
            className="glass-panel p-4 rounded-2xl relative overflow-hidden select-none border border-white/10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3)`
            }}
          >
            {/* Soft ambient glowing backdrop inside the card */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

            <div className="space-y-3 text-left">
              {/* Premium glassy image frame */}
              <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-slate-900/40">
                <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                {badge !== 'none' && (
                  <span className="absolute top-2 left-2 bg-white/10 backdrop-blur-md text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/20 text-white leading-none">
                    {PLATFORM_ICONS[badge]}
                  </span>
                )}
              </div>

              {/* Text detail */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-white/50 tracking-widest uppercase block">{siteName}</span>
                <h4 className="text-sm font-bold text-white leading-snug tracking-tight">{title}</h4>
                <p className="text-[11px] text-white/60 leading-relaxed font-sans font-light">{description}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] text-white/40 font-mono">
                <span>{watermark}</span>
                <span>SECURE INSTANT DIRECT</span>
              </div>
            </div>
          </div>
        );

      case 'minimal': // Minimal
        return (
          <div className="bg-white text-slate-900 p-5 border border-slate-200 select-none space-y-3 font-sans text-left">
            <span className="text-[9px] font-mono tracking-widest text-slate-400 block uppercase">{siteName}</span>
            
            <div className="relative h-28 bg-slate-100 border border-slate-100 overflow-hidden">
              <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1 pt-1">
              <h4 className="text-sm font-bold tracking-tight text-slate-900 leading-snug">{title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-light">{description}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>{watermark.toUpperCase()}</span>
              <span>{new URL(destinationUrl).hostname}</span>
            </div>
          </div>
        );

      case 'modern': // Clean Modern (Default)
      default:
        return (
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden select-none flex flex-col text-left font-sans">
            <div className="relative h-36 bg-slate-950">
              <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              {badge !== 'none' && (
                <span className="absolute top-3 left-3 bg-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full text-white">
                  {PLATFORM_ICONS[badge]}
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-1.5 bg-slate-900/60">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">{siteName}</span>
              <h4 className="text-sm font-bold leading-snug text-white tracking-tight">{title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">{description}</p>
              
              <div className="pt-3.5 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-slate-400" />
                  {new URL(destinationUrl).hostname}
                </span>
                <span>{watermark}</span>
              </div>
            </div>
          </div>
        );
    }
  };

  // Wrap inside targeted social network preview bubbles
  const renderSocialWrapper = (cardContent: React.ReactNode) => {
    switch (platformId) {
      case 'messenger':
      case 'facebook':
        return (
          <div className="bg-[#18191a] p-4 rounded-xl max-w-sm mx-auto shadow-xl border border-white/5 font-sans space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">FB</div>
              <div className="text-left">
                <span className="font-bold text-white block leading-none">UZK Network Operator</span>
                <span className="text-[9px] text-slate-400">Just now • 🌐</span>
              </div>
            </div>
            <p className="text-xs text-slate-200 text-left">Check out the newly deployed gateway channel:</p>
            {cardContent}
          </div>
        );

      case 'discord':
        return (
          <div className="bg-[#313338] p-3 rounded-lg max-w-sm mx-auto shadow-xl border border-white/5 font-sans text-left text-xs space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 shrink-0 flex items-center justify-center text-white font-bold text-xs">DC</div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-[13px] leading-none">UZK Operator</span>
                  <span className="bg-[#5865f2] text-white text-[8px] px-1 rounded font-bold">BOT</span>
                  <span className="text-[10px] text-slate-400">Today at 12:45 PM</span>
                </div>
                <p className="text-slate-300 text-[13px] leading-relaxed">Here is the link metadata preview served by UZK OS:</p>
                <div className="border-l-4 border-[#5865f2] pl-3.5 bg-[#2b2d31] rounded-r p-3 space-y-1">
                  <span className="text-[11px] font-bold text-slate-300 uppercase leading-none block">{siteName}</span>
                  <h4 className="text-sm font-bold text-sky-400 hover:underline cursor-pointer">{title}</h4>
                  <p className="text-xs text-slate-300 leading-normal">{description}</p>
                  
                  {/* Large visual preview */}
                  <div className="mt-2.5 rounded-md overflow-hidden bg-slate-900 border border-white/5 max-h-36">
                    <img src={displayImage} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'telegram':
        return (
          <div className="bg-[#17212b] p-3 rounded-xl max-w-sm mx-auto shadow-xl border border-white/5 font-sans text-left space-y-2">
            <div className="text-xs text-sky-400 font-bold block leading-none">UZK OS Secure Hub</div>
            <p className="text-[13px] text-slate-200">The gateway code is prepared. Social crawlers returned valid indices:</p>
            
            <div className="border-l-2 border-sky-400 pl-2.5 py-0.5 space-y-1 bg-slate-900/30 rounded-r">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide block">{siteName}</span>
              <h4 className="text-[13px] font-bold text-white leading-snug">{title}</h4>
              <p className="text-xs text-slate-300 leading-normal">{description}</p>
              
              <div className="mt-2 rounded-md overflow-hidden max-h-32 bg-slate-950">
                <img src={displayImage} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="bg-[#0b141a] p-2.5 rounded-lg max-w-xs mx-auto shadow-xl border border-[#202c33] font-sans text-left text-xs space-y-1 relative">
            <div className="bg-[#025146] p-2 rounded-lg space-y-1 border-l-4 border-[#25d366]">
              <span className="text-[10px] text-slate-300 font-mono block tracking-wider uppercase">{siteName}</span>
              <h4 className="text-xs font-bold text-[#e9edef]">{title}</h4>
              <p className="text-[10.5px] text-[#8696a0] leading-snug truncate">{description}</p>
              
              <div className="h-28 rounded-md overflow-hidden bg-slate-900 mt-1">
                <img src={displayImage} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-[#53bdeb] hover:underline block text-xs break-all truncate p-1">
              {destinationUrl}
            </div>
          </div>
        );

      case 'linkedin':
        return (
          <div className="bg-[#1d2226] p-4 rounded-xl max-w-sm mx-auto shadow-xl border border-[#2f3539] font-sans text-left space-y-2.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs">IN</div>
              <div>
                <span className="font-bold text-white block leading-none">UZK Operations</span>
                <span className="text-[10px] text-slate-400">Enterprise Redirect Architect • Just now</span>
              </div>
            </div>
            <p className="text-xs text-slate-200">Proud to present our fully secure dynamic gateway redirection architecture:</p>
            {cardContent}
          </div>
        );

      case 'x': // Twitter / X
        return (
          <div className="bg-black p-3.5 rounded-xl max-w-sm mx-auto shadow-xl border border-[#2f3336] font-sans text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs">X</div>
              <div className="text-xs font-bold text-white">
                UZK OS <span className="text-slate-500 font-normal">@uzk_os • Just now</span>
              </div>
            </div>
            <p className="text-[13px] text-slate-100">Directly bypass interstitial systems safely. Embedded previews enabled:</p>
            
            <div className="border border-[#2f3336] rounded-2xl overflow-hidden bg-black">
              <div className="h-32 bg-slate-900 relative">
                <img src={displayImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-1 bg-black font-sans text-xs">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">{siteName}</span>
                <h4 className="text-xs font-bold text-white truncate leading-tight">{title}</h4>
                <p className="text-[11px] text-slate-400 leading-normal truncate">{description}</p>
              </div>
            </div>
          </div>
        );

      case 'reddit':
        return (
          <div className="bg-[#1a1a1b] p-3.5 rounded-xl max-w-sm mx-auto shadow-xl border border-[#343536] font-sans text-left space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="text-[#ff4500] font-bold">r/uzk_os</span>
              <span>• Posted by u/operator</span>
              <span>2m ago</span>
            </div>
            <h4 className="text-sm font-bold text-slate-100 leading-snug">New secure gateway bypass channels successfully established.</h4>
            {cardContent}
          </div>
        );

      default:
        return cardContent;
    }
  };

  return (
    <div className="space-y-4">
      {renderSocialWrapper(renderTemplateContent())}
    </div>
  );
}
