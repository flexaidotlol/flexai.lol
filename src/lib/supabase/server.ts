import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

const hasServerSupabase = Boolean(
  env.PUBLIC_SUPABASE_URL &&
  env.PUBLIC_SUPABASE_URL.startsWith('https://') &&
  !env.PUBLIC_SUPABASE_URL.includes('mock') &&
  env.SUPABASE_SECRET_KEY &&
  !env.SUPABASE_SECRET_KEY.includes('mock')
);

const cleanUrl = env.PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseServer = hasServerSupabase
  ? createClient(cleanUrl, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
