import { z } from 'zod';

const envSchema = z.object({
  // App
  PUBLIC_SITE_URL: z.string().url().default('http://localhost:4321'),
  PUBLIC_APP_NAME: z.string().default('FlexAI'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  PUBLIC_SUPABASE_URL: z.string().optional().default(''),
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(''),
  SUPABASE_SECRET_KEY: z.string().optional().default(''),

  // Stripe
  PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  STRIPE_CURRENCY: z.string().default('usd'),
  MINIMUM_BID_CENTS: z.coerce.number().default(200),

  // Email
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('FlexAI <hello@flexai.lol>'),

  // Turnstile
  PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(''),
  TURNSTILE_SECRET_KEY: z.string().optional().default(''),

  // Analytics & Monitoring
  PUBLIC_POSTHOG_KEY: z.string().optional().default(''),
  PUBLIC_POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),
  PUBLIC_SENTRY_DSN: z.string().optional().default(''),
  SENTRY_AUTH_TOKEN: z.string().optional().default(''),

  // Security
  CRON_SECRET: z.string().default('dev-cron-secret'),
  ADMIN_SECRET: z.string().default('flexai-admin-secret-2026'),
  IP_HASH_SALT: z.string().default('flexai-salt-development-hash'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const rawEnv = {
    PUBLIC_SITE_URL: import.meta.env?.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL,
    PUBLIC_APP_NAME: import.meta.env?.PUBLIC_APP_NAME || process.env.PUBLIC_APP_NAME,
    NODE_ENV: import.meta.env?.MODE || process.env.NODE_ENV || 'development',
    PUBLIC_SUPABASE_URL: import.meta.env?.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: import.meta.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: import.meta.env?.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: import.meta.env?.PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: import.meta.env?.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: import.meta.env?.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CURRENCY: import.meta.env?.STRIPE_CURRENCY || process.env.STRIPE_CURRENCY,
    MINIMUM_BID_CENTS: import.meta.env?.MINIMUM_BID_CENTS || process.env.MINIMUM_BID_CENTS,
    RESEND_API_KEY: import.meta.env?.RESEND_API_KEY || process.env.RESEND_API_KEY,
    EMAIL_FROM: import.meta.env?.EMAIL_FROM || process.env.EMAIL_FROM,
    PUBLIC_TURNSTILE_SITE_KEY: import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY || process.env.PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: import.meta.env?.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY,
    PUBLIC_POSTHOG_KEY: import.meta.env?.PUBLIC_POSTHOG_KEY || process.env.PUBLIC_POSTHOG_KEY,
    PUBLIC_POSTHOG_HOST: import.meta.env?.PUBLIC_POSTHOG_HOST || process.env.PUBLIC_POSTHOG_HOST,
    PUBLIC_SENTRY_DSN: import.meta.env?.PUBLIC_SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN,
    SENTRY_AUTH_TOKEN: import.meta.env?.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN,
    CRON_SECRET: import.meta.env?.CRON_SECRET || process.env.CRON_SECRET,
    ADMIN_SECRET: import.meta.env?.ADMIN_SECRET || process.env.ADMIN_SECRET,
    IP_HASH_SALT: import.meta.env?.IP_HASH_SALT || process.env.IP_HASH_SALT,
  };

  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    // Return default parsed with fallbacks in dev
    return envSchema.parse({});
  }
  return result.data;
}

export const env = parseEnv();
