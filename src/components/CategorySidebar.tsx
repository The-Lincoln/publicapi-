import React, { useState } from 'react';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Layers,
  Tag,
  Shield,
  Info,
  Check,
  Search,
  ExternalLink
} from 'lucide-react';
import { Category } from '../types';
import { getCategoryIcon } from '../utils/iconMap';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  availableTags: string[];
  totalResourcesCount: number;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  availableTags,
  totalResourcesCount
}) => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLegalNotice, setShowLegalNotice] = useState(false);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categoryFilter.toLowerCase()) ||
    c.description.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
      
      {/* Category Tree Navigation Box */}
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-mono font-semibold text-sm">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Intel Sectors</span>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {categories.length}
          </span>
        </div>

        {/* Search inside sectors */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filter sectors..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Tree List */}
        <div className="mt-3 space-y-1 max-h-[460px] overflow-y-auto pr-1">
          {/* "All Sectors" button */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Folder className={`w-4 h-4 ${selectedCategory === 'all' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">All Categories</span>
            </div>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400">
              {totalResourcesCount}
            </span>
          </button>

          {/* Individual Category nodes */}
          {filteredCategories.map((cat) => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
                title={cat.description}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`${isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {getCategoryIcon(cat.icon, 'w-4 h-4')}
                  </span>
                  <span className="truncate text-left">{cat.name}</span>
                </div>
                <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                  isSelected ? 'bg-cyan-900/60 text-cyan-300' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  {cat.resource_count || 0}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Popular Tags Cloud */}
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-mono font-semibold text-sm">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>Keyword Vectors</span>
          </div>
          {selectedTag && (
            <button
              onClick={() => onSelectTag('')}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Clear tag
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
          {availableTags.slice(0, 32).map((t) => {
            const isTagActive = selectedTag.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                onClick={() => onSelectTag(isTagActive ? '' : t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  isTagActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operational Security & Ethical Guidelines Notice */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200 font-mono">OPSEC & Ethical Use</h4>
            <p className="mt-1 text-slate-400 leading-relaxed text-[11px]">
              All listed tools aggregate public datasets. Always perform active reconnaissance within authorized scope. Employ dedicated research environments and VPNs.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <a
                href="https://osintframework.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                OSINT Framework by lockfale <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
};
