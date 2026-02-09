# PHASE-WL-02: Email System Overhaul — Agency-Branded Transactional Emails

**Priority**: 🔴 P0 (Critical — Customer-Facing)  
**Estimated Effort**: 3-4 days  
**Dependencies**: PHASE-WL-01 (BrandingProvider, agency_branding table)  
**Goal**: Every email sent to customers shows the agency's brand, not "Dramac"

---

## Context

The email system currently sends ALL 18 email types with:
- **From**: `"Dramac <noreply@app.dramacagency.com>"` (hardcoded)
- **Reply-To**: `"support@app.dramacagency.com"` (hardcoded)
- **Templates**: "Dramac" in subject, body, footer, copyright (6+ locations)
- **No branding fields**: None of the 18 email data interfaces accept logo, colors, or agency name

### Impact
When a customer books an appointment via an agency's website, they receive an email that says "Your booking with Dramac" instead of "Your booking with [Agency Name]". This destroys the agency's professional image and confuses their customers.

---

## Task 1: Extend Email Interfaces with Branding

**Problem**: `EmailData` interfaces in `email-types.ts` have no branding fields.  
**Solution**: Add a universal `EmailBranding` type and thread it through all email functions.

### Implementation

1. Create `src/lib/email/email-branding.ts`:

```typescript
export interface EmailBranding {
  // Sender
  from_name: string;        // "Acme Agency"
  reply_to: string;         // "support@acmeagency.com"
  
  // Visual
  logo_url: string | null;  // Agency logo for email header
  primary_color: string;    // Brand color for buttons, links
  accent_color: string;     // Secondary color
  
  // Footer
  agency_name: string;      // "Acme Agency"
  footer_text: string | null; // Custom footer message
  footer_address: string | null; // Physical address (CAN-SPAM)
  support_email: string | null;
  support_url: string | null;
  privacy_policy_url: string | null;
  unsubscribe_url: string | null; // Per-recipient unsubscribe link
  
  // Social
  social_links: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

// Build EmailBranding from AgencyBranding database record
export function buildEmailBranding(
  agencyBranding: AgencyBranding | null,
  recipientId?: string
): EmailBranding {
  const defaults = {
    from_name: 'Dramac',
    reply_to: 'support@app.dramacagency.com',
    logo_url: null,
    primary_color: '#0F172A',
    accent_color: '#3B82F6',
    agency_name: 'Dramac',
    footer_text: null,
    footer_address: null,
    support_email: 'support@app.dramacagency.com',
    support_url: null,
    privacy_policy_url: null,
    unsubscribe_url: recipientId 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?uid=${recipientId}`
      : null,
    social_links: {},
  };
  
  if (!agencyBranding) return defaults;
  
  return {
    from_name: agencyBranding.email_from_name ?? agencyBranding.agency_display_name,
    reply_to: agencyBranding.email_reply_to ?? defaults.reply_to,
    logo_url: agencyBranding.email_logo_url ?? agencyBranding.logo_url,
    primary_color: agencyBranding.primary_color,
    accent_color: agencyBranding.accent_color,
    agency_name: agencyBranding.agency_display_name,
    footer_text: agencyBranding.email_footer_text,
    footer_address: agencyBranding.email_footer_address,
    support_email: agencyBranding.support_email,
    support_url: agencyBranding.support_url,
    privacy_policy_url: agencyBranding.privacy_policy_url,
    unsubscribe_url: recipientId 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?uid=${recipientId}`
      : null,
    social_links: agencyBranding.email_social_links ?? {},
  };
}
```

2. Update `src/lib/email/send-email.ts`:

```typescript
// BEFORE:
export async function sendEmail(options: SendEmailOptions) {
  const from = getEmailFrom();
  // ...
}

// AFTER:
export async function sendEmail(options: SendEmailOptions & { branding?: EmailBranding }) {
  const from = options.branding 
    ? `${options.branding.from_name} <noreply@app.dramacagency.com>`
    : getEmailFrom();
  const replyTo = options.branding?.reply_to ?? getEmailReplyTo();
  // ...
}
```

3. Update `getEmailFrom()` in `resend-client.ts` to accept optional name:

```typescript
export function getEmailFrom(fromName?: string): string {
  const name = fromName ?? "Dramac";
  return `${name} <noreply@${process.env.EMAIL_DOMAIN ?? "app.dramacagency.com"}>`;
}
```

### Acceptance Criteria
- [ ] `EmailBranding` type is defined with all fields
- [ ] `buildEmailBranding()` converts agency DB record to email branding
- [ ] `sendEmail()` accepts optional `branding` parameter
- [ ] When branding provided, email `from` name is agency name
- [ ] When no branding, falls back to "Dramac" defaults

---

## Task 2: Rebuild Email Templates with Dynamic Branding

**Problem**: All email templates have hardcoded "Dramac" text, logo, and colors.  
**Solution**: Make every template a function that accepts `EmailBranding` and renders accordingly.

### Template Architecture

Create `src/lib/email/templates/base-template.ts` — shared layout:

```typescript
export function baseEmailTemplate(
  branding: EmailBranding,
  content: string,
  preheader?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding.agency_name}</title>
  ${preheader ? `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          
          <!-- Header with Agency Logo -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;background-color:${branding.primary_color};">
              ${branding.logo_url 
                ? `<img src="${branding.logo_url}" alt="${branding.agency_name}" height="40" style="height:40px;max-width:200px;" />`
                : `<span style="font-size:24px;font-weight:700;color:${branding.accent_color || '#ffffff'};">${branding.agency_name}</span>`
              }
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <!-- Social Links -->
              ${renderSocialLinks(branding.social_links)}
              
              <!-- Footer Text -->
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center;">
                ${branding.footer_text ?? `Sent by ${branding.agency_name}`}
              </p>
              
              ${branding.footer_address 
                ? `<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">${branding.footer_address}</p>` 
                : ''
              }
              
              <!-- Support & Legal Links -->
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                ${branding.support_email ? `<a href="mailto:${branding.support_email}" style="color:#6b7280;">Contact Support</a>` : ''}
                ${branding.privacy_policy_url ? ` · <a href="${branding.privacy_policy_url}" style="color:#6b7280;">Privacy Policy</a>` : ''}
              </p>
              
              <!-- Unsubscribe -->
              ${branding.unsubscribe_url 
                ? `<p style="margin:0;font-size:12px;text-align:center;"><a href="${branding.unsubscribe_url}" style="color:#9ca3af;">Unsubscribe from these emails</a></p>`
                : ''
              }
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderSocialLinks(links: EmailBranding['social_links']): string {
  const entries = Object.entries(links).filter(([, url]) => url);
  if (entries.length === 0) return '';
  
  return `
    <p style="margin:0 0 16px;text-align:center;">
      ${entries.map(([platform, url]) => 
        `<a href="${url}" style="display:inline-block;margin:0 8px;"><img src="${getSocialIcon(platform)}" width="24" height="24" alt="${platform}" /></a>`
      ).join('')}
    </p>
  `;
}
```

### Individual Email Templates

Rebuild each of the 18 email templates as functions accepting `(data, branding)`:

| Template | Key Branding Changes |
|----------|---------------------|
| `welcome` | "Welcome to {agency_name}" not "Welcome to Dramac" |
| `password_reset` | Agency logo in header, agency support email |
| `email_changed` | Agency name in confirmation text |
| `team_invitation` | "You've been invited to join {agency_name}" |
| `team_member_joined` | "{name} joined {agency_name}" |
| `site_published` | Agency logo, "Published via {agency_name}" |
| `domain_connected` | Agency branding in confirmation |
| `subscription_created` | Agency name in billing notification |
| `payment_failed` | Agency name + support contact |
| `trial_ending` | Agency name in urgency messaging |
| `booking_confirmation_customer` | **CRITICAL**: "Your booking with {business_name}" via {agency_name} |
| `booking_confirmation_owner` | Agency branding |
| `booking_cancelled_customer` | Business name + agency branding |
| `booking_cancelled_owner` | Agency branding |
| `order_confirmation_customer` | **CRITICAL**: "Order from {store_name}" via {agency_name} |
| `order_confirmation_owner` | Agency branding |
| `order_shipped_customer` | **CRITICAL**: Store name + tracking branded |
| `form_submission_owner` | Agency branding in notification |

### File Structure

```
src/lib/email/templates/
  base-template.ts          -- Shared layout with branding
  welcome.ts                -- Welcome email
  auth/
    password-reset.ts       -- Password reset
    email-changed.ts        -- Email change confirmation
  team/
    invitation.ts           -- Team invitation
    member-joined.ts        -- New member notification
  sites/
    site-published.ts       -- Site published notification
    domain-connected.ts     -- Domain connection confirmation
  billing/
    subscription-created.ts -- New subscription
    payment-failed.ts       -- Payment failure
    trial-ending.ts         -- Trial expiry warning
  booking/
    confirmation-customer.ts
    confirmation-owner.ts
    cancelled-customer.ts
    cancelled-owner.ts
  ecommerce/
    order-confirmation-customer.ts
    order-confirmation-owner.ts
    order-shipped-customer.ts
  forms/
    submission-owner.ts
```

### Acceptance Criteria
- [ ] All 18 templates rebuilt as `(data, branding) => html` functions
- [ ] Base template provides consistent branded layout
- [ ] Every template renders agency logo when available
- [ ] Every template uses agency name (never "Dramac")
- [ ] Colors from branding applied to buttons/links
- [ ] Footer shows agency info, support links, unsubscribe
- [ ] Templates are responsive (render well at 320px-600px)
- [ ] Tested in Litmus/Email on Acid or equivalent for Gmail, Outlook, Apple Mail

---

## Task 3: Thread Branding Through All Email Send Points

**Problem**: All places that call `sendEmail()` don't pass branding data.  
**Solution**: Update every email send call to fetch and pass agency branding.

### Implementation

Create `src/lib/email/send-branded-email.ts`:

```typescript
import { sendEmail } from "./send-email";
import { buildEmailBranding } from "./email-branding";
import { getAgencyBranding } from "@/lib/queries/branding"; // New query

export async function sendBrandedEmail(
  agencyId: string,
  options: Omit<SendEmailOptions, 'from'> & { recipientUserId?: string }
) {
  // 1. Fetch agency branding from DB (cached)
  const agencyBranding = await getAgencyBranding(agencyId);
  
  // 2. Build email branding
  const branding = buildEmailBranding(agencyBranding, options.recipientUserId);
  
  // 3. Generate branded HTML from template
  const html = options.template 
    ? renderTemplate(options.template, options.data, branding)
    : options.html;
  
  // 4. Send with branding
  return sendEmail({
    ...options,
    html,
    branding,
  });
}
```

### Migration Plan

Find every `sendEmail()` call in the codebase and replace with `sendBrandedEmail()`:

**Server Actions / API Routes that send emails:**
1. `src/app/api/auth/` routes — Registration, password reset
2. `src/lib/actions/team.ts` — Team invitations
3. `src/lib/actions/sites.ts` — Site published notifications
4. `src/lib/actions/domains.ts` — Domain connected
5. `src/lib/actions/billing.ts` — Subscription, payment, trial emails
6. `src/lib/actions/booking.ts` — Booking confirmation/cancellation
7. `src/lib/actions/ecommerce.ts` — Order confirmation/shipped
8. `src/lib/actions/forms.ts` — Form submission notifications
9. Webhook handlers — Stripe/Paddle webhooks that trigger emails

Each call site needs:
1. Access to `agencyId` (usually available from the context)
2. Replace `sendEmail()` → `sendBrandedEmail(agencyId, ...)`

### Acceptance Criteria
- [ ] Every `sendEmail()` call replaced with `sendBrandedEmail()`
- [ ] Agency branding fetched efficiently (cached, not N+1)
- [ ] All 18 email types send with correct agency branding
- [ ] Fallback works when agency has no branding configured

---

## Task 4: Notification Preferences System

**Problem**: No way for users to control which emails they receive. This violates industry standards and GDPR.  
**Solution**: Build a notification preferences system.

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email Notification Categories
  email_marketing BOOLEAN DEFAULT true,
  email_product_updates BOOLEAN DEFAULT true,
  email_security BOOLEAN DEFAULT true,       -- Always sent, shown as locked
  email_billing BOOLEAN DEFAULT true,         -- Always sent, shown as locked
  email_team_activity BOOLEAN DEFAULT true,
  email_site_activity BOOLEAN DEFAULT true,
  email_booking_notifications BOOLEAN DEFAULT true,
  email_order_notifications BOOLEAN DEFAULT true,
  email_form_submissions BOOLEAN DEFAULT true,
  
  -- In-App Notification Categories
  inapp_team_activity BOOLEAN DEFAULT true,
  inapp_site_activity BOOLEAN DEFAULT true,
  inapp_booking_notifications BOOLEAN DEFAULT true,
  inapp_order_notifications BOOLEAN DEFAULT true,
  inapp_form_submissions BOOLEAN DEFAULT true,
  
  -- Digest Settings
  email_digest_frequency TEXT DEFAULT 'instant' 
    CHECK (email_digest_frequency IN ('instant', 'daily', 'weekly', 'never')),
  
  -- Unsubscribe
  global_unsubscribe BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

### Notification Preferences UI

Create `src/app/(dashboard)/dashboard/settings/notifications/page.tsx`:

**Section 1: Email Notifications**
| Category | Toggle | Note |
|----------|--------|------|
| Security alerts | 🔒 Always on | Password changes, suspicious login |
| Billing & payments | 🔒 Always on | Invoices, payment failures |
| Team activity | ✅ | Member joins, role changes |
| Site activity | ✅ | Site published, domain connected |
| Booking notifications | ✅ | New bookings, cancellations |
| Order notifications | ✅ | New orders, shipping updates |
| Form submissions | ✅ | New form entries |
| Product updates | ✅ | New features, platform news |
| Marketing | ✅ | Tips, promotions |

**Section 2: In-App Notifications**
Same categories (minus marketing/product updates)

**Section 3: Email Frequency**
- Instant (default)
- Daily digest
- Weekly digest

### Unsubscribe Flow

Create `src/app/unsubscribe/page.tsx`:
1. Receives `?uid=xxx&category=yyy` query params
2. Shows current preferences with toggles
3. One-click unsubscribe for the specific category
4. "Unsubscribe from all" option
5. Works without login (uses signed token in URL)

### Check Preferences Before Sending

Update `sendBrandedEmail()`:
```typescript
export async function sendBrandedEmail(agencyId, options) {
  // Check if recipient has opted out
  if (options.recipientUserId) {
    const prefs = await getNotificationPreferences(options.recipientUserId);
    const category = mapEmailTypeToCategory(options.emailType);
    
    if (prefs.global_unsubscribe || !prefs[`email_${category}`]) {
      // Skip sending (unless security/billing - always send)
      if (!isRequiredEmail(options.emailType)) {
        return { skipped: true, reason: 'user_opted_out' };
      }
    }
  }
  
  // ... proceed with sending
}
```

### Acceptance Criteria
- [ ] Users can toggle email categories on/off
- [ ] Security and billing emails cannot be turned off (locked)
- [ ] Unsubscribe link in every email works
- [ ] One-click unsubscribe works without login
- [ ] Preferences checked before every email send
- [ ] Opted-out users don't receive those email categories

---

## Task 5: Email Delivery Tracking

**Problem**: No visibility into whether emails were delivered, opened, or bounced.  
**Solution**: Track email delivery events from Resend.

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  agency_id UUID REFERENCES public.agencies(id),
  recipient_user_id UUID REFERENCES auth.users(id),
  
  -- Email Details
  resend_id TEXT,            -- Resend API message ID
  to_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,  -- From EmailType enum
  
  -- Delivery Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  
  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Error Info
  error_message TEXT,
  bounce_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by agency
CREATE INDEX idx_email_logs_agency ON public.email_logs(agency_id, sent_at DESC);
CREATE INDEX idx_email_logs_resend ON public.email_logs(resend_id);
```

### Webhook Handler

Create `src/app/api/webhooks/resend/route.ts`:
- Handles Resend webhook events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
- Updates `email_logs` table with delivery events
- On bounce: Flag the email address for review

### Log on Send

Update `sendBrandedEmail()` to log every sent email:
```typescript
const result = await resend.emails.send(emailPayload);

await supabase.from('email_logs').insert({
  agency_id: agencyId,
  recipient_user_id: options.recipientUserId,
  resend_id: result.id,
  to_email: options.to,
  from_name: branding.from_name,
  subject: options.subject,
  email_type: options.emailType,
  status: 'sent',
});
```

### Dashboard Widget (Optional)

Add an email delivery summary to the agency dashboard:
- Emails sent (last 7 days)
- Delivery rate
- Open rate
- Bounce count (with alerts)

### Acceptance Criteria
- [ ] Every email send is logged to `email_logs`
- [ ] Resend webhook updates delivery status
- [ ] Agency admin can view email delivery stats
- [ ] Bounced emails are flagged
- [ ] No PII stored beyond email address

---

## Task 6: Email Preview & Testing

**Problem**: No way for agency admins to preview branded emails before they go to customers.  
**Solution**: Email preview in branding settings.

### Implementation

1. Add "Preview Email" button to branding settings page
2. Create `src/app/api/email/preview/route.ts`:
   - Accepts `emailType` and `agencyId`
   - Generates email HTML with current agency branding
   - Returns HTML for in-browser preview
3. Add "Send Test Email" button:
   - Sends a real email to the logged-in admin's email
   - Uses current branding settings (even unsaved ones)
4. Create a preview gallery showing all 18 email types:
   - Thumbnail grid of all email templates
   - Click to expand and preview
   - Desktop/mobile toggle (preview at 600px vs 320px)

### Acceptance Criteria
- [ ] Admin can preview any email template with their branding
- [ ] Desktop and mobile preview widths
- [ ] "Send test email" sends a real email to admin
- [ ] Preview updates live as branding settings change

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/lib/email/email-branding.ts` | Branding types & builder |
| CREATE | `src/lib/email/send-branded-email.ts` | Branded email sender |
| CREATE | `src/lib/email/templates/base-template.ts` | Shared email layout |
| CREATE | 18 template files in `src/lib/email/templates/` | Individual email templates |
| CREATE | `src/lib/queries/branding.ts` | DB queries for branding |
| CREATE | `src/app/unsubscribe/page.tsx` | Unsubscribe page |
| CREATE | `src/app/(dashboard)/dashboard/settings/notifications/page.tsx` | Preferences UI |
| CREATE | `src/app/api/webhooks/resend/route.ts` | Delivery tracking webhook |
| CREATE | `src/app/api/email/preview/route.ts` | Email preview API |
| CREATE | `migrations/XXXX_notification_preferences.sql` | Preferences schema |
| CREATE | `migrations/XXXX_email_logs.sql` | Email logs schema |
| MODIFY | `src/lib/email/send-email.ts` | Accept branding parameter |
| MODIFY | `src/lib/email/resend-client.ts` | Dynamic from name |
| MODIFY | All email send call sites (8-12 files) | Use `sendBrandedEmail()` |

---

## Testing Checklist

- [ ] Send each of the 18 email types from an agency with full branding configured
- [ ] Verify agency logo appears in email header
- [ ] Verify "From" name shows agency name (not "Dramac")
- [ ] Verify footer shows agency info, support email, unsubscribe link
- [ ] Test booking confirmation email — customer sees business name
- [ ] Test order confirmation email — customer sees store name
- [ ] Test emails in Gmail, Outlook, Apple Mail (rendering)
- [ ] Test at 320px width (mobile email clients)
- [ ] Toggle off "booking_notifications" preference → booking email not sent
- [ ] Click unsubscribe link → lands on preferences page with category toggled off
- [ ] Send email → check `email_logs` → webhook updates to "delivered"
- [ ] Agency with NO branding → emails use Dramac defaults (backward compatible)
- [ ] Preview gallery shows all 18 templates correctly
