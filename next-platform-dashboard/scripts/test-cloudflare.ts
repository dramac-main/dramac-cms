/**
 * Test Cloudflare API Connection
 * 
 * Run with: npx tsx scripts/test-cloudflare.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(__dirname, '../.env.local') });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

async function testCloudflareConnection() {
  console.log('🧪 Testing Cloudflare API Connection...\n');

  // Check environment variables
  if (!CLOUDFLARE_API_TOKEN) {
    console.error('❌ CLOUDFLARE_API_TOKEN is not set in .env.local');
    process.exit(1);
  }

  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('❌ CLOUDFLARE_ACCOUNT_ID is not set in .env.local');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   Account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
  console.log(`   Token: ${CLOUDFLARE_API_TOKEN.substring(0, 10)}...`);
  console.log('');

  try {
    // Test 1: Verify Token
    console.log('📡 Test 1: Verifying API token...');
    const verifyResponse = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      console.error('❌ Token verification failed');
      console.error(JSON.stringify(verifyData.errors, null, 2));
      process.exit(1);
    }

    console.log('✅ Token is valid');
    console.log(`   Status: ${verifyData.result.status}`);
    console.log('');

    // Test 2: List Zones (Domains)
    console.log('📡 Test 2: Fetching zones...');
    const zonesResponse = await fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${CLOUDFLARE_ACCOUNT_ID}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const zonesData = await zonesResponse.json();

    if (!zonesData.success) {
      console.error('❌ Failed to fetch zones');
      console.error(JSON.stringify(zonesData.errors, null, 2));
      process.exit(1);
    }

    console.log('✅ Successfully connected to Cloudflare');
    console.log(`   Zones found: ${zonesData.result.length}`);
    
    if (zonesData.result.length > 0) {
      console.log('\n   Your domains:');
      zonesData.result.forEach((zone: any, index: number) => {
        console.log(`   ${index + 1}. ${zone.name} (${zone.status})`);
      });
    } else {
      console.log('   ℹ️  No domains added yet - that\'s okay!');
    }
    console.log('');

    // Test 3: Check Permissions
    console.log('📡 Test 3: Checking DNS edit permissions...');
    
    if (zonesData.result.length > 0) {
      const testZone = zonesData.result[0];
      const dnsResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${testZone.id}/dns_records`, {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const dnsData = await dnsResponse.json();

      if (dnsData.success) {
        console.log('✅ DNS read permission: OK');
        console.log(`   DNS records found: ${dnsData.result.length}`);
      } else {
        console.log('⚠️  Could not read DNS records');
        console.log('   This might be okay if you haven\'t set DNS edit permission');
      }
    } else {
      console.log('ℹ️  Skipping DNS test (no domains available)');
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════');
    console.log('🎉 SUCCESS! Cloudflare is properly configured');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('✅ Your Cloudflare setup is ready for DRAMAC!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Complete ResellerClub signup');
    console.log('2. Add ResellerClub credentials to .env.local');
    console.log('3. Configure agency in Supabase');
    console.log('4. Test email purchase flow');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing Cloudflare connection:');
    console.error(error);
    process.exit(1);
  }
}

testCloudflareConnection();
