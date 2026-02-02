import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

async function debugDnsPage() {
  const domainId = '7d307724-0916-4492-90a6-e0f71f1782f4';
  
  console.log('═══════════════════════════════════════════');
  console.log('🔍 Debug DNS Page Data Flow');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Get domain from database
  console.log('📡 Step 1: Query domain from database...');
  const { data: domain, error: domainError } = await supabase
    .from('domains')
    .select('domain_name, cloudflare_zone_id')
    .eq('id', domainId)
    .single();

  if (domainError) {
    console.log('❌ Domain query error:', domainError.message);
    return;
  }

  console.log('✅ Domain found:', domain);
  console.log('   Domain name:', domain.domain_name);
  console.log('   Zone ID:', domain.cloudflare_zone_id);

  if (!domain.cloudflare_zone_id) {
    console.log('\n❌ No Cloudflare zone ID - this is the problem!');
    return;
  }

  // Step 2: Fetch from Cloudflare
  console.log('\n📡 Step 2: Fetch records from Cloudflare...');
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${domain.cloudflare_zone_id}/dns_records`,
    {
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  if (!result.success) {
    console.log('❌ Cloudflare API error:', result.errors);
    return;
  }

  console.log(`✅ Got ${result.result.length} records from Cloudflare`);

  // Step 3: Map records like the action does
  console.log('\n📡 Step 3: Map records for UI...');
  
  const mappedRecords = result.result.map((r: any) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    content: r.content,
    ttl: r.ttl,
    priority: r.priority,
    proxied: r.proxied,
    proxiable: r.proxiable,
    status: 'active',
  }));

  console.log('✅ Mapped records:', JSON.stringify(mappedRecords, null, 2));

  console.log('\n═══════════════════════════════════════════');
  console.log('🎉 Everything looks good! The API flow works.');
  console.log('═══════════════════════════════════════════');
  console.log('\nIf the UI still shows "Failed to fetch records":');
  console.log('1. Make sure the dev server is running');
  console.log('2. Clear browser cache and refresh');
  console.log('3. Check browser Network tab for errors');
}

debugDnsPage().catch(console.error);
