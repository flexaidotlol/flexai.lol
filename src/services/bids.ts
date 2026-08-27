import { z } from 'zod';
import { env } from '../lib/env';
import { memoryStore } from '../lib/data/mock-store';
import { supabaseServer } from '../lib/supabase/server';
import { createStripeCheckoutSession } from '../lib/stripe';
import { validateSafeUrl } from '../lib/security';
import { verifyAiProduct } from '../lib/ai-verification';
import { slugify, centsToDollars } from '../lib/utils/format';
import { notifyBidSuccess } from '../lib/email';
import type { Product, Bid } from '../types';

export const submitProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(60),
  tagline: z.string().min(5, 'Tagline must be at least 5 characters').max(140),
  description: z.string().max(1000).optional(),
  website_url: z.string().min(4, 'Valid website URL is required'),
  category_id: z.string().min(1, 'Category is required'),
  logo_url: z.string().optional(),
  x_handle: z.string().max(40).optional(),
  amount_cents: z.number().int().min(200, 'Minimum bid is $2.00 (200 cents)'),
  user_email: z.string().email('Valid email is required').optional(),
});

export const outbidSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  amount_cents: z.number().int().min(200, 'Minimum bid is $2.00 (200 cents)'),
  user_email: z.string().email().optional(),
});

export async function createProductSubmission(payload: z.infer<typeof submitProductSchema>, origin: string) {
  // 1. Validate Safe URL
  const urlCheck = validateSafeUrl(payload.website_url);
  if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
    throw new Error(urlCheck.error || 'Invalid product website URL');
  }

  const aiVerification = await verifyAiProduct({
    name: payload.name,
    tagline: payload.tagline,
    description: payload.description,
    websiteUrl: urlCheck.normalizedUrl,
    xHandle: payload.x_handle,
  });

  if (!aiVerification.isAiProduct) {
    throw new Error(
      `This listing does not look like an AI product yet. Signals checked: ${aiVerification.reasons.slice(0, 3).join('; ')}`
    );
  }

  // 2. Generate slug
  const baseSlug = slugify(payload.name);
  const slug = baseSlug || 'ai-product-' + Date.now();

  let product: Product;
  let bid: Bid;

  if (supabaseServer) {
    // Check if product already exists by website_url
    const { data: existingProd } = await supabaseServer
      .from('products')
      .select('*')
      .eq('website_url', urlCheck.normalizedUrl)
      .maybeSingle();

    // Resolve category slug or name to Supabase UUID
    let resolvedCategoryId: string | null = null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.category_id);
    if (isUUID) {
      resolvedCategoryId = payload.category_id;
    } else if (payload.category_id) {
      const { data: cat } = await supabaseServer
        .from('categories')
        .select('id')
        .eq('slug', payload.category_id)
        .maybeSingle();

      if (cat?.id) {
        resolvedCategoryId = cat.id;
      } else {
        const newCatSlug = slugify(payload.category_id) || 'custom';
        const { data: createdCat } = await supabaseServer
          .from('categories')
          .insert({
            name: payload.category_id,
            slug: newCatSlug,
            icon: 'Sparkles',
            sort_order: 99,
          })
          .select('id')
          .maybeSingle();

        resolvedCategoryId = createdCat?.id || null;
      }
    }

    if (existingProd) {
      product = existingProd as Product;
    } else {
      // Insert pending product into Supabase
      const { data: newProd, error: prodErr } = await supabaseServer
        .from('products')
        .insert({
          name: payload.name,
          slug,
          tagline: payload.tagline,
          description: payload.description || '',
          website_url: urlCheck.normalizedUrl,
          category_id: resolvedCategoryId,
          logo_url: payload.logo_url || null,
          x_handle: payload.x_handle || null,
          status: 'pending',
          current_bid_cents: 0,
        })
        .select()
        .single();

      if (prodErr || !newProd) {
        throw new Error(`Failed to create product listing: ${prodErr?.message}`);
      }

      product = newProd as Product;
    }

    // Create pending bid
    const { data: newBid, error: bidErr } = await supabaseServer
      .from('bids')
      .insert({
        product_id: product.id,
        amount_cents: payload.amount_cents,
        currency: env.STRIPE_CURRENCY,
        status: 'pending',
      })
      .select()
      .single();

    if (bidErr || !newBid) {
      throw new Error(`Failed to create initial bid: ${bidErr?.message}`);
    }

    bid = newBid as Bid;
  } else {
    // In-memory fallback
    const existing = memoryStore.getProducts().find(p => p.website_url === urlCheck.normalizedUrl);
    if (existing) {
      product = existing;
    } else {
      product = memoryStore.createProduct({
        name: payload.name,
        slug,
        tagline: payload.tagline,
        description: payload.description || '',
        website_url: urlCheck.normalizedUrl,
        category_id: payload.category_id,
        logo_url: payload.logo_url,
        x_handle: payload.x_handle,
        status: 'pending',
        current_bid_cents: 0,
      });
    }

    bid = memoryStore.createBid(product.id, payload.amount_cents);
  }

  // 3. Create Stripe Checkout Session
  const returnUrl = `${origin}/bid/success`;
  const checkout = await createStripeCheckoutSession({
    productId: product.id,
    productName: product.name,
    amountCents: payload.amount_cents,
    bidId: bid.id,
    userEmail: payload.user_email,
    returnUrl,
  });

  return {
    productId: product.id,
    productSlug: product.slug,
    bidId: bid.id,
    checkoutUrl: checkout.url,
    sessionId: checkout.sessionId,
  };
}

export async function createOutbidSession(payload: z.infer<typeof outbidSchema>, origin: string) {
  let product: Product | null = null;

  if (supabaseServer) {
    const { data } = await supabaseServer.from('products').select('*').eq('id', payload.product_id).single();
    product = data as Product | null;
  } else {
    product = memoryStore.getProductBySlug(payload.product_id);
  }

  if (!product) {
    throw new Error('Product not found');
  }

  let bid: Bid;
  if (supabaseServer) {
    const { data: newBid, error } = await supabaseServer
      .from('bids')
      .insert({
        product_id: product.id,
        amount_cents: payload.amount_cents,
        currency: env.STRIPE_CURRENCY,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !newBid) throw new Error('Failed to create outbid record');
    bid = newBid as Bid;
  } else {
    bid = memoryStore.createBid(product.id, payload.amount_cents);
  }

  const returnUrl = `${origin}/bid/success`;
  const checkout = await createStripeCheckoutSession({
    productId: product.id,
    productName: product.name,
    amountCents: payload.amount_cents,
    bidId: bid.id,
    userEmail: payload.user_email,
    returnUrl,
  });

  return {
    productId: product.id,
    productSlug: product.slug,
    bidId: bid.id,
    checkoutUrl: checkout.url,
    sessionId: checkout.sessionId,
  };
}

export async function processPaidBid(bidId: string, paymentIntentId?: string, customerEmail?: string) {
  if (supabaseServer) {
    const { data, error } = await supabaseServer.rpc('activate_paid_bid', {
      p_bid_id: bidId,
      p_stripe_payment_intent_id: paymentIntentId,
    });

    if (error) {
      console.error('Error activating paid bid via RPC:', error);
      throw new Error(`RPC Activation error: ${error.message}`);
    }

    // Send email receipt if email is provided
    if (customerEmail && data?.product_id) {
      const { data: prod } = await supabaseServer.from('products').select('name').eq('id', data.product_id).single();
      if (prod) {
        await notifyBidSuccess(
          customerEmail,
          prod.name,
          centsToDollars(data.new_total_bid_cents || 500),
          data.new_rank || 1
        );
      }
    }

    return data;
  }

  // Memory fallback
  const result = memoryStore.activatePaidBid(bidId, paymentIntentId);
  if (result.success && result.product && customerEmail) {
    await notifyBidSuccess(
      customerEmail,
      result.product.name,
      centsToDollars(result.new_total_bid_cents || 500),
      result.new_rank || 1
    );
  }
  return result;
}

export const updateProductSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(2, 'Product name must be at least 2 characters').max(60).optional(),
  tagline: z.string().min(5, 'Tagline must be at least 5 characters').max(140).optional(),
  description: z.string().max(1000).optional(),
  website_url: z.string().min(4, 'Valid website URL is required').optional(),
  logo_url: z.string().optional(),
  x_handle: z.string().max(40).optional(),
  category_id: z.string().optional(),
});

export async function updateProductDetails(payload: z.infer<typeof updateProductSchema>) {
  const updates: Partial<Product> = {};

  if (payload.name) {
    updates.name = payload.name.trim();
  }
  if (payload.tagline) {
    updates.tagline = payload.tagline.trim();
  }
  if (payload.description !== undefined) {
    updates.description = payload.description.trim();
  }
  if (payload.website_url) {
    const urlCheck = validateSafeUrl(payload.website_url.trim());
    if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
      throw new Error(urlCheck.error || 'Invalid website URL');
    }
    updates.website_url = urlCheck.normalizedUrl;
  }
  if (payload.logo_url) {
    const cleanLogo = payload.logo_url.trim();
    if (cleanLogo.startsWith('http://') || cleanLogo.startsWith('https://')) {
      const logoCheck = validateSafeUrl(cleanLogo);
      if (!logoCheck.isValid) {
        throw new Error('Invalid logo URL: must be a safe public web address');
      }
    }
    updates.logo_url = cleanLogo;
  }
  if (payload.x_handle !== undefined) {
    updates.x_handle = payload.x_handle ? payload.x_handle.replace('@', '').trim() : '';
  }
  if (payload.category_id) {
    updates.category_id = payload.category_id;
  }

  if (supabaseServer) {
    const { data, error } = await supabaseServer
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.product_id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error || !data) {
      throw new Error(`Failed to update product: ${error?.message || 'Not found'}`);
    }

    return data as Product;
  }

  const updated = memoryStore.updateProduct(payload.product_id, updates);
  if (!updated) {
    throw new Error('Product not found in store');
  }

  return updated;
}

export async function getProductByBidId(bidId: string): Promise<Product | null> {
  if (supabaseServer) {
    const { data: bid } = await supabaseServer
      .from('bids')
      .select('product_id')
      .eq('id', bidId)
      .maybeSingle();

    if (bid?.product_id) {
      const { data: prod } = await supabaseServer
        .from('products')
        .select(`*, category:categories(*)`)
        .eq('id', bid.product_id)
        .single();
      return (prod as Product) || null;
    }
    return null;
  }

  const bid = memoryStore.getBidById(bidId);
  if (bid) {
    return memoryStore.getProductBySlug(bid.product_id);
  }
  return null;
}

export async function getBidHistory(productId?: string): Promise<Bid[]> {
  if (supabaseServer) {
    let query = supabaseServer
      .from('bids')
      .select(`*, product:products(name, slug, logo_url)`)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as Bid[];
    }
    return [];
  }

  return memoryStore.getBids(productId);
}
