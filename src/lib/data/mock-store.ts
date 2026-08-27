import type { Product, Category, Achievement, ProductAchievement, RankHistory, Bid, LiveStats, ActivityEvent } from '../../types';
import { getVisitorStats } from './visitor-store';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', slug: 'ai-assistants', name: 'AI Assistants', description: 'Conversational AI, chat assistants, and general reasoning tools', icon: 'Bot', sort_order: 1, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c2', slug: 'ai-agents', name: 'AI Agents', description: 'Autonomous workflow executors and multi-agent systems', icon: 'Cpu', sort_order: 2, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c3', slug: 'ai-image-video', name: 'AI Image & Video', description: 'Generative imaging, video creation, and artistic AI tools', icon: 'Image', sort_order: 3, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c4', slug: 'ai-code-dev', name: 'AI Code & Dev', description: 'Code generation, autocomplete, debuggers, and developer agents', icon: 'Code', sort_order: 4, is_active: true, total_bid_cents: 100, product_count: 1 },
  { id: 'c5', slug: 'ai-marketing', name: 'AI Marketing', description: 'Copywriting, SEO optimization, and ad campaign generation', icon: 'Megaphone', sort_order: 5, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c6', slug: 'ai-voice-audio', name: 'AI Voice & Audio', description: 'Voice synthesis, music composition, and audio mastering', icon: 'Mic', sort_order: 6, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c7', slug: 'ai-productivity', name: 'AI Productivity', description: 'Note taking, task automation, and intelligent workflows', icon: 'Zap', sort_order: 7, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c8', slug: 'ai-research', name: 'AI Research', description: 'Academic research assistants, paper summarizers, and science tools', icon: 'BookOpen', sort_order: 8, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c9', slug: 'ai-automation', name: 'AI Automation', description: 'No-code workflow pipelines, browser agents, and web scrapers', icon: 'RefreshCw', sort_order: 9, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c10', slug: 'ai-business', name: 'AI Business', description: 'CRM automation, sales intelligence, and financial analysis', icon: 'Briefcase', sort_order: 10, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c11', slug: 'ai-education', name: 'AI Education', description: 'Personalized tutoring, language learning, and study bots', icon: 'GraduationCap', sort_order: 11, is_active: true, total_bid_cents: 0, product_count: 0 },
  { id: 'c12', slug: 'ai-fun-entertainment', name: 'AI Fun & Entertainment', description: 'Gaming companions, roleplay characters, and interactive humor', icon: 'Smile', sort_order: 12, is_active: true, total_bid_cents: 0, product_count: 0 },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', slug: 'first_100', name: 'First $100', description: 'Broke through the triple digit barrier', icon: 'DollarSign', achievement_type: 'milestone', threshold_value: 10000, created_at: '2024-01-01T00:00:00Z' },
  { id: 'a2', slug: 'first_1000', name: 'First $1,000', description: 'Entered the 4-figure club', icon: 'Award', achievement_type: 'milestone', threshold_value: 100000, created_at: '2024-01-01T00:00:00Z' },
  { id: 'a3', slug: 'first_10000', name: 'First $10,000', description: 'Flex legend status ($10k+ in bids)', icon: 'Crown', achievement_type: 'milestone', threshold_value: 1000000, created_at: '2024-01-01T00:00:00Z' },
  { id: 'a4', slug: 'reached_number_one', name: 'Took the Throne', description: 'Reached #1 on the global leaderboard', icon: 'Trophy', achievement_type: 'rank', threshold_value: 1, created_at: '2024-01-01T00:00:00Z' },
  { id: 'a5', slug: 'top_three', name: 'Podium Finish', description: 'Climbed into the top 3 global positions', icon: 'Medal', achievement_type: 'rank', threshold_value: 3, created_at: '2024-01-01T00:00:00Z' },
  { id: 'a6', slug: 'biggest_climb', name: 'Rocket Climb', description: 'Climbed 5+ leaderboard positions with a single flex', icon: 'Flame', achievement_type: 'climb', threshold_value: 5, created_at: '2024-01-01T00:00:00Z' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p_buildfast',
    category_id: 'c4',
    slug: 'buildfast',
    name: 'Buildfast',
    tagline: 'Ship production-ready AI apps at lightspeed.',
    description: 'Buildfast is the developer platform to prototype, build, and deploy full-stack AI products in minutes.',
    website_url: 'https://buildfast-ai.com',
    logo_url: '/logos/buildfast.svg',
    x_handle: 'ByManuuDB',
    status: 'active',
    current_bid_cents: 100, // $1.00 (Rank #1 start)
    highest_rank: 1,
    total_clicks: 42,
    is_verified: true,
    bid_change_cents: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act_init',
    type: 'bid',
    product_id: 'p_buildfast',
    product_name: 'Buildfast',
    product_slug: 'buildfast',
    message: 'Buildfast took the #1 throne with a $50 bid',
    amount_cents: 5000,
    timestamp: new Date().toISOString(),
  },
];

class MemoryStore {
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private achievements: Achievement[] = [...INITIAL_ACHIEVEMENTS];
  private products: Product[] = [...INITIAL_PRODUCTS];
  private bids: Bid[] = [];
  private productAchievements: ProductAchievement[] = [
    {
      id: 'pa_bf1',
      product_id: 'p_buildfast',
      product_name: 'Buildfast',
      achievement_id: 'a4',
      achievement: INITIAL_ACHIEVEMENTS[3],
      awarded_at: new Date().toISOString(),
    },
  ];
  private rankHistory: RankHistory[] = [];
  private activityEvents: ActivityEvent[] = [...INITIAL_ACTIVITY];
  private processedEvents: Set<string> = new Set();

  getCategories(): Category[] {
    return this.categories.map((c) => {
      const categoryProducts = this.products.filter((p) => (p.category_id === c.id || p.category_id === c.slug) && p.status === 'active');
      const totalBids = categoryProducts.reduce((sum, p) => sum + p.current_bid_cents, 0);
      return {
        ...c,
        product_count: categoryProducts.length,
        total_bid_cents: totalBids,
      };
    });
  }

  getProducts(categoryId?: string): Product[] {
    const active = this.products.filter((p) => p.status === 'active');

    let list = active;
    if (categoryId && categoryId !== 'all') {
      const targetCat = this.categories.find(
        (c) => c.id === categoryId || c.slug === categoryId
      );
      const targetId = targetCat ? targetCat.id : categoryId;
      const targetSlug = targetCat ? targetCat.slug : categoryId;

      list = list.filter((p) => {
        return (
          p.category_id === targetId ||
          p.category_id === targetSlug
        );
      });
    }

    // Strict sort: highest bid first
    list.sort((a, b) => b.current_bid_cents - a.current_bid_cents);

    return list.map((p, idx) => {
      const cat = this.categories.find((c) => c.id === p.category_id || c.slug === p.category_id);
      return {
        ...p,
        rank: idx + 1,
        category: cat,
      };
    });
  }

  getProductBySlug(slug: string): Product | null {
    const list = this.getProducts();
    const product = list.find((p) => p.slug === slug || p.id === slug);
    return product || null;
  }

  getAllProductsAdmin(): Product[] {
    return [...this.products];
  }

  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  getProductAchievements(productId?: string): ProductAchievement[] {
    if (productId) {
      return this.productAchievements.filter((pa) => pa.product_id === productId);
    }
    return [...this.productAchievements];
  }

  getLiveStats(): LiveStats {
    const activeProds = this.products.filter((p) => p.status === 'active');
    const totalBids = activeProds.reduce((sum, p) => sum + p.current_bid_cents, 0);
    const sorted = [...activeProds].sort((a, b) => b.current_bid_cents - a.current_bid_cents);
    const num1 = sorted[0];
    const vStats = getVisitorStats();

    return {
      online_users: vStats.online_users,
      total_visitors: vStats.total_visitors,
      total_bids_cents: totalBids,
      total_products: activeProds.length,
      number_one_price_cents: num1 ? num1.current_bid_cents : 200,
    };
  }

  getActivityEvents(): ActivityEvent[] {
    return [...this.activityEvents].slice(0, 10);
  }

  calculateExpectedRank(amountCents: number, categoryId?: string) {
    const products = this.getProducts(categoryId);
    const rank = products.filter((p) => p.current_bid_cents >= amountCents).length + 1;
    const num1Price = products.length > 0 ? products[0].current_bid_cents : 200;
    const top3Price = products.length >= 3 ? products[2].current_bid_cents : 200;
    const top10Price = products.length >= 10 ? products[9].current_bid_cents : 200;

    const targetAbove = products[rank - 2];
    const centsToNextRank = targetAbove ? targetAbove.current_bid_cents - amountCents + 100 : 0;

    return {
      amount_cents: amountCents,
      expected_rank: rank,
      next_rank: Math.max(1, rank - 1),
      cents_to_next_rank: Math.max(0, centsToNextRank),
      cents_to_number_one: Math.max(0, num1Price - amountCents + 100),
      cents_to_top_three: Math.max(0, top3Price - amountCents + 100),
      cents_to_top_ten: Math.max(0, top10Price - amountCents + 100),
    };
  }

  createProduct(data: Partial<Product>): Product {
    const id = 'p_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newProduct: Product = {
      id,
      category_id: data.category_id || 'c1',
      slug: data.slug || 'product-' + id,
      name: data.name || 'Untitled AI',
      tagline: data.tagline || '',
      description: data.description || '',
      website_url: data.website_url || 'https://example.com',
      logo_url: data.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      x_handle: data.x_handle || '',
      status: data.status || 'active', // publish directly upon submission
      current_bid_cents: data.current_bid_cents || 0,
      highest_rank: undefined,
      total_clicks: 0,
      is_verified: true,
      created_at: now,
      updated_at: now,
    };
    this.products.push(newProduct);
    return newProduct;
  }

  createBid(productId: string, amountCents: number, userId?: string): Bid {
    const bidId = 'bid_' + Math.random().toString(36).substring(2, 9);
    const bid: Bid = {
      id: bidId,
      product_id: productId,
      user_id: userId,
      amount_cents: amountCents,
      currency: 'usd',
      status: 'pending',
      stripe_checkout_session_id: 'cs_test_' + bidId,
      created_at: new Date().toISOString(),
    };
    this.bids.push(bid);
    return bid;
  }

  activatePaidBid(bidId: string, paymentIntentId?: string) {
    const bid = this.bids.find((b) => b.id === bidId || b.stripe_checkout_session_id === bidId);
    let product: Product | undefined;

    if (bid) {
      if (bid.status === 'paid') {
        return { success: true, already_paid: true };
      }
      product = this.products.find((p) => p.id === bid.product_id);
      bid.status = 'paid';
      bid.paid_at = new Date().toISOString();
      bid.stripe_payment_intent_id = paymentIntentId || 'pi_mock_' + bid.id;
    } else {
      // Find product by id directly if bid was simulated
      product = this.products.find((p) => p.id === bidId);
    }

    if (!product) return { success: false, error: 'Product not found' };

    const oldRank = this.getProducts().find((p) => p.id === product.id)?.rank || 99;
    const addedCents = bid ? bid.amount_cents : 500;

    product.current_bid_cents = (product.current_bid_cents || 0) + addedCents;
    product.status = 'active';
    product.updated_at = new Date().toISOString();
    product.bid_change_cents = addedCents;

    const newRank = this.getProducts().find((p) => p.id === product.id)?.rank || 1;
    if (!product.highest_rank || newRank < product.highest_rank) {
      product.highest_rank = newRank;
    }

    this.rankHistory.push({
      id: 'rh_' + Math.random().toString(36).substring(2, 9),
      product_id: product.id,
      previous_rank: oldRank,
      new_rank: newRank,
      bid_id: bid?.id,
      recorded_at: new Date().toISOString(),
    });

    // Add activity event
    this.activityEvents.unshift({
      id: 'act_' + Date.now(),
      type: newRank === 1 ? 'new_number_one' : oldRank > newRank ? 'climb' : 'bid',
      product_id: product.id,
      product_name: product.name,
      product_logo: product.logo_url,
      product_slug: product.slug,
      message: `${product.name} flexed $${(addedCents / 100).toLocaleString()} to reach #${newRank}`,
      amount_cents: addedCents,
      rank_from: oldRank,
      rank_to: newRank,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      product,
      previous_rank: oldRank,
      new_rank: newRank,
      new_total_bid_cents: product.current_bid_cents,
    };
  }

  recordClick(productId: string) {
    const prod = this.products.find((p) => p.id === productId || p.slug === productId);
    if (prod) {
      prod.total_clicks += 1;
      return prod.website_url;
    }
    return null;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const product = this.products.find((p) => p.id === id || p.slug === id);
    if (!product) return null;

    if (updates.name !== undefined) product.name = updates.name;
    if (updates.tagline !== undefined) product.tagline = updates.tagline;
    if (updates.description !== undefined) product.description = updates.description;
    if (updates.website_url !== undefined) product.website_url = updates.website_url;
    if (updates.logo_url !== undefined) product.logo_url = updates.logo_url;
    if (updates.x_handle !== undefined) product.x_handle = updates.x_handle;
    if (updates.category_id !== undefined) product.category_id = updates.category_id;
    product.updated_at = new Date().toISOString();

    return product;
  }

  getBids(productId?: string): Bid[] {
    if (productId) {
      return this.bids.filter((b) => b.product_id === productId);
    }
    return [...this.bids];
  }

  getBidById(bidId: string): Bid | null {
    const bid = this.bids.find((b) => b.id === bidId || b.stripe_checkout_session_id === bidId);
    return bid || null;
  }

  getRankHistory(productId?: string): RankHistory[] {
    if (productId) {
      return this.rankHistory.filter((r) => r.product_id === productId);
    }
    return [...this.rankHistory];
  }

  isStripeEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  recordStripeEvent(eventId: string) {
    this.processedEvents.add(eventId);
  }
}

export const memoryStore = new MemoryStore();
