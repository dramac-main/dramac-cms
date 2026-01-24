/**
 * Seed Module Collections Script
 * 
 * Links existing modules (booking, ecommerce) to featured collections
 * so they appear in the marketplace Browse Collections tab.
 * 
 * Usage:
 *   pnpm exec tsx scripts/seed-module-collections.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  if (!supabaseUrl) console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedCollections() {
  console.log("\n🌱 Starting collection seeding...\n");

  try {
    // First, get all modules and collections
    console.log("📝 Fetching modules...");
    const { data: modules, error: modulesError } = await supabase
      .from("modules_v2")
      .select("id, slug")
      .in("slug", ["booking", "ecommerce"]);

    if (modulesError) {
      throw new Error(`Failed to fetch modules: ${modulesError.message}`);
    }

    if (!modules || modules.length === 0) {
      console.error("\n❌ No modules found! Please run module registration migrations first:");
      console.error("   - migrations/em-51-register-booking-module.sql");
      console.error("   - migrations/em-52-register-ecommerce-module.sql");
      process.exit(1);
    }

    console.log(`✅ Found ${modules.length} modules: ${modules.map((m) => m.slug).join(", ")}`);

    console.log("\n📝 Fetching collections...");
    const { data: collections, error: collectionsError } = await supabase
      .from("module_collections")
      .select("id, slug, name");

    if (collectionsError) {
      throw new Error(`Failed to fetch collections: ${collectionsError.message}`);
    }

    if (!collections || collections.length === 0) {
      console.error("\n❌ No collections found! Please run marketplace enhancement migration:");
      console.error("   - migrations/20260121_marketplace_enhancement.sql");
      process.exit(1);
    }

    console.log(`✅ Found ${collections.length} collections`);

    // Create a map of module slug to ID
    const moduleMap = new Map(modules.map((m) => [m.slug, m.id]));
    const collectionMap = new Map(collections.map((c) => [c.slug, c]));

    // Define the collection assignments
    const assignments = [
      // Booking module
      { module: "booking", collection: "featured", order: 1 },
      { module: "booking", collection: "top-rated", order: 1 },
      { module: "booking", collection: "most-popular", order: 1 },
      { module: "booking", collection: "enterprise-suite", order: 1 },
      // E-Commerce module
      { module: "ecommerce", collection: "featured", order: 2 },
      { module: "ecommerce", collection: "new-releases", order: 1 },
      { module: "ecommerce", collection: "top-rated", order: 2 },
      { module: "ecommerce", collection: "enterprise-suite", order: 2 },
    ];

    console.log("\n📝 Creating collection items...");
    let created = 0;
    let skipped = 0;

    for (const assignment of assignments) {
      const moduleId = moduleMap.get(assignment.module);
      const collection = collectionMap.get(assignment.collection);

      if (!moduleId || !collection) {
        console.log(`   ⚠️  Skipping ${assignment.module} → ${assignment.collection} (not found)`);
        skipped++;
        continue;
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from("module_collection_items")
        .select("id")
        .eq("collection_id", collection.id)
        .eq("module_id", moduleId)
        .single();

      if (existing) {
        console.log(`   ℹ️  ${assignment.module} already in ${collection.name}`);
        skipped++;
        continue;
      }

      // Insert the item
      const { error: insertError } = await supabase
        .from("module_collection_items")
        .insert({
          collection_id: collection.id,
          module_id: moduleId,
          display_order: assignment.order,
        });

      if (insertError) {
        console.error(`   ❌ Failed to add ${assignment.module} to ${collection.name}: ${insertError.message}`);
      } else {
        console.log(`   ✅ Added ${assignment.module} to ${collection.name}`);
        created++;
      }
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);

    // Verify collections have items
    console.log("\n🔍 Verifying collection items...");
    const { data: verifiedCollections, error: verifyError } = await supabase
      .from("module_collections")
      .select(`
        id,
        slug,
        name,
        is_visible,
        items:module_collection_items(count)
      `)
      .eq("is_visible", true)
      .order("display_order");

    if (verifyError) {
      throw verifyError;
    }

    console.log("\n📊 Collection Status:");
    console.log("─".repeat(60));
    
    let totalItems = 0;
    for (const collection of verifiedCollections || []) {
      const itemCount = collection.items?.[0]?.count || 0;
      totalItems += itemCount;
      const status = itemCount > 0 ? "✅" : "⚠️";
      console.log(`${status} ${collection.name.padEnd(20)} ${itemCount} modules`);
    }

    console.log("─".repeat(60));
    console.log(`\n✨ Total: ${verifiedCollections?.length || 0} collections with ${totalItems} module links\n`);

    if (totalItems === 0) {
      console.log("⚠️  No module items found. Possible issues:");
      console.log("   1. Modules not registered in modules_v2 table");
      console.log("   2. Module slugs don't match (booking, ecommerce)");
      console.log("   3. Collections table doesn't exist");
      console.log("\n🔍 Checking modules_v2 table...");
      
      const { data: checkModules, error: checkError } = await supabase
        .from("modules_v2")
        .select("id, slug, name, status")
        .in("slug", ["booking", "ecommerce"]);

      if (checkError) {
        console.error(`   ❌ Error querying modules: ${checkError.message}`);
      } else {
        console.log(`   Found ${checkModules?.length || 0} modules:`);
        checkModules?.forEach((m) => {
          console.log(`      - ${m.slug} (${m.status})`);
        });
      }
    } else {
      console.log("✅ Collection seeding complete!");
      console.log("\n📍 Marketplace should now show modules in Browse Collections tab");
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("\n❌ Error seeding collections:", error.message);
    } else {
      console.error("\n❌ Unknown error seeding collections:", error);
    }
    process.exit(1);
  }
}

// Run the script
seedCollections();
