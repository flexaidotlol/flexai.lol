import type { APIRoute } from 'astro';
import { verifyAiProduct } from '../../../lib/ai-verification';
import { checkRateLimit } from '../../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || '127.0.0.1';
  const rate = checkRateLimit(`verify-ai:${ip}`, 30, 60);

  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many verification checks. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const result = await verifyAiProduct({
      name: String(body.name || ''),
      tagline: String(body.tagline || ''),
      description: body.description ? String(body.description) : undefined,
      websiteUrl: String(body.website_url || body.url || ''),
      xHandle: body.x_handle ? String(body.x_handle) : undefined,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'AI verification failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
