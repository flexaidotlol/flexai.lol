import type { APIRoute } from 'astro';
import { updateProductSchema, updateProductDetails } from '../../../services/bids';
import { checkRateLimit } from '../../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || '127.0.0.1';
  const rate = checkRateLimit(`update_prod:${ip}`, 30, 60);

  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawData = await request.json();
    const parsed = updateProductSchema.safeParse(rawData);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          issues: parsed.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await updateProductDetails(parsed.data);

    return new Response(
      JSON.stringify({
        success: true,
        product: updated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('API update product error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to update product details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
