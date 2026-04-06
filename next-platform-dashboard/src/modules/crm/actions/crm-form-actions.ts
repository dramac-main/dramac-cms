/**
 * CRM Form Builder — Server Actions
 *
 * CRUD operations for CRM form definitions.
 * Forms are stored in mod_crmmod01_form_definitions and rendered
 * dynamically in the Studio builder + storefront.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CRMFormDefinition,
  CRMFormInput,
  CRMFormUpdate,
} from "../types/crm-types";

const CRM_SHORT_ID = "crmmod01";
const TABLE_PREFIX = `mod_${CRM_SHORT_ID}`;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ============================================================================
// CRUD — Form Definitions
// ============================================================================

export async function getCRMForms(
  siteId: string,
): Promise<CRMFormDefinition[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("*")
    .eq("site_id", siteId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[CRM Forms] getCRMForms error:", error);
    return [];
  }

  return (data || []) as CRMFormDefinition[];
}

export async function getCRMForm(
  siteId: string,
  formId: string,
): Promise<CRMFormDefinition | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", formId)
    .single();

  if (error) return null;
  return data as CRMFormDefinition;
}

export async function getCRMFormBySlug(
  siteId: string,
  slug: string,
): Promise<CRMFormDefinition | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("*")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data as CRMFormDefinition;
}

/**
 * Public version — uses admin client so storefront can fetch form
 * definitions without auth.
 */
export async function getPublicCRMForm(
  siteId: string,
  slug: string,
): Promise<CRMFormDefinition | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient() as any;

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("*")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data as CRMFormDefinition;
}

export async function createCRMForm(
  siteId: string,
  input: Omit<CRMFormInput, "site_id">,
): Promise<{ success: boolean; form?: CRMFormDefinition; error?: string }> {
  const supabase = await getModuleClient();

  // Validate slug uniqueness
  const slug = generateSlug(input.name);
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .single();

  if (existing) {
    return { success: false, error: "A form with this name already exists" };
  }

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .insert({
      site_id: siteId,
      name: input.name,
      slug,
      description: input.description || null,
      fields: input.fields || [],
      status: input.status || "active",
      settings: input.settings || {},
      submission_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[CRM Forms] createCRMForm error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/crm");
  return { success: true, form: data as CRMFormDefinition };
}

export async function updateCRMForm(
  siteId: string,
  formId: string,
  input: CRMFormUpdate,
): Promise<{ success: boolean; form?: CRMFormDefinition; error?: string }> {
  const supabase = await getModuleClient();

  // If name changed, update slug
  const updates: Record<string, unknown> = { ...input };
  if (input.name) {
    updates.slug = generateSlug(input.name);

    // Check slug uniqueness (excluding this form)
    const { data: existing } = await supabase
      .from(`${TABLE_PREFIX}_form_definitions`)
      .select("id")
      .eq("site_id", siteId)
      .eq("slug", updates.slug)
      .neq("id", formId)
      .single();

    if (existing) {
      return { success: false, error: "A form with this name already exists" };
    }
  }

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .update(updates)
    .eq("site_id", siteId)
    .eq("id", formId)
    .select()
    .single();

  if (error) {
    console.error("[CRM Forms] updateCRMForm error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/crm");
  return { success: true, form: data as CRMFormDefinition };
}

export async function deleteCRMForm(
  siteId: string,
  formId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  // Soft delete — mark as archived
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .update({ status: "archived" })
    .eq("site_id", siteId)
    .eq("id", formId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/crm");
  return { success: true };
}

export async function duplicateCRMForm(
  siteId: string,
  formId: string,
): Promise<{ success: boolean; form?: CRMFormDefinition; error?: string }> {
  const supabase = await getModuleClient();

  const { data: original, error: fetchError } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", formId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: "Form not found" };
  }

  const newName = `${original.name} (Copy)`;
  return createCRMForm(siteId, {
    name: newName,
    description: original.description,
    fields: original.fields,
    status: "inactive",
    settings: original.settings,
    slug: generateSlug(newName),
  });
}

// ============================================================================
// Helpers
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

/**
 * Get all active form definitions for studio builder component registry.
 * Returns minimal data needed for component picker.
 */
export async function getCRMFormsForStudio(
  siteId: string,
): Promise<
  Array<{ id: string; name: string; slug: string; fieldCount: number }>
> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_form_definitions`)
    .select("id, name, slug, fields")
    .eq("site_id", siteId)
    .eq("status", "active")
    .order("name");

  if (error) return [];

  return (data || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    fieldCount: Array.isArray(f.fields) ? f.fields.length : 0,
  }));
}
