import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Share2,
  Twitter,
  ExternalLink,
  Loader2,
  Globe,
  Image as ImageIcon,
  Save,
  Check,
  Flame,
  AlertCircle,
  Eye,
  Edit3,
} from 'lucide-react';
import { centsToDollars, formatDomain } from '../../lib/utils/format';
import type { Product, Category } from '../../types';

interface SuccessCelebrationProps {
  sessionId?: string;
  bidId?: string;
  initialProduct?: Product | null;
  categories?: Category[];
  isSimulated?: boolean;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  sessionId,
  bidId,
  initialProduct,
  categories = [],
  isSimulated,
}) => {
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [isActivating, setIsActivating] = useState<boolean>(Boolean(isSimulated));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State for Startup Customization
  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    tagline: initialProduct?.tagline || '',
    description: initialProduct?.description || '',
    website_url: initialProduct?.website_url || '',
    logo_url: initialProduct?.logo_url || '',
    x_handle: initialProduct?.x_handle || '',
    category_id: initialProduct?.category_id || categories[0]?.id || 'c4',
  });

  const rank = product?.rank || 1;
  const currentBidFormatted = product ? centsToDollars(product.current_bid_cents) : '$2.00';

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#8b5cf6', '#6366f1', '#3b82f6', '#f59e0b', '#10b981'],
      });
    } catch (e) {}

    // In simulated local mode, trigger mock webhook activation
    if (isSimulated && bidId) {
      fetch(`/api/stripe/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'simulated-signature',
        },
        body: JSON.stringify({
          id: 'evt_sim_' + Date.now(),
          type: 'checkout.session.completed',
          data: {
            object: {
              id: sessionId || 'cs_test',
              metadata: { bidId },
              payment_intent: 'pi_sim_' + Date.now(),
            },
          },
        }),
      })
        .then(() => {
          // Fetch updated product if needed
          if (product?.slug) {
            return fetch(`/api/products/lookup?q=${encodeURIComponent(product.slug)}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.found && d.product) {
                  setProduct(d.product);
                }
              });
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsActivating(false);
        });
    }
  }, [sessionId, bidId, isSimulated]);

  // Sync initialProduct if updated
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setFormData({
        name: initialProduct.name || '',
        tagline: initialProduct.tagline || '',
        description: initialProduct.description || '',
        website_url: initialProduct.website_url || '',
        logo_url: initialProduct.logo_url || '',
        x_handle: initialProduct.x_handle || '',
        category_id: initialProduct.category_id || categories[0]?.id || 'c4',
      });
    }
  }, [initialProduct]);

  // Fallback domain computation for live card preview
  const previewDomain = formData.website_url ? formatDomain(formData.website_url) : 'your-site.com';
  const selectedCatObj = categories.find((c) => c.id === formData.category_id || c.slug === formData.category_id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) {
      setErrorMsg('No product ID found to update.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          website_url: formData.website_url,
          logo_url: formData.logo_url,
          x_handle: formData.x_handle,
          category_id: formData.category_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update startup details');
      }

      if (data.product) {
        setProduct(data.product);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const shareText = `We just placed our AI tool ${formData.name || 'Startup'} onto FlexAI.lol 👑! Check it out:`;

  const handleShareX = () => {
    const targetUrl = product?.slug ? `https://flexai.lol/ai/${product.slug}` : 'https://flexai.lol';
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(targetUrl)}`;
    window.open(xUrl, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in zoom-in-95 duration-500 font-sans">
      {/* 1. Header Banner & Celebration */}
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl rank-badge-1 text-dark-950 flex items-center justify-center mx-auto shadow-glow-gold">
            <Crown className="w-10 h-10" />
          </div>
          <Sparkles className="w-6 h-6 text-purple-400 absolute -top-2 -right-2 animate-bounce" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Payment Verified & Listing Confirmed</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          YOU FLEXED TO #{rank}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 max-w-xl mx-auto">
          Your bid has been atomically recorded. Complete or edit your company profile below so it looks stunning on the live leaderboard.
        </p>
      </div>

      {/* 2. Main Grid: Form Editor (Left) & Real-Time Card Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: The Setup / Customization Form */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configure Your Live Listing</h2>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
              Real-time Sync
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Listing changes published successfully! Your live card is updated.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            {/* Logo URL input */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-gray-200">
                Company Logo URL / Asset <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png or /logos/your-logo.svg"
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 dark:text-gray-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logo_url: '/logos/buildfast.svg' })}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Buildfast Official Logo
                </button>
              </div>
            </div>

            {/* Startup Name */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-gray-200">
                Startup / Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Buildfast, Acme AI"
                required
                className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-gray-200">
                Punchy Tagline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Ship production-ready AI apps at lightspeed"
                maxLength={140}
                required
                className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <div className="text-right text-[10px] text-slate-400">{formData.tagline.length}/140</div>
            </div>

            {/* Website URL */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-gray-200">
                Official Website URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://your-startup.com"
                  required
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-gray-200">
                Detailed Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="What does your AI tool do? Features, target audience, and capabilities..."
                className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Category and Twitter/X Handle Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Founder / Company X Handle</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={formData.x_handle.replace('@', '')}
                    onChange={(e) => setFormData({ ...formData, x_handle: e.target.value })}
                    placeholder="ByManuuDB"
                    className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl pl-8 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-glow-purple flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Publish to Leaderboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Leaderboard Card Preview & Next Steps */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-gray-400">
                  Live Leaderboard Preview
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                WYSIWYG
              </span>
            </div>

            {/* Preview Card */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                rank === 1
                  ? 'border-amber-400/80 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-950/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className="shrink-0 relative">
                  {rank === 1 ? (
                    <div>
                      <Crown className="w-4 h-4 text-amber-500 absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow" />
                      <div className="w-10 h-10 rounded-xl rank-badge-1 text-dark-950 font-black text-sm flex items-center justify-center shadow-glow-gold">
                        #1
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-dark-800 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center">
                      #{rank}
                    </div>
                  )}
                </div>

                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-border p-1 overflow-hidden shrink-0 flex items-center justify-center">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt={formData.name || 'Startup'}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'AI'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {formData.name || 'Untitled AI Startup'}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-gray-300 truncate">
                    {formData.tagline || 'Your punchy AI software tagline goes here.'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    <span>{selectedCatObj?.name || 'AI Software'}</span>
                    <span>•</span>
                    <span className="text-slate-400">{previewDomain}</span>
                  </div>
                </div>

                {/* Current Bid */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-900 dark:text-white">{currentBidFormatted}</div>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Active</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-gray-400 text-center">
              This is the exact view visitors and founders will see on the FlexAI.lol live leaderboard.
            </p>
          </div>

          {/* Share & Quick Navigation Box */}
          <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Next Actions</h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleShareX}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#0f1419] hover:bg-[#1d242c] border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Twitter className="w-3.5 h-3.5 text-blue-400" />
                <span>Flex your spot on X (Twitter)</span>
              </button>

              <a
                href="/"
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-800 dark:text-gray-200 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 border border-slate-200 dark:border-dark-border flex items-center justify-center gap-2 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-purple-500" />
                <span>View Global Live Leaderboard</span>
              </a>

              {product?.slug && (
                <a
                  href={`/ai/${product.slug}`}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1.5"
                >
                  <span>Go to public product profile page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
