import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroStats } from './components/HeroStats';
import { CategorySidebar } from './components/CategorySidebar';
import { FilterBar } from './components/FilterBar';
import { ResourceCard } from './components/ResourceCard';
import { ResourceList } from './components/ResourceList';
import { ToolDetailModal } from './components/ToolDetailModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { Category, Resource } from './types';
import {
  FolderSearch,
  SearchX,
  RefreshCw,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Master data
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allResourcesUnfiltered, setAllResourcesUnfiltered] = useState<Resource[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [activeType, setActiveType] = useState<string>(''); // '', 'T', 'D', 'R', 'M'
  const [activeCost, setActiveCost] = useState<string>('all'); // 'all', 'free', 'freemium', 'paid'
  const [activeSort, setActiveSort] = useState<string>('views');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);

  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState<number>(24);

  // Modals
  const [activeDetailResource, setActiveDetailResource] = useState<Resource | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('osint_admin_token'));

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  // Initial load: categories, bookmarks, and all resources for quick search & stats
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch filtered resources whenever filters change
  useEffect(() => {
    fetchFilteredResources();
  }, [selectedCategory, searchQuery, selectedTag, activeType, activeCost, activeSort, bookmarkedOnly]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catsRes, bkmkRes, allRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/bookmarks'),
        fetch('/api/resources')
      ]);

      const [catsData, bkmkData, allData] = await Promise.all([
        catsRes.json(),
        bkmkRes.json(),
        allRes.json()
      ]);

      if (catsData.success) {
        setCategories(catsData.data);
      }
      if (bkmkData.success) {
        setBookmarkedIds(new Set(bkmkData.data));
      }
      if (allData.success) {
        setAllResourcesUnfiltered(allData.data);
      }
    } catch (err: any) {
      console.error('Initial data fetch error', err);
      setError('Could not connect to OSINT backend. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedTag.trim()) params.append('tag', selectedTag.trim());
      if (activeType) params.append('type', activeType);
      if (activeCost && activeCost !== 'all') params.append('cost', activeCost);
      if (activeSort) params.append('sort', activeSort);
      if (bookmarkedOnly) params.append('bookmarked', 'true');

      const res = await fetch(`/api/resources?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setResources(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to query resources');
      }
    } catch (err: any) {
      console.error('Resource fetch error', err);
      setError('Error communicating with database API');
    } finally {
      setLoading(false);
    }
  };

  // Extract all unique tags for the tag cloud
  const availableTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allResourcesUnfiltered) {
      if (r.tags && Array.isArray(r.tags)) {
        for (const t of r.tags) {
          const clean = t.trim().toLowerCase();
          if (clean) {
            map.set(clean, (map.get(clean) || 0) + 1);
          }
        }
      }
    }
    // Sort by frequency
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }, [allResourcesUnfiltered]);

  // Actions
  const handleToggleBookmark = async (id: number) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: id })
      });
      const data = await res.json();
      if (data.success) {
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          if (data.bookmarked) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  const handleLaunch = async (resource: Resource) => {
    try {
      // Fire-and-forget view increment
      fetch(`/api/resources/${resource.id}/view`, { method: 'POST' }).catch(() => {});
      
      // Update local view count
      setResources(prev =>
        prev.map(r => r.id === resource.id ? { ...r, views: r.views + 1 } : r)
      );
      setAllResourcesUnfiltered(prev =>
        prev.map(r => r.id === resource.id ? { ...r, views: r.views + 1 } : r)
      );

      // Open URL safely in new window
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRatingSubmit = async (resourceId: number, score: number) => {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, score })
    });
    const json = await res.json();
    if (json.success) {
      const updatedStats = json.data;
      // Update resource in state
      setResources(prev =>
        prev.map(r => r.id === resourceId ? { ...r, rating_avg: updatedStats.rating_avg, rating_count: updatedStats.rating_count } : r)
      );
      setAllResourcesUnfiltered(prev =>
        prev.map(r => r.id === resourceId ? { ...r, rating_avg: updatedStats.rating_avg, rating_count: updatedStats.rating_count } : r)
      );
      if (activeDetailResource && activeDetailResource.id === resourceId) {
        setActiveDetailResource(prev => prev ? {
          ...prev,
          rating_avg: updatedStats.rating_avg,
          rating_count: updatedStats.rating_count
        } : null);
      }
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (activeType) params.append('type', activeType);
    if (activeCost && activeCost !== 'all') params.append('cost', activeCost);

    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedTag('');
    setActiveType('');
    setActiveCost('all');
    setBookmarkedOnly(false);
  };

  const handleResourceCreatedOrUpdated = () => {
    fetchInitialData();
    fetchFilteredResources();
  };

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('osint_admin_token', token);
  };

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('osint_admin_token');
  };

  // Paginated visible resources
  const visibleResources = resources.slice(0, pageLimit);
  const hasMore = resources.length > pageLimit;

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        bookmarkCount={bookmarkedIds.size}
        bookmarkedOnly={bookmarkedOnly}
        onToggleBookmarkedOnly={() => setBookmarkedOnly(!bookmarkedOnly)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminLoggedIn={!!adminToken}
        allResources={allResourcesUnfiltered}
        onSelectResource={(r) => setActiveDetailResource(r)}
      />

      {/* Hero & Metrics Dashboard */}
      <HeroStats
        totalCount={allResourcesUnfiltered.length}
        totalCategories={categories.length}
        filteredCount={resources.length}
        allResources={allResourcesUnfiltered}
        activeType={activeType}
        activeCost={activeCost}
        onSelectTypeFilter={(t) => setActiveType(t)}
        onSelectCostFilter={(c) => setActiveCost(c)}
        onResetFilters={handleClearAllFilters}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* Left: Category Tree & Tag Cloud Sidebar */}
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(slug) => setSelectedCategory(slug)}
            selectedTag={selectedTag}
            onSelectTag={(tag) => setSelectedTag(tag)}
            availableTags={availableTags}
            totalResourcesCount={allResourcesUnfiltered.length}
          />

          {/* Right: Filter Bar & Resource Results */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
            
            {/* Filter & Sort Controls */}
            <FilterBar
              selectedCategory={selectedCategory}
              categories={categories}
              searchQuery={searchQuery}
              selectedTag={selectedTag}
              activeType={activeType}
              activeCost={activeCost}
              activeSort={activeSort}
              bookmarkedOnly={bookmarkedOnly}
              totalFilteredCount={resources.length}
              onClearCategory={() => setSelectedCategory('all')}
              onClearSearch={() => setSearchQuery('')}
              onClearTag={() => setSelectedTag('')}
              onClearAll={handleClearAllFilters}
              onTypeChange={(t) => setActiveType(t)}
              onCostChange={(c) => setActiveCost(c)}
              onSortChange={(s) => setActiveSort(s)}
              onExport={handleExport}
            />

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && resources.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="font-mono text-xs">Querying intelligence database...</span>
              </div>
            ) : resources.length === 0 ? (
              /* Empty State */
              <div className="py-16 px-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center">
                <div className="p-4 rounded-2xl bg-slate-950 text-slate-400 border border-slate-800 mb-4">
                  <SearchX className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-base font-bold font-mono text-slate-200">
                  No Matching OSINT Intelligence Found
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-md">
                  No resources match your active filter criteria. Try clearing tags, expanding to all categories, or refining search keywords.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="mt-5 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-mono font-semibold transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              /* Results List / Grid */
              <div className="space-y-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {visibleResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        isBookmarked={bookmarkedIds.has(resource.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onOpenDetail={(r) => setActiveDetailResource(r)}
                        onLaunch={handleLaunch}
                      />
                    ))}
                  </div>
                ) : (
                  <ResourceList
                    resources={visibleResources}
                    bookmarkedIds={bookmarkedIds}
                    onToggleBookmark={handleToggleBookmark}
                    onOpenDetail={(r) => setActiveDetailResource(r)}
                    onLaunch={handleLaunch}
                  />
                )}

                {/* "Load More" Pagination Control */}
                {hasMore && (
                  <div className="pt-6 pb-2 text-center">
                    <button
                      onClick={() => setPageLimit(prev => prev + 24)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-800 font-mono text-xs font-semibold transition-all shadow-sm"
                    >
                      <span>Load More Resources ({resources.length - pageLimit} remaining)</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Tool Detail Dossier Modal */}
      {activeDetailResource && (
        <ToolDetailModal
          resource={activeDetailResource}
          onClose={() => setActiveDetailResource(null)}
          isBookmarked={bookmarkedIds.has(activeDetailResource.id)}
          onToggleBookmark={handleToggleBookmark}
          onLaunch={handleLaunch}
          onRatingSubmit={handleRatingSubmit}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        categories={categories}
        allResources={allResourcesUnfiltered}
        isAdminLoggedIn={!!adminToken}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onResourceCreatedOrUpdated={handleResourceCreatedOrUpdated}
      />

      {/* Footer */}
      <Footer
        onExport={handleExport}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

    </div>
  );
}
