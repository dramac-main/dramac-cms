"use server";

/**
 * Invoicing Module - Tax Actions
 *
 * Phase INV-08: Tax Management, Multi-Currency & Compliance
 *
 * Server actions for tax rate management and compliance reporting.
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import type { TaxRate, CreateTaxRateInput } from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Tax Rate Management ───────────────────────────────────────

/**
 * Get all tax rates for a site.
 */
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

/**
 * Create a new tax rate.
 */
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

/**
 * Update an existing tax rate.
 * Does NOT affect existing invoices — they snapshot the rate at creation.
 */
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

/**
 * Soft delete a tax rate (set inactive).
 * Cannot delete if referenced by active invoices.
 */
export async function deleteTaxRate(
  siteId: string,
  taxRateId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(INV_TABLES.taxRates)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", taxRateId)
    .eq("site_id", siteId);

  if (error) throw new Error(error.message);
}

/**
 * Set a tax rate as the site's default.
 */
export async function setDefaultTaxRate(
  siteId: string,
  taxRateId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Unset all current defaults
  await supabase
    .from(INV_TABLES.taxRates)
    .update({ is_default: false })
    .eq("site_id", siteId)
    .eq("is_default", true);

  // Set the new default
  const { error } = await supabase
    .from(INV_TABLES.taxRates)
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", taxRateId)
    .eq("site_id", siteId);

  if (error) throw new Error(error.message);
}

// ─── Tax Compliance Reporting ──────────────────────────────────

export interface TaxComplianceReport {
  period: { start: string; end: string };
  taxCollected: number;
  taxByRate: {
    taxRateId: string;
    taxRateName: string;
    rate: number;
    type: "inclusive" | "exclusive";
    totalTaxCollected: number;
    invoiceCount: number;
  }[];
  totalInvoiced: number;
  paidInvoiceTax: number;
  unpaidInvoiceTax: number;
}

/**
 * Generate a tax compliance report for a period.
 * Shows tax collected by rate, split by paid/unpaid.
 */
export async function getTaxComplianceReport(
  siteId: string,
  startDate: string,
  endDate: string,
): Promise<TaxComplianceReport> {
  const supabase = await getModuleClient();

  // Get all tax rates for reference
  const { data: taxRates } = await supabase
    .from(INV_TABLES.taxRates)
    .select("*")
    .eq("site_id", siteId);

  // Get invoices in date range (not void/cancelled)
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, status, tax_total, total, issue_date")
    .eq("site_id", siteId)
    .gte("issue_date", startDate)
    .lte("issue_date", endDate)
    .not("status", "in", '("void","cancelled","draft")');

  // Get line items for those invoices to capture tax_rate_id breakdown
  const invoiceIds = (invoices || []).map((inv: any) => inv.id);

  let lineItems: any[] = [];
  if (invoiceIds.length > 0) {
    const { data: lis } = await supabase
      .from(INV_TABLES.invoiceLineItems)
      .select("invoice_id, tax_rate_id, tax_rate, tax_amount")
      .in("invoice_id", invoiceIds);
    lineItems = lis || [];
  }

  // Build tax-by-rate aggregation
  const taxRateMap = new Map<
    string,
    {
      taxRateId: string;
      taxRateName: string;
      rate: number;
      type: "inclusive" | "exclusive";
      totalTaxCollected: number;
      invoiceCount: number;
      invoiceIds: Set<string>;
    }
  >();

  for (const li of lineItems) {
    const rateId = li.tax_rate_id || "no-tax";
    const rateNum = li.tax_rate || 0;
    if (rateNum === 0 && !li.tax_rate_id) continue;

    if (!taxRateMap.has(rateId)) {
      const matchedRate = (taxRates || []).find((tr: any) => tr.id === rateId);
      taxRateMap.set(rateId, {
        taxRateId: rateId,
        taxRateName: matchedRate?.name || `Tax ${rateNum}%`,
        rate: matchedRate?.rate || rateNum,
        type: matchedRate?.type || "exclusive",
        totalTaxCollected: 0,
        invoiceCount: 0,
        invoiceIds: new Set(),
      });
    }

    const entry = taxRateMap.get(rateId)!;
    entry.totalTaxCollected += li.tax_amount || 0;
    entry.invoiceIds.add(li.invoice_id);
  }

  // Calculate paid vs unpaid tax
  const paidStatuses = new Set(["paid", "partial"]);
  let paidInvoiceTax = 0;
  let unpaidInvoiceTax = 0;
  let totalInvoiced = 0;
  let totalTaxCollected = 0;

  for (const inv of invoices || []) {
    totalInvoiced += inv.total || 0;
    const taxAmt = inv.tax_total || 0;
    totalTaxCollected += taxAmt;
    if (paidStatuses.has(inv.status)) {
      paidInvoiceTax += taxAmt;
    } else {
      unpaidInvoiceTax += taxAmt;
    }
  }

  return {
    period: { start: startDate, end: endDate },
    taxCollected: totalTaxCollected,
    taxByRate: Array.from(taxRateMap.values()).map(
      ({ invoiceIds, ...rest }) => ({
        ...rest,
        invoiceCount: invoiceIds.size,
      }),
    ),
    totalInvoiced,
    paidInvoiceTax,
    unpaidInvoiceTax,
  };
}
