import React, { useState, useEffect } from 'react';
import { 
  Palette, Sliders, RefreshCw, Save, Download, Upload, Check, 
  Sparkles, Grid, Eye, AlertCircle, Copy
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustomTheme } from '../types';

// Preset definitions
export const THEME_PRESETS: { [key: string]: CustomTheme } = {
  jarvis: {
    backgroundStyle: 'jarvis',
    hudColor: '#06b6d4',
    accentColor: '#6366f1',
    borderGlowColor: 'rgba(6, 182, 212, 0.4)',
    cardColor: 'rgba(15, 23, 42, 0.55)',
    gridColor: 'rgba(6, 182, 212, 0.05)',
    particleColor: 'rgba(6, 182, 212, 0.3)',
    fontColor: '#f1f5f9',
    buttonColor: '#06b6d4',
    progressBarColor: '#06b6d4',
    glowIntensity: 10,
    blur: 20,
    transparency: 0.55,
    animationSpeed: 6,
    gridOpacity: 0.4
  },
  stark: {
    backgroundStyle: 'stark',
    hudColor: '#ef4444',
    accentColor: '#eab308',
    borderGlowColor: 'rgba(239, 68, 68, 0.4)',
    cardColor: 'rgba(24, 24, 27, 0.7)',
    gridColor: 'rgba(239, 68, 68, 0.04)',
    particleColor: 'rgba(239, 68, 68, 0.2)',
    fontColor: '#fafafa',
    buttonColor: '#ef4444',
    progressBarColor: '#ef4444',
    glowIntensity: 15,
    blur: 15,
    transparency: 0.7,
    animationSpeed: 4,
    gridOpacity: 0.3
  },
  cyberpunk: {
    backgroundStyle: 'cyberpunk',
    hudColor: '#facc15',
    accentColor: '#f43f5e',
    borderGlowColor: 'rgba(250, 204, 21, 0.5)',
    cardColor: 'rgba(9, 9, 11, 0.85)',
    gridColor: 'rgba(250, 204, 21, 0.08)',
    particleColor: 'rgba(244, 63, 94, 0.4)',
    fontColor: '#facc15',
    buttonColor: '#facc15',
    progressBarColor: '#f43f5e',
    glowIntensity: 20,
    blur: 5,
    transparency: 0.85,
    animationSpeed: 3,
    gridOpacity: 0.6
  },
  glassmorphism: {
    backgroundStyle: 'glassmorphism',
    hudColor: '#ffffff',
    accentColor: '#a855f7',
    borderGlowColor: 'rgba(255, 255, 255, 0.25)',
    cardColor: 'rgba(255, 255, 255, 0.07)',
    gridColor: 'rgba(255, 255, 255, 0.02)',
    particleColor: 'rgba(168, 85, 247, 0.2)',
    fontColor: '#ffffff',
    buttonColor: '#ffffff',
    progressBarColor: '#a855f7',
    glowIntensity: 8,
    blur: 30,
    transparency: 0.07,
    animationSpeed: 8,
    gridOpacity: 0.15
  },
  minimal: {
    backgroundStyle: 'minimal',
    hudColor: '#1e293b',
    accentColor: '#475569',
    borderGlowColor: 'rgba(0, 0, 0, 0.05)',
    cardColor: 'rgba(255, 255, 255, 0.95)',
    gridColor: 'rgba(0, 0, 0, 0.02)',
    particleColor: 'rgba(0, 0, 0, 0.05)',
    fontColor: '#0f172a',
    buttonColor: '#0f172a',
    progressBarColor: '#0f172a',
    glowIntensity: 0,
    blur: 0,
    transparency: 0.95,
    animationSpeed: 0,
    gridOpacity: 0.1
  },
  matrix: {
    backgroundStyle: 'matrix',
    hudColor: '#22c55e',
    accentColor: '#15803d',
    borderGlowColor: 'rgba(34, 197, 94, 0.5)',
    cardColor: 'rgba(2, 6, 17, 0.9)',
    gridColor: 'rgba(34, 197, 94, 0.05)',
    particleColor: 'rgba(34, 197, 94, 0.3)',
    fontColor: '#22c55e',
    buttonColor: '#22c55e',
    progressBarColor: '#22c55e',
    glowIntensity: 12,
    blur: 10,
    transparency: 0.9,
    animationSpeed: 5,
    gridOpacity: 0.5
  },
  dark: {
    backgroundStyle: 'dark',
    hudColor: '#38bdf8',
    accentColor: '#818cf8',
    borderGlowColor: 'rgba(56, 189, 248, 0.2)',
    cardColor: 'rgba(15, 23, 42, 0.8)',
    gridColor: 'rgba(255, 255, 255, 0.01)',
    particleColor: 'rgba(56, 189, 248, 0.1)',
    fontColor: '#f8fafc',
    buttonColor: '#38bdf8',
    progressBarColor: '#38bdf8',
    glowIntensity: 5,
    blur: 20,
    transparency: 0.8,
    animationSpeed: 10,
    gridOpacity: 0.2
  },
  light: {
    backgroundStyle: 'light',
    hudColor: '#0284c7',
    accentColor: '#4f46e5',
    borderGlowColor: 'rgba(2, 132, 199, 0.1)',
    cardColor: 'rgba(255, 255, 255, 0.9)',
    gridColor: 'rgba(0, 0, 0, 0.01)',
    particleColor: 'rgba(2, 132, 199, 0.05)',
    fontColor: '#0f172a',
    buttonColor: '#0284c7',
    progressBarColor: '#0284c7',
    glowIntensity: 3,
    blur: 15,
    transparency: 0.9,
    animationSpeed: 12,
    gridOpacity: 0.1
  }
};

// Apply theme to document element CSS variables
export function applyThemeToCSSVariables(theme: CustomTheme) {
  const root = document.documentElement;
  
  if (theme.hudColor) root.style.setProperty('--hud-color', theme.hudColor);
  if (theme.accentColor) root.style.setProperty('--accent-color', theme.accentColor);
  if (theme.borderGlowColor) root.style.setProperty('--border-glow-color', theme.borderGlowColor);
  if (theme.cardColor) root.style.setProperty('--card-color', theme.cardColor);
  if (theme.gridColor) root.style.setProperty('--grid-color', theme.gridColor);
  if (theme.particleColor) root.style.setProperty('--particle-color', theme.particleColor);
  if (theme.fontColor) root.style.setProperty('--font-color', theme.fontColor);
  if (theme.buttonColor) root.style.setProperty('--button-color', theme.buttonColor);
  if (theme.progressBarColor) root.style.setProperty('--progress-bar-color', theme.progressBarColor);
  
  if (theme.glowIntensity !== undefined) root.style.setProperty('--glow-intensity', `${theme.glowIntensity}px`);
  if (theme.blur !== undefined) root.style.setProperty('--blur', `${theme.blur}px`);
  if (theme.transparency !== undefined) root.style.setProperty('--transparency', `${theme.transparency}`);
  if (theme.animationSpeed !== undefined) root.style.setProperty('--animation-speed', `${theme.animationSpeed}s`);
  if (theme.gridOpacity !== undefined) root.style.setProperty('--grid-opacity', `${theme.gridOpacity}`);
}

export default function ThemeEditor() {
  const [theme, setTheme] = useState<CustomTheme>(() => {
    const saved = localStorage.getItem('uzk_active_theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return THEME_PRESETS.jarvis;
  });

  const [activePreset, setActivePreset] = useState<string>(() => {
    return localStorage.getItem('uzk_active_preset') || 'jarvis';
  });

  const [customPresets, setCustomPresets] = useState<{name: string, theme: CustomTheme}[]>(() => {
    const saved = localStorage.getItem('uzk_custom_presets');
    return saved ? JSON.parse(saved) : [];
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply theme instantly on changes
  useEffect(() => {
    applyThemeToCSSVariables(theme);
    localStorage.setItem('uzk_active_theme', JSON.stringify(theme));
  }, [theme]);

  const selectPreset = (name: string, customPresetTheme?: CustomTheme) => {
    let selectedTheme = THEME_PRESETS[name];
    if (customPresetTheme) {
      selectedTheme = customPresetTheme;
    }
    if (selectedTheme) {
      setTheme(selectedTheme);
      setActivePreset(name);
      localStorage.setItem('uzk_active_preset', name);
    }
  };

  const handleUpdateField = (key: keyof CustomTheme, value: any) => {
    setTheme(prev => ({
      ...prev,
      [key]: value
    }));
    setActivePreset('custom');
    localStorage.setItem('uzk_active_preset', 'custom');
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    
    const updatedPresets = [...customPresets, { name: newPresetName.trim(), theme }];
    setCustomPresets(updatedPresets);
    localStorage.setItem('uzk_custom_presets', JSON.stringify(updatedPresets));
    
    const presetKey = `custom_${Date.now()}`;
    setActivePreset(presetKey);
    localStorage.setItem('uzk_active_preset', presetKey);
    
    setNewPresetName('');
    showSuccess('Custom preset saved successfully!');
  };

  const handleDeletePreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((_, i) => i !== index);
    setCustomPresets(updated);
    localStorage.setItem('uzk_custom_presets', JSON.stringify(updated));
    showSuccess('Custom preset deleted.');
  };

  const handleExportPreset = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(theme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `uzk_os_theme_preset.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showSuccess('Theme configuration exported.');
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === 'object') {
          setTheme(imported);
          setActivePreset('imported');
          localStorage.setItem('uzk_active_preset', 'imported');
          showSuccess('Theme configuration imported successfully!');
        } else {
          setErrorMsg('Invalid theme configuration file structure.');
        }
      } catch (_) {
        setErrorMsg('Failed to parse theme JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    setTheme(THEME_PRESETS.jarvis);
    setActivePreset('jarvis');
    localStorage.setItem('uzk_active_preset', 'jarvis');
    showSuccess('Reset to JARVIS HUD default theme.');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCopyHex = (color?: string) => {
    if (!color) return;
    navigator.clipboard.writeText(color);
    showSuccess(`Copied: ${color}`);
  };

  return (
    <div className="space-y-6" id="theme-editor-view">
      {/* HUD Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50" />
        <div className="space-y-1">
          <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <Palette className="h-3.5 w-3.5" />
            UZK OS // THEME ENGINE
          </span>
          <h2 className="text-xl font-bold font-sans tracking-tight text-white">Theme Customizer Suite</h2>
          <p className="text-xs text-slate-400 font-sans max-w-xl">
            Fine-tune every visual component of the UZK OS console in real-time. Change backgrounds, adjustment layers, glows, borders, and colors instantly.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportPreset}
            className="px-4 py-2 bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            EXPORT PRESET
          </button>
          
          <label className="px-4 py-2 bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-800/80 transition-colors cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            IMPORT
            <input type="file" accept=".json" onChange={handleImportPreset} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Controls - Left side (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Presets selection */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                PRESET CATALOGUE
              </span>
              <button 
                onClick={handleResetToDefault}
                className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> RESET
              </button>
            </div>

            {/* Standard Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {Object.keys(THEME_PRESETS).map((key) => {
                const isSelected = activePreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => selectPreset(key)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all capitalize cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 font-bold' 
                        : 'bg-slate-950/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: THEME_PRESETS[key].hudColor }}
                    />
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Custom Presets / Save Preset Form */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Custom Presets</span>
              
              {customPresets.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {customPresets.map((p, i) => {
                    const presetKey = `custom_${i}`;
                    const isSelected = activePreset === presetKey;
                    return (
                      <span
                        key={presetKey}
                        onClick={() => selectPreset(presetKey, p.theme)}
                        className={`inline-flex items-center gap-1.5 py-1.5 pl-3 pr-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 font-bold' 
                            : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                        }`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full border border-white/20"
                          style={{ backgroundColor: p.theme.hudColor }}
                        />
                        {p.name}
                        <button 
                          onClick={(e) => handleDeletePreset(i, e)}
                          className="hover:text-red-400 text-slate-500 ml-1 font-bold p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleSavePreset} className="flex gap-2 font-mono text-xs">
                <input
                  type="text"
                  placeholder="Enter preset name (e.g. Neon Horizon)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  maxLength={20}
                  className="grow glass-input px-3 py-2 rounded-xl text-slate-200 focus:outline-none placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 hover:bg-cyan-600 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  SAVE
                </button>
              </form>
            </div>
          </div>

          {/* Section 2: HUD Color configuration & Background Style */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <span className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Grid className="h-3.5 w-3.5" />
              BACKGROUND & hud COLOR preset
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Background style Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block font-mono">BACKGROUND STYLE</label>
                <select
                  value={theme.backgroundStyle || 'jarvis'}
                  onChange={(e) => handleUpdateField('backgroundStyle', e.target.value)}
                  className="w-full glass-input text-xs text-slate-300 py-2.5 px-3 rounded-xl font-mono focus:outline-none select-dark"
                >
                  <option value="jarvis">JARVIS HUD Mesh</option>
                  <option value="stark">Stark Industries Grid</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="glassmorphism">Glassmorphism Overlay</option>
                  <option value="minimal">Minimal Grid</option>
                  <option value="matrix">Matrix Code Fall</option>
                  <option value="dark">Solid Dark Mode</option>
                  <option value="light">Solid Light Mode</option>
                </select>
              </div>

              {/* Quick HUD Color Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block font-mono">HUD ACCENT COLORS</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#06b6d4', '#3b82f6', '#a855f7', '#10b981', '#f97316', '#ef4444'].map((col) => (
                    <button
                      key={col}
                      onClick={() => {
                        handleUpdateField('hudColor', col);
                        handleUpdateField('borderGlowColor', `${col}66`);
                        handleUpdateField('buttonColor', col);
                        handleUpdateField('progressBarColor', col);
                      }}
                      className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded-lg border border-white/5">
                    <input
                      type="color"
                      value={theme.hudColor || '#06b6d4'}
                      onChange={(e) => {
                        const col = e.target.value;
                        handleUpdateField('hudColor', col);
                        handleUpdateField('borderGlowColor', `${col}66`);
                        handleUpdateField('buttonColor', col);
                        handleUpdateField('progressBarColor', col);
                      }}
                      className="w-5 h-5 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{theme.hudColor?.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Fine-grained customization options (Color pickers) */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 font-mono text-xs">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Sliders className="h-3.5 w-3.5" />
              FINELY TUNED COMPONENT COLORS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">HUD BASE COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.hudColor || '#06b6d4'}
                    onChange={(e) => handleUpdateField('hudColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.hudColor}
                    onChange={(e) => handleUpdateField('hudColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">ACCENT COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.accentColor || '#6366f1'}
                    onChange={(e) => handleUpdateField('accentColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleUpdateField('accentColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">BORDER GLOW COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.borderGlowColor?.startsWith('rgba') ? '#06b6d4' : (theme.borderGlowColor || '#06b6d4')}
                    onChange={(e) => handleUpdateField('borderGlowColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.borderGlowColor}
                    onChange={(e) => handleUpdateField('borderGlowColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">CARD/PANEL COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.cardColor?.startsWith('rgba') ? '#0f172a' : (theme.cardColor || '#0f172a')}
                    onChange={(e) => handleUpdateField('cardColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.cardColor}
                    onChange={(e) => handleUpdateField('cardColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">GRID/MESH COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.gridColor?.startsWith('rgba') ? '#06b6d4' : (theme.gridColor || '#06b6d4')}
                    onChange={(e) => handleUpdateField('gridColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.gridColor}
                    onChange={(e) => handleUpdateField('gridColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">PARTICLE COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.particleColor?.startsWith('rgba') ? '#06b6d4' : (theme.particleColor || '#06b6d4')}
                    onChange={(e) => handleUpdateField('particleColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.particleColor}
                    onChange={(e) => handleUpdateField('particleColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">FONT COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.fontColor || '#f1f5f9'}
                    onChange={(e) => handleUpdateField('fontColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.fontColor}
                    onChange={(e) => handleUpdateField('fontColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">BUTTON COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.buttonColor || '#06b6d4'}
                    onChange={(e) => handleUpdateField('buttonColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.buttonColor}
                    onChange={(e) => handleUpdateField('buttonColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px]">PROGRESS BAR COLOR</label>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={theme.progressBarColor || '#06b6d4'}
                    onChange={(e) => handleUpdateField('progressBarColor', e.target.value)}
                    className="w-5 h-5 bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.progressBarColor}
                    onChange={(e) => handleUpdateField('progressBarColor', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Visual effects (Sliders) */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 font-mono text-xs">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Sliders className="h-3.5 w-3.5" />
              VISUAL EFFECTS SLIDERS
            </span>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>GLOW INTENSITY</span>
                  <span className="text-cyan-400">{theme.glowIntensity}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={theme.glowIntensity || 0}
                  onChange={(e) => handleUpdateField('glowIntensity', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-950 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>BACKGROUND BLUR</span>
                  <span className="text-cyan-400">{theme.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={theme.blur || 0}
                  onChange={(e) => handleUpdateField('blur', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-950 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>CARD TRANSPARENCY</span>
                  <span className="text-cyan-400">{(theme.transparency || 1).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.00"
                  step="0.05"
                  value={theme.transparency || 1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleUpdateField('transparency', val);
                    handleUpdateField('cardColor', `rgba(15, 23, 42, ${val})`);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-950 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ANIMATION PULSE SPEED</span>
                  <span className="text-cyan-400">{theme.animationSpeed}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={theme.animationSpeed || 6}
                  onChange={(e) => handleUpdateField('animationSpeed', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-950 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>GRID OPACITY</span>
                  <span className="text-cyan-400">{(theme.gridOpacity || 0).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={theme.gridOpacity || 0}
                  onChange={(e) => handleUpdateField('gridOpacity', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-950 rounded-lg"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Live Preview Display - Right side (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4 sticky top-6">
            <span className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Eye className="h-3.5 w-3.5" />
              LIVE CONSOLE INTERFACE PREVIEW
            </span>

            {/* Simulated Live Panel using active customized options */}
            <div 
              className="border rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: theme.cardColor,
                backdropFilter: `blur(${theme.blur}px)`,
                borderColor: theme.borderGlowColor,
                boxShadow: `0 0 ${theme.glowIntensity}px ${theme.borderGlowColor}`,
                color: theme.fontColor
              }}
            >
              {/* Overlay pulse indicator */}
              <div className="flex items-center justify-between font-mono text-[9px] border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: theme.hudColor }}
                  />
                  <span style={{ color: theme.hudColor }}>UZK OS PREVIEW: ONLINE</span>
                </div>
                <div className="text-slate-400">
                  REF: /LIVE_MODE
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold tracking-tight">Simulated Live Element</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  This mock widget demonstrates how glow, background blurs, panels, and text fonts will look to operators.
                </p>
              </div>

              {/* Progress bar demonstration */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-slate-400">
                  <span>ROUTING BANDWIDTH</span>
                  <span>78%</span>
                </div>
                <div className="h-2 w-full bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: '78%', 
                      backgroundColor: theme.progressBarColor,
                      boxShadow: `0 0 6px ${theme.progressBarColor}`
                    }}
                  />
                </div>
              </div>

              {/* Action button demonstration */}
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-2 rounded-xl text-[10px] font-bold font-mono text-slate-950 tracking-wider text-center cursor-pointer transition-all active:scale-95"
                  style={{
                    backgroundColor: theme.buttonColor,
                    boxShadow: `0 0 8px ${theme.buttonColor}44`
                  }}
                >
                  SIMULATED BUTTON
                </button>
                <button 
                  className="px-3 py-2 border rounded-xl text-[10px] font-bold font-mono tracking-wider text-center cursor-pointer transition-all active:scale-95 text-slate-300 bg-transparent"
                  style={{ borderColor: theme.borderGlowColor }}
                >
                  SECURE
                </button>
              </div>
            </div>

            {/* Grid Opacity Visualization */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-2 text-xs font-mono text-slate-400">
              <span className="text-[10px] text-slate-500 block">SYSTEM DIAGNOSTICS</span>
              <p className="leading-relaxed text-[11px]">
                Theme is applied on a platform-wide layer. Grid lines are configured to run at {theme.gridOpacity * 100}% opacity. Background rendering will synchronize with <b>{theme.backgroundStyle?.toUpperCase()}</b> layouts.
              </p>
            </div>

            {/* Error & Success notifications inside editor */}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-sans">
                <Check className="h-4 w-4" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-1.5 font-sans">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
