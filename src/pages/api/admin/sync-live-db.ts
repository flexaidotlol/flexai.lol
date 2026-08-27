import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabase/server';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (supabaseServer) {
    const { data, error } = await supabaseServer
      .from('products')
      .update({ logo_url: '/logos/buildfast.svg' })
      .eq('slug', 'buildfast')
      .select();

    return new Response(
      JSON.stringify({
        success: !error,
        updated: data,
        error: error ? error.message : null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ message: 'Supabase server is not configured in environment' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
