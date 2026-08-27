import React, { useState, useEffect } from 'react';
import { LayoutGrid, Search, Sparkles, Filter, RefreshCw, Crown } from 'lucide-react';
import type { Product, Category } from '../../types';
import { LeaderboardCard } from './LeaderboardCard';
import { OutflexModal } from '../bidding/OutflexModal';
import { CategoryIcon } from '../ui/Icons';
import { centsToDollars, formatCompactDollars } from '../../lib/utils/format';
import { supabaseClient } from '../../lib/supabase/client';

interface RealtimeLeaderboardProps {
  initialProducts: Product[];
  categories: Category[];
  initialCategorySlug?: string;
}

export const RealtimeLeaderboard: React.FC<RealtimeLeaderboardProps> = ({
  initialProducts,
  categories,
  initialCategorySlug = 'all',
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOutflexProduct, setActiveOutflexProduct] = useState<Product | null>(null);
  const [outflexInitialDollars, setOutflexInitialDollars] = useState<number | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const productsInCategory = (category: Category) =>
    products.filter(
      (product) =>
        product.category_id === category.id ||
        product.category_id === category.slug ||
        product.category?.id === category.id ||
        product.category?.slug === category.slug
    );

  const categoryBidCents = (category: Category) =>
    productsInCategory(category).reduce((sum, product) => sum + (product.current_bid_cents || 0), 0);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (slug === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', slug);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Filter products by selected category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      product.category_id === selectedCategory ||
      product.category?.slug === selectedCategory ||
      product.category?.id === selectedCategory ||
      categories.some(
        (c) =>
          (c.slug === selectedCategory || c.id === selectedCategory) &&
          (c.id === product.category_id || c.slug === product.category_id)
      );

    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(product.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    return Boolean(matchesCategory && matchesSearch);
  });

  // Calculate real totals from currently loaded products so live bid updates cannot show stale category values.
  const totalBidsCents = products.reduce((sum, product) => sum + (product.current_bid_cents || 0), 0);

  // Fetch updated leaderboard
  const refreshLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/leaderboard?category=all');
      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      }
    } catch {
      // silent fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  // Supabase Realtime Listener + Fallback Periodic Sync
  useEffect(() => {
    const client = supabaseClient;
    if (client) {
      const channel = client
        .channel('realtime-leaderboard')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            refreshLeaderboard();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } else {
      // Periodic fallback sync for dynamic activity
      const timer = setInterval(refreshLeaderboard, 10000);
      return () => clearInterval(timer);
    }
  }, []);

  const isMilestone = (rank: number) => {
    return rank === 3 || rank === 10 || rank === 30 || rank === 50 || rank === 100;
  };

  const getMilestoneLabel = (rank: number) => {
    if (rank === 3) return 'Top 3 Podium';
    if (rank === 10) return 'Top 10';
    if (rank === 30) return 'Top 30';
    if (rank === 50) return 'Top 50';
    if (rank === 100) return 'Top 100';
    return `Top ${rank}`;
  };

  const handleClaimRank = (product: Product, claimDollars: number) => {
    setOutflexInitialDollars(claimDollars);
    setActiveOutflexProduct(product);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Outflex Modal */}
      <OutflexModal
        product={activeOutflexProduct}
        isOpen={Boolean(activeOutflexProduct)}
        onClose={() => {
          setActiveOutflexProduct(null);
          setOutflexInitialDollars(undefined);
        }}
        initialBidDollars={outflexInitialDollars}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* =========================================================================
            LEFT SIDEBAR: CATEGORY NAVIGATION (Desktop Sidebar / Tablet & Mobile Scroll)
           ========================================================================= */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-20 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border p-3 sm:p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Categories</span>
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{categories.length} niches</span>
            </div>

            {/* Mobile Category Horizontal Scroll */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All</span>
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug || selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Vertical Category List - Clean & Flat */}
            <div className="hidden lg:flex flex-col space-y-0.5">
              {/* All Categories Item */}
              <button
                onClick={() => handleCategorySelect('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutGrid className={`w-4 h-4 shrink-0 ${selectedCategory === 'all' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-gray-500'}`} />
                  <span className="truncate">All Categories</span>
                </div>
                <span className={`text-xs font-mono font-bold shrink-0 ${selectedCategory === 'all' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-gray-500'}`}>
                  {centsToDollars(totalBidsCents)}
                </span>
              </button>

              {/* Individual Category Items */}
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug || selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon name={cat.icon} className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-gray-500'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <span className={`text-xs font-mono shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-400 dark:text-gray-500'}`}>
                      {formatCompactDollars(categoryBidCents(cat))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* =========================================================================
            MAIN AREA: LEADERBOARD LIST
           ========================================================================= */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-3">
          {/* Cards List */}
          {filteredProducts.length > 0 ? (
            <div className="space-y-3">
              {filteredProducts.map((product, index) => {
                const rank = product.rank || index + 1;
                const claimPriceDollars = Math.max(2, Math.ceil(((product.current_bid_cents || 0) + 100) / 100));
                const showMilestone = isMilestone(rank) && index < filteredProducts.length - 1;

                return (
                  <React.Fragment key={product.id}>
                    {/* In-Between Quick "Claim this rank for $X" Pill */}
                    {index > 0 && (
                      <div className="relative flex justify-center -my-1 z-10">
                        <button
                          type="button"
                          onClick={() => handleClaimRank(product, claimPriceDollars)}
                          className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-dark-850 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-xs hover:shadow-glow-purple transition-all duration-150 cursor-pointer group"
                        >
                          <span className="text-purple-500 dark:text-purple-400 group-hover:text-white">claim this rank for</span>
                          <span className="text-purple-900 dark:text-purple-200 group-hover:text-white">€{claimPriceDollars.toLocaleString()}</span>
                        </button>
                      </div>
                    )}

                    <LeaderboardCard
                      product={product}
                      rank={rank}
                      onOutflexClick={(p) => handleClaimRank(p, claimPriceDollars)}
                    />

                    {/* Milestone Dividers (Top 3, Top 10, Top 30, Top 50, Top 100...) */}
                    {showMilestone && (
                      <div className="flex items-center gap-3 py-3 my-1">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-slate-200 dark:to-slate-800" />
                        <span className="px-3.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-dark-border shadow-xs uppercase flex items-center gap-1.5">
                          {rank === 3 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          <span>{getMilestoneLabel(rank)}</span>
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-300 dark:via-slate-700 to-slate-200 dark:to-slate-800" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No products found</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Be the first to claim #1 in this category!</p>
              <a
                href="/submit"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm hover:from-purple-500 hover:to-indigo-500 transition-all"
              >
                List Your AI Now
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
