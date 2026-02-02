import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🔧 Link Existing Cloudflare Zone to Domain');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('If you added the domain manually in Cloudflare Dashboard,');
  console.log('enter the Zone ID to link it to the database.');
  console.log('');
  
  const zoneId = await prompt('Enter Cloudflare Zone ID: ');
  
  if (!zoneId.trim()) {
    console.log('❌ Zone ID is required');
    rl.close();
    return;
  }

  // Fetch zone info from Cloudflare
  console.log('\n📡 Fetching zone info from Cloudflare...');
  
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId.trim()}`, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });
  
  const result = await response.json();
  
  if (!result.success) {
    console.log('❌ Failed to fetch zone:', result.errors);
    rl.close();
    return;
  }

  const zone = result.result;
  console.log(`✅ Found zone: ${zone.name}`);
  console.log(`   Status: ${zone.status}`);
  console.log(`   Nameservers: ${zone.name_servers?.join(', ')}`);

  // Find matching domain
  const { data: domain, error: findError } = await supabase
    .from('domains')
    .select('id, domain_name')
    .eq('domain_name', zone.name)
    .single();

  if (findError || !domain) {
    console.log(`\n❌ No domain found in database for ${zone.name}`);
    rl.close();
    return;
  }

  console.log(`\n✅ Found matching domain in database: ${domain.id}`);
  
  // Update domain
  const { error: updateError } = await supabase
    .from('domains')
    .update({
      cloudflare_zone_id: zone.id,
      nameservers: zone.name_servers || [],
      dns_status: zone.status === 'active' ? 'active' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', domain.id);

  if (updateError) {
    console.log('❌ Failed to update domain:', updateError.message);
  } else {
    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 SUCCESS! Domain linked to Cloudflare zone');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📋 Test DNS UI at:');
    console.log(`   http://localhost:3000/dashboard/domains/${domain.id}/dns`);
    console.log('');
    console.log('📋 Nameservers to set at your registrar:');
    zone.name_servers?.forEach((ns: string) => {
      console.log(`   • ${ns}`);
    });
  }
  
  rl.close();
}

main().catch((e) => {
  console.error(e);
  rl.close();
});
