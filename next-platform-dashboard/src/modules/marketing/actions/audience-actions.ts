/**
 * Marketing Module - Audience Server Actions
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Server-side actions for audience and mailing list CRUD.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  Audience,
  AudienceType,
  AudienceFilterLogic,
  MailingList,
  ListType,
} from "../types/campaign-types";

// ============================================================================
// HELPERS
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ============================================================================
// AUDIENCES
// ============================================================================

export async function getAudiences(siteId: string): Promise<Audience[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.audiences)
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Audience[];
}

export async function getAudience(
  siteId: string,
  audienceId: string,
): Promise<Audience | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.audiences)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", audienceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as Audience;
}

export async function createAudience(
  siteId: string,
  input: {
    name: string;
    description?: string;
    type: AudienceType;
    crmSegmentId?: string;
    filterCriteria?: Record<string, unknown>;
    filterLogic?: AudienceFilterLogic;
    excludeCriteria?: Record<string, unknown>;
  },
): Promise<Audience> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.audiences)
    .insert({
      site_id: siteId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      crm_segment_id: input.crmSegmentId || null,
      filter_criteria: input.filterCriteria || null,
      filter_logic: input.filterLogic || "and",
      exclude_criteria: input.excludeCriteria || null,
      contact_count: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Audience;
}

export async function updateAudience(
  siteId: string,
  audienceId: string,
  input: {
    name?: string;
    description?: string;
    type?: AudienceType;
    crmSegmentId?: string;
    filterCriteria?: Record<string, unknown>;
    filterLogic?: AudienceFilterLogic;
    excludeCriteria?: Record<string, unknown>;
    isActive?: boolean;
  },
): Promise<Audience> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.crmSegmentId !== undefined)
    updateData.crm_segment_id = input.crmSegmentId;
  if (input.filterCriteria !== undefined)
    updateData.filter_criteria = input.filterCriteria;
  if (input.filterLogic !== undefined)
    updateData.filter_logic = input.filterLogic;
  if (input.excludeCriteria !== undefined)
    updateData.exclude_criteria = input.excludeCriteria;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from(MKT_TABLES.audiences)
    .update(updateData)
    .eq("site_id", siteId)
    .eq("id", audienceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Audience;
}

export async function deleteAudience(
  siteId: string,
  audienceId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.audiences)
    .delete()
    .eq("site_id", siteId)
    .eq("id", audienceId);

  if (error) throw new Error(error.message);
}

// ============================================================================
// MAILING LISTS
// ============================================================================

export async function getMailingLists(siteId: string): Promise<MailingList[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.mailingLists)
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Marketing] getMailingLists error:", error.message);
    return [] as MailingList[];
  }
  return (data || []) as MailingList[];
}

export async function getMailingList(
  siteId: string,
  listId: string,
): Promise<MailingList | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.mailingLists)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", listId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as MailingList;
}

export async function createMailingList(
  siteId: string,
  input: {
    name: string;
    description?: string;
    type?: ListType;
    isDoubleOptIn?: boolean;
    welcomeEmailTemplateId?: string;
    tags?: string[];
  },
): Promise<MailingList> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.mailingLists)
    .insert({
      site_id: siteId,
      name: input.name,
      description: input.description || null,
      type: input.type || "manual",
      subscriber_count: 0,
      is_double_opt_in: input.isDoubleOptIn || false,
      welcome_email_template_id: input.welcomeEmailTemplateId || null,
      tags: input.tags || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MailingList;
}

export async function updateMailingList(
  siteId: string,
  listId: string,
  input: {
    name?: string;
    description?: string;
    type?: ListType;
    isDoubleOptIn?: boolean;
    welcomeEmailTemplateId?: string;
    tags?: string[];
    isActive?: boolean;
  },
): Promise<MailingList> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.isDoubleOptIn !== undefined)
    updateData.is_double_opt_in = input.isDoubleOptIn;
  if (input.welcomeEmailTemplateId !== undefined)
    updateData.welcome_email_template_id = input.welcomeEmailTemplateId;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from(MKT_TABLES.mailingLists)
    .update(updateData)
    .eq("site_id", siteId)
    .eq("id", listId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MailingList;
}

export async function deleteMailingList(
  siteId: string,
  listId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.mailingLists)
    .delete()
    .eq("site_id", siteId)
    .eq("id", listId);

  if (error) throw new Error(error.message);
}

// ============================================================================
// LIST SUBSCRIBERS (join table management)
// ============================================================================

export async function addSubscriberToList(
  listId: string,
  subscriberId: string,
  source?: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase.from(MKT_TABLES.listSubscribers).upsert(
    {
      list_id: listId,
      subscriber_id: subscriberId,
      source: source || "manual",
    },
    { onConflict: "list_id,subscriber_id" },
  );

  if (error) throw new Error(error.message);
}

export async function removeSubscriberFromList(
  listId: string,
  subscriberId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.listSubscribers)
    .delete()
    .eq("list_id", listId)
    .eq("subscriber_id", subscriberId);

  if (error) throw new Error(error.message);
}

export async function getListSubscriberIds(listId: string): Promise<string[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.listSubscribers)
    .select("subscriber_id")
    .eq("list_id", listId);

  if (error) throw new Error(error.message);
  return (data || []).map((r: { subscriber_id: string }) => r.subscriber_id);
}
