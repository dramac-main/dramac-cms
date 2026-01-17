/**
 * Promote an existing user to Super Admin
 * 
 * Usage:
 *   npx ts-node scripts/promote-to-admin.ts user@email.com
 *   
 * Or via npm script:
 *   npm run admin:promote -- user@email.com
 * 
 * This is essentially the same as create-super-admin.ts but with 
 * a more specific name for clarity.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
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

async function promoteToAdmin(email: string) {
  console.log(`\n🔐 Promoting to Super Admin: ${email}\n`);

  // Find user by email
  const { data: user, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email, role, name")
    .eq("email", email)
    .single();

  if (lookupError) {
    if (lookupError.code === "PGRST116") {
      console.error("❌ User not found with email:", email);
      console.error("   Make sure the user has signed up first.\n");
    } else {
      console.error("❌ Error looking up user:", lookupError.message);
    }
    process.exit(1);
  }

  console.log(`📋 Found user: ${user.name || user.email}`);
  console.log(`   Current role: ${user.role || "none"}`);

  if (user.role === "super_admin") {
    console.log("\n✅ User is already a Super Admin!");
    process.exit(0);
  }

  // Confirm promotion
  console.log("\n⚠️  Warning: This will give the user full platform access.");
  console.log("   They will be able to:");
  console.log("   - Access all agencies and users");
  console.log("   - Modify any settings");
  console.log("   - Manage subscriptions and billing");
  console.log("   - View all audit logs\n");

  // Update role
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      role: "super_admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("❌ Failed to promote user:", updateError.message);
    process.exit(1);
  }

  // Verify
  const { data: verifyUser } = await supabase
    .from("profiles")
    .select("role")
    .eq("email", email)
    .single();

  console.log(`✅ Role updated to: ${verifyUser?.role}`);
  console.log("\n🎉 User can now access /admin in the dashboard!\n");
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error("\n❌ Please provide an email address:");
  console.error("   npx ts-node scripts/promote-to-admin.ts user@email.com\n");
  process.exit(1);
}

promoteToAdmin(email);
