import { memoryStore } from '../lib/data/mock-store';
import { supabaseServer } from '../lib/supabase/server';
import type { Product, Category, LiveStats, Achievement, ProductAchievement } from '../types';

export async function getCategories(): Promise<Category[]> {
  if (supabaseServer) {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Category[];
    }
  }
  return memoryStore.getCategories();
}

export async function getLeaderboard(categoryId?: string): Promise<Product[]> {
  if (supabaseServer) {
    let query = supabaseServer
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('status', 'active')
      .order('current_bid_cents', { ascending: false });

    if (categoryId && categoryId !== 'all') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
      if (isUUID) {
        query = query.eq('category_id', categoryId);
      } else {
        const { data: cat } = await supabaseServer
          .from('categories')
          .select('id')
          .eq('slug', categoryId)
          .maybeSingle();

        if (cat?.id) {
          query = query.eq('category_id', cat.id);
        } else {
          query = query.eq('category_id', categoryId);
        }
      }
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((p, index) => ({
        ...p,
        rank: index + 1,
      })) as Product[];
    }
  }
  return memoryStore.getProducts(categoryId);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (supabaseServer) {
    const { data, error } = await supabaseServer
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('slug', slug)
      .single();

    if (!error && data) {
      return data as Product;
    }
  }
  return memoryStore.getProductBySlug(slug);
}

export async function getLiveStats(): Promise<LiveStats> {
  return memoryStore.getLiveStats();
}

export async function getHallOfFame(): Promise<{
  achievements: Achievement[];
  recentMilestones: ProductAchievement[];
}> {
  const achievements = memoryStore.getAchievements();
  const recentMilestones = memoryStore.getProductAchievements();
  return { achievements, recentMilestones };
}

export function calculateExpectedRank(amountCents: number, categoryId?: string) {
  return memoryStore.calculateExpectedRank(amountCents, categoryId);
}

export async function calculateExpectedRankFromLiveProducts(amountCents: number, categoryId?: string) {
  const products = await getLeaderboard(categoryId || 'all');
  const rank = products.filter((p) => (p.current_bid_cents || 0) >= amountCents).length + 1;
  const numberOnePrice = products.length > 0 ? products[0].current_bid_cents || 0 : 0;
  const top3Price = products.length >= 3 ? products[2].current_bid_cents || 0 : 0;
  const top10Price = products.length >= 10 ? products[9].current_bid_cents || 0 : 0;
  const targetAbove = products[rank - 2];
  const centsToNextRank = targetAbove ? (targetAbove.current_bid_cents || 0) - amountCents + 100 : 0;

  return {
    amount_cents: amountCents,
    expected_rank: rank,
    next_rank: Math.max(1, rank - 1),
    cents_to_next_rank: Math.max(0, centsToNextRank),
    cents_to_number_one: Math.max(0, numberOnePrice - amountCents + 100),
    cents_to_top_three: Math.max(0, top3Price - amountCents + 100),
    cents_to_top_ten: Math.max(0, top10Price - amountCents + 100),
    number_one_price_cents: numberOnePrice,
    minimum_cents_to_claim_first: Math.max(200, numberOnePrice + 100),
  };
}

export function getAdminProducts(): Product[] {
  return memoryStore.getAllProductsAdmin();
}

export async function lookupProductByUrlOrHandle(query: string): Promise<{
  found: boolean;
  product?: Product;
  topProduct?: Product;
  diffCentsToClaimFirst?: number;
  diffDollarsToClaimFirst?: number;
}> {
  if (!query || !query.trim()) {
    return { found: false };
  }

  const clean = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^@/, '')
    .split('/')[0]
    .split('?')[0];

  const allProducts = await getLeaderboard('all');
  const topProduct = allProducts.length > 0 ? allProducts[0] : undefined;

  // Search by website_url match, slug match, or x_handle match
  const matched = allProducts.find((p) => {
    const pDomain = (p.website_url || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0];
    const pSlug = (p.slug || '').toLowerCase();
    const pHandle = (p.x_handle || '').toLowerCase().replace(/^@/, '');
    const pName = (p.name || '').toLowerCase();

    return (
      (pDomain && (pDomain === clean || pDomain.includes(clean) || clean.includes(pDomain))) ||
      pSlug === clean ||
      pHandle === clean ||
      pName === clean
    );
  });

  if (!matched) {
    return { found: false, topProduct };
  }

  const topBidCents = topProduct ? topProduct.current_bid_cents : 0;
  const currentBidCents = matched.current_bid_cents || 0;

  // Calculate minimum difference to overtake #1
  let diffCents = 200; // minimum default $2.00
  if (matched.rank === 1) {
    diffCents = 200; // already #1, can add $2+ to extend lead
  } else {
    // If top is $100 (10000 cents) and matched is $90 (9000 cents), target is $101 (10100 cents)
    const targetCents = topBidCents + 100;
    diffCents = Math.max(200, targetCents - currentBidCents);
  }

  return {
    found: true,
    product: matched,
    topProduct,
    diffCentsToClaimFirst: diffCents,
    diffDollarsToClaimFirst: Math.round(diffCents / 100),
  };
}
