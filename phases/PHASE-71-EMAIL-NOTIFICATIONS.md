# Phase 71: Email Notifications - Transactional Email System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Implement a comprehensive transactional email system for notifications, alerts, and user communications using Resend as the email service provider.

---

## 📋 Prerequisites

- [ ] Phase 70 Sitemap Generation completed
- [ ] Resend account created
- [ ] DNS records configured for sending domain
- [ ] Environment variables set

---

## 💼 Business Value

1. **User Engagement** - Keep users informed
2. **Retention** - Regular touchpoints with users
3. **Security** - Alert users to important events
4. **Professionalism** - Branded email communications
5. **Support Reduction** - Proactive notifications

---

## 📁 Files to Create

```
src/lib/email/
├── email-client.ts              # Resend client setup
├── email-templates.ts           # Email template definitions
├── email-types.ts               # Type definitions
└── email-renderer.tsx           # React email components

src/actions/email/
├── send-email.ts                # Send email action
├── email-preferences.ts         # Manage preferences

src/components/email/
├── email-preview.tsx            # Preview emails in UI
└── notification-settings.tsx    # User notification preferences

src/app/api/email/
├── webhook/route.ts             # Email event webhooks
```

---

## ✅ Tasks

### Task 71.1: Email Types

**File: `src/lib/email/email-types.ts`**

```typescript
export type EmailType =
  // Authentication
  | "auth.welcome"
  | "auth.password_reset"
  | "auth.password_changed"
  | "auth.email_changed"
  | "auth.magic_link"
  // Team
  | "team.invitation"
  | "team.member_joined"
  | "team.member_removed"
  | "team.role_changed"
  // Sites
  | "site.published"
  | "site.domain_connected"
  | "site.domain_error"
  // Billing
  | "billing.subscription_created"
  | "billing.payment_succeeded"
  | "billing.payment_failed"
  | "billing.subscription_cancelled"
  | "billing.trial_ending"
  // Alerts
  | "alert.usage_warning"
  | "alert.security_notice"
  | "alert.system_update";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailPayload {
  type: EmailType;
  to: EmailRecipient | EmailRecipient[];
  subject?: string;
  data: Record<string, any>;
  attachments?: EmailAttachment[];
  replyTo?: string;
  tags?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailPreferences {
  userId: string;
  marketing: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  teamNotifications: boolean;
  billingNotifications: boolean;
  siteNotifications: boolean;
}

export interface EmailTemplate {
  type: EmailType;
  subject: string;
  previewText?: string;
  category: "transactional" | "marketing" | "alert";
}

export interface EmailEvent {
  id: string;
  type: "delivered" | "opened" | "clicked" | "bounced" | "complained";
  emailId: string;
  recipient: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

---

### Task 71.2: Email Client Setup

**File: `src/lib/email/email-client.ts`**

```typescript
import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM || "DRAMAC CMS <noreply@dramac.app>";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@dramac.app";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export async function sendEmail(params: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo || EMAIL_REPLY_TO,
      attachments: params.attachments,
      tags: params.tags,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email send exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Batch send emails
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
  }>
) {
  try {
    const { data, error } = await resend.batch.send(
      emails.map((email) => ({
        from: EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }))
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, results: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send batch emails",
    };
  }
}
```

---

### Task 71.3: Email Templates

**File: `src/lib/email/email-templates.ts`**

```typescript
import type { EmailType, EmailTemplate } from "./email-types";

export const EMAIL_TEMPLATES: Record<EmailType, EmailTemplate> = {
  // Authentication
  "auth.welcome": {
    type: "auth.welcome",
    subject: "Welcome to DRAMAC CMS! 🎉",
    previewText: "Your agency dashboard is ready",
    category: "transactional",
  },
  "auth.password_reset": {
    type: "auth.password_reset",
    subject: "Reset your password",
    previewText: "Click here to reset your password",
    category: "transactional",
  },
  "auth.password_changed": {
    type: "auth.password_changed",
    subject: "Your password was changed",
    previewText: "Your password was successfully updated",
    category: "transactional",
  },
  "auth.email_changed": {
    type: "auth.email_changed",
    subject: "Your email address was changed",
    previewText: "Your email was successfully updated",
    category: "transactional",
  },
  "auth.magic_link": {
    type: "auth.magic_link",
    subject: "Your login link",
    previewText: "Click to sign in to DRAMAC CMS",
    category: "transactional",
  },

  // Team
  "team.invitation": {
    type: "team.invitation",
    subject: "You've been invited to join {agencyName}",
    previewText: "Accept your team invitation",
    category: "transactional",
  },
  "team.member_joined": {
    type: "team.member_joined",
    subject: "{memberName} joined your team",
    previewText: "A new team member has joined",
    category: "transactional",
  },
  "team.member_removed": {
    type: "team.member_removed",
    subject: "You've been removed from {agencyName}",
    previewText: "Your team access has been revoked",
    category: "transactional",
  },
  "team.role_changed": {
    type: "team.role_changed",
    subject: "Your role has been updated",
    previewText: "Your permissions have changed",
    category: "transactional",
  },

  // Sites
  "site.published": {
    type: "site.published",
    subject: "🚀 {siteName} is now live!",
    previewText: "Your site has been published",
    category: "transactional",
  },
  "site.domain_connected": {
    type: "site.domain_connected",
    subject: "Domain connected: {domain}",
    previewText: "Your custom domain is now active",
    category: "transactional",
  },
  "site.domain_error": {
    type: "site.domain_error",
    subject: "⚠️ Domain issue: {domain}",
    previewText: "There's an issue with your domain",
    category: "alert",
  },

  // Billing
  "billing.subscription_created": {
    type: "billing.subscription_created",
    subject: "Subscription confirmed",
    previewText: "Thank you for subscribing",
    category: "transactional",
  },
  "billing.payment_succeeded": {
    type: "billing.payment_succeeded",
    subject: "Payment received - Thank you!",
    previewText: "Your payment was successful",
    category: "transactional",
  },
  "billing.payment_failed": {
    type: "billing.payment_failed",
    subject: "⚠️ Payment failed",
    previewText: "We couldn't process your payment",
    category: "alert",
  },
  "billing.subscription_cancelled": {
    type: "billing.subscription_cancelled",
    subject: "Subscription cancelled",
    previewText: "Your subscription has been cancelled",
    category: "transactional",
  },
  "billing.trial_ending": {
    type: "billing.trial_ending",
    subject: "Your trial ends in {days} days",
    previewText: "Upgrade to keep your sites",
    category: "transactional",
  },

  // Alerts
  "alert.usage_warning": {
    type: "alert.usage_warning",
    subject: "⚠️ Approaching usage limit",
    previewText: "You're approaching your plan limits",
    category: "alert",
  },
  "alert.security_notice": {
    type: "alert.security_notice",
    subject: "🔒 Security notice",
    previewText: "Important security information",
    category: "alert",
  },
  "alert.system_update": {
    type: "alert.system_update",
    subject: "System update",
    previewText: "Important platform update",
    category: "transactional",
  },
};

// Interpolate template variables
export function interpolateTemplate(
  template: string,
  data: Record<string, any>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}
```

---

### Task 71.4: React Email Renderer

**File: `src/lib/email/email-renderer.tsx`**

```tsx
import * as React from "react";
import { render } from "@react-email/components";
import type { EmailType } from "./email-types";
import { EMAIL_TEMPLATES, interpolateTemplate } from "./email-templates";

// Base email layout
interface EmailLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 24px;
          }
          .logo img {
            height: 32px;
          }
          h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px;
          }
          p {
            margin: 0 0 16px;
            color: #555;
          }
          .button {
            display: inline-block;
            background: #0070f3;
            color: white !important;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            margin: 16px 0;
          }
          .button:hover {
            background: #0060d0;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            color: #999;
            font-size: 12px;
          }
          .footer a {
            color: #999;
          }
        `}</style>
      </head>
      <body>
        {preview && (
          <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
            {preview}
          </div>
        )}
        <div className="container">
          <div className="card">
            <div className="logo">
              <img src="https://dramac.app/logo.png" alt="DRAMAC CMS" />
            </div>
            {children}
          </div>
          <div className="footer">
            <p>
              © {new Date().getFullYear()} DRAMAC CMS. All rights reserved.
            </p>
            <p>
              <a href="https://dramac.app/unsubscribe">Unsubscribe</a> •{" "}
              <a href="https://dramac.app/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

// Welcome email
function WelcomeEmail({ data }: { data: Record<string, any> }) {
  return (
    <EmailLayout preview="Welcome to DRAMAC CMS! Your agency dashboard is ready.">
      <h1>Welcome to DRAMAC CMS! 🎉</h1>
      <p>Hi {data.name || "there"},</p>
      <p>
        Thank you for joining DRAMAC CMS. We're excited to help you build amazing websites for your clients.
      </p>
      <p>
        Your agency dashboard is ready. Here's what you can do:
      </p>
      <ul>
        <li>Create and manage clients</li>
        <li>Build beautiful websites with our visual editor</li>
        <li>Generate sites instantly with AI</li>
        <li>Publish with custom domains</li>
      </ul>
      <p style={{ textAlign: "center" }}>
        <a href={data.dashboardUrl || "https://app.dramac.app"} className="button">
          Go to Dashboard
        </a>
      </p>
      <p>
        If you have any questions, just reply to this email. We're here to help!
      </p>
      <p>
        Best,<br />
        The DRAMAC Team
      </p>
    </EmailLayout>
  );
}

// Password reset email
function PasswordResetEmail({ data }: { data: Record<string, any> }) {
  return (
    <EmailLayout preview="Reset your password">
      <h1>Reset Your Password</h1>
      <p>Hi {data.name || "there"},</p>
      <p>
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <p style={{ textAlign: "center" }}>
        <a href={data.resetUrl} className="button">
          Reset Password
        </a>
      </p>
      <p style={{ fontSize: "14px", color: "#666" }}>
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </EmailLayout>
  );
}

// Team invitation email
function TeamInvitationEmail({ data }: { data: Record<string, any> }) {
  return (
    <EmailLayout preview={`You've been invited to join ${data.agencyName}`}>
      <h1>You're Invited! 🎉</h1>
      <p>Hi {data.recipientName || "there"},</p>
      <p>
        <strong>{data.inviterName}</strong> has invited you to join{" "}
        <strong>{data.agencyName}</strong> on DRAMAC CMS.
      </p>
      <p>
        You'll be joining as a <strong>{data.role}</strong>.
      </p>
      <p style={{ textAlign: "center" }}>
        <a href={data.inviteUrl} className="button">
          Accept Invitation
        </a>
      </p>
      <p style={{ fontSize: "14px", color: "#666" }}>
        This invitation expires in 7 days.
      </p>
    </EmailLayout>
  );
}

// Site published email
function SitePublishedEmail({ data }: { data: Record<string, any> }) {
  return (
    <EmailLayout preview={`${data.siteName} is now live!`}>
      <h1>🚀 Your Site is Live!</h1>
      <p>Hi {data.name || "there"},</p>
      <p>
        Great news! <strong>{data.siteName}</strong> has been published and is now live at:
      </p>
      <p style={{ textAlign: "center" }}>
        <a href={data.siteUrl} style={{ fontSize: "18px" }}>
          {data.siteUrl}
        </a>
      </p>
      <p style={{ textAlign: "center" }}>
        <a href={data.siteUrl} className="button">
          View Your Site
        </a>
      </p>
      <p>
        Don't forget to share your new site with your audience!
      </p>
    </EmailLayout>
  );
}

// Payment failed email
function PaymentFailedEmail({ data }: { data: Record<string, any> }) {
  return (
    <EmailLayout preview="We couldn't process your payment">
      <h1>⚠️ Payment Failed</h1>
      <p>Hi {data.name || "there"},</p>
      <p>
        We weren't able to process your payment of <strong>{data.amount}</strong> for your DRAMAC CMS subscription.
      </p>
      <p>
        Please update your payment method to avoid any interruption to your service:
      </p>
      <p style={{ textAlign: "center" }}>
        <a href={data.billingUrl} className="button">
          Update Payment Method
        </a>
      </p>
      <p style={{ fontSize: "14px", color: "#666" }}>
        If you've already updated your payment method, you can ignore this email.
      </p>
    </EmailLayout>
  );
}

// Generic notification email
function GenericEmail({ data }: { data: Record<string, any> }) {
  return (
    <EmailLayout preview={data.preview}>
      <h1>{data.title}</h1>
      {data.greeting && <p>{data.greeting}</p>}
      <div dangerouslySetInnerHTML={{ __html: data.content }} />
      {data.buttonUrl && data.buttonText && (
        <p style={{ textAlign: "center" }}>
          <a href={data.buttonUrl} className="button">
            {data.buttonText}
          </a>
        </p>
      )}
    </EmailLayout>
  );
}

// Email component map
const EMAIL_COMPONENTS: Record<EmailType, React.ComponentType<{ data: Record<string, any> }>> = {
  "auth.welcome": WelcomeEmail,
  "auth.password_reset": PasswordResetEmail,
  "auth.password_changed": GenericEmail,
  "auth.email_changed": GenericEmail,
  "auth.magic_link": PasswordResetEmail,
  "team.invitation": TeamInvitationEmail,
  "team.member_joined": GenericEmail,
  "team.member_removed": GenericEmail,
  "team.role_changed": GenericEmail,
  "site.published": SitePublishedEmail,
  "site.domain_connected": GenericEmail,
  "site.domain_error": GenericEmail,
  "billing.subscription_created": GenericEmail,
  "billing.payment_succeeded": GenericEmail,
  "billing.payment_failed": PaymentFailedEmail,
  "billing.subscription_cancelled": GenericEmail,
  "billing.trial_ending": GenericEmail,
  "alert.usage_warning": GenericEmail,
  "alert.security_notice": GenericEmail,
  "alert.system_update": GenericEmail,
};

// Render email to HTML
export function renderEmail(type: EmailType, data: Record<string, any>): string {
  const Component = EMAIL_COMPONENTS[type];
  if (!Component) {
    throw new Error(`Unknown email type: ${type}`);
  }
  
  const element = React.createElement(Component, { data });
  return render(element);
}

// Get subject for email type
export function getEmailSubject(type: EmailType, data: Record<string, any>): string {
  const template = EMAIL_TEMPLATES[type];
  return interpolateTemplate(template.subject, data);
}
```

---

### Task 71.5: Send Email Server Action

**File: `src/actions/email/send-email.ts`**

```typescript
"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email/email-client";
import { renderEmail, getEmailSubject } from "@/lib/email/email-renderer";
import { createClient } from "@/lib/supabase/server";
import type { EmailPayload, EmailResult, EmailType } from "@/lib/email/email-types";

const emailPayloadSchema = z.object({
  type: z.string() as z.ZodType<EmailType>,
  to: z.union([
    z.object({ email: z.string().email(), name: z.string().optional() }),
    z.array(z.object({ email: z.string().email(), name: z.string().optional() })),
  ]),
  subject: z.string().optional(),
  data: z.record(z.any()),
  replyTo: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
});

export async function sendEmailAction(payload: EmailPayload): Promise<EmailResult> {
  try {
    const validated = emailPayloadSchema.parse(payload);
    
    // Check user preferences if this is not a critical email
    const recipients = Array.isArray(validated.to) ? validated.to : [validated.to];
    const filteredRecipients = await filterByPreferences(
      recipients.map((r) => r.email),
      validated.type
    );
    
    if (filteredRecipients.length === 0) {
      return { success: true, messageId: "skipped-preferences" };
    }
    
    // Render email
    const html = renderEmail(validated.type, validated.data);
    const subject = validated.subject || getEmailSubject(validated.type, validated.data);
    
    // Send to each recipient
    const results = await Promise.all(
      filteredRecipients.map((email) =>
        sendEmail({
          to: email,
          subject,
          html,
          replyTo: validated.replyTo,
          tags: validated.tags?.map((t) => ({ name: "tag", value: t })),
        })
      )
    );
    
    // Check if any failed
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return {
        success: false,
        error: failed.map((f) => f.error).join(", "),
      };
    }
    
    return {
      success: true,
      messageId: results[0]?.messageId,
    };
  } catch (error) {
    console.error("Send email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Check user email preferences
async function filterByPreferences(
  emails: string[],
  emailType: EmailType
): Promise<string[]> {
  // Critical emails are always sent
  const criticalTypes: EmailType[] = [
    "auth.password_reset",
    "auth.password_changed",
    "auth.email_changed",
    "billing.payment_failed",
    "alert.security_notice",
  ];
  
  if (criticalTypes.includes(emailType)) {
    return emails;
  }
  
  const supabase = await createClient();
  
  // Get preference category
  const category = getPreferenceCategory(emailType);
  
  // Check preferences for each email
  const { data: users } = await supabase
    .from("profiles")
    .select("email, email_preferences")
    .in("email", emails);
  
  const filtered: string[] = [];
  
  for (const email of emails) {
    const user = users?.find((u) => u.email === email);
    
    // If no preferences set, send by default
    if (!user?.email_preferences) {
      filtered.push(email);
      continue;
    }
    
    const prefs = user.email_preferences;
    
    // Check category preference
    if (prefs[category] !== false) {
      filtered.push(email);
    }
  }
  
  return filtered;
}

function getPreferenceCategory(type: EmailType): string {
  if (type.startsWith("team.")) return "teamNotifications";
  if (type.startsWith("billing.")) return "billingNotifications";
  if (type.startsWith("site.")) return "siteNotifications";
  if (type.startsWith("alert.")) return "securityAlerts";
  return "productUpdates";
}

// Convenience functions for common emails
export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmailAction({
    type: "auth.welcome",
    to: { email, name },
    data: {
      name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return sendEmailAction({
    type: "auth.password_reset",
    to: { email },
    data: { resetUrl },
  });
}

export async function sendTeamInvitation(
  recipientEmail: string,
  inviterName: string,
  agencyName: string,
  role: string,
  inviteUrl: string
) {
  return sendEmailAction({
    type: "team.invitation",
    to: { email: recipientEmail },
    data: {
      inviterName,
      agencyName,
      role,
      inviteUrl,
    },
  });
}

export async function sendSitePublishedEmail(
  email: string,
  name: string,
  siteName: string,
  siteUrl: string
) {
  return sendEmailAction({
    type: "site.published",
    to: { email, name },
    data: {
      name,
      siteName,
      siteUrl,
    },
  });
}
```

---

### Task 71.6: Email Preferences Action

**File: `src/actions/email/email-preferences.ts`**

```typescript
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { EmailPreferences } from "@/lib/email/email-types";

const preferencesSchema = z.object({
  marketing: z.boolean(),
  productUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  teamNotifications: z.boolean(),
  billingNotifications: z.boolean(),
  siteNotifications: z.boolean(),
});

export async function getEmailPreferences(): Promise<EmailPreferences | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_preferences")
    .eq("id", user.id)
    .single();
  
  // Return defaults if not set
  const defaults: Omit<EmailPreferences, "userId"> = {
    marketing: true,
    productUpdates: true,
    securityAlerts: true,
    teamNotifications: true,
    billingNotifications: true,
    siteNotifications: true,
  };
  
  return {
    userId: user.id,
    ...defaults,
    ...(profile?.email_preferences || {}),
  };
}

export async function updateEmailPreferences(
  preferences: Partial<Omit<EmailPreferences, "userId">>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = preferencesSchema.partial().parse(preferences);
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Get current preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_preferences")
      .eq("id", user.id)
      .single();
    
    // Merge with existing
    const newPreferences = {
      ...(profile?.email_preferences || {}),
      ...validated,
    };
    
    // Update
    const { error } = await supabase
      .from("profiles")
      .update({ email_preferences: newPreferences })
      .eq("id", user.id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update preferences",
    };
  }
}

// Unsubscribe from all marketing emails
export async function unsubscribeFromMarketing(
  token: string
): Promise<{ success: boolean; error?: string }> {
  // Token should be a signed JWT containing user email
  // Verify and extract email, then update preferences
  try {
    const supabase = await createClient();
    
    // In production, verify the token and extract email
    // For now, assume token is the user email (not secure for production)
    const email = token;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        email_preferences: {
          marketing: false,
          productUpdates: false,
        },
      })
      .eq("email", email);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe",
    };
  }
}
```

---

### Task 71.7: Email Webhook Handler

**File: `src/app/api/email/webhook/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Resend webhook events
interface ResendWebhookEvent {
  type: "email.delivered" | "email.opened" | "email.clicked" | "email.bounced" | "email.complained";
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    subject: string;
    from: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (in production)
    const signature = request.headers.get("svix-signature");
    // TODO: Verify signature with Resend's webhook secret
    
    const event: ResendWebhookEvent = await request.json();
    
    // Process event
    await processEmailEvent(event);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function processEmailEvent(event: ResendWebhookEvent) {
  const supabase = await createClient();
  
  // Map event type
  let eventType: string;
  switch (event.type) {
    case "email.delivered":
      eventType = "delivered";
      break;
    case "email.opened":
      eventType = "opened";
      break;
    case "email.clicked":
      eventType = "clicked";
      break;
    case "email.bounced":
      eventType = "bounced";
      break;
    case "email.complained":
      eventType = "complained";
      break;
    default:
      return;
  }
  
  // Store event (optional - for analytics)
  await supabase.from("email_events").insert({
    email_id: event.data.email_id,
    event_type: eventType,
    recipient: event.data.to[0],
    subject: event.data.subject,
    created_at: event.created_at,
  });
  
  // Handle bounces and complaints
  if (eventType === "bounced" || eventType === "complained") {
    // Mark email as invalid or unsubscribe user
    await supabase
      .from("profiles")
      .update({
        email_status: eventType === "bounced" ? "bounced" : "complained",
        email_preferences: {
          marketing: false,
          productUpdates: false,
        },
      })
      .eq("email", event.data.to[0]);
  }
}
```

---

### Task 71.8: Notification Settings Component

**File: `src/components/email/notification-settings.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2, Mail, Bell, Shield, CreditCard, Globe, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getEmailPreferences, updateEmailPreferences } from "@/actions/email/email-preferences";
import type { EmailPreferences } from "@/lib/email/email-types";

interface NotificationCategory {
  id: keyof Omit<EmailPreferences, "userId">;
  label: string;
  description: string;
  icon: React.ElementType;
  required?: boolean;
}

const CATEGORIES: NotificationCategory[] = [
  {
    id: "securityAlerts",
    label: "Security Alerts",
    description: "Password changes, login attempts, and security notices",
    icon: Shield,
    required: true,
  },
  {
    id: "billingNotifications",
    label: "Billing & Payments",
    description: "Payment confirmations, subscription updates, and invoices",
    icon: CreditCard,
  },
  {
    id: "teamNotifications",
    label: "Team Updates",
    description: "Team invitations, member changes, and role updates",
    icon: Users,
  },
  {
    id: "siteNotifications",
    label: "Site Notifications",
    description: "Publishing status, domain updates, and site alerts",
    icon: Globe,
  },
  {
    id: "productUpdates",
    label: "Product Updates",
    description: "New features, improvements, and platform updates",
    icon: Bell,
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Tips, tutorials, and promotional content",
    icon: Mail,
  },
];

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    const prefs = await getEmailPreferences();
    setPreferences(prefs);
    setLoading(false);
  };

  const handleToggle = (category: keyof Omit<EmailPreferences, "userId">) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [category]: !preferences[category],
    });
  };

  const handleSave = async () => {
    if (!preferences) return;
    
    setSaving(true);
    
    const { userId, ...prefsToSave } = preferences;
    const result = await updateEmailPreferences(prefsToSave);
    
    if (result.success) {
      toast.success("Notification preferences saved");
    } else {
      toast.error("Failed to save preferences", {
        description: result.error,
      });
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Unable to load preferences
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose which emails you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {CATEGORIES.map((category, index) => (
          <div key={category.id}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5">
                  <category.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor={category.id} className="text-base font-medium">
                    {category.label}
                    {category.required && (
                      <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
              <Switch
                id={category.id}
                checked={preferences[category.id]}
                onCheckedChange={() => handleToggle(category.id)}
                disabled={category.required}
              />
            </div>
          </div>
        ))}

        <Separator className="my-6" />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### Task 71.9: Email Preview Component

**File: `src/components/email/email-preview.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Eye, Code, Monitor, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailPreviewProps {
  html: string;
  subject: string;
}

export function EmailPreview({ html, subject }: EmailPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Email Preview
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setDevice("desktop")}
            className={`p-2 rounded ${
              device === "desktop" ? "bg-muted" : ""
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`p-2 rounded ${
              device === "mobile" ? "bg-muted" : ""
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg bg-muted/30 p-4">
              {/* Subject line */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-medium">{subject}</p>
              </div>

              {/* Email content */}
              <div
                className={`bg-white rounded-lg mx-auto transition-all ${
                  device === "mobile" ? "max-w-[375px]" : "max-w-full"
                }`}
              >
                <iframe
                  srcDoc={html}
                  className="w-full h-[500px] border-0"
                  title="Email preview"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="html" className="mt-4">
            <ScrollArea className="h-[500px] rounded-md border">
              <pre className="p-4 text-xs font-mono text-muted-foreground">
                {html}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Email rendering produces valid HTML
- [ ] Template interpolation works
- [ ] Preference filtering works correctly
- [ ] Email validation works

### Integration Tests
- [ ] Emails are sent successfully
- [ ] Webhook events are processed
- [ ] Preferences save correctly
- [ ] Batch sending works

### E2E Tests
- [ ] Welcome email sends on signup
- [ ] Password reset email works
- [ ] Team invitation email works
- [ ] Notification settings UI works

---

## ✅ Completion Checklist

- [ ] Email types defined
- [ ] Resend client configured
- [ ] Email templates created
- [ ] React email renderer working
- [ ] Send email action working
- [ ] Preference management working
- [ ] Webhook handler created
- [ ] Notification settings component created
- [ ] Email preview component created
- [ ] Integration with auth flows
- [ ] Tests passing

---

**Next Phase**: Phase 72 - Help Center
