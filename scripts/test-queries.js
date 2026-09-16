const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testProg() {
  const p = await supabase.from('programs').select('*').limit(1);
  console.log('programs keys:', Object.keys(p.data?.[0] || {}));

  const res = await supabase.from('programs').select('id, name, description, country');
  console.log('programs error:', res.error?.message || 'SUCCESS');
}

testProg();
