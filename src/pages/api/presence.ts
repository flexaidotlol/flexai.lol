import type { APIRoute } from 'astro';
import { hashVisitor } from '../../lib/security';

export const prerender = false;

// In-memory active presence tracker: sessionId -> lastSeenTimestamp
const activePresenceMap = new Map<string, number>();
const uniqueVisitorsSet = new Set<string>();

// Real unique visitor tracking
let totalVisitorCounter = 0;

export const GET: APIRoute = async ({ request, clientAddress }) => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  const ip = (forwarded ? forwarded.split(',')[0].trim() : '') || realIp || cfIp || clientAddress || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const visitorKey = hashVisitor(ip, userAgent);
  const now = Date.now();

  // Register session presence
  activePresenceMap.set(visitorKey, now);

  // Track unique visitor
  if (!uniqueVisitorsSet.has(visitorKey)) {
    uniqueVisitorsSet.add(visitorKey);
    totalVisitorCounter += 1;
  }

  // Prune sessions older than 40 seconds
  const cutoff = now - 40 * 1000;
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
  let bodySessionId = '';
  try {
    const body = await request.json();
    bodySessionId = body.sessionId || '';
  } catch {}

  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  const ip = (forwarded ? forwarded.split(',')[0].trim() : '') || realIp || cfIp || clientAddress || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';

  const visitorKey = bodySessionId ? `session:${bodySessionId}` : hashVisitor(ip, userAgent);
  const now = Date.now();

  // Register session presence
  activePresenceMap.set(visitorKey, now);

  // Track unique visitor
  if (!uniqueVisitorsSet.has(visitorKey)) {
    uniqueVisitorsSet.add(visitorKey);
    totalVisitorCounter += 1;
  }

  // Prune sessions older than 40 seconds
  const cutoff = now - 40 * 1000;
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
