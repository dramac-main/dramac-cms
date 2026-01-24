/**
 * Fix Module Icons Script
 * 
 * Updates booking and ecommerce module icons from text to emojis
 * so they display properly in the marketplace.
 * 
 * Usage:
 *   pnpm exec tsx scripts/fix-module-icons.ts
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

async function fixModuleIcons() {
  console.log("\n🔧 Fixing module icons...\n");

  try {
    // Update booking module icon
    console.log("📝 Updating booking module icon...");
    const { error: bookingError } = await supabase
      .from("modules_v2")
      .update({ icon: "📅", updated_at: new Date().toISOString() })
      .eq("slug", "booking");

    if (bookingError) {
      throw bookingError;
    }

    console.log("   ✅ Booking module icon updated to 📅");

    // Update ecommerce module icon
    console.log("\n📝 Updating ecommerce module icon...");
    const { error: ecommerceError } = await supabase
      .from("modules_v2")
      .update({ icon: "🛒", updated_at: new Date().toISOString() })
      .eq("slug", "ecommerce");

    if (ecommerceError) {
      throw ecommerceError;
    }

    console.log("   ✅ E-Commerce module icon updated to 🛒");

    // Verify the updates
    console.log("\n🔍 Verifying updates...");
    const { data: modules, error: verifyError } = await supabase
      .from("modules_v2")
      .select("slug, name, icon")
      .in("slug", ["booking", "ecommerce"]);

    if (verifyError) {
      throw verifyError;
    }

    console.log("\n📊 Updated Modules:");
    console.log("─".repeat(60));
    modules?.forEach((m) => {
      console.log(`${m.icon}  ${m.name.padEnd(25)} (${m.slug})`);
    });
    console.log("─".repeat(60));

    console.log("\n✅ Module icons fixed successfully!");
    console.log("\n📍 Marketplace should now display proper emoji icons\n");

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("\n❌ Error fixing module icons:", error.message);
    } else {
      console.error("\n❌ Unknown error fixing module icons:", error);
    }
    process.exit(1);
  }
}

// Run the script
fixModuleIcons();
