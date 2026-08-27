import type { APIRoute } from 'astro';
import { submitProductSchema, createProductSubmission } from '../../../services/bids';
import { checkRateLimit } from '../../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || '127.0.0.1';
  const rate = checkRateLimit(`submit:${ip}`, 15, 60);

  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many submissions. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawData = await request.json();
    const parsed = submitProductSchema.safeParse(rawData);

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
    const result = await createProductSubmission(parsed.data, origin);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('API submit error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
