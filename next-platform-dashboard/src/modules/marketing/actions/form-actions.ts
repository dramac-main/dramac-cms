/**
 * Marketing Module - Form Actions
 *
 * Phase MKT-06: Opt-In Forms CRUD + Submissions
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  MarketingForm,
  FormSubmission,
  FormField,
  FormTrigger,
  SuccessAction,
  FormType,
  FormStatus,
} from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ─── Read ──────────────────────────────────────────────────────

export async function getForms(
  siteId: string,
  filters?: {
    formType?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<{ forms: MarketingForm[]; total: number }> {
  const supabase = await getModuleClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from(MKT_TABLES.forms)
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (filters?.formType && filters.formType !== "all") {
    query = query.eq("form_type", filters.formType);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[Marketing] getForms error:", error.message);
    return { forms: [], total: 0 };
  }

  return {
    forms: mapRecords<MarketingForm>(data || []),
    total: count || 0,
  };
}

export async function getForm(formId: string): Promise<MarketingForm | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.forms)
    .select("*")
    .eq("id", formId)
    .single();

  if (error) return null;
  return data ? mapRecord<MarketingForm>(data) : null;
}

export async function getFormPublic(
  formId: string,
): Promise<MarketingForm | null> {
  const supabase = getAdminModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.forms)
    .select("*")
    .eq("id", formId)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data ? mapRecord<MarketingForm>(data) : null;
}

// ─── Create ────────────────────────────────────────────────────

export async function createForm(input: {
  siteId: string;
  name: string;
  formType: FormType;
  fields: FormField[];
  trigger?: FormTrigger;
  successAction?: SuccessAction;
  buttonText?: string;
  buttonColor?: string;
  description?: string;
  listId?: string;
}): Promise<{ form: MarketingForm | null; error: string | null }> {
  const supabase = await getModuleClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(MKT_TABLES.forms)
    .insert({
      site_id: input.siteId,
      name: input.name,
      form_type: input.formType,
      fields: input.fields,
      trigger: input.trigger || null,
      success_action: input.successAction || {
        type: "message",
        message: "Thank you!",
      },
      button_text: input.buttonText || "Submit",
      button_color: input.buttonColor || "#2563eb",
      description: input.description || null,
      list_id: input.listId || null,
      created_by: user?.id || null,
    })
    .select("*")
    .single();

  if (error) return { form: null, error: error.message };
  return { form: data ? mapRecord<MarketingForm>(data) : null, error: null };
}

// ─── Update ────────────────────────────────────────────────────

export async function updateForm(
  formId: string,
  updates: {
    name?: string;
    formType?: FormType;
    fields?: FormField[];
    trigger?: FormTrigger | null;
    successAction?: SuccessAction;
    buttonText?: string;
    buttonColor?: string;
    description?: string;
    listId?: string | null;
    status?: FormStatus;
  },
): Promise<{ form: MarketingForm | null; error: string | null }> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.formType !== undefined) updateData.form_type = updates.formType;
  if (updates.fields !== undefined) updateData.fields = updates.fields;
  if (updates.trigger !== undefined) updateData.trigger = updates.trigger;
  if (updates.successAction !== undefined)
    updateData.success_action = updates.successAction;
  if (updates.buttonText !== undefined)
    updateData.button_text = updates.buttonText;
  if (updates.buttonColor !== undefined)
    updateData.button_color = updates.buttonColor;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.listId !== undefined) updateData.list_id = updates.listId;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from(MKT_TABLES.forms)
    .update(updateData)
    .eq("id", formId)
    .select("*")
    .single();

  if (error) return { form: null, error: error.message };
  return { form: data ? mapRecord<MarketingForm>(data) : null, error: null };
}

// ─── Delete ────────────────────────────────────────────────────

export async function deleteForm(
  formId: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.forms)
    .delete()
    .eq("id", formId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ─── Submissions ───────────────────────────────────────────────

export async function getFormSubmissions(
  formId: string,
  filters?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  },
): Promise<{ submissions: FormSubmission[]; total: number }> {
  const supabase = await getModuleClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from(MKT_TABLES.formSubmissions)
    .select("*", { count: "exact" })
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });

  if (filters?.startDate) {
    query = query.gte("submitted_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("submitted_at", filters.endDate);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    submissions: mapRecords<FormSubmission>(data || []),
    total: count || 0,
  };
}

export async function submitForm(input: {
  formId: string;
  data: Record<string, unknown>;
  visitorId?: string;
  source?: string;
  utmParams?: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const supabase = getAdminModuleClient();

  // Insert submission
  const { error } = await supabase.from(MKT_TABLES.formSubmissions).insert({
    form_id: input.formId,
    data: input.data,
    visitor_id: input.visitorId || null,
    source: input.source || null,
    utm_params: input.utmParams || null,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
  });

  if (error) return { success: false, error: error.message };

  // Increment form submission count
  const { data: formData } = await supabase
    .from(MKT_TABLES.forms)
    .select("total_submissions")
    .eq("id", input.formId)
    .single();

  await supabase
    .from(MKT_TABLES.forms)
    .update({
      total_submissions: (formData?.total_submissions || 0) + 1,
    })
    .eq("id", input.formId);

  return { success: true, error: null };
}

// ─── Embed Code Generation ────────────────────────────────────

export async function getFormEmbedCode(
  formId: string,
  siteUrl: string,
): Promise<string> {
  return `<!-- DRAMAC CMS Form Embed -->
<div id="dramac-form-${formId}"></div>
<script>
(function() {
  var f = document.getElementById("dramac-form-${formId}");
  var iframe = document.createElement("iframe");
  iframe.src = "${siteUrl}/api/marketing/forms/embed/${formId}";
  iframe.style.width = "100%";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("title", "Subscription Form");
  window.addEventListener("message", function(e) {
    if (e.data && e.data.formId === "${formId}" && e.data.height) {
      iframe.style.height = e.data.height + "px";
    }
  });
  f.appendChild(iframe);
})();
</script>`;
}

// ─── Stats ─────────────────────────────────────────────────────

export async function getFormStats(siteId: string): Promise<{
  totalForms: number;
  activeForms: number;
  totalSubmissions: number;
  submissionsToday: number;
}> {
  const supabase = await getModuleClient();

  const { data: forms } = await supabase
    .from(MKT_TABLES.forms)
    .select("status, total_submissions")
    .eq("site_id", siteId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: submissionsToday } = await supabase
    .from(MKT_TABLES.formSubmissions)
    .select("id", { count: "exact", head: true })
    .gte("submitted_at", today.toISOString())
    .in(
      "form_id",
      (forms || []).map(() => "id"), // subquery not supported, fallback below
    );

  return {
    totalForms: forms?.length || 0,
    activeForms: forms?.filter((f: any) => f.status === "active").length || 0,
    totalSubmissions:
      forms?.reduce(
        (sum: number, f: any) => sum + (f.total_submissions || 0),
        0,
      ) || 0,
    submissionsToday: submissionsToday || 0,
  };
}
