import React from 'react';
import {
  ExternalLink,
  Bookmark,
  Star,
  Eye,
  Terminal,
  Shield,
  Search,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { Resource } from '../types';
import { getCategoryIcon } from '../utils/iconMap';

interface ResourceCardProps {
  resource: Resource;
  isBookmarked: boolean;
  onToggleBookmark: (id: number) => void;
  onOpenDetail: (resource: Resource) => void;
  onLaunch: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isBookmarked,
  onToggleBookmark,
  onOpenDetail,
  onLaunch
}) => {
  const flags = resource.tool_flags ? resource.tool_flags.split('').filter(f => f !== ',') : [];

  const renderFlagBadge = (flag: string) => {
    switch (flag) {
      case 'T':
        return (
          <span
            key="T"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60"
            title="Tool / Script: Local install or CLI application"
          >
            (T) Tool
          </span>
        );
      case 'D':
        return (
          <span
            key="D"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60"
            title="Google Dork query syntax"
          >
            (D) Dork
          </span>
        );
      case 'R':
        return (
          <span
            key="R"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60"
            title="Registration Required for access"
          >
            (R) Auth
          </span>
        );
      case 'M':
        return (
          <span
            key="M"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"
            title="Manual URL parameter injection"
          >
            (M) URL
          </span>
        );
      default:
        return null;
    }
  };

  const getCostBadge = () => {
    if (resource.is_free === 1) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          Free
        </span>
      );
    } else if (resource.is_free === 2) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
          Freemium
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
        Paid
      </span>
    );
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 p-5 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-cyan-950/20">
      
      {/* Top Header: Category & Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
            <span className="text-cyan-400">
              {getCategoryIcon(resource.category_icon, 'w-3.5 h-3.5')}
            </span>
            <span className="truncate">{resource.category_name}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {getCostBadge()}
            {flags.map(f => renderFlagBadge(f))}
          </div>
        </div>

        {/* Resource Name */}
        <h3
          onClick={() => onOpenDetail(resource)}
          className="text-base font-bold text-slate-100 group-hover:text-cyan-400 font-mono transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>{resource.name}</span>
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
          {resource.description}
        </p>

        {/* Input/Output or Usage preview */}
        {resource.usage_context && (
          <div className="mt-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800/70 text-[11px] text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{resource.usage_context}</p>
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {resource.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/70 border border-slate-700/50"
              >
                #{tag}
              </span>
            ))}
            {resource.tags.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{resource.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Metrics & Actions */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        
        {/* Rating & Views */}
        <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-slate-200 font-medium">
              {resource.rating_avg > 0 ? resource.rating_avg.toFixed(1) : 'New'}
            </span>
            <span className="text-slate-400">({resource.rating_count})</span>
          </div>

          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>{resource.views}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(resource.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Quick Details Modal Button */}
          <button
            onClick={() => onOpenDetail(resource)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-transparent transition-all"
            title="Inspect full intelligence dossier"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Launch External Link Button */}
          <button
            onClick={() => onLaunch(resource)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition-all font-mono text-xs font-semibold"
            title="Launch Tool"
          >
            <span>Launch</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

      </div>

    </div>
  );
};
