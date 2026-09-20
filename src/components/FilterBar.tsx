import React from 'react';
import {
  Filter,
  Download,
  ArrowUpDown,
  X,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { Category } from '../types';

interface FilterBarProps {
  selectedCategory: string;
  categories: Category[];
  searchQuery: string;
  selectedTag: string;
  activeType: string;
  activeCost: string;
  activeSort: string;
  bookmarkedOnly: boolean;
  totalFilteredCount: number;
  onClearCategory: () => void;
  onClearSearch: () => void;
  onClearTag: () => void;
  onClearAll: () => void;
  onTypeChange: (type: string) => void;
  onCostChange: (cost: string) => void;
  onSortChange: (sort: string) => void;
  onExport: (format: 'json' | 'csv') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  categories,
  searchQuery,
  selectedTag,
  activeType,
  activeCost,
  activeSort,
  bookmarkedOnly,
  totalFilteredCount,
  onClearCategory,
  onClearSearch,
  onClearTag,
  onClearAll,
  onTypeChange,
  onCostChange,
  onSortChange,
  onExport
}) => {
  const currentCategory = categories.find(c => c.slug === selectedCategory || String(c.id) === selectedCategory);
  const hasActiveFilters = selectedCategory !== 'all' || !!searchQuery || !!selectedTag || !!activeType || activeCost !== 'all' || bookmarkedOnly;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
      
      {/* Top Row: Sector breadcrumb, result count & active chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sector:</span>
          </div>

          <span className="font-semibold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg">
            {currentCategory ? currentCategory.name : 'All Intel Categories'}
          </span>

          {/* Active Filter Chips */}
          {selectedCategory !== 'all' && (
            <button
              onClick={onClearCategory}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60"
            >
              <span>{currentCategory?.name}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/50 hover:bg-blue-900/60"
            >
              <span>Query: "{searchQuery}"</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {selectedTag && (
            <button
              onClick={onClearTag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/60"
            >
              <span>#{selectedTag}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline ml-2"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Results Counter & Export Menu */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-cyan-400">{totalFilteredCount}</strong> intelligence resources
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onExport('csv')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => onExport('json')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Export as JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Row: Granular Flags, Cost, and Sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Flags Selector (T, D, R, M) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-mono mr-1 flex items-center gap-1">
            <span>Flags:</span>
          </span>

          <button
            onClick={() => onTypeChange('')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeType === ''
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            All Types
          </button>

          <button
            onClick={() => onTypeChange(activeType === 'T' ? '' : 'T')}
            className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors flex items-center gap-1 ${
              activeType === 'T'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="(T) Local Tool or Script requiring install/CLI"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>(T) Tool / Script</span>
          </button>

          <button
            onClick={() => onTypeChange(activeType === 'D' ? '' : 'D')}
            className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors flex items-center gap-1 ${
              activeType === 'D'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="(D) Google Dork search query"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>(D) Google Dork</span>
          </button>

          <button
            onClick={() => onTypeChange(activeType === 'R' ? '' : 'R')}
            className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors flex items-center gap-1 ${
              activeType === 'R'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="(R) Free registration required"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>(R) Registration</span>
          </button>

          <button
            onClick={() => onTypeChange(activeType === 'M' ? '' : 'M')}
            className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors flex items-center gap-1 ${
              activeType === 'M'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="(M) Manual URL manipulation required"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>(M) Manual URL</span>
          </button>
        </div>

        {/* Cost & Sorting Dropdowns */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          {/* Cost Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Cost:</span>
            <select
              value={activeCost}
              onChange={(e) => onCostChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Pricing</option>
              <option value="free">100% Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Commercial</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="views">Most Popular (Views)</option>
              <option value="rating">Highest Rated</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>

        </div>

      </div>

    </div>
  );
};
