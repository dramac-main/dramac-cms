import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;

async function addCloudflareZone(domainName: string, domainId: string) {
  console.log(`\n🌐 Adding ${domainName} to Cloudflare...\n`);
  
  // Step 1: Create zone in Cloudflare
  console.log('📡 Step 1: Creating Cloudflare zone...');
  
  const createResponse = await fetch('https://api.cloudflare.com/client/v4/zones', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: domainName,
      account: { id: CF_ACCOUNT_ID },
      type: 'full',
    }),
  });

  const createResult = await createResponse.json();
  
  if (!createResult.success) {
    // Check if zone already exists
    if (createResult.errors?.[0]?.code === 1061) {
      console.log('ℹ️  Zone already exists in Cloudflare, fetching existing zone...');
      
      // Fetch existing zone
      const listResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones?name=${domainName}`,
        {
          headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
        }
      );
      const listResult = await listResponse.json();
      
      if (listResult.success && listResult.result.length > 0) {
        const zone = listResult.result[0];
        console.log(`✅ Found existing zone: ${zone.id}`);
        console.log(`   Status: ${zone.status}`);
        console.log(`   Nameservers: ${zone.name_servers?.join(', ') || 'N/A'}`);
        
        // Update domain in database
        await updateDomain(domainId, zone.id, zone.name_servers || [], zone.status);
        return zone;
      }
    }
    
    console.log('❌ Failed to create zone:', createResult.errors);
    return null;
  }

  const zone = createResult.result;
  console.log(`✅ Zone created: ${zone.id}`);
  console.log(`   Status: ${zone.status}`);
  console.log(`   Nameservers: ${zone.name_servers?.join(', ')}`);
  
  // Step 2: Update domain in Supabase
  await updateDomain(domainId, zone.id, zone.name_servers || [], zone.status);
  
  return zone;
}

async function updateDomain(domainId: string, zoneId: string, nameservers: string[], status: string) {
  console.log('\n📡 Step 2: Updating domain in database...');
  
  const { error } = await supabase
    .from('domains')
    .update({
      cloudflare_zone_id: zoneId,
      nameservers: nameservers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (error) {
    console.log('❌ Failed to update domain:', error.message);
  } else {
    console.log('✅ Domain updated in database');
  }
}

async function main() {
  // Using dramacagency.com (active domain)
  const domainName = 'dramacagency.com';
  const domainId = '7d307724-0916-4492-90a6-e0f71f1782f4';
  
  console.log('═══════════════════════════════════════════');
  console.log('🔧 Setup Cloudflare Zone for DNS Testing');
  console.log('═══════════════════════════════════════════');
  
  const zone = await addCloudflareZone(domainName, domainId);
  
  if (zone) {
    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 SUCCESS! Domain ready for DNS testing');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📋 Next steps:');
    console.log('');
    console.log('1. Update your domain registrar nameservers to:');
    zone.name_servers?.forEach((ns: string) => {
      console.log(`   • ${ns}`);
    });
    console.log('');
    console.log('2. Start dev server: pnpm dev');
    console.log('');
    console.log('3. Test DNS UI at:');
    console.log(`   http://localhost:3000/dashboard/domains/${domainId}/dns`);
    console.log('');
    console.log('Note: DNS operations will work even before nameserver');
    console.log('propagation - you just can\'t verify propagation yet.');
  }
}

main().catch(console.error);
