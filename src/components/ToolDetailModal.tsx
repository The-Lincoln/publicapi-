import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Star,
  Eye,
  Shield,
  Copy,
  Check,
  Info,
  Terminal,
  Layers,
  ArrowRight,
  AlertTriangle,
  FileCode
} from 'lucide-react';
import { Resource } from '../types';
import { getCategoryIcon } from '../utils/iconMap';

interface ToolDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: number) => void;
  onLaunch: (resource: Resource) => void;
  onRatingSubmit: (resourceId: number, score: number) => Promise<void>;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  resource,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onLaunch,
  onRatingSubmit
}) => {
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  if (!resource) return null;

  const flags = resource.tool_flags ? resource.tool_flags.split('').filter(f => f !== ',') : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRate = async (score: number) => {
    try {
      setRatingLoading(true);
      setUserScore(score);
      await onRatingSubmit(resource.id, score);
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit rating', err);
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Cyber Gradient Accent */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30">
          <div className="flex items-start justify-between gap-4">
            
            <div>
              {/* Category Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                <span>{getCategoryIcon(resource.category_icon, 'w-3.5 h-3.5')}</span>
                <span>OSINT Framework</span>
                <span>/</span>
                <span className="text-slate-300">{resource.category_name}</span>
              </div>

              {/* Tool Name */}
              <h2 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>{resource.name}</span>
              </h2>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* Badges Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {/* Pricing Badge */}
            {resource.is_free === 1 && (
              <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-800/60">
                100% Free Public Tool
              </span>
            )}
            {resource.is_free === 2 && (
              <span className="px-2.5 py-1 rounded-md font-semibold bg-blue-950/90 text-blue-300 border border-blue-800/60">
                Freemium (Free Tier Available)
              </span>
            )}
            {resource.is_free === 0 && (
              <span className="px-2.5 py-1 rounded-md font-semibold bg-amber-950/90 text-amber-300 border border-amber-800/60">
                Commercial / Paid Tool
              </span>
            )}

            {/* Flag Badges */}
            {flags.includes('T') && (
              <span className="px-2 py-1 rounded-md font-mono text-xs bg-purple-950/80 text-purple-300 border border-purple-800/60">
                (T) Script / Local Tool
              </span>
            )}
            {flags.includes('D') && (
              <span className="px-2 py-1 rounded-md font-mono text-xs bg-amber-950/80 text-amber-300 border border-amber-800/60">
                (D) Google Search Dork
              </span>
            )}
            {flags.includes('R') && (
              <span className="px-2 py-1 rounded-md font-mono text-xs bg-blue-950/80 text-blue-300 border border-blue-800/60">
                (R) Requires Registration
              </span>
            )}
            {flags.includes('M') && (
              <span className="px-2 py-1 rounded-md font-mono text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                (M) Manual URL Parameter
              </span>
            )}

            {/* Views counter */}
            <span className="ml-auto font-mono text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{resource.views} launches</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Direct URL / Dork syntax bar */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Target Resource Endpoint / Search Syntax
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
              <code className="text-xs font-mono text-cyan-300 flex-1 truncate px-2 select-all">
                {resource.url}
              </code>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Resource Summary
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
              {resource.description}
            </p>
          </div>

          {/* Usage Context */}
          {resource.usage_context && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Investigative Workflow & Application</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {resource.usage_context}
              </p>
            </div>
          )}

          {/* Input & Output Specifications */}
          {resource.input_output && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Input & Output Specification</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-300">
                {resource.input_output}
              </div>
            </div>
          )}

          {/* Operational Security (OPSEC) Notes */}
          {resource.opsec_notes && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                    OPSEC & Privacy Advisory
                  </h4>
                  <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                    {resource.opsec_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Associated Classification Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {resource.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Rating Box */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/50 p-4 rounded-xl border">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {resource.rating_avg > 0 ? resource.rating_avg.toFixed(1) : 'Unrated'}
                </span>
                <span className="text-xs text-slate-400">
                  ({resource.rating_count} community reviews)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a star to submit your rating for this resource
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = (hoverRating !== null ? hoverRating >= star : (userScore ? userScore >= star : resource.rating_avg >= star));
                return (
                  <button
                    key={star}
                    disabled={ratingLoading}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => handleRate(star)}
                    className="p-1 text-slate-600 hover:scale-125 transition-transform"
                    title={`Rate ${star} stars`}
                  >
                    <Star className={`w-6 h-6 ${isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
              {ratingSuccess && (
                <span className="text-xs font-mono text-emerald-400 ml-2 animate-fade-in">
                  Thanks for rating!
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          
          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(resource.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}</span>
          </button>

          {/* Launch External Link Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onLaunch(resource)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
            >
              <span>Open Tool</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
