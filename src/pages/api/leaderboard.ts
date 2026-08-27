import type { APIRoute } from 'astro';
import { getLeaderboard, getCategories } from '../../services/leaderboard';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('category') || undefined;

  const [products, categories] = await Promise.all([
    getLeaderboard(categoryId),
    getCategories(),
  ]);

  return new Response(
    JSON.stringify({
      products,
      categories,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3',
      },
    }
  );
};
