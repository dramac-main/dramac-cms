# Phase 71: Email Notifications - Transactional Email System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 MEDIUM
>
> **Estimated Time**: 2-3 hours

---

## ⚠️ CHECK EXISTING NOTIFICATION SYSTEM FIRST!

**Files to review:**
- `src/lib/portal/notification-service.ts` - Client notifications exist!
- `src/types/database.ts` - Check for `notifications` table

**What Exists (Client Portal Notifications):**
```typescript
// src/lib/portal/notification-service.ts
export async function getClientNotifications(clientId, options)
export async function markNotificationRead(notificationId, clientId)
export async function createNotification(notification)
```

**What This Phase Adds:**
- ❌ Transactional EMAIL sending (via Resend)
- ❌ Email templates (welcome, password reset, etc.)
- ❌ User notification preferences

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

Implement transactional email sending using Resend for authentication, team invites, and system notifications.

---

## 📋 Prerequisites

- [ ] Phase 70 completed
- [ ] Resend account created
- [ ] `RESEND_API_KEY` in environment variables
- [ ] DNS configured for sending domain (optional but recommended)

---

## ✅ Tasks

### Task 71.1: Email Types

**File: `src/lib/email/email-types.ts`**

```typescript
export type EmailType =
  // Auth
  | "welcome"
  | "password_reset"
  | "email_changed"
  // Team
  | "team_invitation"
  | "team_member_joined"
  // Sites
  | "site_published"
  | "domain_connected"
  // Billing (LemonSqueezy)
  | "subscription_created"
  | "payment_failed"
  | "trial_ending";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  type: EmailType;
  data: Record<string, unknown>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

---

### Task 71.2: Resend Client Setup

**File: `src/lib/email/resend-client.ts`**

```typescript
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set - emails will not be sent");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@dramac.app";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@dramac.app";
```

---

### Task 71.3: Email Templates

**File: `src/lib/email/templates.ts`**

```typescript
import type { EmailType } from "./email-types";

interface EmailTemplate {
  subject: (data: Record<string, unknown>) => string;
  html: (data: Record<string, unknown>) => string;
  text: (data: Record<string, unknown>) => string;
}

export const EMAIL_TEMPLATES: Record<EmailType, EmailTemplate> = {
  welcome: {
    subject: () => "Welcome to Dramac!",
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed;">Welcome to Dramac!</h1>
            <p>Hi ${data.name || "there"},</p>
            <p>Thanks for signing up! We're excited to help you build amazing websites.</p>
            <p>
              <a href="${data.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px;">
                Go to Dashboard
              </a>
            </p>
            <p>If you have any questions, just reply to this email.</p>
            <p>- The Dramac Team</p>
          </div>
        </body>
      </html>
    `,
    text: (data) => `
Welcome to Dramac!

Hi ${data.name || "there"},

Thanks for signing up! We're excited to help you build amazing websites.

Go to your dashboard: ${data.dashboardUrl}

If you have any questions, just reply to this email.

- The Dramac Team
    `,
  },

  password_reset: {
    subject: () => "Reset Your Password",
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Reset Your Password</h1>
            <p>You requested a password reset. Click the button below to set a new password:</p>
            <p>
              <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link expires in 1 hour. If you didn't request this, you can ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: (data) => `
Reset Your Password

You requested a password reset. Click the link below to set a new password:

${data.resetUrl}

This link expires in 1 hour. If you didn't request this, you can ignore this email.
    `,
  },

  team_invitation: {
    subject: (data) => `You're invited to join ${data.agencyName}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Team Invitation</h1>
            <p>${data.inviterName} has invited you to join <strong>${data.agencyName}</strong> on Dramac.</p>
            <p>
              <a href="${data.inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px;">
                Accept Invitation
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This invitation expires in 7 days.
            </p>
          </div>
        </body>
      </html>
    `,
    text: (data) => `
Team Invitation

${data.inviterName} has invited you to join ${data.agencyName} on Dramac.

Accept your invitation: ${data.inviteUrl}

This invitation expires in 7 days.
    `,
  },

  // Add more templates...
  email_changed: {
    subject: () => "Email Address Changed",
    html: (data) => `<p>Your email was changed to ${data.newEmail}</p>`,
    text: (data) => `Your email was changed to ${data.newEmail}`,
  },
  team_member_joined: {
    subject: (data) => `${data.memberName} joined your team`,
    html: (data) => `<p>${data.memberName} has joined ${data.agencyName}.</p>`,
    text: (data) => `${data.memberName} has joined ${data.agencyName}.`,
  },
  site_published: {
    subject: (data) => `${data.siteName} is now live!`,
    html: (data) => `<p>Your site ${data.siteName} has been published at ${data.siteUrl}.</p>`,
    text: (data) => `Your site ${data.siteName} has been published at ${data.siteUrl}.`,
  },
  domain_connected: {
    subject: (data) => `Domain connected: ${data.domain}`,
    html: (data) => `<p>The domain ${data.domain} is now connected to ${data.siteName}.</p>`,
    text: (data) => `The domain ${data.domain} is now connected to ${data.siteName}.`,
  },
  subscription_created: {
    subject: () => "Subscription Confirmed",
    html: (data) => `<p>Your ${data.planName} subscription is now active.</p>`,
    text: (data) => `Your ${data.planName} subscription is now active.`,
  },
  payment_failed: {
    subject: () => "Payment Failed - Action Required",
    html: (data) => `<p>Your payment failed. Please update your payment method to avoid service interruption.</p>`,
    text: (data) => `Your payment failed. Please update your payment method.`,
  },
  trial_ending: {
    subject: (data) => `Your trial ends in ${data.daysLeft} days`,
    html: (data) => `<p>Your trial ends in ${data.daysLeft} days. Subscribe to continue using Dramac.</p>`,
    text: (data) => `Your trial ends in ${data.daysLeft} days. Subscribe to continue using Dramac.`,
  },
};
```

---

### Task 71.4: Send Email Function

**File: `src/lib/email/send-email.ts`**

```typescript
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "./resend-client";
import { EMAIL_TEMPLATES } from "./templates";
import type { SendEmailOptions, EmailResult, EmailRecipient } from "./email-types";

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const template = EMAIL_TEMPLATES[options.type];
  
  if (!template) {
    return { success: false, error: `Unknown email type: ${options.type}` };
  }

  // Format recipients
  const toArray = Array.isArray(options.to) ? options.to : [options.to];
  const toEmails = toArray.map((r) =>
    typeof r === "string" ? r : r.name ? `${r.name} <${r.email}>` : r.email
  );

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmails,
      replyTo: EMAIL_REPLY_TO,
      subject: template.subject(options.data),
      html: template.html(options.data),
      text: template.text(options.data),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

### Task 71.5: Server Action

**File: `src/lib/actions/email.ts`**

```typescript
"use server";

import { sendEmail } from "@/lib/email/send-email";
import type { EmailType } from "@/lib/email/email-types";

export async function sendEmailAction(
  to: string | { email: string; name?: string },
  type: EmailType,
  data: Record<string, unknown>
) {
  const recipient = typeof to === "string" ? { email: to } : to;
  
  return sendEmail({
    to: recipient,
    type,
    data,
  });
}

// Helper for specific email types
export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: { email, name },
    type: "welcome",
    data: {
      name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
}

export async function sendTeamInvitation(
  email: string,
  inviterName: string,
  agencyName: string,
  inviteUrl: string
) {
  return sendEmail({
    to: { email },
    type: "team_invitation",
    data: { inviterName, agencyName, inviteUrl },
  });
}
```

---

## ✅ Completion Checklist

- [ ] Reviewed existing notification service
- [ ] Resend client configured
- [ ] Email templates created
- [ ] Send email function working
- [ ] Server actions created
- [ ] Tested welcome email
- [ ] Tested password reset email
- [ ] Tested team invitation email

---

## 📝 Notes for AI Agent

1. **RESEND, NOT OTHERS** - Use Resend, not SendGrid/Mailgun
2. **CHECK ENV** - Need `RESEND_API_KEY` in `.env.local`
3. **TEMPLATES** - Keep templates simple, can enhance later
4. **TEXT VERSION** - Always include plain text fallback
5. **DON'T DUPLICATE** - Client notifications are separate (portal)
