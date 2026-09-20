import React from 'react';
import {
  ExternalLink,
  Bookmark,
  Star,
  Eye,
  Maximize2
} from 'lucide-react';
import { Resource } from '../types';
import { getCategoryIcon } from '../utils/iconMap';

interface ResourceListProps {
  resources: Resource[];
  bookmarkedIds: Set<number>;
  onToggleBookmark: (id: number) => void;
  onOpenDetail: (resource: Resource) => void;
  onLaunch: (resource: Resource) => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  bookmarkedIds,
  onToggleBookmark,
  onOpenDetail,
  onLaunch
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Tool / Resource</th>
              <th className="py-3 px-4">Sector</th>
              <th className="py-3 px-3">Flags</th>
              <th className="py-3 px-3">Pricing</th>
              <th className="py-3 px-3">Rating</th>
              <th className="py-3 px-3 text-right">Views</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {resources.map((res) => {
              const isBookmarked = bookmarkedIds.has(res.id);
              const flags = res.tool_flags ? res.tool_flags.split('').filter(f => f !== ',') : [];

              return (
                <tr
                  key={res.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Name and Description */}
                  <td className="py-3 px-4 max-w-xs sm:max-w-md">
                    <button
                      onClick={() => onOpenDetail(res)}
                      className="font-bold text-slate-100 group-hover:text-cyan-400 font-mono text-left transition-colors text-sm hover:underline block truncate"
                    >
                      {res.name}
                    </button>
                    <p className="text-slate-400 text-[11px] truncate mt-0.5">
                      {res.description}
                    </p>
                  </td>

                  {/* Sector */}
                  <td className="py-3 px-4 text-slate-300 font-mono shrink-0 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400">
                        {getCategoryIcon(res.category_icon, 'w-3.5 h-3.5')}
                      </span>
                      <span>{res.category_name}</span>
                    </div>
                  </td>

                  {/* Flags */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono">
                    <div className="flex items-center gap-1">
                      {flags.map((f) => (
                        <span
                          key={f}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700"
                        >
                          ({f})
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Pricing */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {res.is_free === 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                        Free
                      </span>
                    )}
                    {res.is_free === 2 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        Freemium
                      </span>
                    )}
                    {res.is_free === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                        Paid
                      </span>
                    )}
                  </td>

                  {/* Rating */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-slate-200 font-medium">
                        {res.rating_avg > 0 ? res.rating_avg.toFixed(1) : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Views */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-slate-400">
                    {res.views}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onToggleBookmark(res.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isBookmarked
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => onOpenDetail(res)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-transparent transition-all"
                        title="Inspect details"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onLaunch(res)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-mono text-xs font-semibold"
                        title="Launch link"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
