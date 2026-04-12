/**
 * Marketing Module - Audience Resolver Service
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Resolves audience/segment definitions into concrete lists of
 * subscribers eligible to receive a campaign email.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "../lib/marketing-constants";

// ============================================================================
// TYPES
// ============================================================================

export interface ResolvedRecipient {
  subscriberId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  customFields?: Record<string, unknown>;
}

// ============================================================================
// AUDIENCE RESOLUTION
// ============================================================================

export async function resolveAudience(
  siteId: string,
  audienceId?: string | null,
  segmentId?: string | null,
): Promise<ResolvedRecipient[]> {
  const supabase = createAdminClient() as any;

  // If no audience specified, get all active subscribers for the site
  if (!audienceId && !segmentId) {
    return getAllActiveSubscribers(supabase, siteId);
  }

  // If audienceId is provided, resolve based on audience type
  if (audienceId) {
    const { data: audience } = await supabase
      .from(MKT_TABLES.audiences)
      .select("*")
      .eq("site_id", siteId)
      .eq("id", audienceId)
      .single();

    if (!audience) {
      console.warn(
        `[Marketing] Audience ${audienceId} not found, falling back to all subscribers`,
      );
      return getAllActiveSubscribers(supabase, siteId);
    }

    switch (audience.type) {
      case "all_subscribers":
        return getAllActiveSubscribers(supabase, siteId);

      case "all_contacts":
        return getAllContactsAsRecipients(supabase, siteId);

      case "list":
        if (audience.filter_criteria?.listId) {
          return getListSubscribers(
            supabase,
            siteId,
            audience.filter_criteria.listId as string,
          );
        }
        return getAllActiveSubscribers(supabase, siteId);

      case "segment":
        return resolveSegmentAudience(
          supabase,
          siteId,
          audience.filter_criteria || {},
          audience.filter_logic || "and",
          audience.exclude_criteria,
        );

      case "custom":
        return resolveSegmentAudience(
          supabase,
          siteId,
          audience.filter_criteria || {},
          audience.filter_logic || "and",
          audience.exclude_criteria,
        );

      default:
        return getAllActiveSubscribers(supabase, siteId);
    }
  }

  // If segmentId (CRM segment), resolve via CRM contacts
  if (segmentId) {
    return resolveCrmSegment(supabase, siteId, segmentId);
  }

  return [];
}

// ============================================================================
// RESOLUTION STRATEGIES
// ============================================================================

async function getAllActiveSubscribers(
  supabase: any,
  siteId: string,
): Promise<ResolvedRecipient[]> {
  const { data, error } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("id, email, first_name, last_name, custom_fields")
    .eq("site_id", siteId)
    .eq("status", "active")
    .eq("email_opt_in", true);

  if (error) {
    console.error("[Marketing] Failed to resolve all subscribers:", error);
    return [];
  }

  return (data || []).map((s: any) => ({
    subscriberId: s.id,
    email: s.email,
    firstName: s.first_name,
    lastName: s.last_name,
    customFields: s.custom_fields,
  }));
}

async function getAllContactsAsRecipients(
  supabase: any,
  siteId: string,
): Promise<ResolvedRecipient[]> {
  // Pull from CRM contacts who have email_opt_in = true
  const { data, error } = await supabase
    .from("mod_crmmod01_contacts")
    .select("id, email, first_name, last_name")
    .eq("site_id", siteId)
    .eq("email_opt_in", true)
    .not("email", "is", null);

  if (error) {
    console.error("[Marketing] Failed to resolve CRM contacts:", error);
    return [];
  }

  return (data || []).map((c: any) => ({
    subscriberId: c.id,
    email: c.email,
    firstName: c.first_name,
    lastName: c.last_name,
  }));
}

async function getListSubscribers(
  supabase: any,
  siteId: string,
  listId: string,
): Promise<ResolvedRecipient[]> {
  const { data, error } = await supabase
    .from(MKT_TABLES.listSubscribers)
    .select(
      `
      subscriber_id,
      ${MKT_TABLES.subscribers} (id, email, first_name, last_name, custom_fields, status, email_opt_in)
    `,
    )
    .eq("list_id", listId);

  if (error) {
    console.error("[Marketing] Failed to resolve list subscribers:", error);
    return [];
  }

  return (data || [])
    .filter((row: any) => {
      const sub = row[MKT_TABLES.subscribers];
      return sub && sub.status === "active" && sub.email_opt_in;
    })
    .map((row: any) => {
      const sub = row[MKT_TABLES.subscribers];
      return {
        subscriberId: sub.id,
        email: sub.email,
        firstName: sub.first_name,
        lastName: sub.last_name,
        customFields: sub.custom_fields,
      };
    });
}

async function resolveSegmentAudience(
  supabase: any,
  siteId: string,
  filterCriteria: Record<string, unknown>,
  _filterLogic: string,
  excludeCriteria?: Record<string, unknown> | null,
): Promise<ResolvedRecipient[]> {
  // Start with all active opt-in subscribers
  let query = supabase
    .from(MKT_TABLES.subscribers)
    .select("id, email, first_name, last_name, custom_fields")
    .eq("site_id", siteId)
    .eq("status", "active")
    .eq("email_opt_in", true);

  // Apply tag filters
  if (filterCriteria.tags && Array.isArray(filterCriteria.tags)) {
    query = query.overlaps("tags", filterCriteria.tags);
  }

  // Apply engagement score filter
  if (filterCriteria.minEngagementScore) {
    query = query.gte("engagement_score", filterCriteria.minEngagementScore);
  }
  if (filterCriteria.maxEngagementScore) {
    query = query.lte("engagement_score", filterCriteria.maxEngagementScore);
  }

  // Apply date filters
  if (filterCriteria.subscribedAfter) {
    query = query.gte("created_at", filterCriteria.subscribedAfter);
  }
  if (filterCriteria.subscribedBefore) {
    query = query.lte("created_at", filterCriteria.subscribedBefore);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Marketing] Failed to resolve segment:", error);
    return [];
  }

  let recipients: ResolvedRecipient[] = (data || []).map((s: any) => ({
    subscriberId: s.id,
    email: s.email,
    firstName: s.first_name,
    lastName: s.last_name,
    customFields: s.custom_fields,
  }));

  // Apply exclusion tags
  if (excludeCriteria?.tags && Array.isArray(excludeCriteria.tags)) {
    const excludeTags = new Set(excludeCriteria.tags as string[]);
    recipients = recipients.filter((r) => {
      const subTags: string[] = (r.customFields as any)?._tags || [];
      return !subTags.some((t) => excludeTags.has(t));
    });
  }

  return recipients;
}

async function resolveCrmSegment(
  supabase: any,
  siteId: string,
  _segmentId: string,
): Promise<ResolvedRecipient[]> {
  // For now, fall back to all subscribers with CRM contact links
  // Full CRM segment resolution would query the segment definition
  // and filter contacts accordingly
  const { data, error } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("id, email, first_name, last_name, custom_fields")
    .eq("site_id", siteId)
    .eq("status", "active")
    .eq("email_opt_in", true)
    .not("crm_contact_id", "is", null);

  if (error) {
    console.error("[Marketing] Failed to resolve CRM segment:", error);
    return [];
  }

  return (data || []).map((s: any) => ({
    subscriberId: s.id,
    email: s.email,
    firstName: s.first_name,
    lastName: s.last_name,
    customFields: s.custom_fields,
  }));
}
