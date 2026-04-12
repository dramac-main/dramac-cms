/**
 * Marketing Module - Campaign Server Actions
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Server-side actions for campaign CRUD, sending, scheduling,
 * pausing, resuming, duplicating, and test emails.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import {
  MKT_TABLES,
  VALID_CAMPAIGN_TRANSITIONS,
} from "../lib/marketing-constants";
import type {
  Campaign,
  CampaignStatus,
  CampaignType,
} from "../types/campaign-types";

// ============================================================================
// HELPERS
// ============================================================================

const TABLE = MKT_TABLES.campaigns;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ============================================================================
// CAMPAIGN CRUD
// ============================================================================

export async function getCampaigns(
  siteId: string,
  filters?: {
    status?: CampaignStatus;
    type?: CampaignType;
    search?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ campaigns: Campaign[]; total: number }> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,subject_line.ilike.%${filters.search}%`,
    );
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

  if (error) {
    console.error("[Marketing] getCampaigns error:", error.message);
    return { campaigns: [], total: 0 };
  }

  return { campaigns: (data || []) as Campaign[], total: count || 0 };
}

export async function getCampaign(
  siteId: string,
  campaignId: string,
): Promise<Campaign | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Campaign;
}

export async function createCampaign(
  siteId: string,
  input: {
    name: string;
    type?: CampaignType;
    description?: string;
    subjectLine?: string;
    previewText?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    templateId?: string;
    audienceId?: string;
    tags?: string[];
  },
): Promise<Campaign> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      site_id: siteId,
      name: input.name,
      type: input.type || "email",
      description: input.description || null,
      subject_line: input.subjectLine || null,
      preview_text: input.previewText || null,
      from_name: input.fromName || null,
      from_email: input.fromEmail || null,
      reply_to: input.replyTo || null,
      template_id: input.templateId || null,
      audience_id: input.audienceId || null,
      status: "draft",
      ab_test_enabled: false,
      total_recipients: 0,
      total_sent: 0,
      total_delivered: 0,
      total_opened: 0,
      total_clicked: 0,
      total_bounced: 0,
      total_unsubscribed: 0,
      total_complained: 0,
      revenue_attributed: 0,
      tags: input.tags || [],
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const campaign = data as Campaign;

  try {
    await logAutomationEvent(
      siteId,
      "marketing.campaign.created",
      {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
      },
      {
        sourceModule: "marketing",
        sourceEntityType: "campaign",
        sourceEntityId: campaign.id,
      },
    );
  } catch (e) {
    console.error("[Marketing] Failed to emit campaign.created event:", e);
  }

  return campaign;
}

export async function updateCampaign(
  siteId: string,
  campaignId: string,
  input: {
    name?: string;
    description?: string;
    subjectLine?: string;
    previewText?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    templateId?: string;
    contentHtml?: string;
    contentText?: string;
    contentJson?: Record<string, unknown>;
    audienceId?: string;
    segmentId?: string;
    abTestEnabled?: boolean;
    abTestConfig?: Record<string, unknown>;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
): Promise<Campaign> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.subjectLine !== undefined)
    updateData.subject_line = input.subjectLine;
  if (input.previewText !== undefined)
    updateData.preview_text = input.previewText;
  if (input.fromName !== undefined) updateData.from_name = input.fromName;
  if (input.fromEmail !== undefined) updateData.from_email = input.fromEmail;
  if (input.replyTo !== undefined) updateData.reply_to = input.replyTo;
  if (input.templateId !== undefined) updateData.template_id = input.templateId;
  if (input.contentHtml !== undefined)
    updateData.content_html = input.contentHtml;
  if (input.contentText !== undefined)
    updateData.content_text = input.contentText;
  if (input.contentJson !== undefined)
    updateData.content_json = input.contentJson;
  if (input.audienceId !== undefined) updateData.audience_id = input.audienceId;
  if (input.segmentId !== undefined) updateData.segment_id = input.segmentId;
  if (input.abTestEnabled !== undefined)
    updateData.ab_test_enabled = input.abTestEnabled;
  if (input.abTestConfig !== undefined)
    updateData.ab_test_config = input.abTestConfig;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Campaign;
}

export async function deleteCampaign(
  siteId: string,
  campaignId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Only allow deleting draft/cancelled campaigns
  const { data: campaign } = await supabase
    .from(TABLE)
    .select("status")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (campaign && !["draft", "cancelled"].includes(campaign.status)) {
    throw new Error("Only draft or cancelled campaigns can be deleted");
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("site_id", siteId)
    .eq("id", campaignId);

  if (error) throw new Error(error.message);
}

// ============================================================================
// CAMPAIGN STATUS TRANSITIONS
// ============================================================================

export async function updateCampaignStatus(
  siteId: string,
  campaignId: string,
  newStatus: CampaignStatus,
): Promise<Campaign> {
  const supabase = await getModuleClient();

  const { data: campaign } = await supabase
    .from(TABLE)
    .select("status")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  const currentStatus = campaign.status as CampaignStatus;
  const validTransitions = VALID_CAMPAIGN_TRANSITIONS[currentStatus];

  if (!validTransitions?.includes(newStatus)) {
    throw new Error(
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
    );
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "sending") {
    updateData.started_at = new Date().toISOString();
  }
  if (newStatus === "sent") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Campaign;
}

export async function scheduleCampaign(
  siteId: string,
  campaignId: string,
  scheduledAt: string,
): Promise<Campaign> {
  const supabase = await getModuleClient();

  // Validate scheduled time is in the future
  if (new Date(scheduledAt) <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  const { data: campaign } = await supabase
    .from(TABLE)
    .select("status")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "draft") {
    throw new Error("Only draft campaigns can be scheduled");
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt,
    })
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Campaign;
}

export async function duplicateCampaign(
  siteId: string,
  campaignId: string,
): Promise<Campaign> {
  const supabase = await getModuleClient();

  const { data: original } = await supabase
    .from(TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (!original) throw new Error("Campaign not found");

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      site_id: siteId,
      name: `${original.name} (Copy)`,
      type: original.type,
      description: original.description,
      subject_line: original.subject_line,
      preview_text: original.preview_text,
      from_name: original.from_name,
      from_email: original.from_email,
      reply_to: original.reply_to,
      template_id: original.template_id,
      content_html: original.content_html,
      content_text: original.content_text,
      content_json: original.content_json,
      audience_id: original.audience_id,
      segment_id: original.segment_id,
      ab_test_enabled: original.ab_test_enabled,
      ab_test_config: original.ab_test_config,
      status: "draft",
      total_recipients: 0,
      total_sent: 0,
      total_delivered: 0,
      total_opened: 0,
      total_clicked: 0,
      total_bounced: 0,
      total_unsubscribed: 0,
      total_complained: 0,
      revenue_attributed: 0,
      tags: original.tags || [],
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Campaign;
}

// ============================================================================
// CAMPAIGN SENDING
// ============================================================================

export async function sendTestEmail(
  siteId: string,
  campaignId: string,
  testEmail: string,
): Promise<{ success: boolean; error?: string }> {
  // Dynamically import to avoid circular dependency
  const { sendCampaignTestEmail } =
    await import("../services/email-campaign-service");
  return sendCampaignTestEmail(siteId, campaignId, testEmail);
}

export async function sendCampaignNow(
  siteId: string,
  campaignId: string,
): Promise<{ success: boolean; error?: string }> {
  const { sendCampaign } = await import("../services/email-campaign-service");
  return sendCampaign(siteId, campaignId);
}

export async function pauseCampaign(
  siteId: string,
  campaignId: string,
): Promise<Campaign> {
  return updateCampaignStatus(siteId, campaignId, "paused");
}

export async function resumeCampaign(
  siteId: string,
  campaignId: string,
): Promise<Campaign> {
  return updateCampaignStatus(siteId, campaignId, "sending");
}

// ============================================================================
// CAMPAIGN STATS (read from campaign_sends aggregate)
// ============================================================================

export async function getCampaignStats(
  siteId: string,
  campaignId: string,
): Promise<{
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  failed: number;
}> {
  const supabase = await getModuleClient();

  const { data: campaign } = await supabase
    .from(TABLE)
    .select(
      "total_recipients, total_sent, total_delivered, total_opened, total_clicked, total_bounced, total_unsubscribed, total_complained",
    )
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  return {
    totalRecipients: campaign.total_recipients || 0,
    sent: campaign.total_sent || 0,
    delivered: campaign.total_delivered || 0,
    opened: campaign.total_opened || 0,
    clicked: campaign.total_clicked || 0,
    bounced: campaign.total_bounced || 0,
    unsubscribed: campaign.total_unsubscribed || 0,
    complained: campaign.total_complained || 0,
    failed: 0,
  };
}
