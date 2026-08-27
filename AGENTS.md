# FlexAI.lol — Project Context & Agent Operating Guidelines

> **File Purpose**: This document serves as the persistent system context, architecture reference, and development guide for AI coding assistants (Antigravity, Gemini, and other agents) working on the **FlexAI.lol** codebase.

---

## 1. 📌 Project Overview & Identity

**FlexAI.lol** is a competitive, real-time pay-to-rank arena and advertising directory for AI products, tools, and startups.

### Core Value Proposition & Mechanics:
1. **Pay-to-Rank Bidding**: AI founders list their product and submit monetary bids. Products are ranked strictly by their active total bid amount (`current_bid_cents`).
2. **Outbidding ("Outflex")**: Anyone can outbid competing products in real time to take over higher spots or claim the coveted **#1 Champion** spot.
3. **High-ROI Exposure**: Higher rankings give products top visual hierarchy, gold/electric glows, live stats placement, verified DOFOLLOW backlink signals, and outbound click tracking.
4. **Gamification**: Wall of Fame, achievements (e.g. *First $100*, *First $1,000*, *Top 3*, *Reached #1*), live online presence counters, and rank change tickers.

---

## 2. 🛠️ Technology Stack

| Layer | Technology | Details / Purpose |
| :--- | :--- | :--- |
| **Framework** | **Astro v4.16+** | Server-Side Rendering (SSR) via `@astrojs/node`, hybrid pages, fast routing |
| **Client UI** | **React 18** | Interactive React Islands (`client:load`, `client:visible`) embedded in `.astro` layouts |
| **Styling** | **Tailwind CSS v3** | Custom dark theme palette, glow utilities, glassmorphism, animated borders |
| **Icons & Effects** | **Lucide React**, **canvas-confetti** | Modern stroke icons, outbid celebratory animations |
| **Validation** | **Zod v3** | Strict schema validation for environment variables, API payloads, forms |
| **Database** | **Supabase (PostgreSQL)** | RLS policies, custom indexes, atomic stored procedures (`activate_paid_bid`), Realtime channels |
| **Resilience / Dev** | **In-Memory Mock Store** | Full local simulation store (`mock-store.ts`) allowing zero-config local development |
| **Payments** | **Stripe Checkout & Webhooks** | Dynamic checkout sessions, cryptographic signature verification, idempotency tracking |
| **Email** | **Resend** | Transactional receipts and rank-change alert notifications |
| **Testing** | **Vitest** | Unit & integration tests for ranking logic, security/SSRF, currency conversions |

---

## 3. 📂 Directory Structure

```text
FlexAI/
├── AGENTS.md                  # <-- THIS FILE: Persistent context & rules for AI assistants
├── GEMINI.md                  # Symlink/mirror for Gemini agent compatibility
├── README.md                  # Human-facing project documentation
├── package.json               # Dependencies and npm scripts
├── astro.config.mjs           # Astro configuration (Node adapter, React, Tailwind)
├── tailwind.config.mjs        # Custom color tokens, gradients, animation keyframes
├── tsconfig.json              # TypeScript compiler options & paths
├── .env.example               # Template for environment configuration
│
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # Root HTML shell, SEO meta tags, Google Fonts, theme handler
│   │
│   ├── types/
│   │   └── index.ts           # Core TypeScript definitions (Product, Bid, Category, Stats, etc.)
│   │
│   ├── services/              # High-level domain services (dual-mode DB/mock abstraction)
│   │   ├── bids.ts            # Product creation, outbid sessions, paid bid processing
│   │   └── leaderboard.ts     # Leaderboard retrieval, categories, live stats, rank calculations
│   │
│   ├── lib/                   # Infrastructure & utilities
│   │   ├── env.ts             # Zod-validated environment config with dev fallbacks
│   │   ├── data/
│   │   │   └── mock-store.ts  # In-memory resilient state store with realistic sample products
│   │   ├── security/
│   │   │   └── index.ts       # SSRF validator, IP hash generator, sliding-window rate limiter
│   │   ├── stripe/
│   │   │   └── index.ts       # Stripe client, checkout session builder, webhook constructor
│   │   ├── supabase/
│   │   │   ├── client.ts      # Public browser-safe Supabase client
│   │   │   └── server.ts      # Privileged server-side Supabase client
│   │   ├── email/
│   │   │   └── index.ts       # Resend email client with fallback logging
│   │   └── utils/
│   │       └── format.ts      # Cents-to-dollars formatters, slug generator, domain sanitizers
│   │
│   ├── components/            # UI components (Astro & React Islands)
│   │   ├── admin/             # Moderation portal (`AdminPortal.tsx`)
│   │   ├── bidding/           # Outbid modal (`OutflexModal.tsx`), `SuccessCelebration.tsx`
│   │   ├── dashboard/         # Founder management (`FounderDashboard.tsx`)
│   │   ├── layout/            # `Navbar.tsx`, `Footer.astro`
│   │   ├── leaderboard/       # `HeroSection.tsx`, `LeaderboardCard.tsx`, `RealtimeLeaderboard.tsx`
│   │   ├── product/           # `ProductDetail.tsx` (history charts, ranking badges)
│   │   ├── stats/             # `LiveStatsBar.tsx`, `WallOfFameStrip.tsx`
│   │   ├── submission/        # 5-step wizard (`SubmitWizard.tsx`)
│   │   └── ui/                # Reusable UI primitives and icons
│   │
│   └── pages/                 # Routing endpoints
│       ├── index.astro        # Homepage (Hero, Live Stats, Category Tabs, Leaderboard)
│       ├── submit.astro       # 5-Step Product Submission wizard page
│       ├── categories/        # Category filtered browse views
│       ├── hall-of-fame.astro # Historic milestones and top achievement records
│       ├── dashboard.astro    # Founder product management console
│       ├── admin.astro        # Protected moderation & approvals portal
│       ├── about.astro        # Transparency, rules, FAQ, and bidding mechanics
│       ├── ai/[slug].astro    # Dynamic individual product profile page
│       ├── bid/success.astro  # Post-payment verified landing page with celebratory confetti
│       ├── go/[slug].ts       # Controlled outbound click tracking and redirect endpoint
│       └── api/               # REST API endpoints
│           ├── bids/          # `calculate.ts`, `create-checkout.ts`
│           ├── products/      # `submit.ts`
│           ├── stripe/        # `webhook.ts`
│           ├── leaderboard.ts # JSON endpoint for leaderboard data
│           ├── live-stats.ts  # JSON endpoint for global stats
│           └── presence.ts    # Live visitor counter heartbeat
│
├── supabase/
│   ├── migrations/
│   │   └── 20260101000000_initial_schema.sql  # Schema, RLS policies, indexes, and RPC functions
│   └── seed.sql               # Default categories, achievements, and realistic seed AI tools
│
└── tests/
    ├── bids.test.ts           # Minimum bid, atomic activation, webhook idempotency tests
    ├── leaderboard.test.ts    # Ranking order, formatting, slug tests
    └── security.test.ts       # SSRF protection, private IP blocking, salted visitor hashes
```

---

## 4. 💰 Financial & Ranking Business Logic Rules

### 1. Integer Cents Precision (MANDATORY)
* **Never use floating point numbers** (e.g., `49.99`) for storing or calculating money.
* All currency values are strictly handled in **integer cents** (`4999` cents = `$49.99`).
* The minimum bid allowed across the system is **$2.00** (`200` cents).

### 2. Ranking Algorithm
* **Primary criterion**: `current_bid_cents DESC` (Highest total bid amount occupies Rank #1).
* **Tie-breaker**: `updated_at ASC` (The product that reached the bid amount first holds the higher spot).
* Ranks are 1-indexed (`1, 2, 3...`). Rank #1 is highlighted with special gold gradients and `#1 Champion` badges.

### 3. Dual-State Architecture (Supabase ↔ Mock Store Fallback)
* The app operates seamlessly in two environments:
  1. **Production / Supabase Mode**: Activated when `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` are provided. Queries PostgreSQL and executes stored procedures.
  2. **Local / In-Memory Mode**: When Supabase credentials are absent, the application automatically uses `src/lib/data/mock-store.ts`. It provides an in-memory replica with state mutations, rank recalculation, mock Stripe sessions, and simulated checkouts.

---

## 5. 🛡️ Security & Integrity Standards

1. **SSRF URL Sanitization**:
   - Every external URL submitted by users (`website_url`, `logo_url`) MUST be validated using `validateSafeUrl()` (`src/lib/security/index.ts`).
   - It rigorously rejects:
     - `localhost`, `127.0.0.1`, `::1`, `0.0.0.0`, `*.local`, `*.internal`.
     - Cloud metadata IPs: `169.254.169.254`.
     - RFC1918 Private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
     - Non-HTTP protocols (`file://`, `javascript:`, `ftp://`).

2. **Visitor Privacy & Outbound Click Tracking**:
   - Outbound link clicks are routed through `/go/[slug]`.
   - Visitor analytics use `hashVisitor(ip, userAgent)` with HMAC-SHA256 and `IP_HASH_SALT`. Raw IP addresses are **never stored** in the database.

3. **Stripe Webhook Idempotency**:
   - Webhook events are cryptographically verified with `stripe.webhooks.constructEvent`.
   - Event IDs are logged in the `stripe_events` table (or mock store set) to guarantee that duplicate webhook deliveries will never double-charge or double-credit a bid.

4. **Atomic Bid Activation**:
   - Bids are activated using the PostgreSQL RPC function `activate_paid_bid(p_bid_id, p_stripe_payment_intent_id)`.
   - It performs row-level locking (`FOR UPDATE`), updates bid status to `paid`, increments `products.current_bid_cents`, recalculates the new global rank, records a `rank_history` entry, and automatically awards milestone achievements.

---

## 6. 🎨 Design System & Aesthetics

* **Dark-First Modern Theme**:
  - Background: Deep void `/ dark-950` (`#060813`, `#0a0e1a`).
  - Cards: Glassmorphism with slate/violet borders (`#0f1424` / `rgba(255, 255, 255, 0.05)`).
  - Accents: Electric violet (`#8b5cf6`), cyber cyan (`#06b6d4`), champion gold (`#f59e0b` / `#fbbf24`).
* **Micro-Interactions**:
  - Outbid trigger buttons with dynamic calculations ("Outbid by +$5 to reach #1").
  - Confetti burst effects on successful payment.
  - Live animated green pulse indicators for online users and active bids.

---

## 7. 💻 Development & Operational Runbook

### Commands
```bash
# Start development server (Astro SSR with live reload)
npm run dev

# Run automated Vitest test suite
npm test

# Type-check TypeScript & Astro templates
npm run build

# Preview production build
npm run preview
```

### Environment Variables Cheat Sheet
```env
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_APP_NAME=FlexAI
NODE_ENV=development

# Supabase (Optional for local dev, uses mock-store if empty)
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Stripe (Optional for local dev, uses simulated checkout if empty)
PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=usd
MINIMUM_BID_CENTS=500

# Security
ADMIN_SECRET=flexai-admin-secret-2026
IP_HASH_SALT=flexai-salt-development-hash
```

---

## 8. 🤖 Guidelines for AI Coding Assistants

1. **Preserve Dual Compatibility**: Whenever modifying services or endpoints, ensure both the **Supabase client path** and the **`mock-store.ts` path** are updated and tested.
2. **Never Break Financial Precision**: Always pass amounts as integer cents (`amount_cents`). Never format money as raw floats. Use `centsToDollars()` for display.
3. **Always Run SSRF Checks**: Any new endpoint accepting user URLs must call `validateSafeUrl`.
4. **React Islands Convention**: When adding client-side interactivity to `.astro` pages, import the React component and specify the appropriate Astro hydration directive (e.g. `client:load` or `client:visible`).
5. **No Regressions**: Run `npm test` after modifying core bidding or leaderboard logic to ensure all integrity assertions pass.
