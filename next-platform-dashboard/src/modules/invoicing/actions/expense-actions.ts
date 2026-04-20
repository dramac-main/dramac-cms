"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  CreateExpenseInput,
} from "../types/expense-types";
import type { InvoiceActivity } from "../types/activity-types";
import { getInvoicingSettings } from "./settings-actions";
import { sendExpenseNotification } from "../services/expense-email-service";

// ─── Helpers ───────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

async function logActivity(
  supabase: any,
  siteId: string,
  entityId: string,
  entityType: "expense",
  action: string,
  description: string,
  actorType: "user" | "system" | "client" = "user",
  actorId?: string | null,
  actorName?: string | null,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
) {
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    description,
    actor_type: actorType,
    actor_id: actorId || null,
    actor_name: actorName || null,
    old_value: oldValue || null,
    new_value: newValue || null,
  });
}

async function canUserApproveExpense(
  supabase: any,
  siteId: string,
  userId?: string | null,
): Promise<boolean> {
  if (!userId) return false;

  const { data: site } = await supabase
    .from("sites")
    .select("agency_id")
    .eq("id", siteId)
    .single();

  if (!site?.agency_id) return false;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", site.agency_id)
    .eq("user_id", userId)
    .single();

  return membership?.role === "owner" || membership?.role === "admin";
}

async function assertCanApproveExpense(
  supabase: any,
  siteId: string,
  userId?: string | null,
): Promise<void> {
  const canApprove = await canUserApproveExpense(supabase, siteId, userId);
  if (!canApprove) {
    throw new Error("Only agency owners or admins can approve or reject expenses");
  }
}

// ─── Filter / Pagination Types ─────────────────────────────────

export interface ExpenseFilters {
  status?: ExpenseStatus;
  categoryId?: string;
  vendorId?: string;
  isBillable?: boolean;
  isBilled?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface ExpensePagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ═══════════════════════════════════════════════════════════════
// GET EXPENSES (LIST)
// ═══════════════════════════════════════════════════════════════

export async function getExpenses(
  siteId: string,
  filters?: ExpenseFilters,
  pagination?: ExpensePagination,
): Promise<{ expenses: Expense[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;
  const sortBy = pagination?.sortBy ?? "date";
  const sortOrder = pagination?.sortOrder ?? "desc";

  let query = supabase
    .from(INV_TABLES.expenses)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters?.vendorId) {
    query = query.eq("vendor_id", filters.vendorId);
  }
  if (filters?.isBillable !== undefined) {
    query = query.eq("is_billable", filters.isBillable);
  }
  if (filters?.isBilled !== undefined) {
    query = query.eq("is_billed", filters.isBilled);
  }
  if (filters?.dateFrom) {
    query = query.gte("date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("date", filters.dateTo);
  }
  if (filters?.amountMin !== undefined) {
    query = query.gte("amount", filters.amountMin);
  }
  if (filters?.amountMax !== undefined) {
    query = query.lte("amount", filters.amountMax);
  }
  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,expense_number.ilike.%${filters.search}%`,
    );
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    expenses: mapRecords<Expense>(data || []),
    total: count || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET EXPENSE (DETAIL)
// ═══════════════════════════════════════════════════════════════

export async function getExpense(
  expenseId: string,
): Promise<
  (Expense & {
    category: ExpenseCategory | null;
    activity: InvoiceActivity[];
    canCurrentUserApprove: boolean;
    approvedByName: string | null;
    approvedByEmail: string | null;
  }) | null
> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exp, error } = await supabase
    .from(INV_TABLES.expenses)
    .select("*")
    .eq("id", expenseId)
    .single();
  if (error) return null;

  // Fetch category if present
  let category: ExpenseCategory | null = null;
  if (exp.category_id) {
    const { data: cat } = await supabase
      .from(INV_TABLES.expenseCategories)
      .select("*")
      .eq("id", exp.category_id)
      .single();
    if (cat) category = mapRecord<ExpenseCategory>(cat);
  }

  // Fetch activity
  const { data: activity } = await supabase
    .from(INV_TABLES.invoiceActivity)
    .select("*")
    .eq("entity_type", "expense")
    .eq("entity_id", expenseId)
    .order("created_at", { ascending: false })
    .limit(50);

  const canCurrentUserApprove = await canUserApproveExpense(
    supabase,
    exp.site_id,
    user?.id,
  );

  let approvedByName: string | null = null;
  let approvedByEmail: string | null = null;
  if (exp.approved_by) {
    const { data: approverProfile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", exp.approved_by)
      .single();
    approvedByName = approverProfile?.name || null;
    approvedByEmail = approverProfile?.email || null;
  }

  const mapped = mapRecord<Expense>(exp);
  return {
    ...mapped,
    category,
    activity: mapRecords<InvoiceActivity>(activity || []),
    canCurrentUserApprove,
    approvedByName,
    approvedByEmail,
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE EXPENSE
// ═══════════════════════════════════════════════════════════════

export async function createExpense(
  siteId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Check auto-approve settings
  const settings = await getInvoicingSettings(siteId);
  const threshold = settings?.expenseApprovalThreshold ?? 50000;
  const autoApprove = settings?.expenseAutoApproveBelowThreshold ?? false;
  const shouldAutoApprove = autoApprove && input.amount < threshold;

  const initialStatus: ExpenseStatus = shouldAutoApprove ? "approved" : "pending";

  const insertData: Record<string, unknown> = {
    site_id: siteId,
    category_id: input.categoryId || null,
    vendor_id: input.vendorId || null,
    status: initialStatus,
    date: input.date || today,
    amount: input.amount,
    currency: input.currency || "ZMW",
    exchange_rate: 1,
    tax_rate_id: input.taxRateId || null,
    tax_amount: 0,
    description: input.description,
    receipt_url: input.receiptUrl || null,
    receipt_filename: input.receiptFilename || null,
    payment_method: input.paymentMethod || null,
    payment_reference: input.paymentReference || null,
    is_billable: input.isBillable ?? false,
    is_billed: false,
    billed_invoice_id: null,
    contact_id: input.contactId || null,
    company_id: input.companyId || null,
    notes: input.notes || null,
    tags: input.tags || [],
    metadata: {},
    created_by: user?.id || null,
  };

  if (shouldAutoApprove) {
    insertData.approved_by = null;
    insertData.approved_at = new Date().toISOString();
  }

  const { data: exp, error } = await supabase
    .from(INV_TABLES.expenses)
    .insert(insertData)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const actionLabel = shouldAutoApprove ? "created (auto-approved)" : "created";
  await logActivity(
    supabase,
    siteId,
    exp.id,
    "expense",
    actionLabel,
    `Expense ${actionLabel}: ${input.description}`,
    shouldAutoApprove ? "system" : "user",
    user?.id,
    user?.email,
  );

  await emitAutomationEvent(siteId, "accounting.expense.created", {
    expenseId: exp.id,
    amount: input.amount,
    description: input.description,
    autoApproved: shouldAutoApprove,
  });

  // Send email notification
  try {
    await sendExpenseNotification(siteId, exp.id, shouldAutoApprove ? "auto_approved" : "submitted");
  } catch {
    // Non-blocking
  }

  return mapRecord<Expense>(exp);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE EXPENSE
// ═══════════════════════════════════════════════════════════════

export async function updateExpense(
  expenseId: string,
  input: Partial<CreateExpenseInput>,
): Promise<Expense> {
  const supabase = await getModuleClient();

  // Check current state — cannot update if billed
  const { data: current } = await supabase
    .from(INV_TABLES.expenses)
    .select("is_billed, site_id")
    .eq("id", expenseId)
    .single();
  if (!current) throw new Error("Expense not found");
  if (current.is_billed) throw new Error("Cannot update a billed expense");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.categoryId !== undefined) updates.category_id = input.categoryId || null;
  if (input.vendorId !== undefined) updates.vendor_id = input.vendorId || null;
  if (input.date !== undefined) updates.date = input.date;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.taxRateId !== undefined) updates.tax_rate_id = input.taxRateId || null;
  if (input.description !== undefined) updates.description = input.description;
  if (input.receiptUrl !== undefined) updates.receipt_url = input.receiptUrl || null;
  if (input.receiptFilename !== undefined) updates.receipt_filename = input.receiptFilename || null;
  if (input.paymentMethod !== undefined) updates.payment_method = input.paymentMethod || null;
  if (input.paymentReference !== undefined) updates.payment_reference = input.paymentReference || null;
  if (input.isBillable !== undefined) updates.is_billable = input.isBillable;
  if (input.contactId !== undefined) updates.contact_id = input.contactId || null;
  if (input.companyId !== undefined) updates.company_id = input.companyId || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (input.tags !== undefined) updates.tags = input.tags;

  const { data: exp, error } = await supabase
    .from(INV_TABLES.expenses)
    .update(updates)
    .eq("id", expenseId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    current.site_id,
    expenseId,
    "expense",
    "updated",
    "Expense updated",
    "user",
  );

  return mapRecord<Expense>(exp);
}

// ═══════════════════════════════════════════════════════════════
// DELETE EXPENSE
// ═══════════════════════════════════════════════════════════════

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: current } = await supabase
    .from(INV_TABLES.expenses)
    .select("is_billed")
    .eq("id", expenseId)
    .single();
  if (!current) throw new Error("Expense not found");
  if (current.is_billed) throw new Error("Cannot delete a billed expense");

  const { error } = await supabase
    .from(INV_TABLES.expenses)
    .delete()
    .eq("id", expenseId);
  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
// APPROVE EXPENSE
// ═══════════════════════════════════════════════════════════════

export async function approveExpense(expenseId: string): Promise<void> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current } = await supabase
    .from(INV_TABLES.expenses)
    .select("status, site_id, amount, description")
    .eq("id", expenseId)
    .single();
  if (!current) throw new Error("Expense not found");
  if (current.status !== "pending")
    throw new Error("Only pending expenses can be approved");

  await assertCanApproveExpense(supabase, current.site_id, user?.id);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from(INV_TABLES.expenses)
    .update({
      status: "approved" as ExpenseStatus,
      approved_by: user?.id || null,
      approved_at: now,
      updated_at: now,
    })
    .eq("id", expenseId);
  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    current.site_id,
    expenseId,
    "expense",
    "approved",
    `Expense approved by ${user?.email || "unknown"}`,
    "user",
    user?.id,
    user?.email,
    { status: "pending" },
    { status: "approved" },
  );

  await emitAutomationEvent(current.site_id, "accounting.expense.approved", {
    expenseId,
    amount: current.amount,
    description: current.description,
    approvedBy: user?.id,
  });

  try {
    await sendExpenseNotification(current.site_id, expenseId, "approved");
  } catch {
    // Non-blocking
  }
}

// ═══════════════════════════════════════════════════════════════
// REJECT EXPENSE
// ═══════════════════════════════════════════════════════════════

export async function rejectExpense(
  expenseId: string,
  reason: string,
): Promise<void> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current } = await supabase
    .from(INV_TABLES.expenses)
    .select("status, site_id, amount, description")
    .eq("id", expenseId)
    .single();
  if (!current) throw new Error("Expense not found");
  if (current.status !== "pending")
    throw new Error("Only pending expenses can be rejected");

  await assertCanApproveExpense(supabase, current.site_id, user?.id);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from(INV_TABLES.expenses)
    .update({
      status: "rejected" as ExpenseStatus,
      rejection_reason: reason,
      approved_by: user?.id || null,
      approved_at: now,
      updated_at: now,
    })
    .eq("id", expenseId);
  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    current.site_id,
    expenseId,
    "expense",
    "rejected",
    `Expense rejected by ${user?.email || "unknown"}: ${reason}`,
    "user",
    user?.id,
    user?.email,
    { status: "pending" },
    { status: "rejected", reason },
  );

  await emitAutomationEvent(current.site_id, "accounting.expense.rejected", {
    expenseId,
    amount: current.amount,
    description: current.description,
    reason,
    rejectedBy: user?.id,
  });

  try {
    await sendExpenseNotification(current.site_id, expenseId, "rejected");
  } catch {
    // Non-blocking
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVERT TO INVOICE ITEM
// ═══════════════════════════════════════════════════════════════

export async function convertToInvoiceItem(
  expenseIds: string[],
  invoiceId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Get invoice to verify it exists and get site_id
  const { data: invoice } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, site_id, status")
    .eq("id", invoiceId)
    .single();
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "draft")
    throw new Error("Can only add items to draft invoices");

  // Get current max sort order on the invoice
  const { data: existingItems } = await supabase
    .from(INV_TABLES.invoiceLineItems)
    .select("sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextSort = (existingItems?.[0]?.sort_order ?? -1) + 1;

  for (const expenseId of expenseIds) {
    const { data: expense } = await supabase
      .from(INV_TABLES.expenses)
      .select("*")
      .eq("id", expenseId)
      .single();
    if (!expense) continue;
    if (expense.is_billed) continue;

    // Create invoice line item from expense
    await supabase.from(INV_TABLES.invoiceLineItems).insert({
      invoice_id: invoiceId,
      item_id: null,
      sort_order: nextSort++,
      name: expense.description,
      description: `Expense: ${expense.description}`,
      quantity: 1,
      unit: null,
      unit_price: expense.amount,
      discount_type: null,
      discount_value: 0,
      tax_rate_id: expense.tax_rate_id || null,
      tax_rate: 0,
      tax_amount: expense.tax_amount || 0,
      subtotal: expense.amount,
      total: expense.amount + (expense.tax_amount || 0),
      metadata: { source: "expense", expense_id: expense.id },
    });

    // Mark expense as billed
    await supabase
      .from(INV_TABLES.expenses)
      .update({
        is_billed: true,
        billed_invoice_id: invoiceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    await logActivity(
      supabase,
      invoice.site_id,
      expenseId,
      "expense",
      "billed",
      `Expense converted to invoice line item on invoice ${invoiceId}`,
      "user",
    );
  }

  // Recalculate invoice totals
  const { data: allItems } = await supabase
    .from(INV_TABLES.invoiceLineItems)
    .select("subtotal, tax_amount, total")
    .eq("invoice_id", invoiceId);

  if (allItems) {
    const subtotal = allItems.reduce(
      (s: number, i: any) => s + (i.subtotal || 0),
      0,
    );
    const taxAmount = allItems.reduce(
      (s: number, i: any) => s + (i.tax_amount || 0),
      0,
    );
    const total = allItems.reduce(
      (s: number, i: any) => s + (i.total || 0),
      0,
    );
    const { data: inv } = await supabase
      .from(INV_TABLES.invoices)
      .select("amount_paid")
      .eq("id", invoiceId)
      .single();
    const amountPaid = inv?.amount_paid || 0;

    await supabase
      .from(INV_TABLES.invoices)
      .update({
        subtotal,
        tax_amount: taxAmount,
        total,
        amount_due: total - amountPaid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);
  }

  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "expense",
    "expenses_added",
    `${expenseIds.length} billable expense(s) added as line items`,
    "user",
  );
}

// ═══════════════════════════════════════════════════════════════
// GET EXPENSE STATS
// ═══════════════════════════════════════════════════════════════

export interface ExpenseStats {
  totalAmount: number;
  totalApproved: number;
  totalPending: number;
  expenseCount: number;
  byCategory: { categoryId: string | null; categoryName: string; total: number }[];
}

export async function getExpenseStats(
  siteId: string,
  dateRange?: { from?: string; to?: string },
): Promise<ExpenseStats> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(INV_TABLES.expenses)
    .select("id, amount, status, category_id")
    .eq("site_id", siteId);

  if (dateRange?.from) query = query.gte("date", dateRange.from);
  if (dateRange?.to) query = query.lte("date", dateRange.to);

  const { data: expenses } = await query;
  if (!expenses || expenses.length === 0) {
    return {
      totalAmount: 0,
      totalApproved: 0,
      totalPending: 0,
      expenseCount: 0,
      byCategory: [],
    };
  }

  const totalAmount = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalApproved = expenses
    .filter((e: any) => e.status === "approved" || e.status === "paid")
    .reduce((s: number, e: any) => s + e.amount, 0);
  const totalPending = expenses
    .filter((e: any) => e.status === "pending")
    .reduce((s: number, e: any) => s + e.amount, 0);

  // Group by category
  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    const catId = e.category_id || "uncategorized";
    categoryMap.set(catId, (categoryMap.get(catId) || 0) + e.amount);
  }

  // Get category names
  const { data: categories } = await supabase
    .from(INV_TABLES.expenseCategories)
    .select("id, name")
    .eq("site_id", siteId);
  const catNames = new Map(
    (categories || []).map((c: any) => [c.id, c.name]),
  );

  const byCategory = Array.from(categoryMap.entries()).map(
    ([catId, total]) => ({
      categoryId: catId === "uncategorized" ? null : catId,
      categoryName: catId === "uncategorized" ? "Uncategorized" : String(catNames.get(catId) ?? "Unknown"),
      total,
    }),
  );

  return {
    totalAmount,
    totalApproved,
    totalPending,
    expenseCount: expenses.length,
    byCategory,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPENSE CATEGORIES
// ═══════════════════════════════════════════════════════════════

export async function getExpenseCategories(
  siteId: string,
): Promise<ExpenseCategory[]> {
  const supabase = await getModuleClient();
  const { data, error } = await supabase
    .from(INV_TABLES.expenseCategories)
    .select("*")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return mapRecords<ExpenseCategory>(data || []);
}

export async function createExpenseCategory(
  siteId: string,
  input: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string | null;
    parentId?: string | null;
    monthlyBudget?: number;
  },
): Promise<ExpenseCategory> {
  const supabase = await getModuleClient();

  // Get next sort order
  const { data: existing } = await supabase
    .from(INV_TABLES.expenseCategories)
    .select("sort_order")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from(INV_TABLES.expenseCategories)
    .insert({
      site_id: siteId,
      name: input.name,
      description: input.description || null,
      color: input.color || "#6B7280",
      icon: input.icon || null,
      parent_id: input.parentId || null,
      monthly_budget: input.monthlyBudget ?? 0,
      is_active: true,
      sort_order: nextSort,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRecord<ExpenseCategory>(data);
}

export async function updateExpenseCategory(
  categoryId: string,
  input: {
    name?: string;
    description?: string | null;
    color?: string;
    icon?: string | null;
    parentId?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    monthlyBudget?: number;
  },
): Promise<ExpenseCategory> {
  const supabase = await getModuleClient();

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.color !== undefined) updates.color = input.color;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.parentId !== undefined) updates.parent_id = input.parentId;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.monthlyBudget !== undefined) updates.monthly_budget = input.monthlyBudget;

  const { data, error } = await supabase
    .from(INV_TABLES.expenseCategories)
    .update(updates)
    .eq("id", categoryId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRecord<ExpenseCategory>(data);
}

export async function deleteExpenseCategory(
  categoryId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Check if any expenses reference this category
  const { count } = await supabase
    .from(INV_TABLES.expenses)
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  if (count && count > 0) {
    throw new Error(
      `Cannot delete category: ${count} expense(s) reference it. Reassign them first.`,
    );
  }

  const { error } = await supabase
    .from(INV_TABLES.expenseCategories)
    .delete()
    .eq("id", categoryId);
  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY BUDGET SPENDING
// ═══════════════════════════════════════════════════════════════

export interface CategoryBudgetSpend {
  categoryId: string;
  categoryName: string;
  monthlyBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export async function getCategoryBudgetSpending(
  siteId: string,
  month?: string, // YYYY-MM format, defaults to current month
): Promise<CategoryBudgetSpend[]> {
  const supabase = await getModuleClient();

  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = targetMonth.split("-").map(Number);
  const startDate = `${year}-${String(mon).padStart(2, "0")}-01`;
  const endDate = new Date(year, mon, 0).toISOString().split("T")[0]; // last day of month

  // Get categories with budgets
  const { data: categories } = await supabase
    .from(INV_TABLES.expenseCategories)
    .select("id, name, monthly_budget")
    .eq("site_id", siteId)
    .gt("monthly_budget", 0);

  if (!categories || categories.length === 0) return [];

  // Get expenses for the month grouped by category
  const { data: expenses } = await supabase
    .from(INV_TABLES.expenses)
    .select("category_id, amount, status")
    .eq("site_id", siteId)
    .gte("date", startDate)
    .lte("date", endDate)
    .in("status", ["pending", "approved", "paid"]);

  const spendMap = new Map<string, number>();
  for (const exp of expenses || []) {
    if (exp.category_id) {
      spendMap.set(exp.category_id, (spendMap.get(exp.category_id) || 0) + exp.amount);
    }
  }

  return categories.map((cat: any) => {
    const budget = cat.monthly_budget || 0;
    const spent = spendMap.get(cat.id) || 0;
    const remaining = Math.max(0, budget - spent);
    const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      monthlyBudget: budget,
      spent,
      remaining,
      percentUsed,
      isOverBudget: spent > budget,
    };
  });
}
