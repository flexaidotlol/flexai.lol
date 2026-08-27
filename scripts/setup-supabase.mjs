import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabaseUrl = env.PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const supabaseKey = env.SUPABASE_SECRET_KEY;

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  try {
    // Check connection by querying categories or info
    console.log('Testing connection to Supabase...');
    const { data: catData, error: catError } = await supabase.from('categories').select('*').limit(1);
    
    if (catError) {
      console.log('Categories table check:', catError.message);
    } else {
      console.log('Categories table found! Count:', catData?.length);
    }

    const { data: prodData, error: prodError } = await supabase.from('products').select('*').limit(1);
    if (prodError) {
      console.log('Products table check:', prodError.message);
    } else {
      console.log('Products table found! Count:', prodData?.length);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

main();
