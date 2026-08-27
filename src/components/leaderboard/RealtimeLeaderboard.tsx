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

  const handleScrollToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const inputEl = document.getElementById('hero-url-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.classList.add('ring-4', 'ring-purple-500/50');
        setTimeout(() => inputEl.classList.remove('ring-4', 'ring-purple-500/50'), 2500);
      }
    }, 450);
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
            <div className="py-12 px-6 text-center rounded-3xl bg-white dark:bg-dark-900 border border-dashed border-slate-300 dark:border-dark-border shadow-sm space-y-3 max-w-xl mx-auto my-4">
              <div className="flex justify-center items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border/80 flex items-center justify-center text-slate-800 dark:text-gray-200 shadow-inner">
                  <svg
                    viewBox="0 0 100 100"
                    fill="currentColor"
                    className="w-11 h-11"
                  >
                    {/* Main Robot Body & Antenna */}
                    <path d="M92.383,39.336h-2.508v-1.186c0-9.883-8.018-17.901-17.901-17.901h-5.809v-2.821c0-3.544-3.427-6.426-7.641-6.426h-6.908 V6.466h10.886c0.501,2.456,2.678,4.311,5.28,4.311c2.971,0,5.389-2.417,5.389-5.389S70.753,0,67.782,0 c-2.204,0-4.098,1.333-4.932,3.233H48.383v7.77h-6.908c-4.214,0-7.641,2.882-7.641,6.426v2.821h-5.809 c-9.883,0-17.901,8.018-17.901,17.901v1.186H7.617c-3.544,0-6.426,3.427-6.426,7.641l0,17.049c0,4.214,2.882,7.641,6.426,7.641 h2.508v10.432c0,9.883,8.018,17.901,17.901,17.901h43.949c9.883,0,17.901-8.018,17.901-17.901V71.667h2.508 c3.544,0,6.426-3.427,6.426-7.641V46.977C98.809,42.763,95.927,39.336,92.383,39.336z M67.782,2.155c1.783,0,3.233,1.45,3.233,3.233 s-1.45,3.233-3.233,3.233c-1.783,0-3.233-1.45-3.233-3.233S65.999,2.155,67.782,2.155z M37.068,17.429 c0-2.048,1.972-3.707,4.408-3.707h17.049c2.436,0,4.408,1.659,4.408,3.707v2.821H37.068V17.429z M7.617,68.434 c-2.048,0-3.707-1.972-3.707-4.408V46.977c0-2.436,1.659-4.408,3.707-4.408h2.508v25.865H7.617z M86.642,82.099 c0,8.083-6.585,14.668-14.668,14.668H28.026c-8.083,0-14.668-6.585-14.668-14.668V38.151c0-8.083,6.585-14.668,14.668-14.668h43.949 c8.083,0,14.668,6.585,14.668,14.668V82.099z M96.09,64.026c0,2.436-1.659,4.408-3.707,4.408h-2.508V42.569h2.508 c2.048,0,3.707,1.972,3.707,4.408V64.026z" />
                    {/* Face features (Left Eye X, Right Eye O, Mouth zigzag) */}
                    <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M31 46 L43 58 M43 46 L31 58" />
                      <circle cx="63" cy="52" r="6.5" />
                      <path d="M33 74 L41 68 L49 74 L57 68 L65 74" />
                    </g>
                  </svg>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Nobody has flexed here yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Ghost town detected. Steal the <strong className="text-amber-500 font-bold">#1 Crown</strong> for just <strong className="text-purple-600 dark:text-purple-400 font-bold">€2</strong> before your rivals find this spot.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleScrollToHero}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-md hover:shadow-glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Flex your AI</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
