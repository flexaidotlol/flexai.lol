import type { APIRoute } from 'astro';
import { getLiveStats } from '../../services/leaderboard';
import { memoryStore } from '../../lib/data/mock-store';

export const prerender = false;

export const GET: APIRoute = async () => {
  const stats = await getLiveStats();
  const activity = memoryStore.getActivityEvents();

  return new Response(
    JSON.stringify({
      stats,
      activity,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
};
