export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  x_handle?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  total_bid_cents?: number;
  product_count?: number;
}

export interface Product {
  id: string;
  owner_id?: string;
  category_id: string;
  category?: Category;
  slug: string;
  name: string;
  tagline: string;
  description?: string;
  website_url: string;
  logo_url?: string;
  x_handle?: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  current_bid_cents: number;
  highest_rank?: number;
  total_clicks: number;
  is_verified: boolean;
  rank?: number;
  bid_change_cents?: number;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  product_id: string;
  product?: Product;
  user_id?: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  paid_at?: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  achievement_type: 'milestone' | 'rank' | 'climb' | 'streak';
  threshold_value?: number;
  created_at: string;
}

export interface ProductAchievement {
  id: string;
  product_id: string;
  product_name?: string;
  product_logo?: string;
  achievement_id: string;
  achievement: Achievement;
  bid_id?: string;
  metadata?: Record<string, any>;
  awarded_at: string;
}

export interface RankHistory {
  id: string;
  product_id: string;
  previous_rank?: number;
  new_rank: number;
  bid_id?: string;
  recorded_at: string;
}

export interface LiveStats {
  online_users: number;
  total_visitors: number;
  total_bids_cents: number;
  total_products: number;
  number_one_price_cents: number;
}

export interface ActivityEvent {
  id: string;
  type: 'climb' | 'new_number_one' | 'bid' | 'outflexed' | 'milestone';
  product_id: string;
  product_name: string;
  product_logo?: string;
  product_slug: string;
  message: string;
  amount_cents?: number;
  rank_from?: number;
  rank_to?: number;
  timestamp: string;
}

export interface ExpectedRankCalculation {
  amount_cents: number;
  expected_rank: number;
  next_rank: number;
  cents_to_next_rank: number;
  cents_to_number_one: number;
  cents_to_top_three: number;
  cents_to_top_ten: number;
}
