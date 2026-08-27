import type { APIRoute } from 'astro';
import { calculateExpectedRankFromLiveProducts } from '../../../services/leaderboard';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const amountStr = url.searchParams.get('amount') || '200';
  const categoryId = url.searchParams.get('category_id') || undefined;

  let amountCents = parseInt(amountStr, 10);
  if (isNaN(amountCents) || amountCents < 200) {
    amountCents = 200;
  }

  const result = await calculateExpectedRankFromLiveProducts(amountCents, categoryId);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=5',
    },
  });
};
