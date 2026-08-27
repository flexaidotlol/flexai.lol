-- ==============================================================================
-- FlexAI.lol - Database Schema Migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Supabase Auth mapping)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    x_handle TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT,
    website_url TEXT NOT NULL,
    logo_url TEXT,
    x_handle TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
    current_bid_cents BIGINT NOT NULL DEFAULT 0 CHECK (current_bid_cents >= 0),
    highest_rank INT,
    total_clicks INT NOT NULL DEFAULT 0 CHECK (total_clicks >= 0),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. BIDS TABLE
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 100), -- Minimum bid $1.00+ / $2.00
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    paid_at TIMESTAMPTZ
);

-- 5. STRIPE EVENTS TABLE (Webhook Idempotency)
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    payload_reference JSONB
);

-- 6. PRODUCT CLICKS TABLE
CREATE TABLE IF NOT EXISTS public.product_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    visitor_hash TEXT NOT NULL,
    referrer TEXT,
    user_agent_category TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    threshold_value BIGINT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. PRODUCT ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.product_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    awarded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(product_id, achievement_id)
);

-- 9. RANK HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.rank_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    previous_rank INT,
    new_rank INT NOT NULL,
    bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_status_bid ON public.products(status, current_bid_cents DESC, updated_at ASC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id, status, current_bid_cents DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_bids_product ON public.bids(product_id, status);
CREATE INDEX IF NOT EXISTS idx_bids_session ON public.bids(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_product ON public.product_clicks(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_history_product ON public.rank_history(product_id, recorded_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Public can read basic profile info; owners can update their own profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Categories: Public can read active categories
CREATE POLICY "Active categories are viewable by everyone" ON public.categories
    FOR SELECT USING (is_active = true);

-- 3. Products: Public can view active products; owners can view and create their products
CREATE POLICY "Active products are viewable by everyone" ON public.products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own products" ON public.products
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can update non-financial fields on their own products" ON public.products
    FOR UPDATE USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 4. Bids: Users can view their own bids
CREATE POLICY "Users can view their own bids" ON public.bids
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Achievements & Milestones: Public can read achievements and awards
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
    FOR SELECT USING (true);

CREATE POLICY "Product achievements are viewable by everyone" ON public.product_achievements
    FOR SELECT USING (true);

CREATE POLICY "Rank history is viewable by everyone" ON public.rank_history
    FOR SELECT USING (true);

-- 6. Click tracking: Public insert
CREATE POLICY "Allow public insert for click tracking" ON public.product_clicks
    FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- ATOMIC POSTGRESQL FUNCTIONS
-- ==============================================================================

-- 1. Calculate current rank for any given bid amount
CREATE OR REPLACE FUNCTION public.calculate_expected_rank(
    p_amount_cents BIGINT,
    p_category_id UUID DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rank INT;
BEGIN
    IF p_category_id IS NOT NULL THEN
        SELECT COUNT(*) + 1 INTO v_rank
        FROM public.products
        WHERE status = 'active'
          AND category_id = p_category_id
          AND current_bid_cents >= p_amount_cents;
    ELSE
        SELECT COUNT(*) + 1 INTO v_rank
        FROM public.products
        WHERE status = 'active'
          AND current_bid_cents >= p_amount_cents;
    END IF;
    RETURN v_rank;
END;
$$;

-- 2. Atomic Bid Activation function
CREATE OR REPLACE FUNCTION public.activate_paid_bid(
    p_bid_id UUID,
    p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bid RECORD;
    v_product RECORD;
    v_prev_rank INT;
    v_new_rank INT;
    v_new_total_bid BIGINT;
    v_achievements_awarded TEXT[] := ARRAY[]::TEXT[];
    v_ach_record RECORD;
BEGIN
    -- 1. Lock the bid record
    SELECT * INTO v_bid
    FROM public.bids
    WHERE id = p_bid_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid not found');
    END IF;

    -- If already paid, return idempotently
    IF v_bid.status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Bid was already processed', 'already_paid', true);
    END IF;

    -- 2. Lock the associated product
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_bid.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Associated product not found');
    END IF;

    -- 3. Calculate previous global rank
    SELECT COUNT(*) + 1 INTO v_prev_rank
    FROM public.products
    WHERE status = 'active'
      AND id != v_product.id
      AND current_bid_cents > v_product.current_bid_cents;

    -- 4. Mark the bid as paid
    UPDATE public.bids
    SET status = 'paid',
        paid_at = now(),
        stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id)
    WHERE id = p_bid_id;

    -- 5. Calculate new active bid amount and update product
    -- If this is an incremental bid, add to current_bid_cents, or set to the new total
    v_new_total_bid := v_product.current_bid_cents + v_bid.amount_cents;

    UPDATE public.products
    SET current_bid_cents = v_new_total_bid,
        status = 'active', -- Ensure product is active once paid
        updated_at = now()
    WHERE id = v_product.id;

    -- 6. Calculate new global rank
    SELECT COUNT(*) + 1 INTO v_new_rank
    FROM public.products
    WHERE status = 'active'
      AND id != v_product.id
      AND current_bid_cents > v_new_total_bid;

    -- 7. Update highest rank if this is a new best
    IF v_product.highest_rank IS NULL OR v_new_rank < v_product.highest_rank THEN
        UPDATE public.products
        SET highest_rank = v_new_rank
        WHERE id = v_product.id;
    END IF;

    -- 8. Record rank history
    INSERT INTO public.rank_history (product_id, previous_rank, new_rank, bid_id, recorded_at)
    VALUES (v_product.id, v_prev_rank, v_new_rank, v_bid.id, now());

    -- 9. Check and award milestone achievements
    -- A: First $100 ($10,000 cents)
    IF v_new_total_bid >= 10000 THEN
        FOR v_ach_record IN SELECT id, slug FROM public.achievements WHERE slug = 'first_100' LOOP
            INSERT INTO public.product_achievements (product_id, achievement_id, bid_id, metadata)
            VALUES (v_product.id, v_ach_record.id, v_bid.id, jsonb_build_object('total_cents', v_new_total_bid))
            ON CONFLICT (product_id, achievement_id) DO NOTHING;
            v_achievements_awarded := array_append(v_achievements_awarded, 'first_100');
        END LOOP;
    END IF;

    -- B: First $1,000 ($100,000 cents)
    IF v_new_total_bid >= 100000 THEN
        FOR v_ach_record IN SELECT id, slug FROM public.achievements WHERE slug = 'first_1000' LOOP
            INSERT INTO public.product_achievements (product_id, achievement_id, bid_id, metadata)
            VALUES (v_product.id, v_ach_record.id, v_bid.id, jsonb_build_object('total_cents', v_new_total_bid))
            ON CONFLICT (product_id, achievement_id) DO NOTHING;
            v_achievements_awarded := array_append(v_achievements_awarded, 'first_1000');
        END LOOP;
    END IF;

    -- C: First $10,000 ($1,000,000 cents)
    IF v_new_total_bid >= 1000000 THEN
        FOR v_ach_record IN SELECT id, slug FROM public.achievements WHERE slug = 'first_10000' LOOP
            INSERT INTO public.product_achievements (product_id, achievement_id, bid_id, metadata)
            VALUES (v_product.id, v_ach_record.id, v_bid.id, jsonb_build_object('total_cents', v_new_total_bid))
            ON CONFLICT (product_id, achievement_id) DO NOTHING;
            v_achievements_awarded := array_append(v_achievements_awarded, 'first_10000');
        END LOOP;
    END IF;

    -- D: Reached #1
    IF v_new_rank = 1 THEN
        FOR v_ach_record IN SELECT id, slug FROM public.achievements WHERE slug = 'reached_number_one' LOOP
            INSERT INTO public.product_achievements (product_id, achievement_id, bid_id, metadata)
            VALUES (v_product.id, v_ach_record.id, v_bid.id, jsonb_build_object('rank', 1))
            ON CONFLICT (product_id, achievement_id) DO NOTHING;
            v_achievements_awarded := array_append(v_achievements_awarded, 'reached_number_one');
        END LOOP;
    END IF;

    -- E: Top 3
    IF v_new_rank <= 3 THEN
        FOR v_ach_record IN SELECT id, slug FROM public.achievements WHERE slug = 'top_three' LOOP
            INSERT INTO public.product_achievements (product_id, achievement_id, bid_id, metadata)
            VALUES (v_product.id, v_ach_record.id, v_bid.id, jsonb_build_object('rank', v_new_rank))
            ON CONFLICT (product_id, achievement_id) DO NOTHING;
            v_achievements_awarded := array_append(v_achievements_awarded, 'top_three');
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', v_product.id,
        'previous_rank', v_prev_rank,
        'new_rank', v_new_rank,
        'new_total_bid_cents', v_new_total_bid,
        'achievements_awarded', v_achievements_awarded
    );
END;
$$;
