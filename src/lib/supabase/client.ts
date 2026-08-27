import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

const hasValidSupabase = Boolean(
  env.PUBLIC_SUPABASE_URL &&
  env.PUBLIC_SUPABASE_URL.startsWith('https://') &&
  !env.PUBLIC_SUPABASE_URL.includes('mock') &&
  env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const cleanUrl = env.PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseClient = hasValidSupabase
  ? createClient(cleanUrl, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
