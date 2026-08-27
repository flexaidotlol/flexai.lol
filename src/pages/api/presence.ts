import type { APIRoute } from 'astro';
import { hashVisitor } from '../../lib/security';

export const prerender = false;

// In-memory active presence tracker: sessionId -> lastSeenTimestamp
const activePresenceMap = new Map<string, number>();
const uniqueVisitorsSet = new Set<string>();

// Real unique visitor tracking
let totalVisitorCounter = 0;

export const GET: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const visitorHash = hashVisitor(ip, userAgent);
  const now = Date.now();

  // Register session presence
  activePresenceMap.set(visitorHash, now);

  // Track real unique visitor
  if (!uniqueVisitorsSet.has(visitorHash)) {
    uniqueVisitorsSet.add(visitorHash);
    totalVisitorCounter += 1;
  }

  // Prune sessions older than 45 seconds
  const cutoff = now - 45 * 1000;
  for (const [id, lastSeen] of activePresenceMap.entries()) {
    if (lastSeen < cutoff) {
      activePresenceMap.delete(id);
    }
  }

  const onlineCount = Math.max(1, activePresenceMap.size);

  return new Response(
    JSON.stringify({
      online_users: onlineCount,
      total_visitors: totalVisitorCounter,
      timestamp: now,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  return GET({ request, clientAddress } as any);
};
