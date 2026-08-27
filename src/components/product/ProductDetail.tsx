import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Award,
  History,
  Share2,
  Copy,
  Check,
  Flame,
  ArrowUpRight,
  MousePointerClick,
  Calendar,
  Twitter
} from 'lucide-react';
import type { Product, Achievement, ProductAchievement } from '../../types';
import { centsToDollars, formatCompactNumber, formatDomain, formatRelativeTime } from '../../lib/utils/format';
import { OutflexModal } from '../bidding/OutflexModal';

interface ProductDetailProps {
  product: Product;
  achievements?: ProductAchievement[];
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, achievements = [] }) => {
  const [isOutflexOpen, setIsOutflexOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const domain = formatDomain(product.website_url);
  const bidFormatted = centsToDollars(product.current_bid_cents);
  const clicksFormatted = formatCompactNumber(product.total_clicks);

  const shareText = `Check out ${product.name} at #${product.rank || 1} on FlexAI.lol 👑 Current bid: ${bidFormatted}!`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://flexai.lol/ai/${product.slug}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareX = () => {
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Outflex Modal */}
      <OutflexModal
        product={product}
        isOpen={isOutflexOpen}
        onClose={() => setIsOutflexOpen(false)}
      />

      {/* Top Banner & Header Card */}
      <div className="rounded-3xl bg-dark-900 border border-dark-border p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Logo + Details */}
          <div className="flex items-start sm:items-center gap-5">
            {/* Rank badge circle */}
            <div className="shrink-0 relative flex items-center justify-center w-12 sm:w-14">
              {product.rank === 1 ? (
                <Crown
                  className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 fill-amber-400/25 stroke-[2] drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                />
              ) : product.rank === 2 ? (
                <Crown
                  className="w-9 h-9 sm:w-11 sm:h-11 text-slate-400 dark:text-slate-300 fill-slate-300/20 stroke-[2] drop-shadow-[0_0_10px_rgba(148,163,184,0.6)]"
                />
              ) : product.rank === 3 ? (
                <Crown
                  className="w-9 h-9 sm:w-11 sm:h-11 text-amber-700 dark:text-amber-500 fill-amber-600/20 stroke-[2] drop-shadow-[0_0_10px_rgba(194,65,12,0.5)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border text-slate-900 dark:text-white font-black text-xl flex items-center justify-center">
                  #{product.rank || 1}
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-800 border border-dark-border p-1.5 overflow-hidden shrink-0">
              {product.logo_url ? (
                <img src={product.logo_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-3xl font-black text-purple-400 flex items-center justify-center h-full">
                  {product.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Name, Tagline & Links */}
            <div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{product.name}</h1>
                {product.is_verified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-500/20" />
                )}
                {product.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {product.category.name}
                  </span>
                )}
              </div>

              <p className="text-sm sm:text-base text-gray-300 mt-1 max-w-2xl font-normal">
                {product.tagline}
              </p>

              <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-gray-400">
                <a
                  href={`/go/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>{domain}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {product.x_handle && (
                  <a
                    href={`https://x.com/${product.x_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white flex items-center gap-1"
                  >
                    <Twitter className="w-3.5 h-3.5 text-blue-400" />
                    <span>@{product.x_handle.replace('@', '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Action / CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">{bidFormatted}</div>
              <div className="text-xs text-gray-400 font-medium">Active Leaderboard Stake</div>
            </div>

            <button
              onClick={() => setIsOutflexOpen(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Outflex this AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Stats + Description + Share */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Rank Status */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-border space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Leaderboard Rank</span>
          <div className="text-2xl font-black text-white flex items-center gap-2">
            <span>#{product.rank || 1}</span>
            <span className="text-xs font-medium text-emerald-400">(Highest: #{product.highest_rank || 1})</span>
          </div>
          <p className="text-xs text-gray-400">Position updated in real-time</p>
        </div>

        {/* Stat 2: Total Clicks */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-border space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Verified Outbound Clicks</span>
          <div className="text-2xl font-black text-purple-300 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-purple-400" />
            <span>{clicksFormatted}</span>
          </div>
          <p className="text-xs text-gray-400">Visitors redirected to official website</p>
        </div>

        {/* Stat 3: Social Flex Share */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-border space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Flex on Socials</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareX}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#0f1419] hover:bg-[#1d242c] border border-dark-border flex items-center justify-center gap-1.5 transition-colors"
            >
              <Twitter className="w-3.5 h-3.5 text-blue-400" />
              <span>Share on X</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-2 px-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-dark-800 border border-dark-border flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {product.description && (
        <div className="rounded-2xl bg-dark-900 border border-dark-border p-6 space-y-3">
          <h3 className="text-base font-bold text-white">About {product.name}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Achievements Unlocked */}
      <div className="rounded-2xl bg-dark-900 border border-dark-border p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          <span>Milestones & Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {product.current_bid_cents >= 10000 && (
            <div className="p-3.5 rounded-xl bg-dark-950 border border-purple-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">First $100 Unlocked</h4>
                <p className="text-[11px] text-gray-400">Passed 3-digit milestone</p>
              </div>
            </div>
          )}

          {product.current_bid_cents >= 100000 && (
            <div className="p-3.5 rounded-xl bg-dark-950 border border-purple-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">First $1,000 Unlocked</h4>
                <p className="text-[11px] text-gray-400">4-figure club legend</p>
              </div>
            </div>
          )}

          {product.current_bid_cents >= 1000000 && (
            <div className="p-3.5 rounded-xl bg-dark-950 border border-amber-500/40 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">First $10,000 Unlocked</h4>
                <p className="text-[11px] text-gray-400">Flex Arena Hall of Fame</p>
              </div>
            </div>
          )}

          {product.highest_rank === 1 && (
            <div className="p-3.5 rounded-xl bg-dark-950 border border-amber-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Took the Throne</h4>
                <p className="text-[11px] text-gray-400">Reached #1 overall</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
