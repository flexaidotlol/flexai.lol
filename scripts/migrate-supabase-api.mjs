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
    return { success: true, result };
  } else {
    console.error(`❌ Failed for ${label}! Status: ${status}`);
    console.error('Response:', result);
    return { success: false, error: result };
  }
}

async function run() {
  try {
    // Read seed SQL
    const seedSql = fs.readFileSync('supabase/seed.sql', 'utf-8');
    const seedRes = await executeSql(seedSql, 'Seed Data (Categories, Achievements, Buildfast #1)');

    if (!seedRes.success) {
      console.error('Seed failed.');
      return;
    }

    console.log('\n🎉 ALL SUPABASE SEED DATA CREATED SUCCESSFULLY!');
  } catch (err) {
    console.error('Execution error:', err);
  }
}

run();
