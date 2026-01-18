"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getCurrentUserRole, isSuperAdmin } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

export interface FormSubmission {
  id: string;
  siteId: string;
  formId: string;
  data: Record<string, unknown>;
  pageUrl: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  referrer: string | null;
  status: "new" | "read" | "archived" | "spam";
  isSpam: boolean;
  notifiedAt: string | null;
  webhookSentAt: string | null;
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
  spamProtection: boolean;
  honeypotEnabled: boolean;
  rateLimitPerMinute: number;
}

export interface FormWebhook {
  id: string;
  siteId: string;
  formId: string | null;
  url: string;
  method: string;
  headers: Record<string, string>;
  isActive: boolean;
  lastTriggeredAt: string | null;
  lastStatusCode: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionFilters {
  status?: "new" | "read" | "archived" | "spam";
  formId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface UserSiteContext {
  userId: string | null;
  role: string | null;
  accessibleSiteIds: string[] | null; // null = all sites (super admin)
  isPortalUser: boolean;
  portalClientId: string | null;
}

/**
 * Get user context for form submissions access
 * Returns siteIds user can access based on their role
 */
async function getUserSiteContext(): Promise<UserSiteContext> {
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
      return { 
        userId: null, 
        role: null, 
        accessibleSiteIds: [], 
        isPortalUser: true, 
        portalClientId 
      };
    }
    
    // Get sites for this client
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("client_id", portalClientId);
    
    return {
      userId: null,
      role: "client",
      accessibleSiteIds: sites?.map((s: { id: string }) => s.id) || [],
      isPortalUser: true,
      portalClientId
    };
  }
  
  if (!userId) {
    return { 
      userId: null, 
      role: null, 
      accessibleSiteIds: [], 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  // Super admin can see all
  if (await isSuperAdmin()) {
    return { 
      userId, 
      role: "super_admin", 
      accessibleSiteIds: null, 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  // Get user's agency membership
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .single();
  
  if (!membership) {
    return { 
      userId, 
      role, 
      accessibleSiteIds: [], 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  // For agency members, get all sites in their agency
  const { data: sites } = await supabase
    .from("sites")
    .select("id, clients!inner(agency_id)")
    .eq("clients.agency_id", membership.agency_id);
  
  return {
    userId,
    role: membership.role, // owner, admin, or member
    accessibleSiteIds: sites?.map((s: { id: string }) => s.id) || [],
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
 * Check if user can manage form settings
 * Portal users and regular members cannot manage settings
 */
async function canManageFormSettings(): Promise<boolean> {
  const context = await getUserSiteContext();
  
  if (context.isPortalUser) return false;
  if (context.role === "member") return false;
  
  return context.role === "super_admin" || context.role === "owner" || context.role === "admin";
}

/**
 * Get form submissions with filters and pagination
 */
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

  // Note: form_submissions table requires Phase 82 migration to be run
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
    console.error("[SubmissionService] Error fetching submissions:", error);
    return { submissions: [], total: 0 };
  }

  return {
    submissions: (data || []).map(mapToSubmission),
    total: count || 0,
  };
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(submissionId: string): Promise<FormSubmission | null> {
  const supabase = await createClient();

  // 
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

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: "new" | "read" | "archived" | "spam"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First get the submission to check site access
  // 
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("site_id")
    .eq("id", submissionId)
    .single();
  
  if (!existing || !(await canAccessSite(existing.site_id))) {
    return { success: false, error: "Access denied" };
  }

  // 
  const { error } = await supabase
    .from("form_submissions")
    .update({
      status,
      is_spam: status === "spam",
    })
    .eq("id", submissionId);

  if (error) {
    console.error("[SubmissionService] Error updating status:", error);
    return { success: false, error: "Failed to update status" };
  }

  return { success: true };
}

/**
 * Delete a single submission
 */
export async function deleteSubmission(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  // Permission check - only owner/admin can delete
  if (!(await canDeleteSubmissions())) {
    return { 
      success: false, 
      error: "Permission denied: Only agency owners/admins can delete submissions" 
    };
  }

  const supabase = await createClient();

  // Verify site access
  // 
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("site_id")
    .eq("id", submissionId)
    .single();
  
  if (!existing || !(await canAccessSite(existing.site_id))) {
    return { success: false, error: "Access denied" };
  }

  // 
  const { error } = await supabase
    .from("form_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    console.error("[SubmissionService] Error deleting submission:", error);
    return { success: false, error: "Failed to delete submission" };
  }

  return { success: true };
}

/**
 * Delete multiple submissions
 */
export async function deleteSubmissions(
  submissionIds: string[]
): Promise<{ success: boolean; error?: string; deleted?: number }> {
  // Permission check - only owner/admin can delete
  if (!(await canDeleteSubmissions())) {
    return { 
      success: false, 
      error: "Permission denied: Only agency owners/admins can delete submissions" 
    };
  }

  if (submissionIds.length === 0) {
    return { success: false, error: "No submissions to delete" };
  }

  const supabase = await createClient();

  // Verify all submissions belong to accessible sites
  // 
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

  // 
  const { error, count } = await supabase
    .from("form_submissions")
    .delete()
    .in("id", submissionIds);

  if (error) {
    console.error("[SubmissionService] Error deleting submissions:", error);
    return { success: false, error: "Failed to delete submissions" };
  }

  return { success: true, deleted: count || submissionIds.length };
}

/**
 * Get form settings for a specific form
 */
export async function getFormSettings(
  siteId: string,
  formId: string
): Promise<FormSettings | null> {
  // Permission check
  if (!(await canAccessSite(siteId))) {
    return null;
  }

  const supabase = await createClient();

  // 
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
      spamProtection: true,
      honeypotEnabled: true,
      rateLimitPerMinute: 5,
    };
  }

  return mapToFormSettings(data);
}

/**
 * Update form settings
 */
export async function updateFormSettings(
  siteId: string,
  formId: string,
  settings: FormSettings
): Promise<{ success: boolean; error?: string }> {
  // Permission check - portal users and members cannot change settings
  if (!(await canManageFormSettings())) {
    return { success: false, error: "Permission denied: Cannot modify form settings" };
  }
  
  if (!(await canAccessSite(siteId))) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  // 
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
        spam_protection: settings.spamProtection,
        honeypot_enabled: settings.honeypotEnabled,
        rate_limit_per_minute: settings.rateLimitPerMinute,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id,form_id" }
    );

  if (error) {
    console.error("[SubmissionService] Error updating form settings:", error);
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}

/**
 * Get submission statistics for a site
 */
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

  // 
  const totalResultQuery = supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  // 
  const newResultQuery = supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "new");
  // 
  const todayResultQuery = supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", startOfToday.toISOString());
  // 
  const weekResultQuery = supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", startOfWeek.toISOString());

  const [totalResult, newResult, todayResult, weekResult] = await Promise.all([
    totalResultQuery,
    newResultQuery,
    todayResultQuery,
    weekResultQuery,
  ]);

  return {
    total: totalResult.count || 0,
    new: newResult.count || 0,
    today: todayResult.count || 0,
    thisWeek: weekResult.count || 0,
  };
}

/**
 * Get all forms for a site that have submissions
 */
export async function getFormsWithSubmissions(siteId: string): Promise<{
  forms: Array<{ formId: string; formName: string; count: number }>;
}> {
  // Permission check
  if (!(await canAccessSite(siteId))) {
    return { forms: [] };
  }

  const supabase = await createClient();

  // Get distinct form IDs with counts
  // 
  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("form_id")
    .eq("site_id", siteId);

  if (!submissions || submissions.length === 0) {
    return { forms: [] };
  }

  // Count submissions per form
  const formCounts = new Map<string, number>();
  for (const sub of submissions) {
    const count = formCounts.get(sub.form_id) || 0;
    formCounts.set(sub.form_id, count + 1);
  }

  // Get form names from settings
  const formIds = Array.from(formCounts.keys());
  // 
  const { data: settings } = await supabase
    .from("form_settings")
    .select("form_id, form_name")
    .eq("site_id", siteId)
    .in("form_id", formIds);

  const settingsMap = new Map<string, string>();
  for (const setting of settings || []) {
    settingsMap.set(setting.form_id, setting.form_name || setting.form_id);
  }

  const forms = formIds.map(formId => ({
    formId,
    formName: settingsMap.get(formId) || formId,
    count: formCounts.get(formId) || 0,
  }));

  // Sort by count descending
  forms.sort((a, b) => b.count - a.count);

  return { forms };
}

/**
 * Get accessible sites for portal users
 */
export async function getPortalAccessibleSites(): Promise<{
  sites: Array<{ id: string; name: string; subdomain: string }>;
}> {
  const context = await getUserSiteContext();
  
  if (!context.isPortalUser || !context.portalClientId) {
    return { sites: [] };
  }
  
  const supabase = await createClient();
  
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, subdomain")
    .eq("client_id", context.portalClientId)
    .order("name");
  
  return { sites: sites || [] };
}

/**
 * Get webhooks for a site
 */
export async function getFormWebhooks(siteId: string): Promise<FormWebhook[]> {
  // Permission check
  if (!(await canManageFormSettings())) {
    return [];
  }
  
  if (!(await canAccessSite(siteId))) {
    return [];
  }

  const supabase = await createClient();

  // 
  const { data, error } = await supabase
    .from("form_webhooks")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[SubmissionService] Error fetching webhooks:", error);
    return [];
  }

  return (data || []).map(mapToWebhook);
}

/**
 * Create a webhook
 */
export async function createFormWebhook(
  siteId: string,
  webhook: {
    formId?: string;
    name?: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
  }
): Promise<{ success: boolean; error?: string; webhook?: FormWebhook }> {
  // Permission check
  if (!(await canManageFormSettings())) {
    return { success: false, error: "Permission denied" };
  }
  
  if (!(await canAccessSite(siteId))) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  // 
  const { data, error } = await supabase
    .from("form_webhooks")
    .insert({
      site_id: siteId,
      form_id: webhook.formId || null,
      name: webhook.name || `Webhook - ${webhook.url.slice(0, 30)}`,
      url: webhook.url,
      method: webhook.method || "POST",
      headers: webhook.headers || {},
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[SubmissionService] Error creating webhook:", error);
    return { success: false, error: "Failed to create webhook" };
  }

  return { success: true, webhook: mapToWebhook(data) };
}

/**
 * Update a webhook
 */
export async function updateFormWebhook(
  webhookId: string,
  updates: {
    formId?: string | null;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  // Permission check
  if (!(await canManageFormSettings())) {
    return { success: false, error: "Permission denied" };
  }

  const supabase = await createClient();

  // Verify access to the webhook's site
  // 
  const { data: existing } = await supabase
    .from("form_webhooks")
    .select("site_id")
    .eq("id", webhookId)
    .single();

  if (!existing || !(await canAccessSite(existing.site_id))) {
    return { success: false, error: "Access denied" };
  }

  // 
  const { error } = await supabase
    .from("form_webhooks")
    .update({
      form_id: updates.formId,
      url: updates.url,
      method: updates.method,
      headers: updates.headers,
      is_active: updates.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", webhookId);

  if (error) {
    console.error("[SubmissionService] Error updating webhook:", error);
    return { success: false, error: "Failed to update webhook" };
  }

  return { success: true };
}

/**
 * Delete a webhook
 */
export async function deleteFormWebhook(
  webhookId: string
): Promise<{ success: boolean; error?: string }> {
  // Permission check
  if (!(await canManageFormSettings())) {
    return { success: false, error: "Permission denied" };
  }

  const supabase = await createClient();

  // Verify access to the webhook's site
  // 
  const { data: existing } = await supabase
    .from("form_webhooks")
    .select("site_id")
    .eq("id", webhookId)
    .single();

  if (!existing || !(await canAccessSite(existing.site_id))) {
    return { success: false, error: "Access denied" };
  }

  // 
  const { error } = await supabase
    .from("form_webhooks")
    .delete()
    .eq("id", webhookId);

  if (error) {
    console.error("[SubmissionService] Error deleting webhook:", error);
    return { success: false, error: "Failed to delete webhook" };
  }

  return { success: true };
}

/**
 * Export submissions as CSV data
 */
export async function exportSubmissionsCSV(
  siteId: string,
  filters: SubmissionFilters = {}
): Promise<{ csv: string; filename: string } | null> {
  // Permission check
  if (!(await canAccessSite(siteId))) {
    return null;
  }

  // Get all submissions (no pagination for export)
  const { submissions } = await getSubmissions(siteId, filters, 1, 10000);
  
  if (submissions.length === 0) {
    return null;
  }

  // Get all unique field keys
  const allKeys = new Set<string>();
  submissions.forEach((s) => {
    Object.keys(s.data).forEach((k) => {
      if (!k.startsWith("_")) {
        allKeys.add(k);
      }
    });
  });
  
  const headers = ["Date", "Form ID", ...Array.from(allKeys), "Status", "Page URL"];

  // Build CSV rows
  const rows = submissions.map((s) => {
    const values = [
      `"${new Date(s.createdAt).toISOString()}"`,
      `"${s.formId}"`,
      ...Array.from(allKeys).map((k) => {
        const val = s.data[k];
        const str = String(val ?? "").replace(/"/g, '""');
        return `"${str}"`;
      }),
      `"${s.status}"`,
      `"${s.pageUrl || ""}"`,
    ];
    return values.join(",");
  });

  const csv = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
  const filename = `submissions-${siteId}-${new Date().toISOString().split("T")[0]}.csv`;

  return { csv, filename };
}

// Mapping functions
function mapToSubmission(data: Record<string, unknown>): FormSubmission {
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    formId: data.form_id as string,
    data: (data.data as Record<string, unknown>) || {},
    pageUrl: data.page_url as string | null,
    userAgent: data.user_agent as string | null,
    ipAddress: data.ip_address as string | null,
    referrer: data.referrer as string | null,
    status: data.status as "new" | "read" | "archived" | "spam",
    isSpam: data.is_spam as boolean,
    notifiedAt: data.notified_at as string | null,
    webhookSentAt: data.webhook_sent_at as string | null,
    createdAt: data.created_at as string,
  };
}

function mapToFormSettings(data: Record<string, unknown>): FormSettings {
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    formId: data.form_id as string,
    formName: (data.form_name as string) || "Contact Form",
    successMessage: (data.success_message as string) || "Thank you for your submission!",
    redirectUrl: data.redirect_url as string | null,
    notifyEmails: (data.notify_emails as string[]) || [],
    notifyOnSubmission: (data.notify_on_submission as boolean) ?? true,
    spamProtection: (data.spam_protection as boolean) ?? true,
    honeypotEnabled: (data.honeypot_enabled as boolean) ?? true,
    rateLimitPerMinute: (data.rate_limit_per_minute as number) || 5,
  };
}

function mapToWebhook(data: Record<string, unknown>): FormWebhook {
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    formId: data.form_id as string | null,
    url: data.url as string,
    method: (data.method as string) || "POST",
    headers: (data.headers as Record<string, string>) || {},
    isActive: (data.is_active as boolean) ?? true,
    lastTriggeredAt: data.last_triggered_at as string | null,
    lastStatusCode: data.last_status_code as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
