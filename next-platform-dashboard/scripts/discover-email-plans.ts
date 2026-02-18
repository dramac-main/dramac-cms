/**
 * Discovery script — calls the RC products/reseller-cost-price.json endpoint
 * and lists ALL product keys that have email_account_ranges.
 *
 * Usage: npx tsx scripts/discover-email-plans.ts
 * Requires env vars: RESELLERCLUB_API_URL, RESELLERCLUB_RESELLER_ID, RESELLERCLUB_API_KEY
 */

const apiUrl = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com/api';
const resellerId = process.env.RESELLERCLUB_RESELLER_ID || '';
const apiKey = process.env.RESELLERCLUB_API_KEY || '';

if (!resellerId || !apiKey) {
  console.error('Missing RESELLERCLUB_RESELLER_ID or RESELLERCLUB_API_KEY');
  process.exit(1);
}

async function main() {
  // Use reseller-cost-price (doesn't require customer-id)
  const url = `${apiUrl}/products/reseller-cost-price.json?auth-userid=${resellerId}&api-key=${apiKey}`;
  console.log(`Fetching: ${apiUrl}/products/reseller-cost-price.json ...`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${await response.text()}`);
    process.exit(1);
  }

  const data = await response.json() as Record<string, unknown>;

  // Find all keys that have email_account_ranges
  const emailPlans: string[] = [];
  const otherProducts: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null && 'email_account_ranges' in value) {
      emailPlans.push(key);
    } else {
      otherProducts.push(key);
    }
  }

  console.log('\n=== EMAIL PLANS (have email_account_ranges) ===');
  for (const key of emailPlans.sort()) {
    const plan = data[key] as Record<string, unknown>;
    const ranges = plan.email_account_ranges as Record<string, Record<string, Record<string, number>>>;
    const slabs = Object.keys(ranges || {});
    const firstSlab = slabs[0];
    const addPrices = firstSlab ? ranges[firstSlab]?.add : null;
    console.log(`  ${key}`);
    console.log(`    Slabs: ${slabs.join(', ')}`);
    if (addPrices) {
      console.log(`    Add prices (slab ${firstSlab}):`);
      for (const [months, price] of Object.entries(addPrices)) {
        console.log(`      ${months} month(s): $${price}/acc`);
      }
    }
    console.log('');
  }

  console.log('=== OTHER PRODUCTS (no email_account_ranges) ===');
  console.log(`  ${otherProducts.sort().join(', ')}`);
  console.log(`\nTotal: ${emailPlans.length} email plan(s), ${otherProducts.length} other product(s)`);
}

main().catch(console.error);
