import fs from 'fs';

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

async function testEndpoints() {
  console.log('Testing SQL execution endpoints...');

  // Try standard Supabase SQL execution endpoint
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('/rpc/exec_sql response status:', res.status);
    const text = await res.text();
    console.log('/rpc/exec_sql response:', text);
  } catch (e) {
    console.log('/rpc/exec_sql error:', e.message);
  }

  // Try Supabase pg query endpoint
  try {
    const res = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('/pg/query response status:', res.status);
    const text = await res.text();
    console.log('/pg/query response:', text);
  } catch (e) {
    console.log('/pg/query error:', e.message);
  }
}

testEndpoints();
