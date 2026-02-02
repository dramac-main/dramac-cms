import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const ZONE_ID = 'f76379bb513f5a3cd277f6d707779912'; // dramacagency.com

async function testDnsRecords() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 Testing DNS Records Fetch');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test 1: Fetch DNS records directly from Cloudflare
    console.log('📡 Fetching DNS records from Cloudflare...\n');
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
      {
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!result.success) {
      console.log('❌ Failed to fetch records:', result.errors);
      return;
    }

    console.log(`✅ Successfully fetched ${result.result.length} DNS records\n`);
    
    if (result.result.length === 0) {
      console.log('ℹ️  No DNS records exist yet (this is normal for a new zone)');
      console.log('');
      console.log('The DNS UI should show an empty table with:');
      console.log('  "No DNS records found"');
      console.log('');
      console.log('You can test by clicking "Add Record" to create one!');
    } else {
      console.log('📋 Current DNS Records:');
      console.log('─────────────────────────────────────────');
      result.result.forEach((record: any, i: number) => {
        console.log(`[${i + 1}] ${record.type.padEnd(6)} ${record.name}`);
        console.log(`    → ${record.content}`);
        console.log(`    TTL: ${record.ttl}, Proxied: ${record.proxied || false}`);
        console.log('');
      });
    }

    // Test 2: Create a test record
    console.log('\n═══════════════════════════════════════════');
    console.log('🧪 Test 2: Create a test TXT record');
    console.log('═══════════════════════════════════════════\n');

    const createResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TXT',
          name: '_dramac-test',
          content: 'DRAMAC DNS Test - ' + new Date().toISOString(),
          ttl: 3600,
        }),
      }
    );

    const createResult = await createResponse.json();

    if (!createResult.success) {
      if (createResult.errors?.[0]?.code === 81057) {
        console.log('ℹ️  Test record already exists (that\'s fine!)');
      } else {
        console.log('❌ Failed to create test record:', createResult.errors);
      }
    } else {
      console.log('✅ Test TXT record created successfully!');
      console.log(`   ID: ${createResult.result.id}`);
      console.log(`   Name: ${createResult.result.name}`);
    }

  } catch (error) {
    console.log('❌ Error:', error);
  }
}

testDnsRecords();
