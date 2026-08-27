import React, { useState, useEffect, useMemo } from 'react';
import { Globe, ChevronDown, Check, Plus, Minus, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import type { Category, Product } from '../../types';

interface HeroSectionProps {
  categories: Category[];
  topProduct?: Product;
  allProducts?: Product[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ categories, topProduct, allProducts = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Global top product price
  const num1GlobalCents = topProduct?.current_bid_cents || 0;
  const globalClaimDollars = topProduct ? Math.ceil((num1GlobalCents + 100) / 100) : 2;

  const [detectedProduct, setDetectedProduct] = useState<{
    found: boolean;
    product?: Product;
    diffDollarsToClaimFirst?: number;
  } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [aiCheck, setAiCheck] = useState<{
    status: 'idle' | 'checking' | 'passed' | 'failed';
    message?: string;
  }>({ status: 'idle' });

  const productMatchesCategory = (product: Product, categoryValue: string) => {
    const category = categories.find((cat) => cat.id === categoryValue || cat.slug === categoryValue);
    return (
      product.category_id === categoryValue ||
      product.category?.id === categoryValue ||
      product.category?.slug === categoryValue ||
      Boolean(category && (
        product.category_id === category.id ||
        product.category_id === category.slug ||
        product.category?.id === category.id ||
        product.category?.slug === category.slug
      ))
    );
  };

  // Extract clean domain for live favicon
  const domain = useMemo(() => {
    if (!inputValue || !inputValue.trim()) return null;
    const clean = inputValue
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0];
    if (clean.includes('.') && clean.length > 3) {
      return clean;
    }
    return null;
  }, [inputValue]);

  // Debounced lookup when user types in URL or handle
  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 3) {
      setDetectedProduct(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/products/lookup?q=${encodeURIComponent(inputValue.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.product) {
            setDetectedProduct(data);
            // If product has a category, auto-select it if user hasn't chosen one
            if (data.product.category?.slug && !selectedCategory) {
              setSelectedCategory(data.product.category.slug);
            }
          } else {
            setDetectedProduct(null);
          }
        }
      } catch {
        setDetectedProduct(null);
      } finally {
        setIsLookingUp(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    if (!domain || detectedProduct?.found) {
      setAiCheck({ status: 'idle' });
      return;
    }

    const timer = setTimeout(async () => {
      setAiCheck({ status: 'checking' });
      try {
        const res = await fetch('/api/products/verify-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website_url: inputValue.trim(),
            name: domain.split('.')[0]?.replace(/[-_]/g, ' ') || '',
            tagline: '',
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          setAiCheck({ status: 'idle' });
          return;
        }

        setAiCheck({
          status: data.isAiProduct ? 'passed' : 'failed',
          message: data.isAiProduct
            ? 'AI signals detected'
            : 'This site does not look like an AI product',
        });
      } catch {
        setAiCheck({ status: 'idle' });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [domain, inputValue, detectedProduct]);

  // Is category selected or custom category entered?
  const hasCategory = Boolean(
    (selectedCategory && selectedCategory !== 'all') ||
    (isCustomCategory && customCategory.trim()) ||
    detectedProduct?.found
  );

  // Calculate dynamic price to claim #1 for the chosen category / domain
  const dynamicPrice = useMemo(() => {
    // 1. If detected product is already registered:
    if (detectedProduct?.found && detectedProduct.diffDollarsToClaimFirst) {
      return Math.max(2, detectedProduct.diffDollarsToClaimFirst);
    }

    // 2. If a specific category is chosen:
    if (selectedCategory && selectedCategory !== 'all' && !isCustomCategory) {
      const catProducts = allProducts.filter(
        (p) => productMatchesCategory(p, selectedCategory)
      );
      if (catProducts.length > 0) {
        const topCatCents = catProducts[0].current_bid_cents || 0;
        return Math.max(2, Math.ceil((topCatCents + 100) / 100));
      }
      return 2; // Category has no bids yet, minimum $2 to take #1
    }

    // 3. Fallback to global top price
    return Math.max(2, globalClaimDollars);
  }, [detectedProduct, selectedCategory, isCustomCategory, allProducts, globalClaimDollars]);

  // Editable user bid dollars in the Hero
  const [userBidDollars, setUserBidDollars] = useState<number>(2);

  // Sync user bid with dynamic category recommendation initially or on category change
  useEffect(() => {
    setUserBidDollars(dynamicPrice);
  }, [dynamicPrice]);

  // Projected rank based on current userBidDollars and selected category
  const projectedRank = useMemo(() => {
    const targetCents = userBidDollars * 100;
    const relevantProducts = selectedCategory && selectedCategory !== 'all' && !isCustomCategory
      ? allProducts.filter((p) => productMatchesCategory(p, selectedCategory))
      : allProducts;

    const countHigher = relevantProducts.filter(
      (p) => (p.current_bid_cents || 0) >= targetCents
    ).length;

    return countHigher + 1;
  }, [userBidDollars, selectedCategory, isCustomCategory, allProducts]);

  const handleIncrement = () => {
    setUserBidDollars((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setUserBidDollars((prev) => Math.max(2, prev - 1));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    if (!cleaned) {
      setUserBidDollars(2);
      return;
    }
    const val = parseInt(cleaned, 10);
    setUserBidDollars(val);
  };

  // Active state: Can submit if URL is entered and category is chosen (or existing product detected)
  const isAiRejected = aiCheck.status === 'failed' && !detectedProduct?.found;
  const isFormReady = Boolean(inputValue.trim().length > 2 && hasCategory && !isAiRejected && aiCheck.status !== 'checking');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setSelectedCategory('');
    } else {
      setIsCustomCategory(false);
      setSelectedCategory(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormReady) return;

    const params = new URLSearchParams();
    if (inputValue.trim()) {
      if (inputValue.includes('.') || inputValue.startsWith('http')) {
        params.set('url', inputValue.trim());
      } else {
        params.set('name', inputValue.trim());
      }
    }

    if (isCustomCategory && customCategory.trim()) {
      params.set('custom_category', customCategory.trim());
    } else if (selectedCategory) {
      params.set('category', selectedCategory);
    }

    params.set('bid', userBidDollars.toString());
    window.location.href = `/submit?${params.toString()}`;
  };

  return (
    <section className="relative pt-2 pb-5 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="relative text-center max-w-3xl mx-auto space-y-3">
        {/* Creator / Twitter pill */}
        <div className="flex justify-center">
          <a
            href="https://x.com/ByManuuDB"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-dark-900 border border-slate-200 dark:border-dark-border text-slate-700 dark:text-gray-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors shadow-sm group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Created by <strong className="group-hover:underline">@ByManuuDB</strong></span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-purple-500 transition-colors" />
          </a>
        </div>

        {/* Main Title - Seamless Inline Editable Stepper in EUR */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center flex-wrap gap-2.5">
          <span>Claim #{projectedRank} for</span>
          <div className="inline-flex items-center gap-1.5 align-middle">
            {/* Minus Button */}
            <button
              type="button"
              onClick={handleDecrement}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-purple-100 dark:bg-dark-800 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition-all font-bold cursor-pointer shadow-xs"
              aria-label="Decrease price"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Seamless Inline Price - Pure text look without bars or browser arrows */}
            <div className="inline-flex items-center relative px-0.5 group">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-300 dark:to-blue-400 font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl font-mono">
                €
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userBidDollars}
                onChange={handlePriceChange}
                style={{ width: `${Math.max(1, String(userBidDollars).length) * 1.5 + 0.1}ch` }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-300 dark:to-blue-400 font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl font-mono text-center bg-transparent border-0 outline-none p-0 cursor-pointer focus:outline-none focus:ring-0 select-all"
              />
            </div>

            {/* Plus Button */}
            <button
              type="button"
              onClick={handleIncrement}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-purple-100 dark:bg-dark-800 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition-all font-bold cursor-pointer shadow-xs"
              aria-label="Increase price"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </h1>

        {/* Subheading */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 font-medium">
          New spots start at €2. Paying less than the #1 price still puts you on the board at whatever place that bid can take.
        </p>

        {/* Interactive Fast Input Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-2 max-w-3xl mx-auto p-1.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border shadow-sm flex flex-col sm:flex-row items-center gap-2"
        >
          {/* Input field with dynamic Favicon */}
          <div className="relative flex-[1.6] w-full flex items-center min-w-[200px]">
            <div className="absolute left-3.5 flex items-center justify-center pointer-events-none w-5 h-5">
              {domain ? (
                <img
                  src={detectedProduct?.product?.logo_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Your AI software URL or @handle..."
              className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors font-medium"
            />
          </div>

          {/* Category selector / Custom input */}
          <div className="relative w-full sm:w-48">
            {isCustomCategory ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type AI category..."
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-purple-400 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors font-medium"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCustomCategory('');
                  }}
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline shrink-0 px-1 font-bold"
                  title="Choose from list"
                >
                  List
                </button>
              </div>
            ) : (
              <>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full appearance-none bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-purple-500 cursor-pointer transition-colors font-medium"
                >
                  <option value="">Choose a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                      {cat.name}
                    </option>
                  ))}
                  <option value="__custom__" className="font-bold text-purple-600">
                    + Add custom category...
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </>
            )}
          </div>

          {/* CTA Button */}
          <button
            type="submit"
            disabled={!isFormReady}
            className={`w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
              isFormReady
                ? 'text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-glow-purple border border-purple-400/30 cursor-pointer'
                : 'text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-border cursor-not-allowed opacity-70'
            }`}
          >
            {isFormReady ? `Claim #${projectedRank} for €${userBidDollars}` : 'Flex AI Software'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Every new listing is automatically checked for real AI signals before checkout.</span>
        </div>

        {/* Existing Product Auto-Detected Badge */}
        {detectedProduct?.found && detectedProduct.product && (
          <div className="p-2.5 max-w-xl mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>
                <strong>{detectedProduct.product.name}</strong> detected (Rank #{detectedProduct.product.rank || 1} with €{Math.round((detectedProduct.product.current_bid_cents || 0) / 100)} staked).
              </span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-2">
              Pay €{detectedProduct.diffDollarsToClaimFirst} to be #1
            </span>
          </div>
        )}

        {!detectedProduct?.found && aiCheck.status !== 'idle' && (
          <div
            className={`p-2.5 max-w-xl mx-auto rounded-xl border text-xs flex flex-col items-center justify-center gap-1 text-center ${
              aiCheck.status === 'failed'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {aiCheck.status === 'checking' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : aiCheck.status === 'failed' ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-500 shrink-0" />
              )}
              <span>
                {aiCheck.status === 'checking'
                  ? 'Analyzing website for AI software signals...'
                  : aiCheck.message}
              </span>
            </div>

            {aiCheck.status === 'failed' && (
              <p className="text-[11px] text-slate-600 dark:text-gray-400 mt-0.5">
                Is your product built with AI? Contact{' '}
                <a
                  href="mailto:flexai.lol@gmail.com?subject=Manual%20AI%20Domain%20Verification%20Request"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5"
                >
                  flexai.lol@gmail.com
                </a>{' '}
                for instant manual approval.
              </p>
            )}
          </div>
        )}

        {/* Trust mechanic badges - Compact */}
        <div className="pt-1 flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-xs text-slate-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Instant leaderboard update</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>One-time bids</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>No monthly fees</span>
          </div>
        </div>
      </div>
    </section>
  );
};
