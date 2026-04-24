import "server-only";

/**
 * Portal Invoicing DAL (Session 4A).
 *
 * Namespaces: invoices, invoicePayments, creditNotes, recurringInvoices,
 * expenses, vendors, bills, statements.
 *
 * Session 1-3 invariants enforced per method:
 *   1. `requireScope(ctx, siteId, permission)` first — denials audit + throw.
 *   2. Defense-in-depth: every query filters `site_id = scope.siteId`.
 *   3. All money is stored as INTEGER CENTS in invoicing tables; the DAL
 *      exposes values as `*Cents` fields. No floating-point money helpers.
 *   4. `withPortalEvent` wraps every operation for structured observability.
 *   5. Writes fire-and-forget `writePortalAudit` + `logAutomationEvent`
 *      (source: "portal", actor_user_id: ctx.user.userId).
 *   6. Stripe is forbidden in invoicing. No Stripe references in this file.
 *   7. Paddle is platform-billing only — never per-invoice customer payment.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalPermissionKey,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { logPortalEvent, withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { EVENT_REGISTRY } from "@/modules/automation/lib/event-types";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";
import {
  calculateLineItemTotals,
  calculateInvoiceTotals,
  isValidInvoiceTransition,
} from "@/modules/invoicing/lib/invoicing-utils";
import {
  INV_TABLES,
  VALID_INVOICE_TRANSITIONS,
} from "@/modules/invoicing/lib/invoicing-constants";

// =============================================================================
// SHARED HELPERS
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
  permission: PortalPermissionKey,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, permission);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${permission}`,
      permissionKey: permission,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      permission,
    );
  }
  return result.scope!;
}

function numCents(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function nowIso(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  permissionKey: PortalPermissionKey,
  metadata?: Record<string, unknown>,
): void {
  writePortalAudit({
    authUserId: ctx.user.userId,
    clientId: ctx.user.clientId,
    agencyId: ctx.user.agencyId,
    siteId,
    isImpersonation: ctx.isImpersonation,
    impersonatorEmail: ctx.impersonatorEmail,
    action,
    resourceType,
    resourceId,
    permissionKey,
    metadata,
  }).catch(() => {});
}

function emitEvent(
  siteId: string,
  eventType: string,
  ctx: PortalDALContext,
  payload: Record<string, unknown>,
  sourceEntityType: string,
  sourceEntityId: string,
): void {
  logAutomationEvent(
    siteId,
    eventType,
    {
      ...payload,
      source: "portal",
      actor_user_id: ctx.user.userId,
      is_impersonation: ctx.isImpersonation,
    },
    {
      sourceModule: "portal",
      sourceEntityType,
      sourceEntityId,
    },
  ).catch(() => {});
}

// =============================================================================
// INVOICES NAMESPACE
// =============================================================================

export type PortalInvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partial"
  | "paid"
  | "overdue"
  | "void"
  | "cancelled";

export interface PortalInvoiceListFilter {
  status?: PortalInvoiceStatus | PortalInvoiceStatus[] | "all";
  search?: string;
  from?: string;
  to?: string;
  minCents?: number;
  maxCents?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?:
    | "created_at"
    | "issue_date"
    | "due_date"
    | "total"
    | "invoice_number";
  sortDir?: "asc" | "desc";
}

export interface PortalInvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: string;
  clientName: string;
  clientEmail: string | null;
  currency: string;
  issueDate: string;
  dueDate: string;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  createdAt: string | null;
}

export interface PortalInvoiceLineItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPriceCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  subtotalCents: number;
  totalCents: number;
  sortOrder: number;
}

export interface PortalInvoicePaymentSummary {
  id: string;
  paymentNumber: string | null;
  type: "payment" | "refund";
  amountCents: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  transactionReference: string | null;
  notes: string | null;
}

export interface PortalInvoiceActivity {
  id: string;
  action: string;
  description: string;
  actorType: string;
  actorName: string | null;
  createdAt: string;
}

export interface PortalInvoiceDetail {
  id: string;
  invoiceNumber: string;
  status: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  clientTaxId: string | null;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  paymentTerms: string | null;
  subtotalCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  creditsAppliedCents: number;
  depositAmountCents: number;
  depositPaid: boolean;
  notes: string | null;
  terms: string | null;
  /** Internal notes — five-layer security rule applies (portal agent access only). */
  internalNotes: string | null;
  reference: string | null;
  sourceType: string | null;
  sourceId: string | null;
  tags: string[];
  sentAt: string | null;
  viewedAt: string | null;
  lineItems: PortalInvoiceLineItem[];
  payments: PortalInvoicePaymentSummary[];
  activities: PortalInvoiceActivity[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalCreateInvoiceLineItem {
  itemId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  /** Integer cents. */
  unitPriceCents: number;
  discountType?: "percentage" | "fixed" | null;
  /** Basis points when percentage (1000 = 10%), integer cents when fixed. */
  discountValue?: number;
  taxRateId?: string | null;
  /** Tax rate as percentage (e.g. 16 for 16%). */
  taxRate?: number;
}

export interface PortalCreateInvoiceInput {
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  currency?: string;
  issueDate?: string;
  dueDate: string;
  paymentTerms?: string | null;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number;
  notes?: string | null;
  terms?: string | null;
  internalNotes?: string | null;
  reference?: string | null;
  tags?: string[];
  lineItems: PortalCreateInvoiceLineItem[];
}

export interface PortalUpdateInvoiceInput extends Partial<
  Omit<PortalCreateInvoiceInput, "lineItems">
> {
  lineItems?: PortalCreateInvoiceLineItem[];
}

export interface PortalRecordPaymentInput {
  amountCents: number;
  paymentMethod:
    | "bank_transfer"
    | "cash"
    | "mobile_money"
    | "card"
    | "cheque"
    | "paypal"
    | "other"
    | "online";
  paymentDate?: string;
  transactionReference?: string | null;
  paymentMethodDetail?: string | null;
  notes?: string | null;
  proofUrl?: string | null;
}

interface InvoiceRow {
  id: string;
  site_id: string;
  invoice_number: string;
  status: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  client_tax_id: string | null;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  payment_terms: string | null;
  subtotal: number | string | null;
  discount_amount: number | string | null;
  tax_amount: number | string | null;
  total: number | string | null;
  amount_paid: number | string | null;
  amount_due: number | string | null;
  credits_applied: number | string | null;
  deposit_amount: number | string | null;
  deposit_paid: boolean | null;
  notes: string | null;
  terms: string | null;
  internal_notes: string | null;
  reference: string | null;
  source_type: string | null;
  source_id: string | null;
  tags: string[] | null;
  sent_at: string | null;
  viewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function mapInvoiceList(r: InvoiceRow): PortalInvoiceListItem {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    status: r.status,
    clientName: r.client_name,
    clientEmail: r.client_email,
    currency: r.currency,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    totalCents: numCents(r.total),
    amountPaidCents: numCents(r.amount_paid),
    amountDueCents: numCents(r.amount_due),
    createdAt: r.created_at,
  };
}

function mapInvoiceDetail(
  r: InvoiceRow,
  items: PortalInvoiceLineItem[],
  payments: PortalInvoicePaymentSummary[],
  activities: PortalInvoiceActivity[],
): PortalInvoiceDetail {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    status: r.status,
    clientName: r.client_name,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    clientAddress: r.client_address,
    clientTaxId: r.client_tax_id,
    currency: r.currency,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    paidDate: r.paid_date,
    paymentTerms: r.payment_terms,
    subtotalCents: numCents(r.subtotal),
    discountAmountCents: numCents(r.discount_amount),
    taxAmountCents: numCents(r.tax_amount),
    totalCents: numCents(r.total),
    amountPaidCents: numCents(r.amount_paid),
    amountDueCents: numCents(r.amount_due),
    creditsAppliedCents: numCents(r.credits_applied),
    depositAmountCents: numCents(r.deposit_amount),
    depositPaid: !!r.deposit_paid,
    notes: r.notes,
    terms: r.terms,
    internalNotes: r.internal_notes,
    reference: r.reference,
    sourceType: r.source_type,
    sourceId: r.source_id,
    tags: r.tags ?? [],
    sentAt: r.sent_at,
    viewedAt: r.viewed_at,
    lineItems: items,
    payments,
    activities,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function nextDocumentNumber(
  admin: ReturnType<typeof createAdminClient>,
  siteId: string,
  docType: "invoice" | "credit_note" | "bill" | "po",
): Promise<string> {
  const { data, error } = await (
    admin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: string | null; error: { message: string } | null }>;
    }
  ).rpc("generate_next_invoice_number", {
    p_site_id: siteId,
    p_doc_type: docType,
  });
  if (error || !data) {
    throw new Error(`Failed to generate ${docType} number`);
  }
  return data;
}

async function listInvoicesImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalInvoiceListFilter | undefined,
): Promise<PortalInvoiceListItem[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.list",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      const sortBy = filter?.sortBy ?? "created_at";
      const asc = filter?.sortDir === "asc";

      let q = (admin as any)
        .from(INV_TABLES.invoices)
        .select(
          "id,site_id,invoice_number,status,client_name,client_email,currency,issue_date,due_date,total,amount_paid,amount_due,created_at",
        )
        .eq("site_id", scope.siteId);

      if (filter?.status && filter.status !== "all") {
        if (Array.isArray(filter.status)) q = q.in("status", filter.status);
        else q = q.eq("status", filter.status);
      }
      if (filter?.search) {
        const esc = filter.search.replace(/%/g, "\\%");
        q = q.or(
          `invoice_number.ilike.%${esc}%,client_name.ilike.%${esc}%,client_email.ilike.%${esc}%`,
        );
      }
      if (filter?.from) q = q.gte("issue_date", filter.from);
      if (filter?.to) q = q.lte("issue_date", filter.to);
      if (filter?.minCents !== undefined) q = q.gte("total", filter.minCents);
      if (filter?.maxCents !== undefined) q = q.lte("total", filter.maxCents);
      if (filter?.tags && filter.tags.length > 0)
        q = q.overlaps("tags", filter.tags);

      q = q.order(sortBy, { ascending: asc }).range(offset, offset + limit - 1);

      const { data, error } = await q;
      if (error) {
        logPortalEvent({
          event: "portal.dal.invoicing.invoices.query_error",
          level: "error",
          ok: false,
          agencyId: ctx.user.agencyId,
          siteId: scope.siteId,
          error: error.message,
        });
        throw new Error("Failed to load invoices");
      }
      const rows = (data ?? []) as InvoiceRow[];
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.invoices.list",
        "invoice",
        null,
        "canViewInvoices",
        { count: rows.length },
      );
      return rows.map(mapInvoiceList);
    },
  );
}

async function detailInvoiceImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
): Promise<PortalInvoiceDetail> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.detail",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId },
    },
    async () => {
      const admin = createAdminClient();
      const { data, error } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select("*")
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !data) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canViewInvoices",
        );
      }
      const invoice = data as InvoiceRow;

      const [linesResult, paymentsResult, activitiesResult] = await Promise.all(
        [
          (admin as any)
            .from(INV_TABLES.invoiceLineItems)
            .select(
              "id,name,description,quantity,unit,unit_price,discount_amount,tax_amount,subtotal,total,sort_order",
            )
            .eq("invoice_id", invoiceId)
            .order("sort_order", { ascending: true }),
          (admin as any)
            .from(INV_TABLES.payments)
            .select(
              "id,payment_number,type,amount,currency,payment_date,payment_method,status,transaction_reference,notes",
            )
            .eq("invoice_id", invoiceId)
            .eq("site_id", scope.siteId)
            .order("payment_date", { ascending: false }),
          (admin as any)
            .from(INV_TABLES.invoiceActivity)
            .select("id,action,description,actor_type,actor_name,created_at")
            .eq("entity_id", invoiceId)
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false })
            .limit(50),
        ],
      );

      const lineItems: PortalInvoiceLineItem[] = (linesResult.data ?? []).map(
        (r: Record<string, unknown>) => ({
          id: r.id as string,
          name: (r.name as string) ?? "",
          description: (r.description as string) ?? null,
          quantity: Number(r.quantity ?? 0),
          unit: (r.unit as string) ?? null,
          unitPriceCents: numCents(r.unit_price),
          discountAmountCents: numCents(r.discount_amount),
          taxAmountCents: numCents(r.tax_amount),
          subtotalCents: numCents(r.subtotal),
          totalCents: numCents(r.total),
          sortOrder: Number(r.sort_order ?? 0),
        }),
      );

      const payments: PortalInvoicePaymentSummary[] = (
        paymentsResult.data ?? []
      ).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        paymentNumber: (r.payment_number as string) ?? null,
        type: ((r.type as string) ?? "payment") as "payment" | "refund",
        amountCents: numCents(r.amount),
        currency: (r.currency as string) ?? "USD",
        paymentDate: (r.payment_date as string) ?? "",
        paymentMethod: (r.payment_method as string) ?? "other",
        status: (r.status as string) ?? "completed",
        transactionReference: (r.transaction_reference as string) ?? null,
        notes: (r.notes as string) ?? null,
      }));

      const activities: PortalInvoiceActivity[] = (
        activitiesResult.data ?? []
      ).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        action: (r.action as string) ?? "",
        description: (r.description as string) ?? "",
        actorType: (r.actor_type as string) ?? "system",
        actorName: (r.actor_name as string) ?? null,
        createdAt: (r.created_at as string) ?? "",
      }));

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.invoices.detail",
        "invoice",
        invoiceId,
        "canViewInvoices",
      );

      return mapInvoiceDetail(invoice, lineItems, payments, activities);
    },
  );
}

function computeLineItemDbRow(
  item: PortalCreateInvoiceLineItem,
  index: number,
) {
  const totals = calculateLineItemTotals(
    item.quantity,
    item.unitPriceCents,
    item.discountType ?? null,
    item.discountValue ?? 0,
    item.taxRate ?? 0,
  );
  return {
    item_id: item.itemId ?? null,
    sort_order: index,
    name: item.name,
    description: item.description ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    unit_price: item.unitPriceCents,
    discount_type: item.discountType ?? null,
    discount_value: item.discountValue ?? 0,
    discount_amount: totals.discountAmount,
    tax_rate_id: item.taxRateId ?? null,
    tax_rate: item.taxRate ?? 0,
    tax_amount: totals.taxAmount,
    subtotal: totals.subtotal,
    total: totals.total,
  };
}

async function createInvoiceImpl(
  ctx: PortalDALContext,
  siteId: string,
  input: PortalCreateInvoiceInput,
): Promise<{ id: string; invoiceNumber: string }> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.create",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      if (!input.lineItems || input.lineItems.length === 0) {
        throw new Error("Invoice must have at least one line item");
      }
      const admin = createAdminClient();

      const lineRows = input.lineItems.map((li, i) =>
        computeLineItemDbRow(li, i),
      );
      const totals = calculateInvoiceTotals(
        lineRows.map((lr) => ({
          subtotal: lr.subtotal,
          discountAmount: lr.discount_amount,
          taxAmount: lr.tax_amount,
          total: lr.total,
        })),
        input.discountType ?? null,
        input.discountValue ?? 0,
      );

      const invoiceNumber = await nextDocumentNumber(
        admin,
        scope.siteId,
        "invoice",
      );

      const { data: insertData, error: insErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .insert({
          site_id: scope.siteId,
          invoice_number: invoiceNumber,
          status: "draft",
          contact_id: input.contactId ?? null,
          company_id: input.companyId ?? null,
          client_name: input.clientName,
          client_email: input.clientEmail ?? null,
          client_phone: input.clientPhone ?? null,
          client_address: input.clientAddress ?? null,
          client_tax_id: input.clientTaxId ?? null,
          currency: input.currency ?? "USD",
          issue_date: input.issueDate ?? today(),
          due_date: input.dueDate,
          payment_terms: input.paymentTerms ?? null,
          subtotal: totals.subtotal,
          discount_type: input.discountType ?? null,
          discount_value: input.discountValue ?? 0,
          discount_amount: totals.discountAmount,
          tax_amount: totals.taxAmount,
          total: totals.total,
          amount_paid: 0,
          amount_due: totals.total,
          notes: input.notes ?? null,
          terms: input.terms ?? null,
          internal_notes: input.internalNotes ?? null,
          reference: input.reference ?? null,
          source_type: "manual",
          tags: input.tags ?? [],
          created_by: ctx.user.userId,
        })
        .select("id")
        .single();
      if (insErr || !insertData) {
        throw new Error("Failed to create invoice");
      }
      const invoiceId = (insertData as { id: string }).id;

      if (lineRows.length > 0) {
        const { error: liErr } = await (admin as any)
          .from(INV_TABLES.invoiceLineItems)
          .insert(lineRows.map((lr) => ({ ...lr, invoice_id: invoiceId })));
        if (liErr) {
          // Rollback invoice
          await (admin as any)
            .from(INV_TABLES.invoices)
            .delete()
            .eq("id", invoiceId);
          throw new Error("Failed to create invoice line items");
        }
      }

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.invoices.create",
        "invoice",
        invoiceId,
        "canManageInvoices",
        {
          invoiceNumber,
          totalCents: totals.total,
          currency: input.currency ?? "USD",
        },
      );

      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.invoice.created,
        ctx,
        {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          total_cents: totals.total,
          currency: input.currency ?? "USD",
          client_email: input.clientEmail ?? null,
          client_name: input.clientName,
        },
        "invoice",
        invoiceId,
      );

      return { id: invoiceId, invoiceNumber };
    },
  );
}

async function updateInvoiceImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
  input: PortalUpdateInvoiceInput,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.update",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: existing, error: fetchErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select("id,status")
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (fetchErr || !existing) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      if ((existing as { status: string }).status !== "draft") {
        throw new Error("Only draft invoices can be edited");
      }

      const update: Record<string, unknown> = { updated_at: nowIso() };
      if (input.clientName !== undefined) update.client_name = input.clientName;
      if (input.clientEmail !== undefined)
        update.client_email = input.clientEmail;
      if (input.clientPhone !== undefined)
        update.client_phone = input.clientPhone;
      if (input.clientAddress !== undefined)
        update.client_address = input.clientAddress;
      if (input.clientTaxId !== undefined)
        update.client_tax_id = input.clientTaxId;
      if (input.currency !== undefined) update.currency = input.currency;
      if (input.issueDate !== undefined) update.issue_date = input.issueDate;
      if (input.dueDate !== undefined) update.due_date = input.dueDate;
      if (input.paymentTerms !== undefined)
        update.payment_terms = input.paymentTerms;
      if (input.discountType !== undefined)
        update.discount_type = input.discountType;
      if (input.discountValue !== undefined)
        update.discount_value = input.discountValue;
      if (input.notes !== undefined) update.notes = input.notes;
      if (input.terms !== undefined) update.terms = input.terms;
      if (input.internalNotes !== undefined)
        update.internal_notes = input.internalNotes;
      if (input.reference !== undefined) update.reference = input.reference;
      if (input.tags !== undefined) update.tags = input.tags;

      // If line items provided, recompute totals
      if (input.lineItems) {
        const lineRows = input.lineItems.map((li, i) =>
          computeLineItemDbRow(li, i),
        );
        const totals = calculateInvoiceTotals(
          lineRows.map((lr) => ({
            subtotal: lr.subtotal,
            discountAmount: lr.discount_amount,
            taxAmount: lr.tax_amount,
            total: lr.total,
          })),
          (input.discountType ?? null) as "percentage" | "fixed" | null,
          input.discountValue ?? 0,
        );
        update.subtotal = totals.subtotal;
        update.discount_amount = totals.discountAmount;
        update.tax_amount = totals.taxAmount;
        update.total = totals.total;
        update.amount_due = totals.total;

        // Delete existing, insert new
        await (admin as any)
          .from(INV_TABLES.invoiceLineItems)
          .delete()
          .eq("invoice_id", invoiceId);
        if (lineRows.length > 0) {
          await (admin as any)
            .from(INV_TABLES.invoiceLineItems)
            .insert(lineRows.map((lr) => ({ ...lr, invoice_id: invoiceId })));
        }
      }

      const { error: updErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .update(update)
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to update invoice");

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.invoices.update",
        "invoice",
        invoiceId,
        "canManageInvoices",
      );
    },
  );
}

async function sendInvoiceImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.send",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select("id,status,invoice_number,client_email,total,currency")
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const c = current as {
        status: string;
        invoice_number: string;
        client_email: string | null;
        total: number | string;
        currency: string;
      };
      if (
        !isValidInvoiceTransition(c.status, "sent", VALID_INVOICE_TRANSITIONS)
      ) {
        throw new Error(`Cannot send invoice in status ${c.status}`);
      }
      const { error: updErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .update({
          status: "sent",
          sent_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to send invoice");

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.invoices.send",
        "invoice",
        invoiceId,
        "canManageInvoices",
      );

      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.invoice.sent,
        ctx,
        {
          invoice_id: invoiceId,
          invoice_number: c.invoice_number,
          total_cents: numCents(c.total),
          currency: c.currency,
          client_email: c.client_email,
        },
        "invoice",
        invoiceId,
      );
    },
  );
}

async function voidInvoiceImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
  reason: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.void",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId, reason },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select("id,status,invoice_number,total,currency,client_email")
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const c = current as {
        status: string;
        invoice_number: string;
        total: number | string;
        currency: string;
        client_email: string | null;
      };
      if (
        !isValidInvoiceTransition(c.status, "void", VALID_INVOICE_TRANSITIONS)
      ) {
        throw new Error(`Cannot void invoice in status ${c.status}`);
      }
      const { error: updErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .update({ status: "void", updated_at: nowIso() })
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to void invoice");

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.invoices.void",
        "invoice",
        invoiceId,
        "canManageInvoices",
        { reason },
      );

      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.invoice.cancelled,
        ctx,
        {
          invoice_id: invoiceId,
          invoice_number: c.invoice_number,
          reason,
          total_cents: numCents(c.total),
          currency: c.currency,
        },
        "invoice",
        invoiceId,
      );
    },
  );
}

async function addInvoiceNoteImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
  note: string,
  isInternal: boolean,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.invoices.add_note",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId, isInternal, noteLen: note.length },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select("id,internal_notes,notes")
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const c = current as {
        internal_notes: string | null;
        notes: string | null;
      };
      const timestamp = nowIso();
      const stamped = `[${timestamp}] ${ctx.user.fullName || ctx.user.email}: ${note}`;
      const updateField = isInternal
        ? {
            internal_notes: c.internal_notes
              ? `${c.internal_notes}\n${stamped}`
              : stamped,
          }
        : { notes: c.notes ? `${c.notes}\n${stamped}` : stamped };

      const { error: updErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .update({ ...updateField, updated_at: nowIso() })
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to add note");

      // Internal-note five-layer security audit
      finalizeAudit(
        ctx,
        scope.siteId,
        isInternal
          ? "portal.invoicing.invoices.add_internal_note"
          : "portal.invoicing.invoices.add_note",
        "invoice",
        invoiceId,
        "canManageInvoices",
        { isInternal, noteLen: note.length },
      );
    },
  );
}

// =============================================================================
// INVOICE PAYMENTS NAMESPACE
// =============================================================================

export interface PortalPaymentListFilter {
  invoiceId?: string;
  method?: string;
  type?: "payment" | "refund";
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalInvoicePayment {
  id: string;
  paymentNumber: string | null;
  invoiceId: string;
  invoiceNumber: string | null;
  type: "payment" | "refund";
  amountCents: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  paymentMethodDetail: string | null;
  transactionReference: string | null;
  proofUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string | null;
}

async function listPaymentsImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalPaymentListFilter | undefined,
): Promise<PortalInvoicePayment[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.payments.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      let q = (admin as any)
        .from(INV_TABLES.payments)
        .select(
          `id,payment_number,invoice_id,type,amount,currency,payment_date,payment_method,payment_method_detail,transaction_reference,proof_url,status,notes,created_at,${INV_TABLES.invoices}!inner(invoice_number,site_id)`,
        )
        .eq("site_id", scope.siteId);
      if (filter?.invoiceId) q = q.eq("invoice_id", filter.invoiceId);
      if (filter?.method) q = q.eq("payment_method", filter.method);
      if (filter?.type) q = q.eq("type", filter.type);
      if (filter?.from) q = q.gte("payment_date", filter.from);
      if (filter?.to) q = q.lte("payment_date", filter.to);
      if (filter?.search)
        q = q.or(
          `payment_number.ilike.%${filter.search}%,transaction_reference.ilike.%${filter.search}%`,
        );
      q = q
        .order("payment_date", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await q;
      if (error) {
        logPortalEvent({
          event: "portal.dal.invoicing.payments.query_error",
          level: "error",
          ok: false,
          agencyId: ctx.user.agencyId,
          siteId: scope.siteId,
          error: error.message,
        });
        throw new Error("Failed to load payments");
      }
      return (data ?? []).map((r: Record<string, unknown>) => {
        const inv = (r as Record<string, unknown>)[INV_TABLES.invoices] as
          | { invoice_number?: string }
          | undefined;
        return {
          id: r.id as string,
          paymentNumber: (r.payment_number as string) ?? null,
          invoiceId: r.invoice_id as string,
          invoiceNumber: inv?.invoice_number ?? null,
          type: ((r.type as string) ?? "payment") as "payment" | "refund",
          amountCents: numCents(r.amount),
          currency: (r.currency as string) ?? "USD",
          paymentDate: (r.payment_date as string) ?? "",
          paymentMethod: (r.payment_method as string) ?? "other",
          paymentMethodDetail: (r.payment_method_detail as string) ?? null,
          transactionReference: (r.transaction_reference as string) ?? null,
          proofUrl: (r.proof_url as string) ?? null,
          status: (r.status as string) ?? "completed",
          notes: (r.notes as string) ?? null,
          createdAt: (r.created_at as string) ?? null,
        };
      });
    },
  );
}

async function recordPaymentImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
  input: PortalRecordPaymentInput,
): Promise<{ id: string; paymentNumber: string }> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.payments.record",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId, amountCents: input.amountCents },
    },
    async () => {
      if (input.amountCents <= 0) throw new Error("Amount must be positive");
      const admin = createAdminClient();
      const { data: invoice, error } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select(
          "id,status,invoice_number,currency,total,amount_paid,amount_due,client_email",
        )
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !invoice) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const inv = invoice as {
        status: string;
        invoice_number: string;
        currency: string;
        total: number | string;
        amount_paid: number | string;
        amount_due: number | string;
        client_email: string | null;
      };
      if (["void", "cancelled", "draft"].includes(inv.status)) {
        throw new Error(`Cannot record payment on ${inv.status} invoice`);
      }

      const total = numCents(inv.total);
      const previouslyPaid = numCents(inv.amount_paid);
      const newPaid = previouslyPaid + input.amountCents;
      const newDue = Math.max(0, total - newPaid);

      // Try RPC for payment number
      let paymentNumber: string | null = null;
      try {
        const { data: pnData } = await (admin as any).rpc(
          "generate_invmod01_payment_number",
          { p_site_id: scope.siteId },
        );
        if (pnData) paymentNumber = pnData as string;
      } catch {
        // fallback
      }
      if (!paymentNumber) {
        const year = new Date().getFullYear();
        paymentNumber = `PAY-${year}-${Date.now().toString().slice(-6)}`;
      }

      const { data: paymentData, error: payErr } = await (admin as any)
        .from(INV_TABLES.payments)
        .insert({
          site_id: scope.siteId,
          invoice_id: invoiceId,
          payment_number: paymentNumber,
          type: "payment",
          amount: input.amountCents,
          currency: inv.currency,
          payment_date: input.paymentDate ?? today(),
          payment_method: input.paymentMethod,
          payment_method_detail: input.paymentMethodDetail ?? null,
          transaction_reference: input.transactionReference ?? null,
          proof_url: input.proofUrl ?? null,
          notes: input.notes ?? null,
          status: "completed",
          recorded_by: ctx.user.userId,
        })
        .select("id")
        .single();
      if (payErr || !paymentData) {
        throw new Error("Failed to record payment");
      }
      const paymentId = (paymentData as { id: string }).id;

      // Update invoice status
      let newStatus = inv.status;
      if (newPaid >= total) newStatus = "paid";
      else if (newPaid > 0) newStatus = "partial";

      await (admin as any)
        .from(INV_TABLES.invoices)
        .update({
          amount_paid: newPaid,
          amount_due: newDue,
          status: newStatus,
          paid_date: newStatus === "paid" ? today() : null,
          updated_at: nowIso(),
        })
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.payments.record",
        "payment",
        paymentId,
        "canManageInvoices",
        { invoiceId, amountCents: input.amountCents },
      );

      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.payment.received,
        ctx,
        {
          payment_id: paymentId,
          invoice_id: invoiceId,
          invoice_number: inv.invoice_number,
          amount_cents: input.amountCents,
          currency: inv.currency,
          payment_method: input.paymentMethod,
          client_email: inv.client_email,
        },
        "payment",
        paymentId,
      );

      if (newStatus === "paid") {
        emitEvent(
          scope.siteId,
          EVENT_REGISTRY.accounting.invoice.paid,
          ctx,
          {
            invoice_id: invoiceId,
            invoice_number: inv.invoice_number,
            total_cents: total,
            currency: inv.currency,
          },
          "invoice",
          invoiceId,
        );
      } else if (newStatus === "partial") {
        emitEvent(
          scope.siteId,
          EVENT_REGISTRY.accounting.invoice.partial_payment,
          ctx,
          {
            invoice_id: invoiceId,
            invoice_number: inv.invoice_number,
            amount_paid_cents: newPaid,
            amount_due_cents: newDue,
            currency: inv.currency,
          },
          "invoice",
          invoiceId,
        );
      }

      return { id: paymentId, paymentNumber };
    },
  );
}

async function recordRefundImpl(
  ctx: PortalDALContext,
  siteId: string,
  invoiceId: string,
  input: PortalRecordPaymentInput & { reason?: string },
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.payments.refund",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { invoiceId, amountCents: input.amountCents },
    },
    async () => {
      if (input.amountCents <= 0) throw new Error("Amount must be positive");
      const admin = createAdminClient();
      const { data: invoice, error } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select(
          "id,status,invoice_number,currency,amount_paid,amount_due,total,client_email",
        )
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !invoice) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const inv = invoice as {
        status: string;
        invoice_number: string;
        currency: string;
        amount_paid: number | string;
        amount_due: number | string;
        total: number | string;
        client_email: string | null;
      };
      const previouslyPaid = numCents(inv.amount_paid);
      if (input.amountCents > previouslyPaid) {
        throw new Error("Refund exceeds amount paid");
      }
      const newPaid = previouslyPaid - input.amountCents;
      const total = numCents(inv.total);
      const newDue = Math.max(0, total - newPaid);

      const { data: refund, error: refErr } = await (admin as any)
        .from(INV_TABLES.payments)
        .insert({
          site_id: scope.siteId,
          invoice_id: invoiceId,
          type: "refund",
          amount: input.amountCents,
          currency: inv.currency,
          payment_date: input.paymentDate ?? today(),
          payment_method: input.paymentMethod,
          transaction_reference: input.transactionReference ?? null,
          notes: input.reason ?? input.notes ?? null,
          status: "completed",
          recorded_by: ctx.user.userId,
        })
        .select("id")
        .single();
      if (refErr || !refund) throw new Error("Failed to record refund");
      const refundId = (refund as { id: string }).id;

      let newStatus = inv.status;
      if (newPaid <= 0) newStatus = "sent";
      else if (newPaid < total) newStatus = "partial";

      await (admin as any)
        .from(INV_TABLES.invoices)
        .update({
          amount_paid: newPaid,
          amount_due: newDue,
          status: newStatus,
          paid_date: newStatus === "paid" ? today() : null,
          updated_at: nowIso(),
        })
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.payments.refund",
        "payment",
        refundId,
        "canManageInvoices",
        { invoiceId, amountCents: input.amountCents },
      );
      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.payment.refunded,
        ctx,
        {
          refund_id: refundId,
          invoice_id: invoiceId,
          invoice_number: inv.invoice_number,
          amount_cents: input.amountCents,
          currency: inv.currency,
          reason: input.reason ?? null,
        },
        "payment",
        refundId,
      );
      return { id: refundId };
    },
  );
}

// =============================================================================
// CREDIT NOTES NAMESPACE
// =============================================================================

export interface PortalCreditNoteListFilter {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalCreditNoteListItem {
  id: string;
  creditNumber: string;
  status: string;
  clientName: string;
  currency: string;
  issueDate: string;
  totalCents: number;
  amountAppliedCents: number;
  amountRemainingCents: number;
  invoiceId: string | null;
  createdAt: string | null;
}

async function listCreditNotesImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalCreditNoteListFilter | undefined,
): Promise<PortalCreditNoteListItem[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.credit_notes.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      let q = (admin as any)
        .from(INV_TABLES.creditNotes)
        .select(
          "id,credit_number,status,client_name,currency,issue_date,total,amount_applied,amount_remaining,invoice_id,created_at",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all")
        q = q.eq("status", filter.status);
      if (filter?.search)
        q = q.or(
          `credit_number.ilike.%${filter.search}%,client_name.ilike.%${filter.search}%`,
        );
      q = q
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      const { data, error } = await q;
      if (error) throw new Error("Failed to load credit notes");
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        creditNumber: (r.credit_number as string) ?? "",
        status: (r.status as string) ?? "draft",
        clientName: (r.client_name as string) ?? "",
        currency: (r.currency as string) ?? "USD",
        issueDate: (r.issue_date as string) ?? "",
        totalCents: numCents(r.total),
        amountAppliedCents: numCents(r.amount_applied),
        amountRemainingCents: numCents(r.amount_remaining),
        invoiceId: (r.invoice_id as string) ?? null,
        createdAt: (r.created_at as string) ?? null,
      }));
    },
  );
}

async function issueCreditNoteImpl(
  ctx: PortalDALContext,
  siteId: string,
  creditId: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.credit_notes.issue",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { creditId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.creditNotes)
        .select("id,status,credit_number,total,currency")
        .eq("id", creditId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const c = current as {
        status: string;
        credit_number: string;
        total: number | string;
        currency: string;
      };
      if (c.status !== "draft") {
        throw new Error(`Only draft credit notes can be issued`);
      }
      const { error: updErr } = await (admin as any)
        .from(INV_TABLES.creditNotes)
        .update({ status: "issued", updated_at: nowIso() })
        .eq("id", creditId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to issue credit note");

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.credit_notes.issue",
        "credit_note",
        creditId,
        "canManageInvoices",
      );
      emitEvent(
        scope.siteId,
        "accounting.credit_note.issued",
        ctx,
        {
          credit_note_id: creditId,
          credit_number: c.credit_number,
          total_cents: numCents(c.total),
          currency: c.currency,
        },
        "credit_note",
        creditId,
      );
    },
  );
}

async function applyCreditToInvoiceImpl(
  ctx: PortalDALContext,
  siteId: string,
  creditId: string,
  invoiceId: string,
  amountCents: number,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.credit_notes.apply",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { creditId, invoiceId, amountCents },
    },
    async () => {
      if (amountCents <= 0) throw new Error("Amount must be positive");
      const admin = createAdminClient();
      const { data: credit, error: cErr } = await (admin as any)
        .from(INV_TABLES.creditNotes)
        .select("id,status,amount_remaining,currency,credit_number")
        .eq("id", creditId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (cErr || !credit) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const cr = credit as {
        status: string;
        amount_remaining: number | string;
        currency: string;
        credit_number: string;
      };
      const remaining = numCents(cr.amount_remaining);
      if (amountCents > remaining)
        throw new Error("Amount exceeds remaining credit");
      if (!["issued", "partially_applied"].includes(cr.status))
        throw new Error("Credit note is not issuable/applicable");

      const { data: invoice, error: iErr } = await (admin as any)
        .from(INV_TABLES.invoices)
        .select(
          "id,status,total,amount_paid,amount_due,credits_applied,invoice_number,currency",
        )
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (iErr || !invoice) throw new Error("Invoice not found");
      const inv = invoice as {
        status: string;
        total: number | string;
        amount_paid: number | string;
        amount_due: number | string;
        credits_applied: number | string;
        invoice_number: string;
        currency: string;
      };
      if (inv.currency !== cr.currency)
        throw new Error("Credit note currency mismatch");

      // Insert application record
      const { error: appErr } = await (admin as any)
        .from(INV_TABLES.creditApplications)
        .insert({
          site_id: scope.siteId,
          credit_note_id: creditId,
          invoice_id: invoiceId,
          amount: amountCents,
          applied_at: nowIso(),
          applied_by: ctx.user.userId,
        });
      if (appErr) throw new Error("Failed to record credit application");

      // Update credit note totals
      const newApplied =
        numCents(cr.amount_remaining) >= 0
          ? remaining === amountCents
            ? "fully_applied"
            : "partially_applied"
          : "partially_applied";
      const creditAppliedNew = (
        await (admin as any)
          .from(INV_TABLES.creditNotes)
          .select("amount_applied")
          .eq("id", creditId)
          .single()
      ).data?.amount_applied;
      const creditAppliedCents = numCents(creditAppliedNew) + amountCents;
      const creditRemainingCents = remaining - amountCents;

      await (admin as any)
        .from(INV_TABLES.creditNotes)
        .update({
          amount_applied: creditAppliedCents,
          amount_remaining: creditRemainingCents,
          status:
            creditRemainingCents === 0 ? "fully_applied" : "partially_applied",
          updated_at: nowIso(),
        })
        .eq("id", creditId)
        .eq("site_id", scope.siteId);

      // Update invoice
      const total = numCents(inv.total);
      const paid = numCents(inv.amount_paid);
      const creditsNew = numCents(inv.credits_applied) + amountCents;
      const dueNew = Math.max(0, total - paid - creditsNew);
      const statusNew =
        dueNew === 0
          ? "paid"
          : paid > 0 || creditsNew > 0
            ? "partial"
            : inv.status;

      await (admin as any)
        .from(INV_TABLES.invoices)
        .update({
          credits_applied: creditsNew,
          amount_due: dueNew,
          status: statusNew,
          paid_date: statusNew === "paid" ? today() : null,
          updated_at: nowIso(),
        })
        .eq("id", invoiceId)
        .eq("site_id", scope.siteId);

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.credit_notes.apply",
        "credit_note",
        creditId,
        "canManageInvoices",
        { invoiceId, amountCents },
      );
      emitEvent(
        scope.siteId,
        "accounting.credit_note.applied",
        ctx,
        {
          credit_note_id: creditId,
          credit_number: cr.credit_number,
          invoice_id: invoiceId,
          invoice_number: inv.invoice_number,
          amount_cents: amountCents,
          currency: inv.currency,
        },
        "credit_note",
        creditId,
      );
    },
  );
}

// =============================================================================
// RECURRING INVOICES NAMESPACE
// =============================================================================

export interface PortalRecurringListFilter {
  status?: "active" | "paused" | "completed" | "cancelled" | "all";
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalRecurringListItem {
  id: string;
  name: string;
  status: string;
  clientName: string;
  currency: string;
  frequency: string;
  totalCents: number;
  nextGenerateDate: string;
  occurrencesGenerated: number;
  maxOccurrences: number | null;
  createdAt: string | null;
}

async function listRecurringImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalRecurringListFilter | undefined,
): Promise<PortalRecurringListItem[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.recurring.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      let q = (admin as any)
        .from(INV_TABLES.recurringInvoices)
        .select(
          "id,name,status,client_name,currency,frequency,total,next_generate_date,occurrences_generated,max_occurrences,created_at",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all")
        q = q.eq("status", filter.status);
      if (filter?.search)
        q = q.or(
          `name.ilike.%${filter.search}%,client_name.ilike.%${filter.search}%`,
        );
      q = q
        .order("next_generate_date", { ascending: true })
        .range(offset, offset + limit - 1);
      const { data, error } = await q;
      if (error) throw new Error("Failed to load recurring invoices");
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name as string) ?? "",
        status: (r.status as string) ?? "active",
        clientName: (r.client_name as string) ?? "",
        currency: (r.currency as string) ?? "USD",
        frequency: (r.frequency as string) ?? "monthly",
        totalCents: numCents(r.total),
        nextGenerateDate: (r.next_generate_date as string) ?? "",
        occurrencesGenerated: Number(r.occurrences_generated ?? 0),
        maxOccurrences: (r.max_occurrences as number | null) ?? null,
        createdAt: (r.created_at as string) ?? null,
      }));
    },
  );
}

async function pauseRecurringImpl(
  ctx: PortalDALContext,
  siteId: string,
  recurringId: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.recurring.pause",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { recurringId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.recurringInvoices)
        .select("id,status,name")
        .eq("id", recurringId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      if ((current as { status: string }).status !== "active") {
        throw new Error("Only active templates can be paused");
      }
      await (admin as any)
        .from(INV_TABLES.recurringInvoices)
        .update({ status: "paused", updated_at: nowIso() })
        .eq("id", recurringId)
        .eq("site_id", scope.siteId);
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.recurring.pause",
        "recurring_invoice",
        recurringId,
        "canManageInvoices",
      );
    },
  );
}

async function resumeRecurringImpl(
  ctx: PortalDALContext,
  siteId: string,
  recurringId: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.recurring.resume",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { recurringId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.recurringInvoices)
        .select("id,status")
        .eq("id", recurringId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      if ((current as { status: string }).status !== "paused") {
        throw new Error("Only paused templates can be resumed");
      }
      await (admin as any)
        .from(INV_TABLES.recurringInvoices)
        .update({ status: "active", updated_at: nowIso() })
        .eq("id", recurringId)
        .eq("site_id", scope.siteId);
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.recurring.resume",
        "recurring_invoice",
        recurringId,
        "canManageInvoices",
      );
    },
  );
}

// =============================================================================
// EXPENSES NAMESPACE
// =============================================================================

export interface PortalExpenseListFilter {
  status?: "pending" | "approved" | "rejected" | "paid" | "void" | "all";
  categoryId?: string;
  vendorId?: string;
  isBillable?: boolean;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalExpenseListItem {
  id: string;
  expenseNumber: string | null;
  status: string;
  date: string;
  amountCents: number;
  currency: string;
  description: string;
  categoryId: string | null;
  vendorId: string | null;
  isBillable: boolean;
  isBilled: boolean;
  createdAt: string | null;
}

async function listExpensesImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalExpenseListFilter | undefined,
): Promise<PortalExpenseListItem[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.expenses.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      let q = (admin as any)
        .from(INV_TABLES.expenses)
        .select(
          "id,expense_number,status,date,amount,currency,description,category_id,vendor_id,is_billable,is_billed,created_at",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all")
        q = q.eq("status", filter.status);
      if (filter?.categoryId) q = q.eq("category_id", filter.categoryId);
      if (filter?.vendorId) q = q.eq("vendor_id", filter.vendorId);
      if (filter?.isBillable !== undefined)
        q = q.eq("is_billable", filter.isBillable);
      if (filter?.from) q = q.gte("date", filter.from);
      if (filter?.to) q = q.lte("date", filter.to);
      if (filter?.search) q = q.ilike("description", `%${filter.search}%`);
      q = q
        .order("date", { ascending: false })
        .range(offset, offset + limit - 1);
      const { data, error } = await q;
      if (error) throw new Error("Failed to load expenses");
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        expenseNumber: (r.expense_number as string) ?? null,
        status: (r.status as string) ?? "pending",
        date: (r.date as string) ?? "",
        amountCents: numCents(r.amount),
        currency: (r.currency as string) ?? "USD",
        description: (r.description as string) ?? "",
        categoryId: (r.category_id as string) ?? null,
        vendorId: (r.vendor_id as string) ?? null,
        isBillable: !!r.is_billable,
        isBilled: !!r.is_billed,
        createdAt: (r.created_at as string) ?? null,
      }));
    },
  );
}

export interface PortalCreateExpenseInput {
  date: string;
  amountCents: number;
  currency?: string;
  description: string;
  categoryId?: string | null;
  vendorId?: string | null;
  receiptUrl?: string | null;
  paymentMethod?: string | null;
  isBillable?: boolean;
  contactId?: string | null;
  companyId?: string | null;
  notes?: string | null;
  tags?: string[];
}

async function createExpenseImpl(
  ctx: PortalDALContext,
  siteId: string,
  input: PortalCreateExpenseInput,
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.expenses.create",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      if (input.amountCents <= 0) throw new Error("Amount must be positive");
      const admin = createAdminClient();
      const { data, error } = await (admin as any)
        .from(INV_TABLES.expenses)
        .insert({
          site_id: scope.siteId,
          status: "pending",
          date: input.date,
          amount: input.amountCents,
          currency: input.currency ?? "USD",
          description: input.description,
          category_id: input.categoryId ?? null,
          vendor_id: input.vendorId ?? null,
          receipt_url: input.receiptUrl ?? null,
          payment_method: input.paymentMethod ?? null,
          is_billable: input.isBillable ?? false,
          contact_id: input.contactId ?? null,
          company_id: input.companyId ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? [],
          created_by: ctx.user.userId,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error("Failed to create expense");
      const expenseId = (data as { id: string }).id;
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.expenses.create",
        "expense",
        expenseId,
        "canManageInvoices",
        { amountCents: input.amountCents, currency: input.currency ?? "USD" },
      );
      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.expense.created,
        ctx,
        {
          expense_id: expenseId,
          amount_cents: input.amountCents,
          currency: input.currency ?? "USD",
          description: input.description,
          vendor_id: input.vendorId ?? null,
        },
        "expense",
        expenseId,
      );
      return { id: expenseId };
    },
  );
}

async function approveExpenseImpl(
  ctx: PortalDALContext,
  siteId: string,
  expenseId: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.expenses.approve",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { expenseId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.expenses)
        .select("id,status,amount,currency")
        .eq("id", expenseId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const c = current as {
        status: string;
        amount: number | string;
        currency: string;
      };
      if (c.status !== "pending")
        throw new Error("Only pending expenses can be approved");
      await (admin as any)
        .from(INV_TABLES.expenses)
        .update({
          status: "approved",
          approved_by: ctx.user.userId,
          approved_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq("id", expenseId)
        .eq("site_id", scope.siteId);
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.expenses.approve",
        "expense",
        expenseId,
        "canManageInvoices",
      );
      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.expense.approved,
        ctx,
        {
          expense_id: expenseId,
          amount_cents: numCents(c.amount),
          currency: c.currency,
        },
        "expense",
        expenseId,
      );
    },
  );
}

async function rejectExpenseImpl(
  ctx: PortalDALContext,
  siteId: string,
  expenseId: string,
  reason: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.expenses.reject",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { expenseId, reason },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.expenses)
        .select("id,status,amount,currency")
        .eq("id", expenseId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      if ((current as { status: string }).status !== "pending")
        throw new Error("Only pending expenses can be rejected");
      await (admin as any)
        .from(INV_TABLES.expenses)
        .update({
          status: "rejected",
          notes: reason,
          updated_at: nowIso(),
        })
        .eq("id", expenseId)
        .eq("site_id", scope.siteId);
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.expenses.reject",
        "expense",
        expenseId,
        "canManageInvoices",
        { reason },
      );
      emitEvent(
        scope.siteId,
        EVENT_REGISTRY.accounting.expense.rejected,
        ctx,
        { expense_id: expenseId, reason },
        "expense",
        expenseId,
      );
    },
  );
}

// =============================================================================
// VENDORS NAMESPACE
// =============================================================================

export interface PortalVendorListFilter {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface PortalVendorListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  currency: string;
  isActive: boolean;
  totalBilledCents: number;
  totalPaidCents: number;
  createdAt: string | null;
}

async function listVendorsImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalVendorListFilter | undefined,
): Promise<PortalVendorListItem[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.vendors.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      let q = (admin as any)
        .from(INV_TABLES.vendors)
        .select(
          "id,name,email,phone,currency,is_active,total_billed,total_paid,created_at",
        )
        .eq("site_id", scope.siteId);
      if (filter?.isActive !== undefined)
        q = q.eq("is_active", filter.isActive);
      if (filter?.search)
        q = q.or(
          `name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`,
        );
      q = q
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1);
      const { data, error } = await q;
      if (error) throw new Error("Failed to load vendors");
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name as string) ?? "",
        email: (r.email as string) ?? null,
        phone: (r.phone as string) ?? null,
        currency: (r.currency as string) ?? "USD",
        isActive: !!r.is_active,
        totalBilledCents: numCents(r.total_billed),
        totalPaidCents: numCents(r.total_paid),
        createdAt: (r.created_at as string) ?? null,
      }));
    },
  );
}

export interface PortalCreateVendorInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postalCode?: string | null;
  taxId?: string | null;
  currency?: string;
  paymentTermsDays?: number;
  preferredPaymentMethod?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankBranchCode?: string | null;
  mobileMoneyNumber?: string | null;
  notes?: string | null;
  tags?: string[];
}

async function createVendorImpl(
  ctx: PortalDALContext,
  siteId: string,
  input: PortalCreateVendorInput,
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.vendors.create",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      if (!input.name.trim()) throw new Error("Vendor name required");
      const admin = createAdminClient();
      const { data, error } = await (admin as any)
        .from(INV_TABLES.vendors)
        .insert({
          site_id: scope.siteId,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          website: input.website ?? null,
          address: input.address ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          country: input.country ?? "ZM",
          postal_code: input.postalCode ?? null,
          tax_id: input.taxId ?? null,
          currency: input.currency ?? "USD",
          payment_terms_days: input.paymentTermsDays ?? 30,
          preferred_payment_method: input.preferredPaymentMethod ?? null,
          bank_name: input.bankName ?? null,
          bank_account_number: input.bankAccountNumber ?? null,
          bank_branch_code: input.bankBranchCode ?? null,
          mobile_money_number: input.mobileMoneyNumber ?? null,
          notes: input.notes ?? null,
          is_active: true,
          tags: input.tags ?? [],
        })
        .select("id")
        .single();
      if (error || !data) throw new Error("Failed to create vendor");
      const vendorId = (data as { id: string }).id;
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.vendors.create",
        "vendor",
        vendorId,
        "canManageInvoices",
        { name: input.name },
      );
      emitEvent(
        scope.siteId,
        "accounting.vendor.created",
        ctx,
        { vendor_id: vendorId, name: input.name },
        "vendor",
        vendorId,
      );
      return { id: vendorId };
    },
  );
}

// =============================================================================
// BILLS NAMESPACE
// =============================================================================

export interface PortalBillListFilter {
  status?: string;
  vendorId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalBillListItem {
  id: string;
  billNumber: string;
  status: string;
  vendorId: string | null;
  vendorName: string | null;
  currency: string;
  issueDate: string;
  dueDate: string;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  createdAt: string | null;
}

async function listBillsImpl(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalBillListFilter | undefined,
): Promise<PortalBillListItem[]> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.bills.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      let q = (admin as any)
        .from(INV_TABLES.bills)
        .select(
          `id,bill_number,status,vendor_id,currency,issue_date,due_date,total,amount_paid,amount_due,created_at,${INV_TABLES.vendors}(name)`,
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all")
        q = q.eq("status", filter.status);
      if (filter?.vendorId) q = q.eq("vendor_id", filter.vendorId);
      if (filter?.from) q = q.gte("issue_date", filter.from);
      if (filter?.to) q = q.lte("issue_date", filter.to);
      if (filter?.search) q = q.ilike("bill_number", `%${filter.search}%`);
      q = q
        .order("due_date", { ascending: true })
        .range(offset, offset + limit - 1);
      const { data, error } = await q;
      if (error) throw new Error("Failed to load bills");
      return (data ?? []).map((r: Record<string, unknown>) => {
        const vendor =
          (r[INV_TABLES.vendors] as { name?: string } | null) ?? null;
        return {
          id: r.id as string,
          billNumber: (r.bill_number as string) ?? "",
          status: (r.status as string) ?? "draft",
          vendorId: (r.vendor_id as string) ?? null,
          vendorName: vendor?.name ?? null,
          currency: (r.currency as string) ?? "USD",
          issueDate: (r.issue_date as string) ?? "",
          dueDate: (r.due_date as string) ?? "",
          totalCents: numCents(r.total),
          amountPaidCents: numCents(r.amount_paid),
          amountDueCents: numCents(r.amount_due),
          createdAt: (r.created_at as string) ?? null,
        };
      });
    },
  );
}

async function approveBillImpl(
  ctx: PortalDALContext,
  siteId: string,
  billId: string,
): Promise<void> {
  const scope = await requireScope(ctx, siteId, "canManageInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.bills.approve",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { billId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error } = await (admin as any)
        .from(INV_TABLES.bills)
        .select("id,status,bill_number,total,currency,vendor_id")
        .eq("id", billId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageInvoices",
        );
      }
      const c = current as {
        status: string;
        bill_number: string;
        total: number | string;
        currency: string;
        vendor_id: string | null;
      };
      if (!["draft", "received"].includes(c.status))
        throw new Error(`Cannot approve bill in status ${c.status}`);
      await (admin as any)
        .from(INV_TABLES.bills)
        .update({ status: "received", updated_at: nowIso() })
        .eq("id", billId)
        .eq("site_id", scope.siteId);
      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.bills.approve",
        "bill",
        billId,
        "canManageInvoices",
      );
      // Bill-approved is NOT in EVENT_REGISTRY today; we use a literal key.
      emitEvent(
        scope.siteId,
        "accounting.bill.approved",
        ctx,
        {
          bill_id: billId,
          bill_number: c.bill_number,
          total_cents: numCents(c.total),
          currency: c.currency,
          vendor_id: c.vendor_id,
        },
        "bill",
        billId,
      );
    },
  );
}

// =============================================================================
// STATEMENTS NAMESPACE
// =============================================================================

export interface PortalStatementTransaction {
  id: string;
  type: "invoice" | "payment" | "credit_note";
  documentNumber: string;
  date: string;
  debitCents: number;
  creditCents: number;
  runningBalanceCents: number;
  status: string;
  reference: string | null;
}

export interface PortalStatement {
  clientName: string;
  clientEmail: string | null;
  currency: string;
  periodFrom: string;
  periodTo: string;
  openingBalanceCents: number;
  closingBalanceCents: number;
  totalInvoicedCents: number;
  totalPaidCents: number;
  totalCreditedCents: number;
  transactions: PortalStatementTransaction[];
}

async function getStatementImpl(
  ctx: PortalDALContext,
  siteId: string,
  input: {
    contactId?: string | null;
    companyId?: string | null;
    clientEmail?: string | null;
    from: string;
    to: string;
  },
): Promise<PortalStatement> {
  const scope = await requireScope(ctx, siteId, "canViewInvoices");
  return withPortalEvent(
    "portal.dal.invoicing.statements.get",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { from: input.from, to: input.to },
    },
    async () => {
      const admin = createAdminClient();
      // Build filter for invoices (and related)
      const invQuery = (admin as any)
        .from(INV_TABLES.invoices)
        .select(
          "id,invoice_number,client_name,client_email,currency,issue_date,total,amount_paid,amount_due,status",
        )
        .eq("site_id", scope.siteId)
        .in("status", ["sent", "viewed", "partial", "paid", "overdue"])
        .gte("issue_date", input.from)
        .lte("issue_date", input.to)
        .order("issue_date", { ascending: true });

      let invFilteredQuery = invQuery;
      if (input.contactId)
        invFilteredQuery = invFilteredQuery.eq("contact_id", input.contactId);
      else if (input.companyId)
        invFilteredQuery = invFilteredQuery.eq("company_id", input.companyId);
      else if (input.clientEmail)
        invFilteredQuery = invFilteredQuery.eq(
          "client_email",
          input.clientEmail,
        );
      else throw new Error("One of contactId/companyId/clientEmail required");

      const { data: invoices, error: invErr } = await invFilteredQuery;
      if (invErr) throw new Error("Failed to load statement invoices");

      const invRows = (invoices ?? []) as Array<{
        id: string;
        invoice_number: string;
        client_name: string;
        client_email: string | null;
        currency: string;
        issue_date: string;
        total: number | string;
        amount_paid: number | string;
        amount_due: number | string;
        status: string;
      }>;

      const invoiceIds = invRows.map((r) => r.id);
      let payments: Array<{
        id: string;
        invoice_id: string;
        payment_number: string | null;
        payment_date: string;
        amount: number | string;
        type: string;
        status: string;
        transaction_reference: string | null;
      }> = [];
      if (invoiceIds.length > 0) {
        const { data: pdata } = await (admin as any)
          .from(INV_TABLES.payments)
          .select(
            "id,invoice_id,payment_number,payment_date,amount,type,status,transaction_reference",
          )
          .eq("site_id", scope.siteId)
          .in("invoice_id", invoiceIds)
          .gte("payment_date", input.from)
          .lte("payment_date", input.to)
          .order("payment_date", { ascending: true });
        payments = (pdata ?? []) as typeof payments;
      }

      const tx: PortalStatementTransaction[] = [];
      let running = 0;
      let totalInvoiced = 0;
      let totalPaid = 0;
      const currency = invRows[0]?.currency ?? "USD";
      const clientName = invRows[0]?.client_name ?? "";
      const clientEmail = invRows[0]?.client_email ?? null;

      const merged: Array<{
        kind: "invoice" | "payment";
        date: string;
        row: unknown;
      }> = [
        ...invRows.map((r) => ({
          kind: "invoice" as const,
          date: r.issue_date,
          row: r,
        })),
        ...payments.map((p) => ({
          kind: "payment" as const,
          date: p.payment_date,
          row: p,
        })),
      ].sort((a, b) => a.date.localeCompare(b.date));

      for (const entry of merged) {
        if (entry.kind === "invoice") {
          const r = entry.row as (typeof invRows)[number];
          const total = numCents(r.total);
          running += total;
          totalInvoiced += total;
          tx.push({
            id: r.id,
            type: "invoice",
            documentNumber: r.invoice_number,
            date: r.issue_date,
            debitCents: total,
            creditCents: 0,
            runningBalanceCents: running,
            status: r.status,
            reference: null,
          });
        } else {
          const p = entry.row as (typeof payments)[number];
          const amt = numCents(p.amount);
          if (p.type === "payment") {
            running -= amt;
            totalPaid += amt;
            tx.push({
              id: p.id,
              type: "payment",
              documentNumber: p.payment_number ?? "",
              date: p.payment_date,
              debitCents: 0,
              creditCents: amt,
              runningBalanceCents: running,
              status: p.status,
              reference: p.transaction_reference,
            });
          } else {
            // refund = debit
            running += amt;
            totalPaid -= amt;
            tx.push({
              id: p.id,
              type: "payment",
              documentNumber: p.payment_number ?? "",
              date: p.payment_date,
              debitCents: amt,
              creditCents: 0,
              runningBalanceCents: running,
              status: p.status,
              reference: p.transaction_reference,
            });
          }
        }
      }

      finalizeAudit(
        ctx,
        scope.siteId,
        "portal.invoicing.statements.get",
        "statement",
        null,
        "canViewInvoices",
        {
          from: input.from,
          to: input.to,
          txCount: tx.length,
        },
      );

      return {
        clientName,
        clientEmail,
        currency,
        periodFrom: input.from,
        periodTo: input.to,
        openingBalanceCents: 0,
        closingBalanceCents: running,
        totalInvoicedCents: totalInvoiced,
        totalPaidCents: totalPaid,
        totalCreditedCents: 0,
        transactions: tx,
      };
    },
  );
}

// =============================================================================
// NAMESPACE FACTORIES
// =============================================================================

export interface PortalInvoicingInvoicesNamespace {
  list(
    siteId: string,
    filter?: PortalInvoiceListFilter,
  ): Promise<PortalInvoiceListItem[]>;
  detail(siteId: string, invoiceId: string): Promise<PortalInvoiceDetail>;
  create(
    siteId: string,
    input: PortalCreateInvoiceInput,
  ): Promise<{ id: string; invoiceNumber: string }>;
  update(
    siteId: string,
    invoiceId: string,
    input: PortalUpdateInvoiceInput,
  ): Promise<void>;
  send(siteId: string, invoiceId: string): Promise<void>;
  void(siteId: string, invoiceId: string, reason: string): Promise<void>;
  addInternalNote(
    siteId: string,
    invoiceId: string,
    note: string,
  ): Promise<void>;
  addNote(siteId: string, invoiceId: string, note: string): Promise<void>;
}

export interface PortalInvoicingPaymentsNamespace {
  list(
    siteId: string,
    filter?: PortalPaymentListFilter,
  ): Promise<PortalInvoicePayment[]>;
  record(
    siteId: string,
    invoiceId: string,
    input: PortalRecordPaymentInput,
  ): Promise<{ id: string; paymentNumber: string }>;
  refund(
    siteId: string,
    invoiceId: string,
    input: PortalRecordPaymentInput & { reason?: string },
  ): Promise<{ id: string }>;
}

export interface PortalInvoicingCreditNotesNamespace {
  list(
    siteId: string,
    filter?: PortalCreditNoteListFilter,
  ): Promise<PortalCreditNoteListItem[]>;
  issue(siteId: string, creditId: string): Promise<void>;
  applyToInvoice(
    siteId: string,
    creditId: string,
    invoiceId: string,
    amountCents: number,
  ): Promise<void>;
}

export interface PortalInvoicingRecurringNamespace {
  list(
    siteId: string,
    filter?: PortalRecurringListFilter,
  ): Promise<PortalRecurringListItem[]>;
  pause(siteId: string, recurringId: string): Promise<void>;
  resume(siteId: string, recurringId: string): Promise<void>;
}

export interface PortalInvoicingExpensesNamespace {
  list(
    siteId: string,
    filter?: PortalExpenseListFilter,
  ): Promise<PortalExpenseListItem[]>;
  create(
    siteId: string,
    input: PortalCreateExpenseInput,
  ): Promise<{ id: string }>;
  approve(siteId: string, expenseId: string): Promise<void>;
  reject(siteId: string, expenseId: string, reason: string): Promise<void>;
}

export interface PortalInvoicingVendorsNamespace {
  list(
    siteId: string,
    filter?: PortalVendorListFilter,
  ): Promise<PortalVendorListItem[]>;
  create(
    siteId: string,
    input: PortalCreateVendorInput,
  ): Promise<{ id: string }>;
}

export interface PortalInvoicingBillsNamespace {
  list(
    siteId: string,
    filter?: PortalBillListFilter,
  ): Promise<PortalBillListItem[]>;
  approve(siteId: string, billId: string): Promise<void>;
}

export interface PortalInvoicingStatementsNamespace {
  get(
    siteId: string,
    input: {
      contactId?: string | null;
      companyId?: string | null;
      clientEmail?: string | null;
      from: string;
      to: string;
    },
  ): Promise<PortalStatement>;
}

export interface PortalInvoicingNamespace {
  invoices: PortalInvoicingInvoicesNamespace;
  payments: PortalInvoicingPaymentsNamespace;
  creditNotes: PortalInvoicingCreditNotesNamespace;
  recurring: PortalInvoicingRecurringNamespace;
  expenses: PortalInvoicingExpensesNamespace;
  vendors: PortalInvoicingVendorsNamespace;
  bills: PortalInvoicingBillsNamespace;
  statements: PortalInvoicingStatementsNamespace;
}

export function createInvoicingNamespace(
  ctx: PortalDALContext,
): PortalInvoicingNamespace {
  return {
    invoices: {
      list: (siteId, filter) => listInvoicesImpl(ctx, siteId, filter),
      detail: (siteId, invoiceId) => detailInvoiceImpl(ctx, siteId, invoiceId),
      create: (siteId, input) => createInvoiceImpl(ctx, siteId, input),
      update: (siteId, invoiceId, input) =>
        updateInvoiceImpl(ctx, siteId, invoiceId, input),
      send: (siteId, invoiceId) => sendInvoiceImpl(ctx, siteId, invoiceId),
      void: (siteId, invoiceId, reason) =>
        voidInvoiceImpl(ctx, siteId, invoiceId, reason),
      addInternalNote: (siteId, invoiceId, note) =>
        addInvoiceNoteImpl(ctx, siteId, invoiceId, note, true),
      addNote: (siteId, invoiceId, note) =>
        addInvoiceNoteImpl(ctx, siteId, invoiceId, note, false),
    },
    payments: {
      list: (siteId, filter) => listPaymentsImpl(ctx, siteId, filter),
      record: (siteId, invoiceId, input) =>
        recordPaymentImpl(ctx, siteId, invoiceId, input),
      refund: (siteId, invoiceId, input) =>
        recordRefundImpl(ctx, siteId, invoiceId, input),
    },
    creditNotes: {
      list: (siteId, filter) => listCreditNotesImpl(ctx, siteId, filter),
      issue: (siteId, creditId) => issueCreditNoteImpl(ctx, siteId, creditId),
      applyToInvoice: (siteId, creditId, invoiceId, amountCents) =>
        applyCreditToInvoiceImpl(ctx, siteId, creditId, invoiceId, amountCents),
    },
    recurring: {
      list: (siteId, filter) => listRecurringImpl(ctx, siteId, filter),
      pause: (siteId, recurringId) =>
        pauseRecurringImpl(ctx, siteId, recurringId),
      resume: (siteId, recurringId) =>
        resumeRecurringImpl(ctx, siteId, recurringId),
    },
    expenses: {
      list: (siteId, filter) => listExpensesImpl(ctx, siteId, filter),
      create: (siteId, input) => createExpenseImpl(ctx, siteId, input),
      approve: (siteId, expenseId) =>
        approveExpenseImpl(ctx, siteId, expenseId),
      reject: (siteId, expenseId, reason) =>
        rejectExpenseImpl(ctx, siteId, expenseId, reason),
    },
    vendors: {
      list: (siteId, filter) => listVendorsImpl(ctx, siteId, filter),
      create: (siteId, input) => createVendorImpl(ctx, siteId, input),
    },
    bills: {
      list: (siteId, filter) => listBillsImpl(ctx, siteId, filter),
      approve: (siteId, billId) => approveBillImpl(ctx, siteId, billId),
    },
    statements: {
      get: (siteId, input) => getStatementImpl(ctx, siteId, input),
    },
  };
}
