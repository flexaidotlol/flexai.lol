import React, { useEffect, useState } from 'react';
import type { LiveStats } from '../../types';
import { formatNumber, centsToDollars } from '../../lib/utils/format';

interface LiveStatsBarProps {
  initialStats?: LiveStats;
}

export const LiveStatsBar: React.FC<LiveStatsBarProps> = ({ initialStats }) => {
  const [stats, setStats] = useState<LiveStats>(
    initialStats || {
      online_users: 1,
      total_visitors: 1,
      total_bids_cents: 100,
      total_products: 1,
      number_one_price_cents: 100,
    }
  );

  // Active Realtime User Presence Heartbeat & Stats Sync
  useEffect(() => {
    // Generate or retrieve unique browser session ID
    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('flexai_session_id') || '';
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        sessionStorage.setItem('flexai_session_id', sessionId);
      }
    } catch {}

    const sendHeartbeatAndSync = async () => {
      try {
        // 1. Send active presence ping
        const presenceRes = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (presenceRes.ok) {
          const presenceData = await presenceRes.json();
          setStats((prev) => ({
            ...prev,
            online_users: presenceData.online_users || 1,
            total_visitors: presenceData.total_visitors || prev.total_visitors,
          }));
        }

        // 2. Fetch live product bids & total stake stats
        const statsRes = await fetch('/api/live-stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.stats) {
            setStats((prev) => ({
              ...prev,
              total_bids_cents: statsData.stats.total_bids_cents,
              total_products: statsData.stats.total_products,
              number_one_price_cents: statsData.stats.number_one_price_cents,
            }));
          }
        }
      } catch {
        // silent fallback
      }
    };

    // Initial heartbeat on mount
    sendHeartbeatAndSync();

    // Heartbeat every 8 seconds for responsive real-time counting
    const interval = setInterval(sendHeartbeatAndSync, 8000);

    // Also trigger immediately when user switches back to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeatAndSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-2 px-4">
      <div className="inline-flex items-center flex-wrap justify-center gap-2 sm:gap-4 px-4 py-1.5 rounded-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-border shadow-sm text-xs sm:text-sm text-slate-700 dark:text-gray-300">
        {/* Realtime Active Online Users Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-900 dark:text-white">{stats.online_users} {stats.online_users === 1 ? 'user' : 'users'} online</span>
        </div>

        <span className="text-slate-300 dark:text-gray-600 hidden sm:inline">•</span>

        {/* Visitors count */}
        <div className="hidden sm:inline">
          <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(stats.total_visitors)}</span> visitors since launch
        </div>

        <span className="text-slate-300 dark:text-gray-600 hidden sm:inline">•</span>

        {/* Total bids volume / money earned */}
        <div className="flex items-center gap-1">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{centsToDollars(stats.total_bids_cents)}</span>
          <span className="font-medium text-slate-700 dark:text-gray-300">earned in bids</span>
        </div>
      </div>
    </div>
  );
};
