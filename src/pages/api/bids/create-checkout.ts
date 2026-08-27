import type { APIRoute } from 'astro';
import { outbidSchema, createOutbidSession } from '../../../services/bids';
import { checkRateLimit } from '../../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || '127.0.0.1';
  const rate = checkRateLimit(`checkout:${ip}`, 30, 60);

  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit reached. Please wait.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const parsed = outbidSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          issues: parsed.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const origin = new URL(request.url).origin;
    const session = await createOutbidSession(parsed.data, origin);

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Create checkout error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
