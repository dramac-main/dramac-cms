/**
 * Create or promote a Super Admin user
 * 
 * Usage:
 *   npx ts-node scripts/create-super-admin.ts user@email.com
 *   
 * Or via npm script:
 *   npm run admin:create -- user@email.com
 * 
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
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
  console.error("\nMake sure these are set in your .env.local or .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin(email: string) {
  console.log(`\n🔐 Creating Super Admin for: ${email}\n`);

  // Check if user exists in profiles
  const { data: existingUser, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email, role, name")
    .eq("email", email)
    .single();

  if (lookupError && lookupError.code !== "PGRST116") {
    console.error("❌ Error looking up user:", lookupError.message);
    process.exit(1);
  }

  if (existingUser) {
    // Promote existing user
    console.log(`📋 Found existing user: ${existingUser.name || existingUser.email}`);
    console.log(`   Current role: ${existingUser.role || "none"}`);

    if (existingUser.role === "super_admin") {
      console.log("\n✅ User is already a Super Admin!");
      process.exit(0);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: "super_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingUser.id);

    if (updateError) {
      console.error("❌ Failed to promote user:", updateError.message);
      process.exit(1);
    }

    console.log("✅ User promoted to Super Admin!");
  } else {
    console.log("❌ User not found in profiles table.");
    console.log("   Please ensure they have signed up first via the application.");
    console.log("   Then run this script again to promote them.\n");
    
    // Check if user exists in auth.users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email === email);
    
    if (authUser) {
      console.log("ℹ️  Note: User exists in auth.users but not in profiles.");
      console.log("   They may need to complete their profile setup first.\n");
    } else {
      console.log("ℹ️  User has not signed up yet. They need to:");
      console.log("   1. Sign up at your application's signup page");
      console.log("   2. Then run this script again to promote them\n");
    }
    
    process.exit(1);
  }

  // Verify the change
  const { data: verifyUser } = await supabase
    .from("profiles")
    .select("role")
    .eq("email", email)
    .single();

  console.log(`\n✅ Verification: Role is now "${verifyUser?.role}"`);
  console.log("\n🎉 Super Admin setup complete!");
  console.log("   They can now access /admin in the dashboard.\n");
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error("\n❌ Please provide an email address:");
  console.error("   npx ts-node scripts/create-super-admin.ts user@email.com\n");
  console.error("   Or via npm script:");
  console.error("   npm run admin:create -- user@email.com\n");
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error("\n❌ Invalid email format:", email);
  process.exit(1);
}

createSuperAdmin(email);
