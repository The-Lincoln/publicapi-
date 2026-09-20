import React from 'react';
import { ShieldCheck, Database, Layers, Eye, Sparkles, Terminal, Filter, Star } from 'lucide-react';
import { Resource } from '../types';

interface HeroStatsProps {
  totalCount: number;
  totalCategories: number;
  filteredCount: number;
  allResources: Resource[];
  activeType: string;
  activeCost: string;
  onSelectTypeFilter: (type: string) => void;
  onSelectCostFilter: (cost: string) => void;
  onResetFilters: () => void;
}

export const HeroStats: React.FC<HeroStatsProps> = ({
  totalCount,
  totalCategories,
  filteredCount,
  allResources,
  activeType,
  activeCost,
  onSelectTypeFilter,
  onSelectCostFilter,
  onResetFilters
}) => {
  // Compute real metrics
  const freeToolsCount = allResources.filter(r => r.is_free === 1).length;
  const freePercent = totalCount > 0 ? Math.round((freeToolsCount / totalCount) * 100) : 100;
  const totalViews = allResources.reduce((acc, r) => acc + (r.views || 0), 0);
  const avgRating = allResources.length > 0
    ? (allResources.reduce((acc, r) => acc + (r.rating_avg || 0), 0) / allResources.length).toFixed(1)
    : '4.8';

  return (
    <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-slate-950/40 to-transparent py-6 px-4 sm:px-6 lg:px-8">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#00E5FF_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Title & Tagline */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Curated Open-Source Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-mono">
            OSINT Public Data Explorer
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
            Centralized directory of verified OSINT frameworks, Google dorks, breach monitors, satellite feeds, and passive reconnaissance datasets.
          </p>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider">Catalog</span>
              <Database className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
              {totalCount}
            </div>
            <span className="text-[11px] text-slate-400">Curated tools</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider">Sectors</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
              {totalCategories}
            </div>
            <span className="text-[11px] text-slate-400">Intelligence trees</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider">Free Ratio</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {freePercent}%
            </div>
            <span className="text-[11px] text-slate-400">No paywall needed</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider">Rating</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
              {avgRating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <span className="text-[11px] text-slate-400">Community verified</span>
          </div>
        </div>

      </div>

      {/* Fast Preset Badges */}
      <div className="max-w-7xl mx-auto mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-mono flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3 h-3 text-cyan-400" /> Quick Presets:
        </span>

        <button
          onClick={onResetFilters}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
            !activeType && activeCost === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Resources ({totalCount})
        </button>

        <button
          onClick={() => onSelectCostFilter('free')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
            activeCost === 'free'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          100% Free ({freeToolsCount})
        </button>

        <button
          onClick={() => onSelectTypeFilter('D')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
            activeType === 'D'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          (D) Google Dorks
        </button>

        <button
          onClick={() => onSelectTypeFilter('T')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
            activeType === 'T'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          (T) Local Tools & Scripts
        </button>

        <button
          onClick={() => onSelectTypeFilter('R')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
            activeType === 'R'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          (R) Registration Required
        </button>
      </div>
    </div>
  );
};
