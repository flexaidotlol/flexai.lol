-- ==============================================================================
-- FlexAI.lol - Seed Data
-- ==============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, slug, name, description, icon, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'ai-assistants', 'AI Assistants', 'Conversational AI, chat assistants, and general reasoning tools', 'Bot', 1),
('c0000000-0000-0000-0000-000000000002', 'ai-agents', 'AI Agents', 'Autonomous workflow executors and multi-agent systems', 'Cpu', 2),
('c0000000-0000-0000-0000-000000000003', 'ai-image-video', 'AI Image & Video', 'Generative imaging, video creation, and artistic AI tools', 'Image', 3),
('c0000000-0000-0000-0000-000000000004', 'ai-code-dev', 'AI Code & Dev', 'Code generation, autocomplete, debuggers, and developer agents', 'Code', 4),
('c0000000-0000-0000-0000-000000000005', 'ai-marketing', 'AI Marketing', 'Copywriting, SEO optimization, and ad campaign generation', 'Megaphone', 5),
('c0000000-0000-0000-0000-000000000006', 'ai-voice-audio', 'AI Voice & Audio', 'Voice synthesis, music composition, and audio mastering', 'Mic', 6),
('c0000000-0000-0000-0000-000000000007', 'ai-productivity', 'AI Productivity', 'Note taking, task automation, and intelligent workflows', 'Zap', 7),
('c0000000-0000-0000-0000-000000000008', 'ai-research', 'AI Research', 'Academic research assistants, paper summarizers, and science tools', 'BookOpen', 8),
('c0000000-0000-0000-0000-000000000009', 'ai-automation', 'AI Automation', 'No-code workflow pipelines, browser agents, and web scrapers', 'RefreshCw', 9),
('c0000000-0000-0000-0000-000000000010', 'ai-business', 'AI Business', 'CRM automation, sales intelligence, and financial analysis', 'Briefcase', 10),
('c0000000-0000-0000-0000-000000000011', 'ai-education', 'AI Education', 'Personalized tutoring, language learning, and study bots', 'GraduationCap', 11),
('c0000000-0000-0000-0000-000000000012', 'ai-fun-entertainment', 'AI Fun & Entertainment', 'Gaming companions, roleplay characters, and interactive humor', 'Smile', 12)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 2. SEED ACHIEVEMENTS
INSERT INTO public.achievements (id, slug, name, description, icon, achievement_type, threshold_value) VALUES
('a0000000-0000-0000-0000-000000000001', 'first_100', 'First $100', 'Broke through the triple digit barrier ($100 in bids)', 'DollarSign', 'milestone', 10000),
('a0000000-0000-0000-0000-000000000002', 'first_1000', 'First $1,000', 'Entered the 4-figure club ($1,000 in bids)', 'Award', 'milestone', 100000),
('a0000000-0000-0000-0000-000000000003', 'first_10000', 'First $10,000', 'Flex legend status ($10,000 in bids)', 'Crown', 'milestone', 1000000),
('a0000000-0000-0000-0000-000000000004', 'reached_number_one', 'Took the Throne', 'Reached #1 on the global leaderboard', 'Trophy', 'rank', 1),
('a0000000-0000-0000-0000-000000000005', 'top_three', 'Podium Finish', 'Climbed into the top 3 global positions', 'Medal', 'rank', 3),
('a0000000-0000-0000-0000-000000000006', 'biggest_climb', 'Rocket Climb', 'Climbed 5+ leaderboard positions with a single flex bid', 'Flame', 'climb', 5)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- 3. SEED INITIAL PRODUCTS: Buildfast at #1
INSERT INTO public.products (id, category_id, slug, name, tagline, description, website_url, logo_url, x_handle, status, current_bid_cents, highest_rank, total_clicks, is_verified) VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'buildfast', 'Buildfast', 'Ship production-ready AI apps at lightspeed.', 'Buildfast is the developer platform to prototype, build, and deploy full-stack AI products in minutes.', 'https://buildfast-ai.com', '/logos/buildfast.svg', 'ByManuuDB', 'active', 100, 1, 42, true)
ON CONFLICT (slug) DO UPDATE SET
    logo_url = EXCLUDED.logo_url,
    current_bid_cents = EXCLUDED.current_bid_cents,
    tagline = EXCLUDED.tagline,
    website_url = EXCLUDED.website_url;
