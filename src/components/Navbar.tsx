import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bookmark,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Shield,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Terminal
} from 'lucide-react';
import { Resource } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  bookmarkCount: number;
  bookmarkedOnly: boolean;
  onToggleBookmarkedOnly: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  allResources: Resource[];
  onSelectResource: (resource: Resource) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isDark,
  onToggleTheme,
  bookmarkCount,
  bookmarkedOnly,
  onToggleBookmarkedOnly,
  onOpenAdmin,
  isAdminLoggedIn,
  allResources,
  onSelectResource
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [autocompleteMatches, setAutocompleteMatches] = useState<Resource[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener for '/' and 'Ctrl+K' / 'Cmd+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement !== searchInputRef.current)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update autocomplete matches on query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setAutocompleteMatches([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = allResources
      .filter(r => r.name.toLowerCase().includes(q) || (r.tags && r.tags.some(t => t.toLowerCase().includes(q))))
      .slice(0, 6);
    setAutocompleteMatches(matches);
  }, [searchQuery, allResources]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 border-slate-800/80 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Terminal className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                OSINT<span className="text-cyan-400">.</span>EXPLORER
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Global Public Intelligence Platform
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-xl mx-2">
          <div className={`relative flex items-center w-full rounded-lg border transition-all duration-200 ${
            isSearchFocused
              ? 'border-cyan-400/80 ring-2 ring-cyan-400/20 bg-slate-900'
              : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
          }`}>
            <Search className="w-4 h-4 ml-3 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              id="global-osint-search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search 200+ OSINT tools, Google dorks, datasets, tags..."
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-200"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/90 rounded border border-slate-700/60">
                <span>⌘</span>K
              </kbd>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && autocompleteMatches.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60"
            >
              <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 bg-slate-950/60 flex items-center justify-between">
                <span>Quick Matches</span>
                <span>{autocompleteMatches.length} suggested</span>
              </div>
              {autocompleteMatches.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    onSelectResource(res);
                    setIsSearchFocused(false);
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                        {res.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                        {res.category_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {res.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Favorites Filter Button */}
          <button
            id="navbar-favorites-btn"
            onClick={onToggleBookmarkedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              bookmarkedOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
            }`}
            title="Toggle Favorites Only"
          >
            <Bookmark className={`w-4 h-4 ${bookmarkedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Bookmarks</span>
            {bookmarkCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                bookmarkedOnly ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-300'
              }`}>
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Grid / List View Toggle */}
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              id="viewmode-grid-btn"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="viewmode-list-btn"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Admin Portal Button */}
          <button
            id="navbar-admin-btn"
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isAdminLoggedIn
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-slate-100'
            }`}
            title="Admin Console"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isAdminLoggedIn ? 'Admin Panel' : 'Admin'}
            </span>
          </button>

        </div>

      </div>
    </header>
  );
};
