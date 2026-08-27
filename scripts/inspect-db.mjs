import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function check() {
  const { data: products } = await supabase.from('products').select('*');
  console.log('PRODUCTS IN SUPABASE:', JSON.stringify(products, null, 2));

  const { data: categories } = await supabase.from('categories').select('id, slug, name');
  console.log(`CATEGORIES IN SUPABASE (${categories?.length}):`, categories);
}

check();
