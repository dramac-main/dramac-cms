/**
 * Marketing Module - Subscriber Server Actions
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Server-side actions for subscriber CRUD, import, and tag management.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../lib/marketing-constants";
import type { Subscriber, SubscriberStatus } from "../types/campaign-types";

// ============================================================================
// HELPERS
// ============================================================================

const TABLE = MKT_TABLES.subscribers;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ============================================================================
// SUBSCRIBER CRUD
// ============================================================================

export async function getSubscribers(
  siteId: string,
  filters?: {
    status?: SubscriberStatus;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  },
): Promise<{ subscribers: Subscriber[]; total: number }> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`,
    );
  }
  if (filters?.tags?.length) {
    query = query.overlaps("tags", filters.tags);
  }

  query = query.order("created_at", { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 20) - 1,
    );
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return { subscribers: (data || []) as Subscriber[], total: count || 0 };
}

export async function getSubscriber(
  siteId: string,
  subscriberId: string,
): Promise<Subscriber | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", subscriberId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as Subscriber;
}

export async function getSubscriberByEmail(
  siteId: string,
  email: string,
): Promise<Subscriber | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as Subscriber;
}

export async function createSubscriber(
  siteId: string,
  input: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    crmContactId?: string;
    status?: SubscriberStatus;
    emailOptIn?: boolean;
    smsOptIn?: boolean;
    consentSource?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  },
): Promise<Subscriber> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      site_id: siteId,
      email: input.email.toLowerCase().trim(),
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      phone: input.phone || null,
      crm_contact_id: input.crmContactId || null,
      status: input.status || "active",
      email_opt_in: input.emailOptIn ?? true,
      sms_opt_in: input.smsOptIn ?? false,
      consent_source: input.consentSource || "manual",
      consent_date: new Date().toISOString(),
      tags: input.tags || [],
      custom_fields: input.customFields || {},
      engagement_score: 0,
      total_emails_sent: 0,
      total_emails_opened: 0,
      total_emails_clicked: 0,
      bounce_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Subscriber;
}

export async function updateSubscriber(
  siteId: string,
  subscriberId: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: SubscriberStatus;
    emailOptIn?: boolean;
    smsOptIn?: boolean;
    tags?: string[];
    customFields?: Record<string, unknown>;
    unsubscribeReason?: string;
  },
): Promise<Subscriber> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (input.firstName !== undefined) updateData.first_name = input.firstName;
  if (input.lastName !== undefined) updateData.last_name = input.lastName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.emailOptIn !== undefined)
    updateData.email_opt_in = input.emailOptIn;
  if (input.smsOptIn !== undefined) updateData.sms_opt_in = input.smsOptIn;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.customFields !== undefined)
    updateData.custom_fields = input.customFields;
  if (input.unsubscribeReason !== undefined)
    updateData.unsubscribe_reason = input.unsubscribeReason;

  if (input.status === "unsubscribed") {
    updateData.unsubscribed_at = new Date().toISOString();
    updateData.email_opt_in = false;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("site_id", siteId)
    .eq("id", subscriberId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Subscriber;
}

export async function deleteSubscriber(
  siteId: string,
  subscriberId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("site_id", siteId)
    .eq("id", subscriberId);

  if (error) throw new Error(error.message);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkImportSubscribers(
  siteId: string,
  subscribers: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
  }>,
  source: string = "import",
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const supabase = await getModuleClient();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    const records = batch.map((s) => ({
      site_id: siteId,
      email: s.email.toLowerCase().trim(),
      first_name: s.firstName || null,
      last_name: s.lastName || null,
      phone: s.phone || null,
      status: "active",
      email_opt_in: true,
      sms_opt_in: false,
      consent_source: source,
      consent_date: new Date().toISOString(),
      tags: s.tags || [],
      custom_fields: {},
      engagement_score: 0,
      total_emails_sent: 0,
      total_emails_opened: 0,
      total_emails_clicked: 0,
      bounce_count: 0,
    }));

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(records, { onConflict: "site_id,email", ignoreDuplicates: true })
      .select("id");

    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    } else {
      imported += data?.length || 0;
      skipped += batch.length - (data?.length || 0);
    }
  }

  return { imported, skipped, errors };
}

export async function bulkTagSubscribers(
  siteId: string,
  subscriberIds: string[],
  tagsToAdd: string[],
): Promise<number> {
  const supabase = await getModuleClient();
  let updated = 0;

  for (const id of subscriberIds) {
    const { data: sub } = await supabase
      .from(TABLE)
      .select("tags")
      .eq("site_id", siteId)
      .eq("id", id)
      .single();

    if (sub) {
      const existingTags: string[] = sub.tags || [];
      const merged = [...new Set([...existingTags, ...tagsToAdd])];

      const { error } = await supabase
        .from(TABLE)
        .update({ tags: merged })
        .eq("site_id", siteId)
        .eq("id", id);

      if (!error) updated++;
    }
  }

  return updated;
}

// ============================================================================
// SUBSCRIBER COUNT HELPERS
// ============================================================================

export async function getActiveSubscriberCount(
  siteId: string,
): Promise<number> {
  const supabase = await getModuleClient();

  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "active")
    .eq("email_opt_in", true);

  if (error) throw new Error(error.message);
  return count || 0;
}
