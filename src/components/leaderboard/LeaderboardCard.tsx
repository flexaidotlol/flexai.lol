import React from 'react';
import { Crown, CheckCircle2, TrendingUp, TrendingDown, ExternalLink, ArrowUpRight, Sparkles } from 'lucide-react';
import type { Product } from '../../types';
import { centsToDollars, formatCompactNumber, formatRelativeTime, formatDomain } from '../../lib/utils/format';

interface LeaderboardCardProps {
  product: Product;
  rank: number;
  onOutflexClick?: (product: Product) => void;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ product, rank, onOutflexClick }) => {
  const isTop1 = rank === 1;
  const isTop2 = rank === 2;
  const isTop3 = rank === 3;

  const currentBidFormatted = centsToDollars(product.current_bid_cents);
  const domain = formatDomain(product.website_url);
  const relativeTime = formatRelativeTime(product.updated_at || product.created_at);
  const clickCount = formatCompactNumber(product.total_clicks);

  // Bid movement
  const bidChange = product.bid_change_cents || 0;
  const isPositive = bidChange >= 0;

  return (
    <div
      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 bg-white dark:bg-dark-900 ${
        isTop1
          ? 'border-2 border-amber-400 dark:border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_28px_rgba(251,191,36,0.35)]'
          : isTop2
          ? 'border border-slate-300 dark:border-slate-600 shadow-[0_0_12px_rgba(148,163,184,0.15)] hover:border-slate-400'
          : isTop3
          ? 'border border-amber-700/40 dark:border-amber-600/40 shadow-[0_0_10px_rgba(194,65,12,0.12)] hover:border-amber-600'
          : 'border border-slate-200 dark:border-dark-border hover:border-purple-400/40 shadow-xs'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Rank + Logo + Details */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Rank Badge: Crowns for Top 3 (No numbers), Normal Numbers for Rank 4+ */}
          <div className="relative shrink-0 flex items-center justify-center">
            {isTop1 ? (
              <div
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.6)]"
                title="Rank #1 Champion (Gold Crown)"
              >
                <Crown className="w-6 h-6 text-dark-950 fill-dark-950 drop-shadow-xs" />
              </div>
            ) : isTop2 ? (
              <div
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-100 flex items-center justify-center shadow-[0_0_12px_rgba(148,163,184,0.4)]"
                title="Rank #2 (Silver Crown)"
              >
                <Crown className="w-5 h-5 text-slate-900 fill-slate-900" />
              </div>
            ) : isTop3 ? (
              <div
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-800 via-amber-600 to-orange-400 flex items-center justify-center shadow-[0_0_10px_rgba(194,65,12,0.35)]"
                title="Rank #3 (Bronze Crown)"
              >
                <Crown className="w-5 h-5 text-white fill-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border text-slate-600 dark:text-gray-400 font-bold text-xs flex items-center justify-center">
                #{rank}
              </div>
            )}
          </div>

          {/* Product Logo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
            {product.logo_url ? (
              <img
                src={product.logo_url}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{product.name.charAt(0)}</span>
            )}
          </div>

          {/* Info & Tagline */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <a
                href={`/ai/${product.slug}`}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 transition-colors flex items-center gap-1.5"
              >
                <span>{product.name}</span>
                {product.is_verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />
                )}
              </a>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 line-clamp-1 mt-0.5 font-normal">
              {product.tagline}
            </p>

            {/* Sub-bar metadata */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs text-slate-500 dark:text-gray-400">
              {product.category && (
                <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                  <span>#{product.highest_rank || 1} in {product.category.name}</span>
                </span>
              )}

              <span>{relativeTime}</span>

              <a
                href={`/go/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300 transition-colors flex items-center gap-1 hover:underline font-medium"
              >
                <span>{domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <span className="font-semibold text-slate-700 dark:text-gray-300">{clickCount} clicks</span>

              <a
                href={`/ai/${product.slug}`}
                className="text-purple-600 dark:text-purple-400 hover:underline font-bold transition-colors"
              >
                see details
              </a>
            </div>
          </div>
        </div>

        {/* Right Section: Bid Amount + Change + Outflex Action */}
        <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-dark-border/50 shrink-0">
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {currentBidFormatted}
            </div>

            {bidChange !== 0 ? (
              <div
                className={`text-xs font-semibold flex items-center justify-end gap-0.5 mt-0.5 ${
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{centsToDollars(Math.abs(bidChange))}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 dark:text-gray-400 font-medium mt-0.5">verified bid</div>
            )}
          </div>

          {/* Outflex Action Button */}
          {onOutflexClick && (
            <button
              onClick={() => onOutflexClick(product)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-dark-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white border border-slate-300 dark:border-dark-border hover:border-purple-400/40 transition-all shadow-sm"
            >
              Outflex
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
