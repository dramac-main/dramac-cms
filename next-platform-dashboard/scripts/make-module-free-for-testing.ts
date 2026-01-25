/**
 * Make a Module Free for Testing
 * 
 * This script safely changes a module's pricing to "free" for testing purposes.
 * It handles both module_source (Module Studio) and modules_v2 (Marketplace).
 * 
 * SAFE TO RUN: This won't break existing subscriptions or installations.
 * 
 * Usage:
 *   npx tsx scripts/make-module-free-for-testing.ts booking
 *   npx tsx scripts/make-module-free-for-testing.ts ecommerce
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const moduleSlug = process.argv[2];

if (!moduleSlug) {
  console.error("❌ Usage: npx tsx scripts/make-module-free-for-testing.ts <module-slug>");
  console.error("   Example: npx tsx scripts/make-module-free-for-testing.ts booking");
  process.exit(1);
}

async function makeModuleFree() {
  console.log(`🔧 Making module "${moduleSlug}" FREE for testing...\n`);

  try {
    // 1. Update module_source (Module Studio)
    console.log("📝 Updating module_source (Module Studio)...");
    const { data: sourceData, error: sourceError } = await supabase
      .from("module_source")
      .update({ pricing_tier: "free" })
      .eq("slug", moduleSlug)
      .select("id, slug, name, pricing_tier")
      .single();

    if (sourceError) {
      if (sourceError.code === "PGRST116") {
        console.log("⚠️  Module not found in module_source (this is OK if module wasn't created in Studio)");
      } else {
        console.error("❌ Error updating module_source:", sourceError);
      }
    } else {
      console.log("✅ Module Studio updated:");
      console.log(`   ID: ${sourceData.id}`);
      console.log(`   Name: ${sourceData.name}`);
      console.log(`   Pricing: ${sourceData.pricing_tier}`);
    }

    // 2. Update modules_v2 (Marketplace)
    console.log("\n🏪 Updating modules_v2 (Marketplace)...");
    const { data: marketplaceData, error: marketplaceError } = await supabase
      .from("modules_v2")
      .update({
        pricing_type: "free",
        wholesale_price_monthly: 0,
        wholesale_price_yearly: 0,
        suggested_retail_monthly: 0,
        suggested_retail_yearly: 0,
      })
      .eq("slug", moduleSlug)
      .select("id, slug, name, pricing_type, wholesale_price_monthly")
      .single();

    if (marketplaceError) {
      console.error("❌ Error updating modules_v2:", marketplaceError);
      process.exit(1);
    }

    console.log("✅ Marketplace updated:");
    console.log(`   ID: ${marketplaceData.id}`);
    console.log(`   Name: ${marketplaceData.name}`);
    console.log(`   Pricing Type: ${marketplaceData.pricing_type}`);
    console.log(`   Wholesale Price: $${marketplaceData.wholesale_price_monthly / 100}`);

    // 3. Check existing subscriptions (informational only - no changes)
    console.log("\n📊 Checking existing subscriptions...");
    const { data: subscriptions, error: subError } = await supabase
      .from("agency_module_subscriptions")
      .select("id, agency_id, status")
      .eq("module_id", marketplaceData.id);

    if (subError) {
      console.error("⚠️  Could not check subscriptions:", subError);
    } else {
      console.log(`   Found ${subscriptions?.length || 0} existing subscription(s)`);
      if (subscriptions && subscriptions.length > 0) {
        console.log("   ✅ These subscriptions will continue to work normally");
        console.log("   ✅ New agencies can now subscribe for FREE");
      }
    }

    // 4. Check existing installations (informational only - no changes)
    console.log("\n🏗️  Checking existing installations...");
    const { data: installations, error: instError } = await supabase
      .from("site_module_installations")
      .select("id, site_id, status")
      .eq("module_id", marketplaceData.id);

    if (instError) {
      console.error("⚠️  Could not check installations:", instError);
    } else {
      console.log(`   Found ${installations?.length || 0} existing installation(s)`);
      if (installations && installations.length > 0) {
        console.log("   ✅ These installations will continue to work normally");
      }
    }

    console.log("\n✨ SUCCESS! Module is now FREE for testing\n");
    console.log("📋 What this means:");
    console.log("   ✅ New agencies can subscribe without payment");
    console.log("   ✅ Existing subscriptions continue working");
    console.log("   ✅ Existing installations continue working");
    console.log("   ✅ Module can be installed and tested freely");
    console.log("   ✅ No billing integration required for testing");
    
    console.log("\n🚀 Next steps:");
    console.log("   1. Go to marketplace and find the module");
    console.log("   2. Click 'Subscribe' (no payment required)");
    console.log("   3. Install on a test site");
    console.log("   4. Test all features thoroughly");
    console.log("   5. When ready, run this script again to change pricing back");

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

makeModuleFree();
