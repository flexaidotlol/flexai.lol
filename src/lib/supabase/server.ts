import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

// Ensure global WebSocket exists in Node.js runtime so Supabase client never throws
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const hasServerSupabase = Boolean(
  env.PUBLIC_SUPABASE_URL &&
  env.PUBLIC_SUPABASE_URL.startsWith('https://') &&
  !env.PUBLIC_SUPABASE_URL.includes('mock') &&
  env.SUPABASE_SECRET_KEY &&
  !env.SUPABASE_SECRET_KEY.includes('mock')
);

const cleanUrl = env.PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseServer = (() => {
  if (!hasServerSupabase) return null;
  try {
    return createClient(cleanUrl, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.error('Supabase server init error:', err);
    return null;
  }
})();
