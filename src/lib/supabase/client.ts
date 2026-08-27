import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

// Ensure global WebSocket exists in Node.js runtime
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const hasValidSupabase = Boolean(
  env.PUBLIC_SUPABASE_URL &&
  env.PUBLIC_SUPABASE_URL.startsWith('https://') &&
  !env.PUBLIC_SUPABASE_URL.includes('mock') &&
  env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const cleanUrl = env.PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseClient = (() => {
  if (!hasValidSupabase) return null;
  try {
    return createClient(cleanUrl, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Supabase client init error:', err);
    return null;
  }
})();
