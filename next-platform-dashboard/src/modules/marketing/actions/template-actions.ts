/**
 * Marketing Module - Template Server Actions
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Server-side actions for email template CRUD operations.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../lib/marketing-constants";
import type { EmailTemplate, TemplateCategory } from "../types/campaign-types";

// ============================================================================
// HELPERS
// ============================================================================

const TABLE = MKT_TABLES.emailTemplates;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ============================================================================
// TEMPLATE CRUD
// ============================================================================

export async function getTemplates(
  siteId: string,
  filters?: {
    category?: TemplateCategory;
    search?: string;
    isSystem?: boolean;
    isActive?: boolean;
  },
): Promise<EmailTemplate[]> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(TABLE)
    .select("*")
    .or(`site_id.eq.${siteId},site_id.is.null`);

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.isSystem !== undefined) {
    query = query.eq("is_system", filters.isSystem);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }

  query = query
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []) as EmailTemplate[];
}

export async function getTemplate(
  siteId: string,
  templateId: string,
): Promise<EmailTemplate | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(`site_id.eq.${siteId},site_id.is.null`)
    .eq("id", templateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as EmailTemplate;
}

export async function createTemplate(
  siteId: string,
  input: {
    name: string;
    description?: string;
    category?: TemplateCategory;
    contentJson: Record<string, unknown>;
    contentHtml?: string;
    contentText?: string;
    subjectLine?: string;
    previewText?: string;
    mergeVariables?: string[];
    thumbnailUrl?: string;
  },
): Promise<EmailTemplate> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      site_id: siteId,
      name: input.name,
      description: input.description || null,
      category: input.category || "custom",
      content_json: input.contentJson,
      content_html: input.contentHtml || null,
      content_text: input.contentText || null,
      subject_line: input.subjectLine || null,
      preview_text: input.previewText || null,
      merge_variables: input.mergeVariables || [],
      thumbnail_url: input.thumbnailUrl || null,
      is_system: false,
      is_active: true,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EmailTemplate;
}

export async function updateTemplate(
  siteId: string,
  templateId: string,
  input: {
    name?: string;
    description?: string;
    category?: TemplateCategory;
    contentJson?: Record<string, unknown>;
    contentHtml?: string;
    contentText?: string;
    subjectLine?: string;
    previewText?: string;
    mergeVariables?: string[];
    thumbnailUrl?: string;
    isActive?: boolean;
  },
): Promise<EmailTemplate> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.contentJson !== undefined)
    updateData.content_json = input.contentJson;
  if (input.contentHtml !== undefined)
    updateData.content_html = input.contentHtml;
  if (input.contentText !== undefined)
    updateData.content_text = input.contentText;
  if (input.subjectLine !== undefined)
    updateData.subject_line = input.subjectLine;
  if (input.previewText !== undefined)
    updateData.preview_text = input.previewText;
  if (input.mergeVariables !== undefined)
    updateData.merge_variables = input.mergeVariables;
  if (input.thumbnailUrl !== undefined)
    updateData.thumbnail_url = input.thumbnailUrl;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("site_id", siteId)
    .eq("id", templateId)
    .eq("is_system", false)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EmailTemplate;
}

export async function deleteTemplate(
  siteId: string,
  templateId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("site_id", siteId)
    .eq("id", templateId)
    .eq("is_system", false);

  if (error) throw new Error(error.message);
}

export async function duplicateTemplate(
  siteId: string,
  templateId: string,
): Promise<EmailTemplate> {
  const supabase = await getModuleClient();

  const { data: original } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", templateId)
    .or(`site_id.eq.${siteId},site_id.is.null`)
    .single();

  if (!original) throw new Error("Template not found");

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      site_id: siteId,
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      content_json: original.content_json,
      content_html: original.content_html,
      content_text: original.content_text,
      subject_line: original.subject_line,
      preview_text: original.preview_text,
      merge_variables: original.merge_variables || [],
      is_system: false,
      is_active: true,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EmailTemplate;
}
