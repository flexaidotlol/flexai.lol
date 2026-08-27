import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Filter, ExternalLink, Lock } from 'lucide-react';
import type { Product } from '../../types';
import { centsToDollars, formatDomain } from '../../lib/utils/format';

interface AdminPortalProps {
  products: Product[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ products }) => {
  const [productList, setProductList] = useState<Product[]>(products);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const filtered = productList.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const updateStatus = (productId: string, status: 'active' | 'rejected') => {
    setProductList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status } : p))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-white">FlexAI Admin & Moderation</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">Review pending submissions, inspect payment stakes, and enforce arena integrity.</p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-900 border border-dark-border rounded-xl">
          {(['all', 'active', 'pending', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Moderation Table */}
      <div className="rounded-3xl bg-dark-900 border border-dark-border shadow-xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <input
            type="text"
            placeholder="Search products by name or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-950 border border-dark-border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dark-border text-gray-400 uppercase font-semibold bg-dark-950/60">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Active Stake</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-gray-300">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-dark-850/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={p.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1">{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <a
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>{formatDomain(p.website_url)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {centsToDollars(p.current_bid_cents)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : p.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {p.status !== 'active' && (
                      <button
                        onClick={() => updateStatus(p.id, 'active')}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20"
                      >
                        Approve
                      </button>
                    )}
                    {p.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(p.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
