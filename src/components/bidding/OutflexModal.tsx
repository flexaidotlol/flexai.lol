import React, { useState, useEffect } from 'react';
import { X, Sparkles, Zap, ShieldCheck, ArrowRight, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import type { Product } from '../../types';
import { centsToDollars, formatCompactDollars } from '../../lib/utils/format';

interface OutflexModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialBidDollars?: number;
}

export const OutflexModal: React.FC<OutflexModalProps> = ({
  product,
  isOpen,
  onClose,
  initialBidDollars,
}) => {
  const [bidAmountDollars, setBidAmountDollars] = useState<number>(initialBidDollars || 2);
  const [userEmail, setUserEmail] = useState<string>('');
  const [expectedRank, setExpectedRank] = useState<number | null>(null);
  const [minimumOutflexDollars, setMinimumOutflexDollars] = useState<number>(initialBidDollars || 2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default recommendation when modal opens
  useEffect(() => {
    if (product) {
      const minDollars = initialBidDollars || 2;
      setMinimumOutflexDollars(minDollars);
      setBidAmountDollars(minDollars);
    }
  }, [product, initialBidDollars]);

  // Fetch dynamic rank calculation preview
  useEffect(() => {
    if (!isOpen || !product) return;

    const fetchCalculation = async () => {
      setIsLoading(true);
      try {
        const cumulativeCents = product.current_bid_cents + (bidAmountDollars * 100);
        const res = await fetch(`/api/bids/calculate?amount=${cumulativeCents}&category_id=${product.category_id}`);
        if (res.ok) {
          const data = await res.json();
          const remainingCents = data.cents_to_number_one || 0;
          const requiredDollars = Math.max(2, bidAmountDollars + Math.ceil(remainingCents / 100));
          setMinimumOutflexDollars(requiredDollars);
          setExpectedRank(data.expected_rank);
        }
      } catch {
        // silent fallback
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchCalculation, 200);
    return () => clearTimeout(timer);
  }, [bidAmountDollars, isOpen, product]);

  useEffect(() => {
    if (isOpen && product && bidAmountDollars < minimumOutflexDollars) {
      setBidAmountDollars(minimumOutflexDollars);
    }
  }, [minimumOutflexDollars, bidAmountDollars, isOpen, product]);

  if (!isOpen || !product) return null;

  const currentBidDollars = product.current_bid_cents / 100;
  const newTotalDollars = currentBidDollars + bidAmountDollars;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/bids/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          amount_cents: bidAmountDollars * 100,
          user_email: userEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border shadow-2xl p-6 sm:p-8 overflow-hidden transition-colors">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-600/25 blur-3xl rounded-full pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border p-1.5 flex items-center justify-center overflow-hidden shrink-0">
            {product.logo_url ? (
              <img src={product.logo_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Flex {product.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold">
                Current: #{product.rank || 1}
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400">Boost ranking stake with a one-time bid</p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-5">
          {/* Bid Amount Input & Quick Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
              Bid Increase (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 dark:text-gray-400">$</span>
              <input
                type="number"
                min={minimumOutflexDollars}
                step="1"
                value={bidAmountDollars}
                onChange={(e) => setBidAmountDollars(Math.max(minimumOutflexDollars, parseInt(e.target.value) || minimumOutflexDollars))}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-slate-700 focus:border-purple-500 rounded-xl text-xl font-bold text-slate-900 dark:text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Preset increment chips */}
            <div className="flex items-center gap-2 mt-3">
              {[minimumOutflexDollars, 5, 10, 25, 50]
                .filter((preset, index, values) => preset >= minimumOutflexDollars && values.indexOf(preset) === index)
                .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBidAmountDollars(preset)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    bidAmountDollars === preset
                      ? 'bg-purple-600 text-white shadow-glow-purple border-purple-500'
                      : 'bg-slate-100 dark:bg-dark-800 border-slate-200 dark:border-dark-border text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  +${preset}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-2">
              Minimum to claim #1 in this category: <strong>${minimumOutflexDollars}</strong>. Higher custom bids are allowed.
            </p>
          </div>

          {/* Dynamic Rank Projection Card */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-dark-950/80 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-gray-400">Current Position:</span>
              <span className="font-semibold text-slate-900 dark:text-white">#{product.rank || 1} ({centsToDollars(product.current_bid_cents)})</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-gray-400">New Total Bid Stake:</span>
              <span className="font-bold text-purple-700 dark:text-purple-300">{centsToDollars(newTotalDollars * 100)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-dark-border flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">Expected Position:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>#{expectedRank || product.rank || 1}</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 italic">
              * Rankings are calculated atomically upon confirmed payment confirmation.
            </p>
          </div>

          {/* Optional notification email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-1.5">
              Receipt & Outbid Alert Email (Optional)
            </label>
            <input
              type="email"
              placeholder="founder@yourcompany.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors font-medium"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-glow-purple border border-purple-400/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to Stripe...</span>
              </>
            ) : (
              <>
                <span>Flex my AI for ${bidAmountDollars}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
