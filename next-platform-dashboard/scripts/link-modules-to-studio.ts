/**
 * Script: Link Booking & E-Commerce modules to Module Studio
 * 
 * This creates module_source entries for booking and ecommerce modules
 * and links them via studio_module_id so they can be edited in Module Studio.
 * 
 * Run: npx tsx scripts/link-modules-to-studio.ts
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

async function linkModulesToStudio() {
  console.log("🔗 Linking Booking & E-Commerce modules to Module Studio...\n");

  try {
    // 1. Create module_source for booking
    console.log("📅 Creating module_source entry for Booking module...");
    const { data: bookingSource, error: bookingSourceError } = await supabase
      .from("module_source")
      .upsert({
        module_id: "booking",
        slug: "booking",
        name: "Booking & Scheduling",
        description: "Complete appointment scheduling and calendar management system",
        icon: "📅",
        category: "business",
        pricing_tier: "pro",
        render_code: `// Booking Module Component
import React from "react";

export default function BookingModule({ settings }) {
  return (
    <div className="booking-module">
      <h2>Booking & Scheduling</h2>
      <p>Appointment scheduling system</p>
      <div className="booking-calendar">
        {/* Calendar implementation */}
      </div>
    </div>
  );
}`,
        settings_schema: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              title: "Timezone",
              default: "America/New_York",
            },
            bookingAdvanceDays: {
              type: "number",
              title: "Booking Advance Days",
              default: 30,
            },
          },
        },
        api_routes: [],
        styles: "",
        default_settings: {
          timezone: "America/New_York",
          bookingAdvanceDays: 30,
        },
        dependencies: [],
        status: "published",
        latest_version: "1.0.0",
      })
      .select()
      .single();

    if (bookingSourceError) {
      console.error("❌ Error creating booking module_source:", bookingSourceError);
    } else {
      console.log("✅ Booking module_source created:", bookingSource.id);
    }

    // 2. Create module_source for ecommerce
    console.log("\n🛒 Creating module_source entry for E-Commerce module...");
    const { data: ecommerceSource, error: ecommerceSourceError } = await supabase
      .from("module_source")
      .upsert({
        module_id: "ecommerce",
        slug: "ecommerce",
        name: "E-Commerce Suite",
        description: "Complete online store with product catalog, cart, and checkout",
        icon: "🛒",
        category: "business",
        pricing_tier: "enterprise",
        render_code: `// E-Commerce Module Component
import React from "react";

export default function EcommerceModule({ settings }) {
  return (
    <div className="ecommerce-module">
      <h2>E-Commerce Suite</h2>
      <p>Full-featured online store</p>
      <div className="product-grid">
        {/* Product catalog implementation */}
      </div>
    </div>
  );
}`,
        settings_schema: {
          type: "object",
          properties: {
            currency: {
              type: "string",
              title: "Currency",
              default: "USD",
            },
            taxRate: {
              type: "number",
              title: "Tax Rate (%)",
              default: 0,
            },
          },
        },
        api_routes: [],
        styles: "",
        default_settings: {
          currency: "USD",
          taxRate: 0,
        },
        dependencies: [],
        status: "published",
        latest_version: "1.0.0",
      })
      .select()
      .single();

    if (ecommerceSourceError) {
      console.error("❌ Error creating ecommerce module_source:", ecommerceSourceError);
    } else {
      console.log("✅ E-Commerce module_source created:", ecommerceSource.id);
    }

    // 3. Link modules_v2 to module_source
    if (bookingSource) {
      console.log("\n🔗 Linking booking module in modules_v2...");
      const { error: linkBookingError } = await supabase
        .from("modules_v2")
        .update({ studio_module_id: bookingSource.id })
        .eq("slug", "booking");

      if (linkBookingError) {
        console.error("❌ Error linking booking:", linkBookingError);
      } else {
        console.log("✅ Booking module linked successfully");
      }
    }

    if (ecommerceSource) {
      console.log("\n🔗 Linking ecommerce module in modules_v2...");
      const { error: linkEcommerceError } = await supabase
        .from("modules_v2")
        .update({ studio_module_id: ecommerceSource.id })
        .eq("slug", "ecommerce");

      if (linkEcommerceError) {
        console.error("❌ Error linking ecommerce:", linkEcommerceError);
      } else {
        console.log("✅ E-Commerce module linked successfully");
      }
    }

    // 4. Verify the linkage
    console.log("\n🔍 Verifying linkage...");
    const { data: linkedModules, error: verifyError } = await supabase
      .from("modules_v2")
      .select(`
        slug,
        name,
        studio_module_id,
        module_source:studio_module_id (
          id,
          slug,
          status
        )
      `)
      .in("slug", ["booking", "ecommerce"]);

    if (verifyError) {
      console.error("❌ Error verifying:", verifyError);
    } else {
      console.log("\n✅ Verification complete:");
      console.table(linkedModules);
    }

    console.log("\n✨ Done! Modules can now be edited in Module Studio at:");
    if (bookingSource) {
      console.log(`   📅 Booking: /admin/modules/studio/${bookingSource.id}`);
    }
    if (ecommerceSource) {
      console.log(`   🛒 E-Commerce: /admin/modules/studio/${ecommerceSource.id}`);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

linkModulesToStudio();
