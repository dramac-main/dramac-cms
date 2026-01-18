/**
 * Test Email Setup
 * 
 * Quick test script to verify Resend is configured correctly.
 * Run with: npx tsx scripts/test-email.ts your-email@example.com
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { sendEmail, previewEmail } from "../src/lib/email/send-email";

const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error("❌ Please provide a recipient email address");
  console.log("Usage: npx tsx scripts/test-email.ts your-email@example.com");
  process.exit(1);
}

async function testEmail() {
  console.log("\n🧪 Testing Email Configuration\n");
  
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in .env.local");
    console.log("\nPlease add your API key to .env.local:");
    console.log("RESEND_API_KEY=re_your_key_here\n");
    process.exit(1);
  }
  
  console.log("✅ API key found");
  console.log("📧 From:", process.env.EMAIL_FROM || "Dramac <noreply@dramacagency.com>");
  console.log("📨 To:", recipientEmail);
  console.log();
  
  // Preview the email first
  console.log("📋 Generating email preview...");
  const preview = previewEmail("welcome", {
    name: "Test User",
    dashboardUrl: "https://app.dramacagency.com/dashboard",
  });
  
  if (preview) {
    console.log("✅ Template loaded successfully");
    console.log("   Subject:", preview.subject);
    console.log();
  }
  
  // Send test email
  console.log("📤 Sending test email...");
  const result = await sendEmail({
    to: { email: recipientEmail, name: "Test User" },
    type: "welcome",
    data: {
      name: "Test User",
      dashboardUrl: "https://app.dramacagency.com/dashboard",
    },
  });
  
  console.log();
  if (result.success) {
    console.log("✅ Email sent successfully!");
    console.log("   Message ID:", result.messageId);
    console.log("\n💡 Check your inbox at:", recipientEmail);
    console.log("   (May take a few seconds to arrive)");
  } else {
    console.error("❌ Failed to send email");
    console.error("   Error:", result.error);
    
    if (result.error?.includes("API key")) {
      console.log("\n💡 Double-check your RESEND_API_KEY in .env.local");
    }
  }
  console.log();
}

testEmail().catch(console.error);
