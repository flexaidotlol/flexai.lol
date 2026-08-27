import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  Upload,
  ArrowRight,
  Check,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  Globe,
  DollarSign,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { Category } from '../../types';
import { centsToDollars, formatDomain } from '../../lib/utils/format';

interface SubmitWizardProps {
  categories: Category[];
  initialName?: string;
  initialUrl?: string;
  initialCategory?: string;
  initialBid?: number;
}

export const SubmitWizard: React.FC<SubmitWizardProps> = ({
  categories,
  initialName = '',
  initialUrl = '',
  initialCategory = '',
  initialBid,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialCategoryObject = categories.find(
    (cat) => cat.id === initialCategory || cat.slug === initialCategory
  );

  const [formData, setFormData] = useState({
    name: initialName,
    website_url: initialUrl,
    tagline: '',
    description: '',
    category_id: initialCategoryObject?.id || categories[0]?.id || 'c4',
    logo_url: '',
    x_handle: '',
    amount_dollars: Math.max(2, initialBid || 2),
    user_email: '',
  });

  const [projectedRank, setProjectedRank] = useState<number>(1);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [minimumClaimDollars, setMinimumClaimDollars] = useState<number>(Math.max(2, initialBid || 2));
  const [detectedProduct, setDetectedProduct] = useState<{
    found: boolean;
    product?: any;
    diffDollarsToClaimFirst?: number;
  } | null>(null);

  const sampleLogos = [
    '/logos/buildfast.svg',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=128&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=128&auto=format&fit=crop&q=80',
  ];

  useEffect(() => {
    if (!formData.logo_url) {
      setFormData((prev) => ({ ...prev, logo_url: sampleLogos[0] }));
    }
  }, []);

  // Auto-detect if website or name is already listed
  useEffect(() => {
    const query = formData.website_url || formData.name;
    if (!query || query.trim().length < 4) {
      setDetectedProduct(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/lookup?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.product) {
            setDetectedProduct(data);
            // Pre-fill missing fields if empty
            setFormData((prev) => ({
              ...prev,
              name: prev.name || data.product.name,
              tagline: prev.tagline || data.product.tagline,
              category_id: data.product.category_id || prev.category_id,
              logo_url: data.product.logo_url || prev.logo_url,
              x_handle: data.product.x_handle || prev.x_handle,
              amount_dollars: data.diffDollarsToClaimFirst || prev.amount_dollars,
            }));
          } else {
            setDetectedProduct(null);
          }
        }
      } catch {
        setDetectedProduct(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.website_url, formData.name]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData((prev) => ({ ...prev, logo_url: dataUrl }));
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch dynamic rank projection as bid changes
  useEffect(() => {
    const fetchExpected = async () => {
      setIsCalculating(true);
      try {
        const currentCents = detectedProduct?.product?.current_bid_cents || 0;
        const totalCents = currentCents + formData.amount_dollars * 100;
        const res = await fetch(`/api/bids/calculate?amount=${totalCents}&category_id=${formData.category_id}`);
        if (res.ok) {
          const data = await res.json();
          const minimumDollars = detectedProduct?.found
            ? Math.max(2, detectedProduct.diffDollarsToClaimFirst || 2)
            : Math.max(2, Math.ceil((data.minimum_cents_to_claim_first || 200) / 100));
          setMinimumClaimDollars(minimumDollars);
          setProjectedRank(data.expected_rank);
        }
      } catch {
        // silent
      } finally {
        setIsCalculating(false);
      }
    };

    const timer = setTimeout(fetchExpected, 150);
    return () => clearTimeout(timer);
  }, [formData.amount_dollars, formData.category_id, detectedProduct]);

  useEffect(() => {
    if (formData.amount_dollars < minimumClaimDollars) {
      setFormData((prev) => ({ ...prev, amount_dollars: minimumClaimDollars }));
    }
  }, [minimumClaimDollars, detectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your startup name');
      setIsSubmitting(false);
      return;
    }

    if (!formData.website_url.trim()) {
      setErrorMsg('Please provide your website URL');
      setIsSubmitting(false);
      return;
    }

    if (!formData.tagline.trim()) {
      setErrorMsg('Please provide a punchy tagline / remate');
      setIsSubmitting(false);
      return;
    }

    if (formData.amount_dollars < minimumClaimDollars) {
      setErrorMsg(`Minimum bid to claim #1 in this category is $${minimumClaimDollars}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        website_url: formData.website_url.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description?.trim() || undefined,
        category_id: formData.category_id,
        logo_url: formData.logo_url || sampleLogos[0],
        x_handle: formData.x_handle?.replace('@', '').trim() || undefined,
        amount_cents: Math.round(formData.amount_dollars * 100),
        user_email: formData.user_email?.trim() || undefined,
      };

      const res = await fetch('/api/products/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize submission');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectedCatObj = categories.find((c) => c.id === formData.category_id) || categories[0];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border shadow-xl p-6 sm:p-10 transition-colors">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Pay-to-Win • Zero VC Gatekeeping</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {detectedProduct?.found ? `Raise ${detectedProduct.product.name} Listing` : 'Register your AI startup'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-gray-400 max-w-lg mx-auto">
            {detectedProduct?.found
              ? `Pay only the difference to climb above competing AI tools and reclaim #1.`
              : `The price to claim #1 is $2. Enter with any bid starting from $2 to climb above competing AI tools instantly.`}
          </p>
        </div>

        {/* Existing Product Auto-Detected Banner */}
        {detectedProduct?.found && detectedProduct.product && (
          <div className="mb-6 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-xs sm:text-sm text-purple-950 dark:text-purple-200 flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mt-1 shrink-0"></span>
            <div className="flex-1">
              <p className="font-bold text-sm">
                ✨ {detectedProduct.product.name} is already registered!
              </p>
              <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                Current active stake: <strong>${Math.round((detectedProduct.product.current_bid_cents || 0) / 100)}</strong> (Rank #{detectedProduct.product.rank || 1}).
                Pay only the <strong>${detectedProduct.diffDollarsToClaimFirst}</strong> difference to take #1!
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Check this field:</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                  Startup Name
                </label>
                <span className="text-[10px] text-slate-400">{formData.name.length}/40</span>
              </div>
              <input
                type="text"
                placeholder="Unicorn AI"
                maxLength={40}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://myai.com"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none transition-colors font-medium"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Logo URL / Browse */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1.5">
              Logo (Image URL or Upload)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://myai.com/logo.png"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="flex-1 bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none transition-colors font-medium"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-dark-border transition-all flex items-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">
              PNG, JPG, WebP or SVG under 5MB. Or paste direct image URL.
            </p>
          </div>

          {/* Row 3: Tagline / Remate */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                Tagline / Remate (Punchline)
              </label>
              <span className="text-[10px] text-slate-400">{formData.tagline.length}/90</span>
            </div>
            <input
              type="text"
              placeholder="Family AI empire since 2026. Ship code in your sleep."
              maxLength={90}
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none transition-colors font-medium"
            />
          </div>

          {/* Row 4: Category & X Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1.5">
                Niche Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none transition-colors font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1.5">
                X / Twitter Handle (Optional)
              </label>
              <input
                type="text"
                placeholder="@ByManuuDB"
                value={formData.x_handle}
                onChange={(e) => setFormData({ ...formData, x_handle: e.target.value })}
                className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none transition-colors font-medium"
              />
            </div>
          </div>            {/* Row 5: Bid Amount & Dynamic Rank */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1.5">
              Initial Contribution / Flex Bid (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">$</span>
              <input
                type="number"
                min="2"
                step="1"
                value={formData.amount_dollars}
                onChange={(e) => setFormData({ ...formData, amount_dollars: Math.max(minimumClaimDollars, parseInt(e.target.value) || minimumClaimDollars) })}
                className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl pl-9 pr-4 py-3 text-xl font-bold text-slate-900 dark:text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 mt-2">
              {[minimumClaimDollars, 3, 5, 10, 25]
                .filter((preset, index, values) => preset >= minimumClaimDollars && values.indexOf(preset) === index)
                .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData({ ...formData, amount_dollars: preset })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    formData.amount_dollars === preset
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-dark-800 border-slate-300 dark:border-dark-border text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  €{preset}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-2">
              Minimum to claim #1 in {selectedCatObj?.name || 'this category'}: <strong>€{minimumClaimDollars}</strong>. You can enter any higher custom amount.
            </p>

            {/* Dynamic Rank Message */}
            <div className="mt-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>
                  Your startup will be ranked at:
                </span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                {isCalculating ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `#${projectedRank}`} in {selectedCatObj?.name || 'Arena'}
              </span>
            </div>
          </div>

          {/* Email for receipt */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1.5">
              Notification Email (Stripe Receipt & Rank Alerts)
            </label>
            <input
              type="email"
              placeholder="founder@unicorn.ai"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-dark-border focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none transition-colors font-medium"
            />
          </div>

          {/* Big CTA Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-glow-purple border border-purple-400/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to Stripe...</span>
                </>
              ) : (
                <>
                  <span>
                    {detectedProduct?.found
                      ? `Pay €${formData.amount_dollars} Difference to Claim #1`
                      : `Pay €${formData.amount_dollars} & Enter Leaderboard`}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Legal / Humor footer disclaimer */}
          <p className="text-[11px] text-center text-slate-500 dark:text-gray-500 leading-relaxed">
            By paying, your AI is placed instantly on the leaderboard. Dofollow backlink signal activated. No monthly subscription traps.
          </p>
        </form>
      </div>
    </div>
  );
};
