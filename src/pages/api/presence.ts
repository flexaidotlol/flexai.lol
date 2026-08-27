import type { APIRoute } from 'astro';
import { hashVisitor } from '../../lib/security';
import { recordVisitorHit, getVisitorStats } from '../../lib/data/visitor-store';

export const prerender = false;

export const GET: APIRoute = async ({ request, clientAddress }) => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  const ip = (forwarded ? forwarded.split(',')[0].trim() : '') || realIp || cfIp || clientAddress || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const visitorKey = hashVisitor(ip, userAgent);

  const stats = recordVisitorHit(visitorKey);

  return new Response(
    JSON.stringify({
      online_users: stats.online_users,
      total_visitors: stats.total_visitors,
      timestamp: Date.now(),
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
  const stats = recordVisitorHit(visitorKey);

  return new Response(
    JSON.stringify({
      online_users: stats.online_users,
      total_visitors: stats.total_visitors,
      timestamp: Date.now(),
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
