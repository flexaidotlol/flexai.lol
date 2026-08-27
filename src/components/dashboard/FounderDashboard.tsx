import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Plus,
  ExternalLink,
  Share2,
  MousePointerClick,
  History,
  CreditCard,
  Crown,
  Edit3,
  Globe,
  Save,
  Check,
  X,
  Loader2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import type { Product, Bid, Category } from '../../types';
import { centsToDollars, formatCompactNumber, formatDomain } from '../../lib/utils/format';
import { OutflexModal } from '../bidding/OutflexModal';

interface FounderDashboardProps {
  products: Product[];
  bids?: Bid[];
  categories?: Category[];
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
  products: initialProducts,
  bids = [],
  categories = [],
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Edit Modal Form State
  const [editForm, setEditForm] = useState({
    name: '',
    tagline: '',
    description: '',
    website_url: '',
    logo_url: '',
    x_handle: '',
    category_id: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      tagline: p.tagline,
      description: p.description || '',
      website_url: p.website_url,
      logo_url: p.logo_url || '',
      x_handle: p.x_handle || '',
      category_id: p.category_id || categories[0]?.id || 'c4',
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: editingProduct.id,
          name: editForm.name,
          tagline: editForm.tagline,
          description: editForm.description,
          website_url: editForm.website_url,
          logo_url: editForm.logo_url,
          x_handle: editForm.x_handle,
          category_id: editForm.category_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update product');
      }

      // Update local state
      setProducts((prev) =>
        prev.map((item) => (item.id === editingProduct.id ? { ...item, ...data.product } : item))
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingProduct(null);
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || 'Error updating product');
    } finally {
      setIsSaving(false);
    }
  };

  const myProducts = products.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans">
      {/* Outflex / Increase Bid Modal */}
      <OutflexModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit AI Listing Details</h3>
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Changes saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Logo Image URL</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    {editForm.logo_url ? (
                      <img src={editForm.logo_url} alt="" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={editForm.logo_url}
                    onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png or /logos/buildfast.svg"
                    className="flex-1 bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Startup Name */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Startup Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Tagline</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  required
                  maxLength={140}
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Official Website URL</label>
                <input
                  type="text"
                  value={editForm.website_url}
                  onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-gray-200">Detailed Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Category & Twitter Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 dark:text-gray-200">Category</label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 dark:text-gray-200">X (Twitter) Handle</label>
                  <input
                    type="text"
                    value={editForm.x_handle.replace('@', '')}
                    onChange={(e) => setEditForm({ ...editForm, x_handle: e.target.value })}
                    placeholder="username"
                    className="w-full bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Founder Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage your active AI listings, customize logos, monitor ranks, and inspect verified receipts.
          </p>
        </div>

        <a
          href="/submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New AI</span>
        </a>
      </div>

      {/* My AI Products Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-500" />
          <span>My AI Products</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border p-6 shadow-xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border p-1 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={p.logo_url || '/logos/buildfast.svg'} alt={p.name} className="w-full h-full object-contain rounded-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-gray-400 font-mono">{formatDomain(p.website_url)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-400 dark:text-gray-400 font-semibold">Rank</div>
                  <div className="text-2xl font-black text-emerald-500">#{p.rank || 1}</div>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-dark-border/80 text-center">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Current Bid</div>
                  <div className="text-base font-bold text-purple-600 dark:text-purple-300 mt-0.5">{centsToDollars(p.current_bid_cents)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Clicks</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatCompactNumber(p.total_clicks)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Peak Rank</div>
                  <div className="text-base font-bold text-amber-500 mt-0.5">#{p.highest_rank || 1}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setSelectedProduct(p)}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Increase Bid</span>
                </button>

                <button
                  onClick={() => openEditModal(p)}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-purple-600 dark:text-purple-300 hover:text-white bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-600 border border-purple-200 dark:border-purple-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <a
                  href={`/ai/${p.slug}`}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-border flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Public Page</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Payment & Bid History Table */}
      <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-500" />
            <span>Payment & Bid History</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-gray-400 font-semibold">
            {bids.length} transactions recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-gray-400 font-semibold uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt / Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border/50 text-slate-700 dark:text-gray-300">
              {bids.length > 0 ? (
                bids.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-gray-400">
                      {new Date(b.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{b.product?.name || 'AI Startup'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {centsToDollars(b.amount_cents)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          b.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                      {b.stripe_payment_intent_id || b.stripe_checkout_session_id || b.id}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-gray-500">
                    No payment records yet. Submitting a bid will log your verified transaction here atomically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
