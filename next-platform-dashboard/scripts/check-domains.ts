import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDomains() {
  console.log('🔍 Checking domains in database...\n');
  
  const { data, error } = await supabase
    .from('domains')
    .select('id, domain_name, cloudflare_zone_id, status, agency_id')
    .limit(10);
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('📭 No domains found in database\n');
    console.log('═══════════════════════════════════════════');
    console.log('To test DNS Management UI, you need to:');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('1. Start the dev server:');
    console.log('   pnpm dev');
    console.log('');
    console.log('2. Go to Domains page:');
    console.log('   http://localhost:3000/dashboard/domains');
    console.log('');
    console.log('3. Add a domain you own (or search & register one)');
    console.log('');
    console.log('4. Then access DNS at:');
    console.log('   /dashboard/domains/{domainId}/dns');
    console.log('');
  } else {
    console.log('═══════════════════════════════════════════');
    console.log(`📋 Found ${data.length} domain(s):`);
    console.log('═══════════════════════════════════════════\n');
    
    data.forEach((d, i) => {
      console.log(`[${i + 1}] ${d.domain_name}`);
      console.log(`    ID: ${d.id}`);
      console.log(`    Cloudflare Zone: ${d.cloudflare_zone_id || '❌ Not configured'}`);
      console.log(`    Status: ${d.status}`);
      console.log('');
      
      if (d.cloudflare_zone_id) {
        console.log(`    ✅ Ready to test DNS UI at:`);
        console.log(`    http://localhost:3000/dashboard/domains/${d.id}/dns`);
      } else {
        console.log(`    ⚠️  Need to add Cloudflare zone first`);
      }
      console.log('');
    });
  }
}

checkDomains().catch(console.error);
