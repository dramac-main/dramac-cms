"use server";

/**
 * Invoicing Module - Vendor Actions
 *
 * Phase INV-14: Vendor Management, Purchase Orders & Bills
 *
 * 6 server actions for vendor CRUD, stats, and soft-delete.
 * ALL amounts in CENTS (integers).
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import type {
  Vendor,
  Bill,
  PurchaseOrder,
  CreateVendorInput,
  VendorStats,
} from "../types";
import type { Expense } from "../types/expense-types";

// ─── Helpers ───────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

async function logActivity(
  supabase: any,
  siteId: string,
  entityId: string,
  action: string,
  description: string,
) {
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "vendor",
    entity_id: entityId,
    action,
    description,
    actor_type: "user",
  });
}

// ─── Filter / Pagination Types ─────────────────────────────────

export interface VendorFilters {
  search?: string;
  isActive?: boolean;
}

export interface VendorPagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── getVendors ────────────────────────────────────────────────

export async function getVendors(
  siteId: string,
  filters?: VendorFilters,
  pagination?: VendorPagination,
): Promise<{ vendors: Vendor[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(INV_TABLES.vendors)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
    );
  }

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const sortBy = pagination?.sortBy || "created_at";
  const sortOrder = pagination?.sortOrder === "asc";
  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch vendors: ${error.message}`);
  }

  return {
    vendors: mapRecords<Vendor>(data || []),
    total: count || 0,
  };
}

// ─── getVendor ─────────────────────────────────────────────────

export async function getVendor(
  vendorId: string,
): Promise<
  Vendor & { bills: Bill[]; purchaseOrders: PurchaseOrder[]; expenses: Expense[] }
> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(INV_TABLES.vendors)
    .select("*")
    .eq("id", vendorId)
    .single();

  if (error || !data) {
    throw new Error(`Vendor not found: ${error?.message || "No data"}`);
  }

  const vendor = mapRecord<Vendor>(data);

  // Fetch related bills
  const { data: billsData } = await supabase
    .from(INV_TABLES.bills)
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch related POs
  const { data: posData } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch related expenses
  const { data: expensesData } = await supabase
    .from(INV_TABLES.expenses)
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    ...vendor,
    bills: mapRecords<Bill>(billsData || []),
    purchaseOrders: mapRecords<PurchaseOrder>(posData || []),
    expenses: mapRecords<Expense>(expensesData || []),
  };
}

// ─── createVendor ──────────────────────────────────────────────

export async function createVendor(
  siteId: string,
  input: CreateVendorInput,
): Promise<Vendor> {
  const supabase = await getModuleClient();

  if (!input.name?.trim()) {
    throw new Error("Vendor name is required");
  }

  const { data, error } = await supabase
    .from(INV_TABLES.vendors)
    .insert({
      site_id: siteId,
      name: input.name.trim(),
      email: input.email || null,
      phone: input.phone || null,
      website: input.website || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      country: input.country || "ZM",
      postal_code: input.postalCode || null,
      tax_id: input.taxId || null,
      currency: input.currency || "ZMW",
      payment_terms_days: input.paymentTermsDays ?? 30,
      bank_name: input.bankName || null,
      bank_account_number: input.bankAccountNumber || null,
      bank_branch_code: input.bankBranchCode || null,
      mobile_money_number: input.mobileMoneyNumber || null,
      notes: input.notes || null,
      is_active: true,
      total_billed: 0,
      total_paid: 0,
      tags: input.tags || [],
      metadata: {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create vendor: ${error?.message || "No data"}`);
  }

  const vendor = mapRecord<Vendor>(data);

  await logActivity(
    supabase,
    siteId,
    vendor.id,
    "vendor_created",
    `Vendor "${vendor.name}" created`,
  );

  return vendor;
}

// ─── updateVendor ──────────────────────────────────────────────

export async function updateVendor(
  vendorId: string,
  input: Partial<CreateVendorInput>,
): Promise<Vendor> {
  const supabase = await getModuleClient();

  // Get existing to find siteId
  const { data: existing } = await supabase
    .from(INV_TABLES.vendors)
    .select("site_id")
    .eq("id", vendorId)
    .single();

  if (!existing) {
    throw new Error("Vendor not found");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.email !== undefined) updates.email = input.email || null;
  if (input.phone !== undefined) updates.phone = input.phone || null;
  if (input.website !== undefined) updates.website = input.website || null;
  if (input.address !== undefined) updates.address = input.address || null;
  if (input.city !== undefined) updates.city = input.city || null;
  if (input.state !== undefined) updates.state = input.state || null;
  if (input.country !== undefined) updates.country = input.country;
  if (input.postalCode !== undefined) updates.postal_code = input.postalCode || null;
  if (input.taxId !== undefined) updates.tax_id = input.taxId || null;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.paymentTermsDays !== undefined)
    updates.payment_terms_days = input.paymentTermsDays;
  if (input.bankName !== undefined) updates.bank_name = input.bankName || null;
  if (input.bankAccountNumber !== undefined)
    updates.bank_account_number = input.bankAccountNumber || null;
  if (input.bankBranchCode !== undefined)
    updates.bank_branch_code = input.bankBranchCode || null;
  if (input.mobileMoneyNumber !== undefined)
    updates.mobile_money_number = input.mobileMoneyNumber || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (input.tags !== undefined) updates.tags = input.tags;

  const { data, error } = await supabase
    .from(INV_TABLES.vendors)
    .update(updates)
    .eq("id", vendorId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update vendor: ${error?.message || "No data"}`);
  }

  const vendor = mapRecord<Vendor>(data);

  await logActivity(
    supabase,
    existing.site_id,
    vendorId,
    "vendor_updated",
    `Vendor "${vendor.name}" updated`,
  );

  return vendor;
}

// ─── deleteVendor (soft delete) ────────────────────────────────

export async function deleteVendor(vendorId: string): Promise<void> {
  const supabase = await getModuleClient();

  // Check for unpaid bills
  const { data: unpaidBills } = await supabase
    .from(INV_TABLES.bills)
    .select("id")
    .eq("vendor_id", vendorId)
    .in("status", ["draft", "received", "partial", "overdue"]);

  if (unpaidBills && unpaidBills.length > 0) {
    throw new Error(
      `Cannot deactivate vendor with ${unpaidBills.length} unpaid bill(s). Resolve outstanding bills first.`,
    );
  }

  const { data: existing } = await supabase
    .from(INV_TABLES.vendors)
    .select("site_id, name")
    .eq("id", vendorId)
    .single();

  if (!existing) {
    throw new Error("Vendor not found");
  }

  const { error } = await supabase
    .from(INV_TABLES.vendors)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", vendorId);

  if (error) {
    throw new Error(`Failed to deactivate vendor: ${error.message}`);
  }

  await logActivity(
    supabase,
    existing.site_id,
    vendorId,
    "vendor_deactivated",
    `Vendor "${existing.name}" deactivated`,
  );
}

// ─── getVendorStats ────────────────────────────────────────────

export async function getVendorStats(vendorId: string): Promise<VendorStats> {
  const supabase = await getModuleClient();

  // Bills summary
  const { data: bills } = await supabase
    .from(INV_TABLES.bills)
    .select("total, amount_paid, amount_due, status, paid_date, issue_date")
    .eq("vendor_id", vendorId)
    .neq("status", "void");

  const billList = bills || [];
  const totalBilled = billList.reduce(
    (sum: number, b: any) => sum + (b.total || 0),
    0,
  );
  const totalPaid = billList.reduce(
    (sum: number, b: any) => sum + (b.amount_paid || 0),
    0,
  );
  const totalOutstanding = billList.reduce(
    (sum: number, b: any) => sum + (b.amount_due || 0),
    0,
  );

  // Average payment days
  const paidBills = billList.filter(
    (b: any) => b.status === "paid" && b.paid_date && b.issue_date,
  );
  let avgPaymentDays = 0;
  if (paidBills.length > 0) {
    const totalDays = paidBills.reduce((sum: number, b: any) => {
      const issue = new Date(b.issue_date).getTime();
      const paid = new Date(b.paid_date).getTime();
      return sum + Math.max(0, Math.round((paid - issue) / 86400000));
    }, 0);
    avgPaymentDays = Math.round(totalDays / paidBills.length);
  }

  // PO count
  const { count: poCount } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  const { count: activePOs } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .in("status", ["draft", "sent", "acknowledged"]);

  return {
    totalBilled,
    totalPaid,
    totalOutstanding,
    billCount: billList.length,
    poCount: poCount || 0,
    activePurchaseOrders: activePOs || 0,
    avgPaymentDays,
  };
}
