import React from 'react';
import { Terminal, Shield, ExternalLink, Heart, Database, Lock } from 'lucide-react';

interface FooterProps {
  onExport: (format: 'json' | 'csv') => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onExport, onOpenAdmin }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-16 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Branding & Attribution */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>OSINT Global Public Data Explorer</span>
          </div>
          <p className="mt-1.5 text-slate-400 max-w-md text-[11px] leading-relaxed">
            Data aggregated from the public <a href="https://osintframework.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">OSINT Framework</a> curated by lockfale, and reputable open cyber intelligence repositories.
          </p>
        </div>

        {/* Center: System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300">SQLite Engine Active</span>
          <span className="text-slate-400">|</span>
          <span className="text-cyan-400">REST API v2.5</span>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => onExport('csv')}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => onExport('json')}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={onOpenAdmin}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Admin Portal
          </button>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-slate-900 text-center text-[10px] text-slate-400">
        Strictly designed for authorized cybersecurity investigations, journalistic research, and ethical OSINT defense. Always respect terms of service and applicable cyber laws.
      </div>
    </footer>
  );
};
