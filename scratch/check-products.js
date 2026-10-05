const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) envVars[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/products?select=id,name,slug,category,is_featured`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(r => r.json())
.then(d => {
  console.log('COUNT:', Array.isArray(d) ? d.length : d);
  console.log('PRODUCTS:', d);
})
.catch(e => console.error(e));
