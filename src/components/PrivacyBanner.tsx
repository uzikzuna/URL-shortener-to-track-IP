import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PrivacyBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('url_shortener_analytics_consent');
    if (!consent) {
      // Delay showing the banner slightly for a better entrance experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('url_shortener_analytics_consent', 'accepted');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-5 rounded-2xl shadow-2xl relative overflow-hidden"
          id="privacy-consent-banner"
        >
          {/* Subtle accent light */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-medium text-slate-100 text-sm">Privacy & Analytics Notice</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-0.5 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Close privacy notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                We collect aggregate visitor analytics (such as top countries, browser, device type, and referrer sources) for link statistics. 
                <span className="text-indigo-300 font-medium ml-1">We do not track you across the web or store your raw IP address permanently.</span>
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAccept}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs font-sans transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  Got it, thank you
                  <ArrowRight className="h-3 w-3" />
                </button>
                <a 
                  href="#privacy-info" 
                  className="text-xs text-slate-400 hover:text-slate-200 hover:underline font-sans"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('privacy-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Read Policy
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
