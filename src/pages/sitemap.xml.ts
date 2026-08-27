import type { APIRoute } from 'astro';
import { getLeaderboard, getCategories } from '../services/leaderboard';

export const prerender = false;

export const GET: APIRoute = async () => {
  const siteUrl = 'https://flexai.lol';

  const [products, categories] = await Promise.all([
    getLeaderboard('all'),
    getCategories(),
  ]);

  const now = new Date().toISOString();

  const staticPages = [
    { url: `${siteUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
    { url: `${siteUrl}/categories`, changefreq: 'daily', priority: '0.9', lastmod: now },
    { url: `${siteUrl}/hall-of-fame`, changefreq: 'daily', priority: '0.8', lastmod: now },
    { url: `${siteUrl}/about`, changefreq: 'monthly', priority: '0.7', lastmod: now },
    { url: `${siteUrl}/submit`, changefreq: 'monthly', priority: '0.8', lastmod: now },
  ];

  const categoryPages = categories.map((cat) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    changefreq: 'daily',
    priority: '0.8',
    lastmod: now,
  }));

  const productPages = products.map((prod) => ({
    url: `${siteUrl}/ai/${prod.slug}`,
    changefreq: 'daily',
    priority: '0.9',
    lastmod: prod.updated_at
      ? new Date(prod.updated_at).toISOString()
      : prod.created_at
      ? new Date(prod.created_at).toISOString()
      : now,
  }));

  const allEntries = [...staticPages, ...categoryPages, ...productPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
  });
};

export const HEAD: APIRoute = GET;

