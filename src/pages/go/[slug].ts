import type { APIRoute } from 'astro';
import { getProductBySlug } from '../../services/leaderboard';
import { supabaseServer } from '../../lib/supabase/server';
import { memoryStore } from '../../lib/data/mock-store';
import { hashVisitor } from '../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, clientAddress, redirect }) => {
  const { slug } = params;

  if (!slug) {
    return redirect('/', 302);
  }

  const product = await getProductBySlug(slug);
  if (!product || !product.website_url) {
    return redirect('/', 302);
  }

  const ip = clientAddress || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';
  const visitorHash = hashVisitor(ip, userAgent);

  // Track click safely without exposing private data
  if (supabaseServer) {
    try {
      await supabaseServer.from('product_clicks').insert({
        product_id: product.id,
        visitor_hash: visitorHash,
        referrer: referrer.substring(0, 255),
        user_agent_category: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      });

      // Increment product clicks
      await supabaseServer.rpc('increment_product_clicks', { p_product_id: product.id });
    } catch (e) {
      // Ignore click tracking failure so redirect always works smoothly
    }
  } else {
    memoryStore.recordClick(product.id);
  }

  // Ensure safe protocol
  let targetUrl = product.website_url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  return redirect(targetUrl, 302);
};
