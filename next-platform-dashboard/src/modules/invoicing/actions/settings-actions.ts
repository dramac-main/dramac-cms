"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import type { InvoicingSettings, TaxRate, CreateTaxRateInput } from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Settings ──────────────────────────────────────────────────

export async function getInvoicingSettings(
  siteId: string,
): Promise<InvoicingSettings | null> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from(INV_TABLES.settings)
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as InvoicingSettings;
}

export async function updateInvoicingSettings(
  siteId: string,
  input: Partial<InvoicingSettings>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  // Remove fields that shouldn't be client-updatable
  const {
    id: _id,
    siteId: _siteId,
    createdAt: _ca,
    updatedAt: _ua,
    invoiceNextNumber: _inn,
    creditNoteNextNumber: _cnn,
    billNextNumber: _bnn,
    poNextNumber: _pnn,
    ...fields
  } = input;

  // Convert camelCase to snake_case for DB
  const dbFields: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {
    invoicePrefix: "invoice_prefix",
    invoiceNumberFormat: "invoice_number_format",
    invoicePadding: "invoice_padding",
    creditNotePrefix: "credit_note_prefix",
    billPrefix: "bill_prefix",
    poPrefix: "po_prefix",
    defaultCurrency: "default_currency",
    defaultPaymentTermsDays: "default_payment_terms_days",
    defaultPaymentTermsLabel: "default_payment_terms_label",
    defaultTaxRateId: "default_tax_rate_id",
    defaultNotes: "default_notes",
    defaultTerms: "default_terms",
    lateFeeEnabled: "late_fee_enabled",
    lateFeeType: "late_fee_type",
    lateFeeAmount: "late_fee_amount",
    lateFeeGraceDays: "late_fee_grace_days",
    overdueReminderEnabled: "overdue_reminder_enabled",
    overdueReminderSchedule: "overdue_reminder_schedule",
    brandLogoUrl: "brand_logo_url",
    brandColor: "brand_color",
    companyName: "company_name",
    companyAddress: "company_address",
    companyPhone: "company_phone",
    companyEmail: "company_email",
    companyWebsite: "company_website",
    companyTaxId: "company_tax_id",
    onlinePaymentEnabled: "online_payment_enabled",
    paymentInstructions: "payment_instructions",
    timezone: "timezone",
    metadata: "metadata",
  };

  for (const [key, value] of Object.entries(fields)) {
    const dbKey = fieldMap[key];
    if (dbKey && value !== undefined) {
      dbFields[dbKey] = value;
    }
  }

  dbFields.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from(INV_TABLES.settings)
    .update(dbFields)
    .eq("site_id", siteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Tax Rates ─────────────────────────────────────────────────

export async function getTaxRates(siteId: string): Promise<TaxRate[]> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from(INV_TABLES.taxRates)
    .select("*")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as TaxRate[];
}

export async function createTaxRate(
  siteId: string,
  input: CreateTaxRateInput,
): Promise<TaxRate> {
  const supabase = await getModuleClient();

  // If setting as default, unset existing defaults first
  if (input.isDefault) {
    await supabase
      .from(INV_TABLES.taxRates)
      .update({ is_default: false })
      .eq("site_id", siteId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from(INV_TABLES.taxRates)
    .insert({
      site_id: siteId,
      name: input.name,
      rate: input.rate,
      type: input.type || "exclusive",
      is_compound: input.isCompound || false,
      is_default: input.isDefault || false,
      description: input.description || null,
      sort_order: input.sortOrder || 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TaxRate;
}

export async function updateTaxRate(
  siteId: string,
  taxRateId: string,
  input: Partial<CreateTaxRateInput>,
): Promise<TaxRate> {
  const supabase = await getModuleClient();

  if (input.isDefault) {
    await supabase
      .from(INV_TABLES.taxRates)
      .update({ is_default: false })
      .eq("site_id", siteId)
      .eq("is_default", true);
  }

  const dbFields: Record<string, unknown> = {};
  if (input.name !== undefined) dbFields.name = input.name;
  if (input.rate !== undefined) dbFields.rate = input.rate;
  if (input.type !== undefined) dbFields.type = input.type;
  if (input.isCompound !== undefined) dbFields.is_compound = input.isCompound;
  if (input.isDefault !== undefined) dbFields.is_default = input.isDefault;
  if (input.description !== undefined) dbFields.description = input.description;
  if (input.sortOrder !== undefined) dbFields.sort_order = input.sortOrder;
  dbFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(INV_TABLES.taxRates)
    .update(dbFields)
    .eq("id", taxRateId)
    .eq("site_id", siteId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TaxRate;
}

export async function deleteTaxRate(
  siteId: string,
  taxRateId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Soft delete by deactivating
  const { error } = await supabase
    .from(INV_TABLES.taxRates)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", taxRateId)
    .eq("site_id", siteId);

  if (error) throw new Error(error.message);
}
