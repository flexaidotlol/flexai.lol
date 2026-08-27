import fs from 'fs';

const PROJECT_REF = process.env.PUBLIC_SUPABASE_PROJECT_REF || 'ifwyogouwsbbwyapobbe';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

async function executeSql(sqlQuery, label) {
  console.log(`\n--- Executing ${label} ---`);
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sqlQuery })
  });

  const status = response.status;
  const result = await response.text();

  if (status >= 200 && status < 300) {
    console.log(`✅ Success for ${label}! Status: ${status}`);
    console.log('Result:', result);
    return { success: true, result };
  } else {
    console.error(`❌ Failed for ${label}! Status: ${status}`);
    console.error('Response:', result);
    return { success: false, error: result };
  }
}

async function run() {
  const sql = `
    UPDATE public.products 
    SET logo_url = '/logos/buildfast.svg' 
    WHERE slug = 'buildfast' OR name ILIKE '%buildfast%';

    SELECT id, slug, name, logo_url, current_bid_cents FROM public.products WHERE slug = 'buildfast';
  `;

  await executeSql(sql, 'Update Buildfast Logo in Live Supabase');
}

run();
