# FlexAI.lol — Competitive Pay-to-Rank Leaderboard for AI Products

FlexAI.lol is a competitive pay-to-rank arena and advertising marketplace for AI products. Founders submit their AI tool, choose a category, and pay a bid in integer cents. Products are ranked primarily by their active bid amount. Anyone can later outbid competing products in real-time.

---

## 🚀 Live Demo & Reference Architecture

- **Dark Premium Aesthetics**: Near-black/navy background (`#060813`), electric violet & blue glows, golden `#1` champion highlights, and glassmorphism.
- **Frontend**: [Astro](https://astro.build) with SSR adapter, TypeScript, Tailwind CSS, Lucide Icons, and React Islands for client interactivity.
- **Backend & Database**: Supabase PostgreSQL with atomic bid activation functions (`activate_paid_bid`), Row Level Security (RLS), and Realtime updates.
- **Payments**: Stripe Checkout with cryptographic webhook signature verification and strict idempotency via `stripe_events`.
- **Security**: Strict SSRF URL validation, integer cents calculation (no floating point errors), visitor hash generation with IP salt, and sliding-window rate limiting.

---

## 📦 Project Structure

```text
src/
  components/
    admin/            # Admin moderation portal
    bidding/          # Outflex calculator modal & success celebration
    dashboard/        # Founder dashboard
    layout/           # Header, Navbar, and Footer
    leaderboard/      # Hero section, Leaderboard cards, Category sidebar, Realtime sync
    product/          # Product detail view with rank/bid history
    stats/            # Live stats ticker & Wall of Fame strip
    submission/       # 5-step product submission wizard
    ui/               # Icons and UI primitives

  layouts/
    Layout.astro      # Main HTML shell with dynamic SEO and OG card tags

  lib/
    data/             # In-memory resilient state store with realistic mock AI companies
    email/            # Resend transactional email client with graceful fallback
    env.ts            # Strict Zod typed environment validation
    security/         # SSRF validator, IP hash generator, rate limiter
    stripe/           # Stripe Checkout session creator and webhook validator
    supabase/         # Authenticated client and privileged server client
    utils/            # Cents-to-dollars formatters, relative time, domain sanitizer

  pages/
    index.astro       # Homepage with Hero, Leaderboard & Wall of Fame
    submit.astro      # 5-step submission wizard
    categories/       # Category browse views
    hall-of-fame.astro# Milestones and historic records
    dashboard.astro   # Founder product management
    admin.astro       # Protected moderation portal
    about.astro       # Arena mechanics, transparency & FAQ
    ai/[slug].astro   # Dynamic product detail page
    bid/success.astro # Verified checkout landing page
    go/[slug].ts      # Controlled outbound click tracking and redirect
    api/              # RESTful endpoints (bids, products, webhook, leaderboard)

supabase/
  migrations/         # PostgreSQL schema, indexes, RLS, and atomic activation RPCs
  seed.sql            # Initial categories, achievements, and realistic products

tests/
  leaderboard.test.ts # Ordering, rank calculation, and currency format tests
  security.test.ts    # SSRF protection, loopback blocking, and IP hashing tests
  bids.test.ts        # Minimum bid ($5.00) enforcement and atomic activation tests
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.2+) or Node.js (v20+)

### 2. Install Dependencies
```bash
bun install
# or
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

*(The application includes an in-memory development engine, so it runs out-of-the-box even before connecting remote Supabase or Stripe credentials!)*

### 4. Run Development Server
```bash
bun run dev
# Server starts at http://127.0.0.1:4321/
```

### 5. Run Automated Tests
```bash
bun test
# or
npm test
```

---

## 🗄️ Supabase Setup & Migrations

When connecting a remote Supabase instance:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run:
   - `supabase/migrations/20260101000000_initial_schema.sql`
   - `supabase/seed.sql`
3. Copy your project URL and keys to `.env`:
   ```env
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
   SUPABASE_SECRET_KEY=eyJhbGciOi...
   ```

---

## 💳 Stripe Configuration & Local Webhook Testing

1. Create a Stripe account at [stripe.com](https://stripe.com).
2. Set your Stripe API keys in `.env`:
   ```env
   PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Test webhooks locally using the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:4321/api/stripe/webhook
   ```

---

## 🔒 Security Model & Architectural Rules

1. **Integer Cents Precision**: All financial calculations are stored strictly in integer cents (e.g., `$5.00` = `500`, `$12,456` = `1245600`).
2. **Server Authority**: The frontend is never authoritative for ranking, bids, or payment status. The PostgreSQL database + Stripe webhooks are the sole source of truth.
3. **Webhook Idempotency**: Handled via the `stripe_events` table to ensure duplicate webhook deliveries never create duplicate bids.
4. **SSRF Prevention**: `validateSafeUrl` blocks internal IP ranges (10.x, 172.16-31.x, 192.168.x), loopbacks (`localhost`, `127.0.0.1`), and cloud metadata IPs (`169.254.169.254`).
5. **Controlled Click Tracking**: Outbound links route via `/go/[slug]` using salted visitor hashes without storing sensitive IP addresses.

---

## 🌐 Production Deployment

The application is structured for zero-config deployment on Vercel or Cloudflare:

```bash
# Build production bundle
bun ./node_modules/astro/astro.js build
```

Deploy with Vercel:
```bash
npx vercel
```
