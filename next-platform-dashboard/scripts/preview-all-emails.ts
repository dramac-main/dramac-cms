/**
 * Preview All Email Templates
 * 
 * Shows all email templates without sending them.
 * Run with: npx tsx scripts/preview-all-emails.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { previewEmail } from "../src/lib/email/send-email";
import type { EmailType } from "../src/lib/email/email-types";

const emailTests: Array<{ type: EmailType; data: Record<string, unknown> }> = [
  {
    type: "welcome",
    data: { name: "John Doe", dashboardUrl: "https://app.dramacagency.com/dashboard" },
  },
  {
    type: "password_reset",
    data: { resetUrl: "https://app.dramacagency.com/reset/abc123" },
  },
  {
    type: "email_changed",
    data: { newEmail: "newemail@example.com" },
  },
  {
    type: "team_invitation",
    data: {
      inviterName: "Jane Smith",
      agencyName: "Acme Agency",
      inviteUrl: "https://app.dramacagency.com/invite/xyz789",
    },
  },
  {
    type: "team_member_joined",
    data: { memberName: "Bob Jones", agencyName: "Acme Agency" },
  },
  {
    type: "site_published",
    data: { siteName: "My Awesome Site", siteUrl: "https://awesome.dramacagency.com" },
  },
  {
    type: "domain_connected",
    data: { domain: "example.com", siteName: "My Site" },
  },
  {
    type: "subscription_created",
    data: { planName: "Pro Plan" },
  },
  {
    type: "payment_failed",
    data: { updatePaymentUrl: "https://app.dramacagency.com/settings/billing" },
  },
  {
    type: "trial_ending",
    data: { daysLeft: 3, upgradeUrl: "https://app.dramacagency.com/upgrade" },
  },
];

console.log("\n📧 Email Template Previews\n");
console.log("=".repeat(60));

for (const test of emailTests) {
  const preview = previewEmail(test.type, test.data);
  
  if (preview) {
    console.log(`\n📬 ${test.type.toUpperCase()}`);
    console.log("─".repeat(60));
    console.log("Subject:", preview.subject);
    console.log("\nText Preview:");
    console.log(preview.text.trim().substring(0, 200) + "...\n");
  }
}

console.log("=".repeat(60));
console.log("\n✅ All templates loaded successfully!\n");
