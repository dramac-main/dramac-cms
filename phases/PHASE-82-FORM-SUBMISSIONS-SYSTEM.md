# Phase 82: Form Submissions System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 6-8 hours

---

## 🎯 Objective

Create a complete form submission system so agencies can:
1. **Capture** - Store form submissions from published sites
2. **View** - See all submissions in dashboard
3. **Notify** - Email notifications on new submissions
4. **Export** - Download submissions as CSV
5. **Integrate** - Webhook support for CRM integration

---

## � USER ROLES & ACCESS

### Access Matrix

| Feature | Super Admin | Agency Owner | Agency Admin | Agency Member | Client (Portal) |
|---------|-------------|--------------|--------------|---------------|-----------------|
| View all submissions | ✅ (all agencies) | ✅ | ✅ | ✅ (assigned sites) | ✅ (own sites) |
| Delete submissions | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export CSV | ✅ | ✅ | ✅ | ✅ | ✅ (limited) |
| Configure form settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage webhooks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mark as read/spam | ✅ | ✅ | ✅ | ✅ | ✅ |

### Permission Implementation
- Use `getCurrentUserRole()` from `@/lib/auth/permissions`
- Site-scoped access (submissions belong to sites)
- Client portal access via `clients.portal_user_id` link
- Agency members only see submissions from assigned sites

---

## 📋 Prerequisites

- [ ] Form components exist in visual editor
- [ ] Site publishing works
- [ ] Email service configured (optional for notifications)
- [ ] Permission system working (`src/lib/auth/permissions.ts`)
- [ ] Client portal exists (`/portal/`)

---

## 🔍 Current State Analysis

**What Exists:**
- Form components in visual editor (inputs, buttons)
- `form-navigation-settings` phase documents
- Basic form rendering in published sites
- Client portal at `/portal/` with impersonation
- Permission system in `@/lib/auth/permissions.ts`

**What's Missing:**
- Form submission storage
- Submissions dashboard (agency & portal)
- Email notifications
- Export functionality
- Webhook integrations
- Spam protection
- Portal submissions view for clients

---

## 💼 Business Value

1. **Lead Capture** - Agencies can capture leads for clients
2. **Client Value** - Clients see submissions without external tools
3. **Differentiation** - Compete with Typeform, JotForm integration
4. **Upsell** - Premium features (more submissions, integrations)
5. **Stickiness** - Data stored in platform = harder to leave

---

## 📁 Files to Create

```
# Agency Dashboard (staff)
src/app/(dashboard)/sites/[siteId]/submissions/
├── page.tsx                    # Submissions list

# Client Portal (clients)
src/app/portal/submissions/
├── page.tsx                    # Portal submissions view
├── [siteId]/page.tsx           # Site-specific submissions

src/app/api/forms/
├── submit/route.ts             # Public submission endpoint
├── export/route.ts             # CSV export

src/lib/forms/
├── submission-service.ts       # Submission CRUD (with permissions!)
├── notification-service.ts     # Email notifications
├── webhook-service.ts          # Webhook dispatching
├── spam-protection.ts          # Basic spam checks

src/components/forms/
├── submission-table.tsx        # Data table
├── submission-detail.tsx       # Single submission view
├── form-settings-panel.tsx     # Form configuration
├── export-dialog.tsx           # Export options

Database:
├── form_submissions            # Submission data
├── form_settings               # Form configuration
├── form_webhooks               # Webhook URLs
```

---

## ✅ Tasks

### Task 82.1: Database Schema

**File: `migrations/form-submissions-tables.sql`**

```sql
-- Form settings per site/form
CREATE TABLE IF NOT EXISTS form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL, -- ID from the form component
  
  -- Configuration
  form_name TEXT DEFAULT 'Contact Form',
  success_message TEXT DEFAULT 'Thank you for your submission!',
  redirect_url TEXT,
  
  -- Notifications
  notify_emails TEXT[], -- Array of email addresses
  notify_on_submission BOOLEAN DEFAULT TRUE,
  
  -- Spam protection
  enable_honeypot BOOLEAN DEFAULT TRUE,
  enable_rate_limit BOOLEAN DEFAULT TRUE,
  rate_limit_per_hour INTEGER DEFAULT 10,
  
  -- Storage
  retention_days INTEGER DEFAULT 365,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, form_id)
);

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  
  -- Submission data
  data JSONB NOT NULL, -- Form field values
  
  -- Metadata
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  
  -- Status
  status TEXT DEFAULT 'new', -- new, read, archived, spam
  is_spam BOOLEAN DEFAULT FALSE,
  
  -- Processing
  notified_at TIMESTAMPTZ,
  webhook_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS form_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT, -- NULL means all forms
  
  -- Webhook config
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST', -- POST, PUT
  headers JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_form_submissions_site ON form_submissions(site_id);
CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at DESC);
CREATE INDEX idx_form_settings_site ON form_settings(site_id);
CREATE INDEX idx_form_webhooks_site ON form_webhooks(site_id);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_submissions
-- Super admins can do everything
CREATE POLICY "Super admins have full access to submissions"
ON form_submissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Agency members can view submissions for sites in their agency
CREATE POLICY "Agency members can view their agency submissions"
ON form_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_submissions.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Agency owners/admins can delete submissions
CREATE POLICY "Agency owners/admins can delete submissions"
ON form_submissions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_submissions.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- Agency owners/admins can update submissions
CREATE POLICY "Agency owners/admins can update submissions"
ON form_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_submissions.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- RLS Policies for form_settings
CREATE POLICY "Super admins have full access to form settings"
ON form_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Agency members can view form settings"
ON form_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_settings.site_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Agency owners/admins can manage form settings"
ON form_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_settings.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- RLS Policies for form_webhooks
CREATE POLICY "Super admins have full access to webhooks"
ON form_webhooks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Agency owners/admins can manage webhooks"
ON form_webhooks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_webhooks.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);
```

---

### Task 82.2: Submission Service

**File: `src/lib/forms/submission-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getCurrentUserRole, isSuperAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

export interface FormSubmission {
  id: string;
  siteId: string;
  formId: string;
  data: Record<string, unknown>;
  pageUrl: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  status: "new" | "read" | "archived" | "spam";
  isSpam: boolean;
  createdAt: string;
}

export interface FormSettings {
  id: string;
  siteId: string;
  formId: string;
  formName: string;
  successMessage: string;
  redirectUrl: string | null;
  notifyEmails: string[];
  notifyOnSubmission: boolean;
  enableHoneypot: boolean;
  enableRateLimit: boolean;
  rateLimitPerHour: number;
}

export interface SubmissionFilters {
  status?: string;
  formId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Get user context for form submissions access
 * Returns siteIds user can access based on their role
 */
async function getUserSiteContext(): Promise<{
  userId: string | null;
  role: string | null;
  accessibleSiteIds: string[] | null; // null = all sites (super admin)
  isPortalUser: boolean;
  portalClientId: string | null;
}> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  const cookieStore = await cookies();
  
  // Check for portal user (client impersonation)
  const portalClientId = cookieStore.get("impersonating_client_id")?.value || null;
  
  if (portalClientId) {
    // Portal user - get their accessible sites
    const { data: client } = await supabase
      .from("clients")
      .select("id, has_portal_access")
      .eq("id", portalClientId)
      .single();
    
    if (!client?.has_portal_access) {
      return { userId: null, role: null, accessibleSiteIds: [], isPortalUser: true, portalClientId };
    }
    
    // Get sites for this client
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("client_id", portalClientId);
    
    return {
      userId: null,
      role: "client",
      accessibleSiteIds: sites?.map(s => s.id) || [],
      isPortalUser: true,
      portalClientId
    };
  }
  
  if (!userId) {
    return { userId: null, role: null, accessibleSiteIds: [], isPortalUser: false, portalClientId: null };
  }
  
  // Super admin can see all
  if (await isSuperAdmin()) {
    return { userId, role: "super_admin", accessibleSiteIds: null, isPortalUser: false, portalClientId: null };
  }
  
  // Get user's agency membership
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .single();
  
  if (!membership) {
    return { userId, role, accessibleSiteIds: [], isPortalUser: false, portalClientId: null };
  }
  
  // For agency members, get all sites in their agency
  const { data: sites } = await supabase
    .from("sites")
    .select("id, clients!inner(agency_id)")
    .eq("clients.agency_id", membership.agency_id);
  
  return {
    userId,
    role: membership.role, // owner, admin, or member
    accessibleSiteIds: sites?.map(s => s.id) || [],
    isPortalUser: false,
    portalClientId: null
  };
}

/**
 * Check if user can access a specific site's submissions
 */
async function canAccessSite(siteId: string): Promise<boolean> {
  const context = await getUserSiteContext();
  
  if (context.accessibleSiteIds === null) {
    return true; // Super admin
  }
  
  return context.accessibleSiteIds.includes(siteId);
}

/**
 * Check if user can delete submissions
 * Agency members and portal clients cannot delete
 */
async function canDeleteSubmissions(): Promise<boolean> {
  const context = await getUserSiteContext();
  
  if (context.isPortalUser) return false;
  if (context.role === "member") return false;
  
  return context.role === "super_admin" || context.role === "owner" || context.role === "admin";
}

/**
 * Check if user can export submissions
 * Portal users have limited export (own sites only)
 */
async function canExportSubmissions(): Promise<boolean> {
  const context = await getUserSiteContext();
  return context.userId !== null || context.isPortalUser;
}

export async function getSubmissions(
  siteId: string,
  filters: SubmissionFilters = {},
  page = 1,
  limit = 50
): Promise<{ submissions: FormSubmission[]; total: number }> {
  // Permission check
  if (!(await canAccessSite(siteId))) {
    console.error("[SubmissionService] Access denied for site:", siteId);
    return { submissions: [], total: 0 };
  }
  
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("form_submissions")
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.formId) {
    query = query.eq("form_id", filters.formId);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate.toISOString());
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[SubmissionService] Error:", error);
    return { submissions: [], total: 0 };
  }

  return {
    submissions: data.map(mapToSubmission),
    total: count || 0,
  };
}

export async function getSubmission(submissionId: string): Promise<FormSubmission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error || !data) {
    return null;
  }
  
  // Permission check - verify user can access this site
  if (!(await canAccessSite(data.site_id))) {
    console.error("[SubmissionService] Access denied for submission:", submissionId);
    return null;
  }

  return mapToSubmission(data);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: "new" | "read" | "archived" | "spam"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First get the submission to check site access
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("site_id")
    .eq("id", submissionId)
    .single();
  
  if (!existing || !(await canAccessSite(existing.site_id))) {
    return { success: false, error: "Access denied" };
  }

  const { error } = await supabase
    .from("form_submissions")
    .update({
      status,
      is_spam: status === "spam",
    })
    .eq("id", submissionId);

  if (error) {
    return { success: false, error: "Failed to update status" };
  }

  return { success: true };
}

export async function deleteSubmission(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  // Permission check - only owner/admin can delete
  if (!(await canDeleteSubmissions())) {
    return { success: false, error: "Permission denied: Only agency owners/admins can delete submissions" };
  }

  const supabase = await createClient();

  // Verify site access
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("site_id")
    .eq("id", submissionId)
    .single();
  
  if (!existing || !(await canAccessSite(existing.site_id))) {
    return { success: false, error: "Access denied" };
  }

  const { error } = await supabase
    .from("form_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    return { success: false, error: "Failed to delete submission" };
  }

  return { success: true };
}

export async function deleteSubmissions(
  submissionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // Permission check - only owner/admin can delete
  if (!(await canDeleteSubmissions())) {
    return { success: false, error: "Permission denied: Only agency owners/admins can delete submissions" };
  }

  const supabase = await createClient();

  // Verify all submissions belong to accessible sites
  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("id, site_id")
    .in("id", submissionIds);
  
  if (submissions) {
    for (const sub of submissions) {
      if (!(await canAccessSite(sub.site_id))) {
        return { success: false, error: "Access denied for one or more submissions" };
      }
    }
  }

  const { error } = await supabase
    .from("form_submissions")
    .delete()
    .in("id", submissionIds);

  if (error) {
    return { success: false, error: "Failed to delete submissions" };
  }

  return { success: true };
}

export async function getFormSettings(
  siteId: string,
  formId: string
): Promise<FormSettings | null> {
  // Permission check
  if (!(await canAccessSite(siteId))) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("form_settings")
    .select("*")
    .eq("site_id", siteId)
    .eq("form_id", formId)
    .single();

  if (error || !data) {
    // Return defaults if no settings exist
    return {
      id: "",
      siteId,
      formId,
      formName: "Contact Form",
      successMessage: "Thank you for your submission!",
      redirectUrl: null,
      notifyEmails: [],
      notifyOnSubmission: true,
      enableHoneypot: true,
      enableRateLimit: true,
      rateLimitPerHour: 10,
    };
  }

  return {
    id: data.id,
    siteId: data.site_id,
    formId: data.form_id,
    formName: data.form_name,
    successMessage: data.success_message,
    redirectUrl: data.redirect_url,
    notifyEmails: data.notify_emails || [],
    notifyOnSubmission: data.notify_on_submission,
    enableHoneypot: data.enable_honeypot,
    enableRateLimit: data.enable_rate_limit,
    rateLimitPerHour: data.rate_limit_per_hour,
  };
}

export async function updateFormSettings(
  siteId: string,
  formId: string,
  settings: Partial<FormSettings>
): Promise<{ success: boolean; error?: string }> {
  // Permission check - portal users cannot change settings
  const context = await getUserSiteContext();
  if (context.isPortalUser) {
    return { success: false, error: "Portal users cannot modify form settings" };
  }
  
  if (!(await canAccessSite(siteId))) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("form_settings")
    .upsert(
      {
        site_id: siteId,
        form_id: formId,
        form_name: settings.formName,
        success_message: settings.successMessage,
        redirect_url: settings.redirectUrl,
        notify_emails: settings.notifyEmails,
        notify_on_submission: settings.notifyOnSubmission,
        enable_honeypot: settings.enableHoneypot,
        enable_rate_limit: settings.enableRateLimit,
        rate_limit_per_hour: settings.rateLimitPerHour,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id,form_id" }
    );

  if (error) {
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}

export async function getSubmissionStats(siteId: string): Promise<{
  total: number;
  new: number;
  today: number;
  thisWeek: number;
}> {
  // Permission check
  if (!(await canAccessSite(siteId))) {
    return { total: 0, new: 0, today: 0, thisWeek: 0 };
  }

  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalResult, newResult, todayResult, weekResult] = await Promise.all([
    supabase
      .from("form_submissions")
      .select("id", { count: "exact" })
      .eq("site_id", siteId),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact" })
      .eq("site_id", siteId)
      .eq("status", "new"),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact" })
      .eq("site_id", siteId)
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact" })
      .eq("site_id", siteId)
      .gte("created_at", startOfWeek.toISOString()),
  ]);

  return {
    total: totalResult.count || 0,
    new: newResult.count || 0,
    today: todayResult.count || 0,
    thisWeek: weekResult.count || 0,
  };
}

/**
 * Get accessible sites for portal users
 */
export async function getPortalAccessibleSites(): Promise<{
  sites: Array<{ id: string; name: string; domain: string }>;
}> {
  const context = await getUserSiteContext();
  
  if (!context.isPortalUser || !context.portalClientId) {
    return { sites: [] };
  }
  
  const supabase = await createClient();
  
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, domain")
    .eq("client_id", context.portalClientId)
    .order("name");
  
  return { sites: sites || [] };
}

function mapToSubmission(data: Record<string, unknown>): FormSubmission {
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    formId: data.form_id as string,
    data: (data.data as Record<string, unknown>) || {},
    pageUrl: data.page_url as string | null,
    userAgent: data.user_agent as string | null,
    ipAddress: data.ip_address as string | null,
    status: data.status as "new" | "read" | "archived" | "spam",
    isSpam: data.is_spam as boolean,
    createdAt: data.created_at as string,
  };
}
```

---

### Task 82.3: Public Form Submission Endpoint

**File: `src/app/api/forms/submit/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, formId, data, honeypot } = body;

    if (!siteId || !formId || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || null;
    const referer = headersList.get("referer") || null;
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // Get form settings
    const { data: settings } = await supabase
      .from("form_settings")
      .select("*")
      .eq("site_id", siteId)
      .eq("form_id", formId)
      .single();

    // Honeypot check
    if (settings?.enable_honeypot && honeypot) {
      console.log("[FormSubmit] Honeypot triggered, likely spam");
      // Still return success to not alert bots
      return NextResponse.json({
        success: true,
        message: settings?.success_message || "Thank you!",
      });
    }

    // Rate limiting
    if (settings?.enable_rate_limit) {
      const rateKey = `${siteId}:${formId}:${ip}`;
      const now = Date.now();
      const rateLimit = rateLimitMap.get(rateKey);

      if (rateLimit) {
        if (now < rateLimit.resetAt) {
          if (rateLimit.count >= (settings.rate_limit_per_hour || 10)) {
            return NextResponse.json(
              { error: "Rate limit exceeded. Please try again later." },
              { status: 429 }
            );
          }
          rateLimit.count++;
        } else {
          rateLimitMap.set(rateKey, { count: 1, resetAt: now + 3600000 });
        }
      } else {
        rateLimitMap.set(rateKey, { count: 1, resetAt: now + 3600000 });
      }
    }

    // Basic spam detection
    const isSpam = detectSpam(data);

    // Save submission
    const { data: submission, error } = await supabase
      .from("form_submissions")
      .insert({
        site_id: siteId,
        form_id: formId,
        data,
        page_url: referer,
        user_agent: userAgent,
        ip_address: ip,
        status: isSpam ? "spam" : "new",
        is_spam: isSpam,
      })
      .select()
      .single();

    if (error) {
      console.error("[FormSubmit] Error saving submission:", error);
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 }
      );
    }

    // Send notifications (async, don't wait)
    if (settings?.notify_on_submission && !isSpam) {
      sendNotifications(submission, settings).catch(console.error);
    }

    // Trigger webhooks (async, don't wait)
    triggerWebhooks(siteId, formId, submission).catch(console.error);

    return NextResponse.json({
      success: true,
      message: settings?.success_message || "Thank you for your submission!",
      redirect: settings?.redirect_url || null,
    });
  } catch (error) {
    console.error("[FormSubmit] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function detectSpam(data: Record<string, unknown>): boolean {
  const content = Object.values(data).join(" ").toLowerCase();

  // Common spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|winner)\b/i,
    /\b(click here|act now|limited time)\b/i,
    /https?:\/\/[^\s]+\.(ru|cn|tk|xyz)\b/i, // Suspicious TLDs
    /<script\b/i, // HTML injection attempt
    /\[url=/i, // BBCode spam
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Check for excessive links
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount > 3) {
    return true;
  }

  return false;
}

async function sendNotifications(
  submission: Record<string, unknown>,
  settings: Record<string, unknown>
): Promise<void> {
  const emails = settings.notify_emails as string[];
  if (!emails || emails.length === 0) return;

  // In production, use email service like Resend, SendGrid, etc.
  console.log("[FormSubmit] Would send notification to:", emails);
  console.log("[FormSubmit] Submission data:", submission.data);

  // Mark as notified
  await supabase
    .from("form_submissions")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", submission.id);
}

async function triggerWebhooks(
  siteId: string,
  formId: string,
  submission: Record<string, unknown>
): Promise<void> {
  const { data: webhooks } = await supabase
    .from("form_webhooks")
    .select("*")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .or(`form_id.is.null,form_id.eq.${formId}`);

  if (!webhooks || webhooks.length === 0) return;

  for (const webhook of webhooks) {
    try {
      const response = await fetch(webhook.url, {
        method: webhook.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhook.headers || {}),
        },
        body: JSON.stringify({
          event: "form.submission",
          siteId,
          formId,
          data: submission.data,
          submittedAt: submission.created_at,
        }),
      });

      await supabase
        .from("form_webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status_code: response.status,
        })
        .eq("id", webhook.id);

      await supabase
        .from("form_submissions")
        .update({ webhook_sent_at: new Date().toISOString() })
        .eq("id", submission.id);
    } catch (error) {
      console.error("[FormSubmit] Webhook error:", error);
    }
  }
}
```

---

### Task 82.4: Submissions Table Component

**File: `src/components/forms/submission-table.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Mail,
  MailOpen,
  Archive,
  AlertTriangle,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateSubmissionStatus,
  deleteSubmission,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

interface SubmissionTableProps {
  submissions: FormSubmission[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onView: (submission: FormSubmission) => void;
  onRefresh: () => void;
}

const statusConfig = {
  new: { label: "New", icon: Mail, color: "bg-blue-100 text-blue-800" },
  read: { label: "Read", icon: MailOpen, color: "bg-gray-100 text-gray-800" },
  archived: { label: "Archived", icon: Archive, color: "bg-yellow-100 text-yellow-800" },
  spam: { label: "Spam", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
};

export function SubmissionTable({
  submissions,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onRefresh,
}: SubmissionTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    status: "new" | "read" | "archived" | "spam"
  ) => {
    setActionLoading(id);
    const result = await updateSubmissionStatus(id, status);
    setActionLoading(null);

    if (result.success) {
      toast.success("Status updated");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submission?")) return;

    setActionLoading(id);
    const result = await deleteSubmission(id);
    setActionLoading(null);

    if (result.success) {
      toast.success("Submission deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPreviewText = (data: Record<string, unknown>): string => {
    // Get first meaningful field value
    const values = Object.entries(data)
      .filter(([key]) => !["_honeypot", "form_id"].includes(key))
      .map(([, value]) => String(value))
      .filter((v) => v.length > 0);

    const preview = values.slice(0, 2).join(" - ");
    return preview.length > 60 ? preview.slice(0, 60) + "..." : preview;
  };

  const allSelected = submissions.length > 0 && selectedIds.length === submissions.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
          </TableHead>
          <TableHead className="w-24">Status</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="w-32">Date</TableHead>
          <TableHead className="w-16"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => {
          const status = statusConfig[submission.status];
          const StatusIcon = status.icon;
          const isSelected = selectedIds.includes(submission.id);
          const isLoading = actionLoading === submission.id;

          return (
            <TableRow
              key={submission.id}
              className={`cursor-pointer ${isSelected ? "bg-muted/50" : ""}`}
              onClick={() => onView(submission)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(submission.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">{getPreviewText(submission.data)}</p>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDate(submission.createdAt)}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {submission.status !== "new" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(submission.id, "new")}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Mark as New
                      </DropdownMenuItem>
                    )}
                    {submission.status !== "read" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(submission.id, "read")}
                      >
                        <MailOpen className="h-4 w-4 mr-2" />
                        Mark as Read
                      </DropdownMenuItem>
                    )}
                    {submission.status !== "archived" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(submission.id, "archived")}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    {submission.status !== "spam" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(submission.id, "spam")}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Mark as Spam
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(submission.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

---

### Task 82.5: Submission Detail Component

**File: `src/components/forms/submission-detail.tsx`**

```tsx
"use client";

import { X, Mail, Clock, Globe, MonitorSmartphone, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  updateSubmissionStatus,
  deleteSubmission,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

interface SubmissionDetailProps {
  submission: FormSubmission;
  onClose: () => void;
  onUpdate: () => void;
}

export function SubmissionDetail({
  submission,
  onClose,
  onUpdate,
}: SubmissionDetailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleMarkRead = async () => {
    if (submission.status === "new") {
      const result = await updateSubmissionStatus(submission.id, "read");
      if (result.success) {
        onUpdate();
      }
    }
  };

  const handleArchive = async () => {
    const result = await updateSubmissionStatus(submission.id, "archived");
    if (result.success) {
      toast.success("Submission archived");
      onUpdate();
    } else {
      toast.error(result.error || "Failed to archive");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this submission?")) return;

    const result = await deleteSubmission(submission.id);
    if (result.success) {
      toast.success("Submission deleted");
      onClose();
      onUpdate();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  // Mark as read when viewing
  if (submission.status === "new") {
    handleMarkRead();
  }

  // Render form field
  const renderField = (key: string, value: unknown): JSX.Element => {
    // Skip internal fields
    if (key.startsWith("_")) return <></>;

    const displayKey = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    let displayValue: React.ReactNode = String(value);

    // Handle special types
    if (typeof value === "boolean") {
      displayValue = value ? "Yes" : "No";
    } else if (value instanceof Date) {
      displayValue = value.toLocaleString();
    } else if (typeof value === "object" && value !== null) {
      displayValue = JSON.stringify(value, null, 2);
    } else if (String(value).includes("@")) {
      displayValue = (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {String(value)}
        </a>
      );
    } else if (String(value).match(/^https?:\/\//)) {
      displayValue = (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {String(value)}
        </a>
      );
    }

    // Handle long text
    const strValue = String(value);
    const isLongText = strValue.length > 100;

    return (
      <div key={key} className="py-3">
        <dt className="text-sm font-medium text-muted-foreground mb-1">
          {displayKey}
        </dt>
        <dd className={`text-sm ${isLongText ? "whitespace-pre-wrap" : ""}`}>
          {displayValue}
        </dd>
      </div>
    );
  };

  return (
    <div className="w-96 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h3 className="font-semibold">Submission Details</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={
                submission.status === "new"
                  ? "bg-blue-100 text-blue-800"
                  : submission.status === "spam"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Form: {submission.formId}
            </span>
          </div>

          {/* Metadata */}
          <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDate(submission.createdAt)}</span>
            </div>
            {submission.pageUrl && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="truncate">{submission.pageUrl}</span>
              </div>
            )}
            {submission.userAgent && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MonitorSmartphone className="h-4 w-4" />
                <span className="truncate text-xs">
                  {submission.userAgent.slice(0, 50)}...
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Form Data */}
          <div>
            <h4 className="font-medium mb-3">Form Data</h4>
            <dl className="divide-y">
              {Object.entries(submission.data).map(([key, value]) =>
                renderField(key, value)
              )}
            </dl>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          onClick={handleArchive}
          className="w-full"
          disabled={submission.status === "archived"}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive Submission
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          className="w-full text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Submission
        </Button>
      </div>
    </div>
  );
}
```

---

### Task 82.6: Submissions Page

**File: `src/app/(dashboard)/sites/[siteId]/submissions/page.tsx`**

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { Mail, Download, Trash2, Loader2, Inbox, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmissionTable } from "@/components/forms/submission-table";
import { SubmissionDetail } from "@/components/forms/submission-detail";
import {
  getSubmissions,
  getSubmissionStats,
  deleteSubmissions,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

export default function SubmissionsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, today: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);

    const [submissionsResult, statsResult] = await Promise.all([
      getSubmissions(
        siteId,
        { status: statusFilter === "all" ? undefined : statusFilter },
        page
      ),
      getSubmissionStats(siteId),
    ]);

    setSubmissions(submissionsResult.submissions);
    setTotal(submissionsResult.total);
    setStats(statsResult);
    setLoading(false);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? submissions.map((s) => s.id) : []);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} submissions?`)) return;

    const result = await deleteSubmissions(selectedIds);
    if (result.success) {
      toast.success(`Deleted ${selectedIds.length} submissions`);
      setSelectedIds([]);
      loadData();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleExport = () => {
    // Generate CSV
    if (submissions.length === 0) {
      toast.error("No submissions to export");
      return;
    }

    // Get all unique field keys
    const allKeys = new Set<string>();
    submissions.forEach((s) => {
      Object.keys(s.data).forEach((k) => allKeys.add(k));
    });
    const headers = ["Date", ...Array.from(allKeys), "Status"];

    // Build CSV rows
    const rows = submissions.map((s) => {
      const values = [
        new Date(s.createdAt).toISOString(),
        ...Array.from(allKeys).map((k) => {
          const val = s.data[k];
          // Escape quotes and handle special characters
          const str = String(val ?? "").replace(/"/g, '""');
          return `"${str}"`;
        }),
        s.status,
      ];
      return values.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${siteId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Form Submissions
              </h1>
              <p className="text-muted-foreground mt-1">
                {total} total submissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {selectedIds.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No submissions yet</h3>
              <p className="text-sm text-muted-foreground">
                Submissions will appear here when visitors submit your forms.
              </p>
            </div>
          ) : (
            <SubmissionTable
              submissions={submissions}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={setDetailSubmission}
              onRefresh={loadData}
            />
          )}
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 50 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {detailSubmission && (
        <SubmissionDetail
          submission={detailSubmission}
          onClose={() => setDetailSubmission(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
```

---

### Task 82.7: Portal Submissions Page (Client View)

**File: `src/app/portal/submissions/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Mail, Download, Loader2, Inbox, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SubmissionTable } from "@/components/forms/submission-table";
import { SubmissionDetail } from "@/components/forms/submission-detail";
import {
  getSubmissions,
  getSubmissionStats,
  getPortalAccessibleSites,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

export default function PortalSubmissionsPage() {
  const [sites, setSites] = useState<Array<{ id: string; name: string; domain: string }>>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, today: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Selection (view only for portal users)
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load accessible sites on mount
  useEffect(() => {
    async function loadSites() {
      const result = await getPortalAccessibleSites();
      setSites(result.sites);
      if (result.sites.length > 0) {
        setSelectedSiteId(result.sites[0].id);
      }
      setLoading(false);
    }
    loadSites();
  }, []);

  // Load submissions when site changes
  useEffect(() => {
    if (selectedSiteId) {
      loadData();
    }
  }, [selectedSiteId, page, statusFilter]);

  const loadData = async () => {
    if (!selectedSiteId) return;
    
    setLoading(true);

    const [submissionsResult, statsResult] = await Promise.all([
      getSubmissions(
        selectedSiteId,
        { status: statusFilter === "all" ? undefined : statusFilter },
        page
      ),
      getSubmissionStats(selectedSiteId),
    ]);

    setSubmissions(submissionsResult.submissions);
    setTotal(submissionsResult.total);
    setStats(statsResult);
    setLoading(false);
  };

  const handleExport = () => {
    if (submissions.length === 0) {
      toast.error("No submissions to export");
      return;
    }

    // Get all unique field keys
    const allKeys = new Set<string>();
    submissions.forEach((s) => {
      Object.keys(s.data).forEach((k) => allKeys.add(k));
    });
    const headers = ["Date", ...Array.from(allKeys), "Status"];

    // Build CSV rows
    const rows = submissions.map((s) => {
      const values = [
        new Date(s.createdAt).toISOString(),
        ...Array.from(allKeys).map((k) => {
          const val = s.data[k];
          const str = String(val ?? "").replace(/"/g, '""');
          return `"${str}"`;
        }),
        s.status,
      ];
      return values.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${selectedSiteId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  if (sites.length === 0 && !loading) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center py-16">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Sites Available</h2>
          <p className="text-muted-foreground">
            You don't have access to any sites yet. Please contact your agency.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Form Submissions
            </h1>
            <p className="text-muted-foreground mt-1">
              View form submissions from your websites
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Site Selector */}
        {sites.length > 1 && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Select Website</label>
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                    <span className="text-muted-foreground ml-2">({site.domain})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{stats.today}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No submissions yet</h3>
            <p className="text-sm text-muted-foreground">
              Submissions will appear here when visitors submit forms on your website.
            </p>
          </div>
        ) : (
          <SubmissionTable
            submissions={submissions}
            selectedIds={[]} // Portal users can't select/delete
            onSelect={() => {}} // No-op for portal
            onSelectAll={() => {}} // No-op for portal
            onView={setDetailSubmission}
            onRefresh={loadData}
            readOnly // Add readOnly prop for portal users
          />
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="p-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 50 >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {detailSubmission && (
        <SubmissionDetail
          submission={detailSubmission}
          onClose={() => setDetailSubmission(null)}
          onUpdate={loadData}
          readOnly // Portal users can only view
        />
      )}
    </div>
  );
}
```

**Note**: Update `SubmissionTable` and `SubmissionDetail` components to accept a `readOnly` prop that hides delete/bulk actions for portal users.

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Submission service CRUD operations
- [ ] Permission checks for all user roles
- [ ] Spam detection catches common patterns
- [ ] CSV export formats correctly

### Integration Tests
- [ ] Form submission saves to database
- [ ] Rate limiting blocks excessive submissions
- [ ] Webhooks trigger on submission
- [ ] Portal users can only view their sites

### E2E Tests
- [ ] Submit form on published site
- [ ] View submissions in dashboard (agency)
- [ ] View submissions in portal (client)
- [ ] Status changes work
- [ ] Export downloads correctly
- [ ] Bulk delete works (agency only)
- [ ] Portal users cannot delete submissions

---

## ✅ Completion Checklist

- [ ] Database schema for submissions
- [ ] RLS policies for all tables
- [ ] Submission service with permission checks
- [ ] Public submit endpoint
- [ ] Spam protection
- [ ] Rate limiting
- [ ] Submission table component (with readOnly mode)
- [ ] Submission detail component (with readOnly mode)
- [ ] Agency submissions page
- [ ] **Portal submissions page (client view)**
- [ ] CSV export (all users)
- [ ] Webhook support (agency only)
- [ ] Email notifications (optional)

---

## 🔐 User Role Summary

| Role | View | Export | Mark Read | Delete | Settings |
|------|------|--------|-----------|--------|----------|
| Super Admin | ✅ All | ✅ | ✅ | ✅ | ✅ |
| Agency Owner | ✅ Agency | ✅ | ✅ | ✅ | ✅ |
| Agency Admin | ✅ Agency | ✅ | ✅ | ✅ | ✅ |
| Agency Member | ✅ Assigned | ✅ | ✅ | ❌ | ❌ |
| Client Portal | ✅ Own Sites | ✅ | ✅ | ❌ | ❌ |

---

**Next Phase**: Phase 83 - Blog System
