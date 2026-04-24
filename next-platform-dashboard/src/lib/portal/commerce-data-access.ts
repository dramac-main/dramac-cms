import "server-only";

/**
 * Portal Commerce DAL (Session 3).
 *
 * Namespaces added here: orders, products, customers, quotes, bookings,
 * payments. Each method follows the Session 1+2 invariants:
 *
 *   1. Permission check via `requireScope(ctx, siteId, permission)` first.
 *      Denials write `portal_audit_log` and throw `PortalAccessDeniedError`.
 *   2. Defense-in-depth: every query filters by `site_id = scope.siteId`.
 *   3. Money columns are DECIMAL / NUMERIC in the DB (see §4.7 of the
 *      session brief). All arithmetic and sums go through `money.ts`
 *      helpers; display formatting is up to the caller via
 *      `formatCurrency` (from `@/lib/locale-config`).
 *   4. Every read/write emits a structured event via `withPortalEvent` and
 *      sensitive operations (PII view, writes) write a fire-and-forget
 *      audit entry via `writePortalAudit`.
 *   5. Writes emit an automation event via `logAutomationEvent` using the
 *      `EVENT_REGISTRY` keys so downstream automations fire for portal
 *      actions identically to agency actions.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalPermissionKey,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { logPortalEvent, withPortalEvent } from "./observability";
import { toCents } from "@/lib/money";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { EVENT_REGISTRY } from "@/modules/automation/lib/event-types";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";

// =============================================================================
// SHARED: require scope (duplicate of data-access internal — kept local so this
// module has no cross-file mutable dependency on the main DAL).
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

// =============================================================================
// SHARED: minor-unit helpers
// =============================================================================

/** Safely convert a (possibly string) DECIMAL to integer cents, clamped to ≥0. */
function decimalToCents(v: unknown): number {
  const c = toCents(v as string | number | null | undefined);
  return c < 0 ? 0 : c;
}

/** Extract the first image URL from a products.images Json array. */
function firstImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first) {
    const u = (first as { url: unknown }).url;
    return typeof u === "string" ? u : null;
  }
  return null;
}

// =============================================================================
// ORDERS NAMESPACE
// =============================================================================

export type PortalOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PortalOrderPaymentStatus =
  | "pending"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";

export interface PortalOrderListFilter {
  status?: PortalOrderStatus | "all";
  paymentStatus?: PortalOrderPaymentStatus | "all";
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface PortalOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalCents: number;
  currency: string;
  itemCount: number;
  createdAt: string | null;
}

export interface PortalOrderItemDetail {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  fulfilledQuantity: number;
  imageUrl: string | null;
}

export interface PortalOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
  paymentMethod: string | null;
  paymentProvider: string | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: Record<string, unknown> | null;
  billingAddress: Record<string, unknown> | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: PortalOrderItemDetail[];
}

interface OrderListRow {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  fulfillment_status: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total: number | string | null;
  currency: string | null;
  created_at: string | null;
}

interface OrderDetailRow {
  id: string;
  site_id: string;
  agency_id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  fulfillment_status: string | null;
  payment_method: string | null;
  payment_provider: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  subtotal: number | string | null;
  discount_amount: number | string | null;
  shipping_amount: number | string | null;
  tax_amount: number | string | null;
  total: number | string | null;
  currency: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

interface OrderItemRow {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number | string | null;
  total_price: number | string | null;
  fulfilled_quantity: number | null;
  image_url: string | null;
}

const VALID_ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

async function listOrders(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalOrderListFilter | undefined,
): Promise<PortalOrderListItem[]> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.orders.list",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      let q = admin
        .from("mod_ecommod01_orders")
        .select(
          "id, order_number, status, payment_status, fulfillment_status, customer_name, customer_email, total, currency, created_at",
        )
        .eq("site_id", scope.siteId);

      if (filter?.status && filter.status !== "all") {
        q = q.eq("status", filter.status);
      }
      if (filter?.paymentStatus && filter.paymentStatus !== "all") {
        q = q.eq("payment_status", filter.paymentStatus);
      }
      if (filter?.search) {
        const s = `%${filter.search.replace(/[%_]/g, "\\$&")}%`;
        q = q.or(
          `order_number.ilike.${s},customer_name.ilike.${s},customer_email.ilike.${s}`,
        );
      }
      if (filter?.from) q = q.gte("created_at", filter.from);
      if (filter?.to) q = q.lte("created_at", filter.to);

      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);

      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logPortalEvent({
          event: "portal.dal.orders.list_error",
          level: "error",
          ok: false,
          agencyId: ctx.user.agencyId,
          siteId: scope.siteId,
          error: error.message,
        });
        throw new Error("Failed to load orders");
      }

      const rows = (data ?? []) as OrderListRow[];

      // Batched item count (single query) rather than N+1.
      const ids = rows.map((r) => r.id);
      const countMap = new Map<string, number>();
      if (ids.length) {
        const { data: items } = await admin
          .from("mod_ecommod01_order_items")
          .select("order_id, quantity")
          .in("order_id", ids);
        for (const it of (items ?? []) as Array<{
          order_id: string;
          quantity: number | null;
        }>) {
          countMap.set(
            it.order_id,
            (countMap.get(it.order_id) ?? 0) + (it.quantity ?? 0),
          );
        }
      }

      return rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        status: r.status ?? "unknown",
        paymentStatus: r.payment_status,
        fulfillmentStatus: r.fulfillment_status,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        totalCents: decimalToCents(r.total),
        currency: r.currency ?? "USD",
        itemCount: countMap.get(r.id) ?? 0,
        createdAt: r.created_at,
      }));
    },
  );
}

async function detailOrder(
  ctx: PortalDALContext,
  siteId: string,
  orderId: string,
): Promise<PortalOrderDetail> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.orders.detail",
    {
      agencyId: ctx.user.agencyId,
      clientId: ctx.user.clientId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { orderId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: order, error } = await admin
        .from("mod_ecommod01_orders")
        .select("*")
        .eq("id", orderId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !order) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageOrders",
        );
      }

      const { data: items } = await admin
        .from("mod_ecommod01_order_items")
        .select(
          "id, product_id, variant_id, product_name, product_sku, quantity, unit_price, total_price, fulfilled_quantity, image_url",
        )
        .eq("order_id", orderId);

      const o = order as OrderDetailRow;
      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.orders.detail.view",
        resourceType: "order",
        resourceId: orderId,
        permissionKey: "canManageOrders",
      }).catch(() => {});

      return {
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        paymentStatus: o.payment_status,
        fulfillmentStatus: o.fulfillment_status,
        paymentMethod: o.payment_method,
        paymentProvider: o.payment_provider,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        shippingAddress: o.shipping_address,
        billingAddress: o.billing_address,
        subtotalCents: decimalToCents(o.subtotal),
        discountCents: decimalToCents(o.discount_amount),
        shippingCents: decimalToCents(o.shipping_amount),
        taxCents: decimalToCents(o.tax_amount),
        totalCents: decimalToCents(o.total),
        currency: o.currency ?? "USD",
        shippingMethod: o.shipping_method,
        trackingNumber: o.tracking_number,
        trackingUrl: o.tracking_url,
        shippedAt: o.shipped_at,
        deliveredAt: o.delivered_at,
        customerNotes: o.customer_notes,
        internalNotes: o.internal_notes,
        metadata: o.metadata,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        items: ((items ?? []) as OrderItemRow[]).map((it) => ({
          id: it.id,
          productId: it.product_id,
          variantId: it.variant_id,
          productName: it.product_name,
          productSku: it.product_sku,
          quantity: it.quantity,
          unitPriceCents: decimalToCents(it.unit_price),
          totalPriceCents: decimalToCents(it.total_price),
          fulfilledQuantity: it.fulfilled_quantity ?? 0,
          imageUrl: it.image_url,
        })),
      };
    },
  );
}

async function updateOrderStatus(
  ctx: PortalDALContext,
  siteId: string,
  orderId: string,
  input: { status: PortalOrderStatus; internalNote?: string },
): Promise<{ id: string; status: string }> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.orders.update_status",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { orderId, status: input.status },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error: fetchErr } = await admin
        .from("mod_ecommod01_orders")
        .select("id, status, agency_id, customer_email, total, currency")
        .eq("id", orderId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (fetchErr || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageOrders",
        );
      }

      const prevStatus = current.status ?? "pending";
      const allowed = VALID_ORDER_TRANSITIONS[prevStatus] ?? [];
      if (!allowed.includes(input.status)) {
        throw new Error(
          `Invalid status transition: ${prevStatus} → ${input.status}`,
        );
      }

      const update: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.internalNote) {
        update.internal_notes = input.internalNote;
      }

      const { error: updErr } = await admin
        .from("mod_ecommod01_orders")
        .update(update)
        .eq("id", orderId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to update order status");

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.orders.status_changed",
        resourceType: "order",
        resourceId: orderId,
        permissionKey: "canManageOrders",
        metadata: {
          from: current.status,
          to: input.status,
        },
      }).catch(() => {});

      logAutomationEvent(
        scope.siteId,
        EVENT_REGISTRY.ecommerce.order.status_changed,
        {
          order_id: orderId,
          previous_status: current.status,
          new_status: input.status,
          customer_email: current.customer_email,
          source: "portal",
          actor_user_id: ctx.user.userId,
          is_impersonation: ctx.isImpersonation,
        },
        {
          sourceModule: "portal",
          sourceEntityType: "order",
          sourceEntityId: orderId,
        },
      ).catch(() => {});

      return { id: orderId, status: input.status };
    },
  );
}

async function recordOrderShipment(
  ctx: PortalDALContext,
  siteId: string,
  orderId: string,
  input: {
    trackingNumber: string;
    carrier?: string;
    trackingUrl?: string;
    shippedAt?: string;
  },
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.orders.record_shipment",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { orderId },
    },
    async () => {
      if (!input.trackingNumber || input.trackingNumber.length < 2) {
        throw new Error("trackingNumber is required");
      }
      const admin = createAdminClient();
      const shippedAt = input.shippedAt ?? new Date().toISOString();

      const { error } = await admin
        .from("mod_ecommod01_orders")
        .update({
          status: "shipped",
          fulfillment_status: "fulfilled",
          tracking_number: input.trackingNumber,
          tracking_url: input.trackingUrl ?? null,
          shipping_method: input.carrier ?? null,
          shipped_at: shippedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("site_id", scope.siteId);
      if (error) throw new Error("Failed to record shipment");

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.orders.shipment_recorded",
        resourceType: "order",
        resourceId: orderId,
        permissionKey: "canManageOrders",
        metadata: {
          tracking_number: input.trackingNumber,
          carrier: input.carrier ?? null,
        },
      }).catch(() => {});

      logAutomationEvent(
        scope.siteId,
        EVENT_REGISTRY.ecommerce.order.shipped,
        {
          order_id: orderId,
          tracking_number: input.trackingNumber,
          carrier: input.carrier ?? null,
          source: "portal",
          actor_user_id: ctx.user.userId,
        },
        {
          sourceModule: "portal",
          sourceEntityType: "order",
          sourceEntityId: orderId,
        },
      ).catch(() => {});

      return { id: orderId };
    },
  );
}

async function issueOrderRefund(
  ctx: PortalDALContext,
  siteId: string,
  orderId: string,
  input: { amountCents: number; reason: string },
): Promise<{ id: string; amountCents: number }> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.orders.issue_refund",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { orderId, amountCents: input.amountCents },
    },
    async () => {
      if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
        throw new Error("amountCents must be a positive integer");
      }
      if (!input.reason || input.reason.trim().length < 3) {
        throw new Error("reason is required");
      }
      const admin = createAdminClient();

      const { data: order, error: loadErr } = await admin
        .from("mod_ecommod01_orders")
        .select("id, total, payment_status")
        .eq("id", orderId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (loadErr || !order) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageOrders",
        );
      }
      const totalCents = decimalToCents(order.total);
      if (input.amountCents > totalCents) {
        throw new Error("Refund amount exceeds order total");
      }
      const isFull = input.amountCents === totalCents;
      const newPaymentStatus = isFull ? "refunded" : "partially_refunded";

      const { error: updErr } = await admin
        .from("mod_ecommod01_orders")
        .update({
          payment_status: newPaymentStatus,
          status: isFull ? "refunded" : order.payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to update order for refund");

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.orders.refund_issued",
        resourceType: "order",
        resourceId: orderId,
        permissionKey: "canManageOrders",
        metadata: {
          amount_cents: input.amountCents,
          reason: input.reason,
          is_full: isFull,
        },
      }).catch(() => {});

      logAutomationEvent(
        scope.siteId,
        EVENT_REGISTRY.ecommerce.order.refunded,
        {
          order_id: orderId,
          amount_cents: input.amountCents,
          reason: input.reason,
          is_full: isFull,
          source: "portal",
          actor_user_id: ctx.user.userId,
        },
        {
          sourceModule: "portal",
          sourceEntityType: "order",
          sourceEntityId: orderId,
        },
      ).catch(() => {});

      return { id: orderId, amountCents: input.amountCents };
    },
  );
}

async function addOrderInternalNote(
  ctx: PortalDALContext,
  siteId: string,
  orderId: string,
  input: { note: string },
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.orders.internal_note",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { orderId },
    },
    async () => {
      const trimmed = input.note?.trim();
      if (!trimmed) throw new Error("Note cannot be empty");
      const admin = createAdminClient();
      const { data: current } = await admin
        .from("mod_ecommod01_orders")
        .select("internal_notes")
        .eq("id", orderId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (!current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageOrders",
        );
      }
      const stamp = new Date().toISOString();
      const line = `[${stamp}] (${ctx.user.fullName}) ${trimmed}`;
      const next = current.internal_notes
        ? `${current.internal_notes}\n${line}`
        : line;
      const { error } = await admin
        .from("mod_ecommod01_orders")
        .update({ internal_notes: next, updated_at: stamp })
        .eq("id", orderId)
        .eq("site_id", scope.siteId);
      if (error) throw new Error("Failed to add internal note");

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.orders.note_added",
        resourceType: "order",
        resourceId: orderId,
        permissionKey: "canManageOrders",
      }).catch(() => {});

      return { id: orderId };
    },
  );
}

export interface PortalOrdersNamespaceExtensions {
  list(
    siteId: string,
    filter?: PortalOrderListFilter,
  ): Promise<PortalOrderListItem[]>;
  detail(siteId: string, orderId: string): Promise<PortalOrderDetail>;
  updateStatus(
    siteId: string,
    orderId: string,
    input: { status: PortalOrderStatus; internalNote?: string },
  ): Promise<{ id: string; status: string }>;
  recordShipment(
    siteId: string,
    orderId: string,
    input: {
      trackingNumber: string;
      carrier?: string;
      trackingUrl?: string;
      shippedAt?: string;
    },
  ): Promise<{ id: string }>;
  issueRefund(
    siteId: string,
    orderId: string,
    input: { amountCents: number; reason: string },
  ): Promise<{ id: string; amountCents: number }>;
  addInternalNote(
    siteId: string,
    orderId: string,
    input: { note: string },
  ): Promise<{ id: string }>;
}

export function createOrdersNamespaceExtensions(
  ctx: PortalDALContext,
): PortalOrdersNamespaceExtensions {
  return {
    list: (siteId, filter) => listOrders(ctx, siteId, filter),
    detail: (siteId, orderId) => detailOrder(ctx, siteId, orderId),
    updateStatus: (siteId, orderId, input) =>
      updateOrderStatus(ctx, siteId, orderId, input),
    recordShipment: (siteId, orderId, input) =>
      recordOrderShipment(ctx, siteId, orderId, input),
    issueRefund: (siteId, orderId, input) =>
      issueOrderRefund(ctx, siteId, orderId, input),
    addInternalNote: (siteId, orderId, input) =>
      addOrderInternalNote(ctx, siteId, orderId, input),
  };
}

// =============================================================================
// PRODUCTS NAMESPACE
// =============================================================================

export interface PortalProductListFilter {
  search?: string;
  status?: "active" | "draft" | "archived" | "all";
  lowStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface PortalProductListItem {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  sku: string | null;
  basePriceCents: number;
  currency: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  imageUrl: string | null;
  createdAt: string | null;
}

export interface PortalProductDetail extends PortalProductListItem {
  description: string | null;
  comparePriceCents: number;
  costPriceCents: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight: number | null;
  metadata: Record<string, unknown> | null;
  variants: Array<{
    id: string;
    sku: string | null;
    optionValues: Record<string, unknown> | null;
    priceCents: number;
    stockQuantity: number | null;
  }>;
}

export interface PortalLowStockAlert {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string | null;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  currentAlertLevel: string | null;
  lastAlertedAt: string | null;
  currentStock: number | null;
}

interface ProductListRow {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  sku: string | null;
  base_price: number | string | null;
  quantity: number | null;
  low_stock_threshold: number | null;
  images: unknown;
  created_at: string | null;
}

interface ProductDetailRow extends ProductListRow {
  site_id: string;
  agency_id: string;
  description: string | null;
  compare_at_price: number | string | null;
  cost_price: number | string | null;
  track_inventory: boolean | null;
  weight: number | string | null;
  metadata: Record<string, unknown> | null;
}

interface ProductVariantRow {
  id: string;
  sku: string | null;
  options: Record<string, unknown> | null;
  price: number | string | null;
  quantity: number | null;
  image_url: string | null;
}

async function listProducts(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalProductListFilter | undefined,
): Promise<PortalProductListItem[]> {
  const scope = await requireScope(ctx, siteId, "canManageProducts");
  return withPortalEvent(
    "portal.dal.products.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      let q = admin
        .from("mod_ecommod01_products")
        .select(
          "id, name, slug, status, sku, base_price, quantity, low_stock_threshold, images, created_at",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all") {
        q = q.eq("status", filter.status);
      }
      if (filter?.search) {
        const s = `%${filter.search.replace(/[%_]/g, "\\$&")}%`;
        q = q.or(`name.ilike.${s},sku.ilike.${s}`);
      }
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error("Failed to load products");

      const rows = (data ?? []) as unknown as ProductListRow[];
      const mapped = rows.map((r) => {
        const threshold = r.low_stock_threshold ?? 5;
        const stock = r.quantity;
        const isLow = stock !== null && stock <= threshold;
        const imageUrl = firstImageUrl(r.images);
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          status: r.status,
          sku: r.sku,
          basePriceCents: decimalToCents(r.base_price),
          currency: "USD",
          stockQuantity: stock,
          lowStockThreshold: threshold,
          isLowStock: isLow,
          imageUrl,
          createdAt: r.created_at,
        };
      });
      return filter?.lowStockOnly
        ? mapped.filter((p) => p.isLowStock)
        : mapped;
    },
  );
}

async function detailProduct(
  ctx: PortalDALContext,
  siteId: string,
  productId: string,
): Promise<PortalProductDetail> {
  const scope = await requireScope(ctx, siteId, "canManageProducts");
  return withPortalEvent(
    "portal.dal.products.detail",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { productId },
    },
    async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("mod_ecommod01_products")
        .select("*")
        .eq("id", productId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !data) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageProducts",
        );
      }
      const { data: variants } = await admin
        .from("mod_ecommod01_product_variants")
        .select("id, sku, options, price, quantity, image_url")
        .eq("product_id", productId);

      const p = data as unknown as ProductDetailRow;
      const threshold = p.low_stock_threshold ?? 5;
      const stock = p.quantity;
      const isLow = stock !== null && stock <= threshold;
      const imageUrl = firstImageUrl(p.images);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        sku: p.sku,
        basePriceCents: decimalToCents(p.base_price),
        currency: "USD",
        stockQuantity: stock,
        lowStockThreshold: threshold,
        isLowStock: isLow,
        imageUrl,
        createdAt: p.created_at,
        description: p.description,
        comparePriceCents: decimalToCents(p.compare_at_price),
        costPriceCents: decimalToCents(p.cost_price),
        trackInventory: p.track_inventory ?? true,
        allowBackorder: false,
        weight: p.weight === null ? null : Number(p.weight),
        metadata: p.metadata,
        variants: ((variants ?? []) as unknown as ProductVariantRow[]).map((v) => ({
          id: v.id,
          sku: v.sku,
          optionValues: v.options,
          priceCents: decimalToCents(v.price),
          stockQuantity: v.quantity,
        })),
      };
    },
  );
}

async function adjustProductInventory(
  ctx: PortalDALContext,
  siteId: string,
  productId: string,
  input: { variantId?: string | null; delta: number; reason: string },
): Promise<{ newStock: number; lowStockTriggered: boolean }> {
  const scope = await requireScope(ctx, siteId, "canManageProducts");
  return withPortalEvent(
    "portal.dal.products.adjust_inventory",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { productId, variantId: input.variantId ?? null, delta: input.delta },
    },
    async () => {
      if (!Number.isInteger(input.delta) || input.delta === 0) {
        throw new Error("delta must be a non-zero integer");
      }
      if (!input.reason || input.reason.trim().length < 2) {
        throw new Error("reason is required");
      }
      const admin = createAdminClient();

      // Target table: product or variant
      const useVariant = !!input.variantId;
      const whereId = useVariant ? input.variantId! : productId;

      // Load current stock from the appropriate table.
      let prevStock: number | null = null;
      let rootProductId: string = productId;
      if (useVariant) {
        const { data: variant, error: loadErr } = await admin
          .from("mod_ecommod01_product_variants")
          .select("id, quantity, product_id")
          .eq("id", whereId)
          .maybeSingle();
        if (loadErr || !variant) {
          throw new PortalAccessDeniedError(
            "site_not_found",
            siteId,
            "canManageProducts",
          );
        }
        prevStock = variant.quantity;
        rootProductId = variant.product_id ?? productId;
      } else {
        const { data: product, error: loadErr } = await admin
          .from("mod_ecommod01_products")
          .select("id, quantity")
          .eq("id", whereId)
          .maybeSingle();
        if (loadErr || !product) {
          throw new PortalAccessDeniedError(
            "site_not_found",
            siteId,
            "canManageProducts",
          );
        }
        prevStock = product.quantity;
      }

      // Defense-in-depth: verify the product belongs to this site.
      const { data: root } = await admin
        .from("mod_ecommod01_products")
        .select("id, site_id, name, low_stock_threshold, quantity")
        .eq("id", rootProductId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (!root) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageProducts",
        );
      }

      const base = prevStock ?? 0;
      const newStock = base + input.delta;
      if (newStock < 0) throw new Error("Stock cannot go negative");

      if (useVariant) {
        const { error: updErr } = await admin
          .from("mod_ecommod01_product_variants")
          .update({ quantity: newStock })
          .eq("id", whereId);
        if (updErr) throw new Error("Failed to adjust inventory");
      } else {
        const { error: updErr } = await admin
          .from("mod_ecommod01_products")
          .update({
            quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", whereId);
        if (updErr) throw new Error("Failed to adjust inventory");
      }

      // Record inventory movement
      await admin
        .from("mod_ecommod01_inventory_movements")
        .insert({
          site_id: scope.siteId,
          product_id: rootProductId,
          variant_id: useVariant ? input.variantId : null,
          type: input.delta > 0 ? "adjustment_in" : "adjustment_out",
          quantity: Math.abs(input.delta),
          previous_stock: base,
          new_stock: newStock,
          reason: input.reason,
          reference_type: "portal",
          reference_id: ctx.user.userId,
          created_by: ctx.user.userId,
        } as never)
        .then(() => null, () => null);

      const threshold = root.low_stock_threshold ?? 5;
      const wasLow = base <= threshold;
      const isLow = newStock <= threshold;
      const lowStockTriggered = !wasLow && isLow;

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.products.inventory_adjusted",
        resourceType: "product",
        resourceId: rootProductId,
        permissionKey: "canManageProducts",
        metadata: {
          variant_id: input.variantId ?? null,
          delta: input.delta,
          previous_stock: base,
          new_stock: newStock,
          reason: input.reason,
        },
      }).catch(() => {});

      if (lowStockTriggered) {
        logAutomationEvent(
          scope.siteId,
          newStock === 0
            ? EVENT_REGISTRY.ecommerce.product.out_of_stock
            : EVENT_REGISTRY.ecommerce.product.low_stock,
          {
            product_id: rootProductId,
            variant_id: input.variantId ?? null,
            product_name: root.name,
            stock_quantity: newStock,
            threshold,
            source: "portal",
            actor_user_id: ctx.user.userId,
          },
          {
            sourceModule: "portal",
            sourceEntityType: "product",
            sourceEntityId: rootProductId,
          },
        ).catch(() => {});
      }

      return { newStock, lowStockTriggered };
    },
  );
}

async function listLowStockAlerts(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalLowStockAlert[]> {
  const scope = await requireScope(ctx, siteId, "canManageProducts");
  return withPortalEvent(
    "portal.dal.products.low_stock_alerts",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      // Strategy: compute active low-stock candidates by joining products with
      // their threshold. Fallback to stock_alerts table if present.
      const { data: products, error } = await admin
        .from("mod_ecommod01_products")
        .select("id, name, quantity, low_stock_threshold, track_inventory")
        .eq("site_id", scope.siteId);
      if (error) throw new Error("Failed to load low-stock products");

      const alerts: PortalLowStockAlert[] = [];
      for (const p of (products ?? []) as Array<{
        id: string;
        name: string | null;
        quantity: number | null;
        low_stock_threshold: number | null;
        track_inventory: boolean | null;
      }>) {
        if (p.track_inventory === false) continue;
        const threshold = p.low_stock_threshold ?? 5;
        const stock = p.quantity ?? 0;
        if (stock > threshold) continue;
        const level =
          stock === 0 ? "out" : stock <= Math.max(1, Math.floor(threshold / 3)) ? "critical" : "low";
        alerts.push({
          id: p.id,
          productId: p.id,
          variantId: null,
          productName: p.name,
          lowStockThreshold: threshold,
          criticalStockThreshold: Math.max(1, Math.floor(threshold / 3)),
          currentAlertLevel: level,
          lastAlertedAt: null,
          currentStock: stock,
        });
      }
      alerts.sort((a, b) => (a.currentStock ?? 0) - (b.currentStock ?? 0));
      return alerts;
    },
  );
}

export interface PortalProductsNamespace {
  list(
    siteId: string,
    filter?: PortalProductListFilter,
  ): Promise<PortalProductListItem[]>;
  detail(siteId: string, productId: string): Promise<PortalProductDetail>;
  adjustInventory(
    siteId: string,
    productId: string,
    input: { variantId?: string | null; delta: number; reason: string },
  ): Promise<{ newStock: number; lowStockTriggered: boolean }>;
  lowStockAlerts(siteId: string): Promise<PortalLowStockAlert[]>;
}

export function createProductsNamespace(
  ctx: PortalDALContext,
): PortalProductsNamespace {
  return {
    list: (siteId, filter) => listProducts(ctx, siteId, filter),
    detail: (siteId, productId) => detailProduct(ctx, siteId, productId),
    adjustInventory: (siteId, productId, input) =>
      adjustProductInventory(ctx, siteId, productId, input),
    lowStockAlerts: (siteId) => listLowStockAlerts(ctx, siteId),
  };
}

// =============================================================================
// CUSTOMERS NAMESPACE (read-only)
// =============================================================================

export interface PortalCustomerListFilter {
  search?: string;
  status?: "active" | "inactive" | "guest" | "all";
  limit?: number;
  offset?: number;
}

export interface PortalCustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  ordersCount: number;
  totalSpentCents: number;
  averageOrderValueCents: number;
  tags: string[];
  createdAt: string | null;
  lastOrderAt: string | null;
}

export interface PortalCustomerDetail extends PortalCustomerListItem {
  acceptsMarketing: boolean;
  marketingOptInAt: string | null;
  lastSeenAt: string | null;
  metadata: Record<string, unknown> | null;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string | null;
  }>;
}

interface CustomerListRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string | null;
  orders_count: number | null;
  total_spent: number | null;
  average_order_value: number | null;
  tags: string[] | null;
  created_at: string | null;
  last_order_date: string | null;
}

async function listCustomers(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalCustomerListFilter | undefined,
): Promise<PortalCustomerListItem[]> {
  const scope = await requireScope(ctx, siteId, "canManageCustomers");
  return withPortalEvent(
    "portal.dal.customers.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      let q = admin
        .from("mod_ecommod01_customers")
        .select(
          "id, first_name, last_name, email, phone, status, orders_count, total_spent, average_order_value, tags, created_at, last_order_date",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all") {
        q = q.eq("status", filter.status);
      }
      if (filter?.search) {
        const s = `%${filter.search.replace(/[%_]/g, "\\$&")}%`;
        q = q.or(
          `first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s}`,
        );
      }
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error("Failed to load customers");

      // `total_spent` / `average_order_value` are stored in cents already (INTEGER).
      return ((data ?? []) as CustomerListRow[]).map((r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        status: r.status ?? "active",
        ordersCount: r.orders_count ?? 0,
        totalSpentCents: Math.max(0, Number(r.total_spent ?? 0)),
        averageOrderValueCents: Math.max(0, Number(r.average_order_value ?? 0)),
        tags: r.tags ?? [],
        createdAt: r.created_at,
        lastOrderAt: r.last_order_date,
      }));
    },
  );
}

async function detailCustomer(
  ctx: PortalDALContext,
  siteId: string,
  customerId: string,
): Promise<PortalCustomerDetail> {
  const scope = await requireScope(ctx, siteId, "canManageCustomers");
  return withPortalEvent(
    "portal.dal.customers.detail",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { customerId },
    },
    async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("mod_ecommod01_customers")
        .select("*")
        .eq("id", customerId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !data) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageCustomers",
        );
      }

      const { data: orders } = await admin
        .from("mod_ecommod01_orders")
        .select("id, order_number, status, total, currency, created_at")
        .eq("site_id", scope.siteId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(10);

      const c = data as CustomerListRow & {
        accepts_marketing: boolean | null;
        marketing_opt_in_at: string | null;
        last_seen_at: string | null;
        metadata: Record<string, unknown> | null;
      };

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.customers.detail.view",
        resourceType: "customer",
        resourceId: customerId,
        permissionKey: "canManageCustomers",
      }).catch(() => {});

      return {
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        status: c.status ?? "active",
        ordersCount: c.orders_count ?? 0,
        totalSpentCents: Math.max(0, Number(c.total_spent ?? 0)),
        averageOrderValueCents: Math.max(0, Number(c.average_order_value ?? 0)),
        tags: c.tags ?? [],
        createdAt: c.created_at,
        lastOrderAt: c.last_order_date,
        acceptsMarketing: c.accepts_marketing ?? false,
        marketingOptInAt: c.marketing_opt_in_at,
        lastSeenAt: c.last_seen_at,
        metadata: c.metadata,
        recentOrders: ((orders ?? []) as Array<{
          id: string;
          order_number: string;
          status: string;
          total: number | string | null;
          currency: string | null;
          created_at: string | null;
        }>).map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          totalCents: decimalToCents(o.total),
          currency: o.currency ?? "USD",
          createdAt: o.created_at,
        })),
      };
    },
  );
}

export interface PortalCustomersNamespace {
  list(
    siteId: string,
    filter?: PortalCustomerListFilter,
  ): Promise<PortalCustomerListItem[]>;
  detail(siteId: string, customerId: string): Promise<PortalCustomerDetail>;
}

export function createCustomersNamespace(
  ctx: PortalDALContext,
): PortalCustomersNamespace {
  return {
    list: (siteId, filter) => listCustomers(ctx, siteId, filter),
    detail: (siteId, customerId) => detailCustomer(ctx, siteId, customerId),
  };
}

// =============================================================================
// QUOTES NAMESPACE
// =============================================================================

export type PortalQuoteStatus =
  | "draft"
  | "pending_approval"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted"
  | "cancelled";

export interface PortalQuoteListFilter {
  status?: PortalQuoteStatus | "all";
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalQuoteListItem {
  id: string;
  quoteNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  validUntil: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string | null;
}

export interface PortalQuoteItem {
  id: string;
  productId: string | null;
  productName: string;
  description: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
}

export interface PortalQuoteDetail extends PortalQuoteListItem {
  title: string | null;
  introduction: string | null;
  termsAndConditions: string | null;
  notesToCustomer: string | null;
  internalNotes: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingCents: number;
  validFrom: string | null;
  convertedToOrderId: string | null;
  convertedAt: string | null;
  items: PortalQuoteItem[];
}

interface QuoteListRow {
  id: string;
  quote_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  total: number | string | null;
  currency: string | null;
  valid_until: string | null;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string | null;
}

interface QuoteDetailRow extends QuoteListRow {
  site_id: string;
  agency_id: string;
  title: string | null;
  introduction: string | null;
  terms_and_conditions: string | null;
  notes_to_customer: string | null;
  internal_notes: string | null;
  subtotal: number | string | null;
  discount_amount: number | string | null;
  tax_amount: number | string | null;
  shipping_amount: number | string | null;
  valid_from: string | null;
  converted_to_order_id: string | null;
  converted_at: string | null;
}

interface QuoteItemRow {
  id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number | string | null;
  line_total: number | string | null;
}

const VALID_QUOTE_TRANSITIONS: Record<string, readonly PortalQuoteStatus[]> = {
  draft: ["sent", "cancelled"],
  pending_approval: ["sent", "cancelled"],
  sent: ["viewed", "accepted", "rejected", "expired", "cancelled"],
  viewed: ["accepted", "rejected", "expired", "cancelled"],
  accepted: ["converted", "cancelled"],
  rejected: [],
  expired: [],
  converted: [],
  cancelled: [],
};

async function listQuotes(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalQuoteListFilter | undefined,
): Promise<PortalQuoteListItem[]> {
  const scope = await requireScope(ctx, siteId, "canManageQuotes");
  return withPortalEvent(
    "portal.dal.quotes.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      let q = admin
        .from("mod_ecommod01_quotes")
        .select(
          "id, quote_number, status, customer_name, customer_email, total, currency, valid_until, sent_at, responded_at, created_at",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all") {
        q = q.eq("status", filter.status);
      }
      if (filter?.search) {
        const s = `%${filter.search.replace(/[%_]/g, "\\$&")}%`;
        q = q.or(
          `quote_number.ilike.${s},customer_name.ilike.${s},customer_email.ilike.${s}`,
        );
      }
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error("Failed to load quotes");

      return ((data ?? []) as QuoteListRow[]).map((r) => ({
        id: r.id,
        quoteNumber: r.quote_number,
        status: r.status,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        totalCents: decimalToCents(r.total),
        currency: r.currency ?? "USD",
        validUntil: r.valid_until,
        sentAt: r.sent_at,
        respondedAt: r.responded_at,
        createdAt: r.created_at,
      }));
    },
  );
}

async function detailQuote(
  ctx: PortalDALContext,
  siteId: string,
  quoteId: string,
): Promise<PortalQuoteDetail> {
  const scope = await requireScope(ctx, siteId, "canManageQuotes");
  return withPortalEvent(
    "portal.dal.quotes.detail",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { quoteId },
    },
    async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("mod_ecommod01_quotes")
        .select("*")
        .eq("id", quoteId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !data) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageQuotes",
        );
      }
      const { data: items } = await admin
        .from("mod_ecommod01_quote_items")
        .select(
          "id, product_id, name, description, quantity, unit_price, line_total",
        )
        .eq("quote_id", quoteId);

      const q = data as QuoteDetailRow;
      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.quotes.detail.view",
        resourceType: "quote",
        resourceId: quoteId,
        permissionKey: "canManageQuotes",
      }).catch(() => {});

      return {
        id: q.id,
        quoteNumber: q.quote_number,
        status: q.status,
        customerName: q.customer_name,
        customerEmail: q.customer_email,
        totalCents: decimalToCents(q.total),
        currency: q.currency ?? "USD",
        validUntil: q.valid_until,
        sentAt: q.sent_at,
        respondedAt: q.responded_at,
        createdAt: q.created_at,
        title: q.title,
        introduction: q.introduction,
        termsAndConditions: q.terms_and_conditions,
        notesToCustomer: q.notes_to_customer,
        internalNotes: q.internal_notes,
        subtotalCents: decimalToCents(q.subtotal),
        discountCents: decimalToCents(q.discount_amount),
        taxCents: decimalToCents(q.tax_amount),
        shippingCents: decimalToCents(q.shipping_amount),
        validFrom: q.valid_from,
        convertedToOrderId: q.converted_to_order_id,
        convertedAt: q.converted_at,
        items: ((items ?? []) as QuoteItemRow[]).map((it) => ({
          id: it.id,
          productId: it.product_id,
          productName: it.name,
          description: it.description,
          quantity: it.quantity,
          unitPriceCents: decimalToCents(it.unit_price),
          totalPriceCents: decimalToCents(it.line_total),
        })),
      };
    },
  );
}

async function updateQuoteStatus(
  ctx: PortalDALContext,
  siteId: string,
  quoteId: string,
  input: { status: PortalQuoteStatus; reason?: string },
): Promise<{ id: string; status: string }> {
  const scope = await requireScope(ctx, siteId, "canManageQuotes");
  return withPortalEvent(
    "portal.dal.quotes.update_status",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { quoteId, status: input.status },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error: loadErr } = await admin
        .from("mod_ecommod01_quotes")
        .select("id, status")
        .eq("id", quoteId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (loadErr || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageQuotes",
        );
      }
      const allowed = VALID_QUOTE_TRANSITIONS[current.status ?? "draft"] ?? [];
      if (!allowed.includes(input.status)) {
        throw new Error(
          `Invalid quote transition: ${current.status ?? "draft"} → ${input.status}`,
        );
      }
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = {
        status: input.status,
        updated_at: now,
        last_modified_by: ctx.user.userId,
      };
      if (input.status === "sent") patch.sent_at = now;
      if (
        input.status === "accepted" ||
        input.status === "rejected" ||
        input.status === "cancelled"
      ) {
        patch.responded_at = now;
        if (input.reason) patch.response_notes = input.reason;
      }

      const { error: updErr } = await admin
        .from("mod_ecommod01_quotes")
        .update(patch)
        .eq("id", quoteId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to update quote status");

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: `portal.quotes.${input.status}`,
        resourceType: "quote",
        resourceId: quoteId,
        permissionKey: "canManageQuotes",
        metadata: {
          from: current.status,
          to: input.status,
          reason: input.reason,
        },
      }).catch(() => {});

      const eventKey =
        input.status === "sent"
          ? EVENT_REGISTRY.ecommerce.quote.sent
          : input.status === "accepted"
            ? EVENT_REGISTRY.ecommerce.quote.accepted
            : input.status === "rejected"
              ? EVENT_REGISTRY.ecommerce.quote.rejected
              : null;
      if (eventKey) {
        logAutomationEvent(
          scope.siteId,
          eventKey,
          {
            quote_id: quoteId,
            previous_status: current.status,
            new_status: input.status,
            source: "portal",
            actor_user_id: ctx.user.userId,
          },
          {
            sourceModule: "portal",
            sourceEntityType: "quote",
            sourceEntityId: quoteId,
          },
        ).catch(() => {});
      }

      return { id: quoteId, status: input.status };
    },
  );
}

async function convertQuoteToOrder(
  ctx: PortalDALContext,
  siteId: string,
  quoteId: string,
): Promise<{ quoteId: string; orderId: string }> {
  const scope = await requireScope(ctx, siteId, "canManageQuotes");
  return withPortalEvent(
    "portal.dal.quotes.convert",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { quoteId },
    },
    async () => {
      const admin = createAdminClient();
      const { data: quote, error: loadErr } = await admin
        .from("mod_ecommod01_quotes")
        .select("*")
        .eq("id", quoteId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (loadErr || !quote) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageQuotes",
        );
      }
      const q = quote as QuoteDetailRow & {
        customer_phone: string | null;
        billing_address: Record<string, unknown> | null;
        shipping_address: Record<string, unknown> | null;
        customer_id: string | null;
      };
      if (q.status !== "accepted") {
        throw new Error("Only accepted quotes can be converted to orders");
      }
      if (q.converted_to_order_id) {
        return { quoteId, orderId: q.converted_to_order_id };
      }

      const { data: items } = await admin
        .from("mod_ecommod01_quote_items")
        .select("*")
        .eq("quote_id", quoteId);

      // Generate simple order number — agency-side uses a dedicated generator,
      // but for portal conversions we use a timestamp prefix that is unique per
      // site.
      const orderNumber = `Q-${q.quote_number}-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: orderErr } = await admin
        .from("mod_ecommod01_orders")
        .insert({
          site_id: scope.siteId,
          agency_id: q.agency_id,
          order_number: orderNumber,
          customer_id: q.customer_id,
          customer_email: q.customer_email,
          customer_phone: q.customer_phone,
          shipping_address: q.shipping_address ?? {},
          billing_address: q.billing_address ?? {},
          subtotal: q.subtotal ?? 0,
          discount_amount: q.discount_amount ?? 0,
          shipping_amount: q.shipping_amount ?? 0,
          tax_amount: q.tax_amount ?? 0,
          total: q.total ?? 0,
          currency: q.currency ?? "USD",
          status: "pending",
          payment_status: "pending",
          customer_name: q.customer_name,
          metadata: { source: "portal_quote_conversion", quote_id: quoteId },
        } as never)
        .select("id")
        .single();
      if (orderErr || !order) throw new Error("Failed to create order from quote");

      const orderId = (order as { id: string }).id;

      if (items && items.length) {
        const rowsToInsert = (items as unknown as QuoteItemRow[]).map((it) => ({
          order_id: orderId,
          product_id: it.product_id,
          product_name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price ?? 0,
          total_price: it.line_total ?? 0,
        }));
        await admin
          .from("mod_ecommod01_order_items")
          .insert(rowsToInsert as never);
      }

      await admin
        .from("mod_ecommod01_quotes")
        .update({
          status: "converted",
          converted_to_order_id: orderId,
          converted_at: new Date().toISOString(),
        })
        .eq("id", quoteId)
        .eq("site_id", scope.siteId);

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.quotes.converted_to_order",
        resourceType: "quote",
        resourceId: quoteId,
        permissionKey: "canManageQuotes",
        metadata: { order_id: orderId },
      }).catch(() => {});

      logAutomationEvent(
        scope.siteId,
        EVENT_REGISTRY.ecommerce.quote.converted_to_order,
        {
          quote_id: quoteId,
          order_id: orderId,
          source: "portal",
          actor_user_id: ctx.user.userId,
        },
        {
          sourceModule: "portal",
          sourceEntityType: "quote",
          sourceEntityId: quoteId,
        },
      ).catch(() => {});

      return { quoteId, orderId };
    },
  );
}

export interface PortalQuotesNamespace {
  list(
    siteId: string,
    filter?: PortalQuoteListFilter,
  ): Promise<PortalQuoteListItem[]>;
  detail(siteId: string, quoteId: string): Promise<PortalQuoteDetail>;
  updateStatus(
    siteId: string,
    quoteId: string,
    input: { status: PortalQuoteStatus; reason?: string },
  ): Promise<{ id: string; status: string }>;
  convertToOrder(
    siteId: string,
    quoteId: string,
  ): Promise<{ quoteId: string; orderId: string }>;
}

export function createQuotesNamespace(
  ctx: PortalDALContext,
): PortalQuotesNamespace {
  return {
    list: (siteId, filter) => listQuotes(ctx, siteId, filter),
    detail: (siteId, quoteId) => detailQuote(ctx, siteId, quoteId),
    updateStatus: (siteId, quoteId, input) =>
      updateQuoteStatus(ctx, siteId, quoteId, input),
    convertToOrder: (siteId, quoteId) =>
      convertQuoteToOrder(ctx, siteId, quoteId),
  };
}

// =============================================================================
// BOOKINGS NAMESPACE
// =============================================================================

export type PortalAppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export interface PortalBookingListFilter {
  status?: PortalAppointmentStatus | "all";
  from?: string;
  to?: string;
  staffId?: string;
  limit?: number;
  offset?: number;
}

export interface PortalBookingListItem {
  id: string;
  serviceId: string | null;
  serviceName: string | null;
  staffId: string | null;
  staffName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  currency: string;
  createdAt: string | null;
}

export interface PortalBookingDetail extends PortalBookingListItem {
  notes: string | null;
  internalNotes: string | null;
  customFields: Record<string, unknown> | null;
  paymentStatus: string | null;
  paymentAmountCents: number;
}

export interface PortalBookingService {
  id: string;
  name: string;
  slug: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
}

interface AppointmentRow {
  id: string;
  site_id: string;
  service_id: string | null;
  staff_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  start_time: string;
  end_time: string;
  customer_notes: string | null;
  cancellation_reason: string | null;
  custom_fields: Record<string, unknown> | null;
  payment_status: string | null;
  payment_amount: number | string | null;
  created_at: string | null;
}

const VALID_BOOKING_TRANSITIONS: Record<
  string,
  readonly PortalAppointmentStatus[]
> = {
  pending: ["confirmed", "cancelled", "rescheduled"],
  confirmed: ["completed", "cancelled", "no_show", "rescheduled"],
  rescheduled: ["confirmed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

async function listBookings(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalBookingListFilter | undefined,
): Promise<PortalBookingListItem[]> {
  const scope = await requireScope(ctx, siteId, "canManageBookings");
  return withPortalEvent(
    "portal.dal.bookings.list",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      let q = admin
        .from("mod_bookmod01_appointments")
        .select(
          "id, site_id, service_id, staff_id, customer_name, customer_email, customer_phone, status, start_time, end_time, payment_amount, payment_status, created_at, service:mod_bookmod01_services(name), staff:mod_bookmod01_staff(name)",
        )
        .eq("site_id", scope.siteId);
      if (filter?.status && filter.status !== "all") {
        q = q.eq("status", filter.status);
      }
      if (filter?.staffId) q = q.eq("staff_id", filter.staffId);
      if (filter?.from) q = q.gte("start_time", filter.from);
      if (filter?.to) q = q.lte("start_time", filter.to);
      const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      const { data, error } = await q
        .order("start_time", { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error("Failed to load bookings");

      return (
        (data ?? []) as unknown as Array<
          AppointmentRow & {
            service?: { name: string } | { name: string }[] | null;
            staff?: { name: string } | { name: string }[] | null;
          }
        >
      ).map((r) => {
        const svc = Array.isArray(r.service) ? r.service[0] : r.service;
        const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff;
        return {
          id: r.id,
          serviceId: r.service_id,
          serviceName: svc?.name ?? null,
          staffId: r.staff_id,
          staffName: staff?.name ?? null,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          status: r.status,
          startsAt: r.start_time,
          endsAt: r.end_time,
          priceCents: decimalToCents(r.payment_amount),
          currency: "USD",
          createdAt: r.created_at,
        };
      });
    },
  );
}

async function detailBooking(
  ctx: PortalDALContext,
  siteId: string,
  appointmentId: string,
): Promise<PortalBookingDetail> {
  const scope = await requireScope(ctx, siteId, "canManageBookings");
  return withPortalEvent(
    "portal.dal.bookings.detail",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { appointmentId },
    },
    async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("mod_bookmod01_appointments")
        .select(
          "*, service:mod_bookmod01_services(name), staff:mod_bookmod01_staff(name)",
        )
        .eq("id", appointmentId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (error || !data) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageBookings",
        );
      }

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: "portal.bookings.detail.view",
        resourceType: "appointment",
        resourceId: appointmentId,
        permissionKey: "canManageBookings",
      }).catch(() => {});

      const r = data as unknown as AppointmentRow & {
        service?: { name: string } | { name: string }[] | null;
        staff?: { name: string } | { name: string }[] | null;
      };
      const svc = Array.isArray(r.service) ? r.service[0] : r.service;
      const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff;
      return {
        id: r.id,
        serviceId: r.service_id,
        serviceName: svc?.name ?? null,
        staffId: r.staff_id,
        staffName: staff?.name ?? null,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerPhone: r.customer_phone,
        status: r.status,
        startsAt: r.start_time,
        endsAt: r.end_time,
        priceCents: decimalToCents(r.payment_amount),
        currency: "USD",
        createdAt: r.created_at,
        notes: r.customer_notes,
        internalNotes: r.cancellation_reason,
        customFields: r.custom_fields,
        paymentStatus: r.payment_status,
        paymentAmountCents: decimalToCents(r.payment_amount),
      };
    },
  );
}

async function updateBookingStatus(
  ctx: PortalDALContext,
  siteId: string,
  appointmentId: string,
  input: {
    status: PortalAppointmentStatus;
    reason?: string;
    startsAt?: string;
    endsAt?: string;
  },
): Promise<{ id: string; status: string }> {
  const scope = await requireScope(ctx, siteId, "canManageBookings");
  return withPortalEvent(
    "portal.dal.bookings.update_status",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { appointmentId, status: input.status },
    },
    async () => {
      const admin = createAdminClient();
      const { data: current, error: loadErr } = await admin
        .from("mod_bookmod01_appointments")
        .select("id, status, customer_email, start_time, end_time")
        .eq("id", appointmentId)
        .eq("site_id", scope.siteId)
        .maybeSingle();
      if (loadErr || !current) {
        throw new PortalAccessDeniedError(
          "site_not_found",
          siteId,
          "canManageBookings",
        );
      }
      const allowed = VALID_BOOKING_TRANSITIONS[current.status ?? "pending"] ?? [];
      if (!allowed.includes(input.status)) {
        throw new Error(
          `Invalid booking transition: ${current.status ?? "pending"} → ${input.status}`,
        );
      }
      if (input.status === "rescheduled") {
        if (!input.startsAt || !input.endsAt) {
          throw new Error("Rescheduling requires startsAt and endsAt");
        }
      }
      const patch: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.status === "rescheduled") {
        patch.start_time = input.startsAt;
        patch.end_time = input.endsAt;
      }
      if (input.status === "cancelled" && input.reason) {
        patch.cancellation_reason = input.reason;
      }

      const { error: updErr } = await admin
        .from("mod_bookmod01_appointments")
        .update(patch as never)
        .eq("id", appointmentId)
        .eq("site_id", scope.siteId);
      if (updErr) throw new Error("Failed to update booking");

      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: `portal.bookings.${input.status}`,
        resourceType: "appointment",
        resourceId: appointmentId,
        permissionKey: "canManageBookings",
        metadata: {
          from: current.status,
          to: input.status,
          reason: input.reason,
        },
      }).catch(() => {});

      const eventKey =
        input.status === "confirmed"
          ? EVENT_REGISTRY.booking.appointment.confirmed
          : input.status === "cancelled"
            ? EVENT_REGISTRY.booking.appointment.cancelled
            : input.status === "rescheduled"
              ? EVENT_REGISTRY.booking.appointment.rescheduled
              : input.status === "completed"
                ? EVENT_REGISTRY.booking.appointment.completed
                : input.status === "no_show"
                  ? EVENT_REGISTRY.booking.appointment.no_show
                  : null;
      if (eventKey) {
        logAutomationEvent(
          scope.siteId,
          eventKey,
          {
            appointment_id: appointmentId,
            previous_status: current.status,
            new_status: input.status,
            customer_email: current.customer_email,
            source: "portal",
            actor_user_id: ctx.user.userId,
          },
          {
            sourceModule: "portal",
            sourceEntityType: "appointment",
            sourceEntityId: appointmentId,
          },
        ).catch(() => {});
      }

      return { id: appointmentId, status: input.status };
    },
  );
}

async function listBookingServices(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalBookingService[]> {
  const scope = await requireScope(ctx, siteId, "canManageBookings");
  return withPortalEvent(
    "portal.dal.bookings.list_services",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("mod_bookmod01_services")
        .select(
          "id, name, slug, duration_minutes, price, currency, is_active",
        )
        .eq("site_id", scope.siteId)
        .order("sort_order", { ascending: true });
      if (error) throw new Error("Failed to load services");
      return ((data ?? []) as Array<{
        id: string;
        name: string;
        slug: string;
        duration_minutes: number;
        price: number | string | null;
        currency: string | null;
        is_active: boolean | null;
      }>).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        durationMinutes: r.duration_minutes,
        priceCents: decimalToCents(r.price),
        currency: r.currency ?? "USD",
        isActive: r.is_active ?? true,
      }));
    },
  );
}

export interface PortalBookingsNamespace {
  list(
    siteId: string,
    filter?: PortalBookingListFilter,
  ): Promise<PortalBookingListItem[]>;
  detail(siteId: string, appointmentId: string): Promise<PortalBookingDetail>;
  updateStatus(
    siteId: string,
    appointmentId: string,
    input: {
      status: PortalAppointmentStatus;
      reason?: string;
      startsAt?: string;
      endsAt?: string;
    },
  ): Promise<{ id: string; status: string }>;
  listServices(siteId: string): Promise<PortalBookingService[]>;
}

export function createBookingsNamespace(
  ctx: PortalDALContext,
): PortalBookingsNamespace {
  return {
    list: (siteId, filter) => listBookings(ctx, siteId, filter),
    detail: (siteId, appointmentId) =>
      detailBooking(ctx, siteId, appointmentId),
    updateStatus: (siteId, appointmentId, input) =>
      updateBookingStatus(ctx, siteId, appointmentId, input),
    listServices: (siteId) => listBookingServices(ctx, siteId),
  };
}

// =============================================================================
// PAYMENTS NAMESPACE (payment-proof queue)
//
// Payment proofs are stored in `mod_ecommod01_orders.metadata.payment_proof`
// as a JSON object populated by the customer-facing upload flow (see
// `modules/ecommerce/actions/public-ecommerce-actions.ts#uploadPaymentProof`).
// The portal DAL reads and mutates that metadata in-place, so the unit of
// identity here is the order id, NOT a proof id. All mutations revalidate
// the order belongs to the scoped site.
// =============================================================================

export type PortalPaymentProofStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface PortalPaymentProofListFilter {
  status?: PortalPaymentProofStatus | "all";
  limit?: number;
  offset?: number;
}

export interface PortalPaymentProof {
  /** Order id — the stable handle for the proof record. */
  id: string;
  orderId: string;
  orderNumber: string | null;
  /** Storage path inside the private `payment-proofs` bucket. */
  storagePath: string;
  fileName: string | null;
  contentType: string | null;
  submittedAt: string;
  status: PortalPaymentProofStatus;
  amountCents: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  reviewerId: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

export interface PortalPaymentBulkResult {
  succeeded: Array<{ id: string }>;
  failed: Array<{ id: string; reason: string }>;
}

interface PaymentProofMetadata {
  storage_path?: string;
  file_name?: string;
  content_type?: string;
  uploaded_at?: string;
  status?: string;
  reviewer_id?: string | null;
  reviewed_at?: string | null;
  reason?: string | null;
}

interface OrderWithProofRow {
  id: string;
  site_id: string;
  order_number: string | null;
  customer_email: string | null;
  customer_name: string | null;
  total: number | string | null;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

function normalizeProofStatus(raw: string | undefined): PortalPaymentProofStatus {
  if (raw === "approved") return "approved";
  if (raw === "rejected") return "rejected";
  return "pending";
}

function extractProof(
  row: OrderWithProofRow,
): PortalPaymentProof | null {
  const proof = (row.metadata ?? {}).payment_proof as
    | PaymentProofMetadata
    | undefined;
  if (!proof || !proof.storage_path) return null;
  return {
    id: row.id,
    orderId: row.id,
    orderNumber: row.order_number,
    storagePath: proof.storage_path,
    fileName: proof.file_name ?? null,
    contentType: proof.content_type ?? null,
    submittedAt: proof.uploaded_at ?? row.created_at ?? new Date(0).toISOString(),
    status: normalizeProofStatus(proof.status),
    amountCents: decimalToCents(row.total),
    currency: row.currency ?? "USD",
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    reviewerId: proof.reviewer_id ?? null,
    reviewedAt: proof.reviewed_at ?? null,
    reason: proof.reason ?? null,
  };
}

async function listPaymentProofs(
  ctx: PortalDALContext,
  siteId: string,
  filter: PortalPaymentProofListFilter | undefined,
): Promise<PortalPaymentProof[]> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.payments.list_proofs",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
    },
    async () => {
      const admin = createAdminClient();
      const limit = Math.min(Math.max(filter?.limit ?? 100, 1), 200);
      const offset = Math.max(filter?.offset ?? 0, 0);
      // Filter to orders that actually have a payment_proof in metadata.
      // Supabase supports the `not.is.null` operator on jsonb paths via
      // the `->` accessor; we use a raw filter for portability.
      const { data, error } = await admin
        .from("mod_ecommod01_orders")
        .select(
          "id, site_id, order_number, customer_email, customer_name, total, currency, metadata, created_at",
        )
        .eq("site_id", scope.siteId)
        .not("metadata->payment_proof", "is", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error("Failed to load payment proofs");
      const all = ((data ?? []) as unknown as OrderWithProofRow[])
        .map(extractProof)
        .filter((p): p is PortalPaymentProof => p !== null);
      if (filter?.status && filter.status !== "all") {
        return all.filter((p) => p.status === filter.status);
      }
      return all;
    },
  );
}

async function reviewPaymentProofInternal(
  ctx: PortalDALContext,
  scope: PortalSiteScope,
  orderId: string,
  decision: { status: "approved" | "rejected"; reason?: string },
): Promise<void> {
  const admin = createAdminClient();
  const { data: orderRow, error } = await admin
    .from("mod_ecommod01_orders")
    .select(
      "id, site_id, order_number, customer_email, customer_name, total, currency, metadata, created_at",
    )
    .eq("id", orderId)
    .eq("site_id", scope.siteId)
    .maybeSingle();
  if (error || !orderRow) {
    throw new Error("Payment proof not found");
  }
  const row = orderRow as unknown as OrderWithProofRow;
  const proof = extractProof(row);
  if (!proof) throw new Error("Payment proof not found");
  if (proof.status !== "pending") {
    throw new Error(`Proof is already ${proof.status}`);
  }
  if (decision.status === "rejected" && !decision.reason) {
    throw new Error("Rejection requires a reason");
  }
  const now = new Date().toISOString();
  const existingMeta = (row.metadata ?? {}) as Record<string, unknown>;
  const existingProof = (existingMeta.payment_proof ?? {}) as PaymentProofMetadata;
  const updatedMeta = {
    ...existingMeta,
    payment_proof: {
      ...existingProof,
      status: decision.status,
      reviewer_id: ctx.user.userId,
      reviewed_at: now,
      reason: decision.reason ?? null,
    },
  };

  const patch: Record<string, unknown> = {
    metadata: updatedMeta,
    updated_at: now,
  };
  if (decision.status === "approved") {
    patch.payment_status = "paid";
    patch.status = "confirmed";
  }

  const { error: updErr } = await admin
    .from("mod_ecommod01_orders")
    .update(patch as never)
    .eq("id", orderId)
    .eq("site_id", scope.siteId);
  if (updErr) throw new Error("Failed to update payment proof");

  writePortalAudit({
    authUserId: ctx.user.userId,
    clientId: ctx.user.clientId,
    agencyId: ctx.user.agencyId,
    siteId: scope.siteId,
    isImpersonation: ctx.isImpersonation,
    impersonatorEmail: ctx.impersonatorEmail,
    action: `portal.payments.proof_${decision.status}`,
    resourceType: "payment_proof",
    resourceId: orderId,
    permissionKey: "canManageOrders",
    metadata: {
      order_id: orderId,
      reason: decision.reason ?? null,
    },
  }).catch(() => {});

  const eventKey =
    decision.status === "approved"
      ? EVENT_REGISTRY.ecommerce.payment.received
      : EVENT_REGISTRY.ecommerce.payment.proof_rejected;
  logAutomationEvent(
    scope.siteId,
    eventKey,
    {
      order_id: orderId,
      order_number: row.order_number,
      amount_cents: decimalToCents(row.total),
      currency: row.currency ?? "USD",
      source: "portal",
      actor_user_id: ctx.user.userId,
      reason: decision.reason ?? null,
    },
    {
      sourceModule: "portal",
      sourceEntityType: "order",
      sourceEntityId: orderId,
    },
  ).catch(() => {});
}

async function approvePaymentProof(
  ctx: PortalDALContext,
  siteId: string,
  proofId: string,
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.payments.approve",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { proofId },
    },
    async () => {
      await reviewPaymentProofInternal(ctx, scope, proofId, {
        status: "approved",
      });
      return { id: proofId };
    },
  );
}

async function rejectPaymentProof(
  ctx: PortalDALContext,
  siteId: string,
  proofId: string,
  input: { reason: string },
): Promise<{ id: string }> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.payments.reject",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { proofId },
    },
    async () => {
      if (!input.reason || input.reason.trim().length < 3) {
        throw new Error("Rejection reason is required");
      }
      await reviewPaymentProofInternal(ctx, scope, proofId, {
        status: "rejected",
        reason: input.reason.trim(),
      });
      return { id: proofId };
    },
  );
}

async function bulkReviewPaymentProofs(
  ctx: PortalDALContext,
  siteId: string,
  input: {
    ids: string[];
    action: "approve" | "reject";
    reason?: string;
  },
): Promise<PortalPaymentBulkResult> {
  const scope = await requireScope(ctx, siteId, "canManageOrders");
  return withPortalEvent(
    "portal.dal.payments.bulk_review",
    {
      agencyId: ctx.user.agencyId,
      siteId: scope.siteId,
      authUserId: ctx.user.userId,
      isImpersonation: ctx.isImpersonation,
      metadata: { count: input.ids.length, action: input.action },
    },
    async () => {
      if (!input.ids.length) return { succeeded: [], failed: [] };
      if (input.ids.length > 100) {
        throw new Error("Bulk review limited to 100 items");
      }
      if (input.action === "reject" && !input.reason) {
        throw new Error("Bulk rejection requires a reason");
      }
      // Each proof is reviewed as an independent operation. Partial failures
      // do NOT abort the batch — caller inspects the result.
      const succeeded: Array<{ id: string }> = [];
      const failed: Array<{ id: string; reason: string }> = [];
      for (const id of input.ids) {
        try {
          await reviewPaymentProofInternal(ctx, scope, id, {
            status: input.action === "approve" ? "approved" : "rejected",
            reason: input.reason,
          });
          succeeded.push({ id });
        } catch (e) {
          failed.push({
            id,
            reason: e instanceof Error ? e.message : String(e),
          });
        }
      }
      writePortalAudit({
        authUserId: ctx.user.userId,
        clientId: ctx.user.clientId,
        agencyId: ctx.user.agencyId,
        siteId: scope.siteId,
        isImpersonation: ctx.isImpersonation,
        impersonatorEmail: ctx.impersonatorEmail,
        action: `portal.payments.bulk_${input.action}`,
        resourceType: "payment_proof",
        permissionKey: "canManageOrders",
        metadata: {
          total: input.ids.length,
          succeeded: succeeded.length,
          failed: failed.length,
        },
      }).catch(() => {});
      return { succeeded, failed };
    },
  );
}

export interface PortalPaymentsNamespace {
  listProofs(
    siteId: string,
    filter?: PortalPaymentProofListFilter,
  ): Promise<PortalPaymentProof[]>;
  approveProof(siteId: string, proofId: string): Promise<{ id: string }>;
  rejectProof(
    siteId: string,
    proofId: string,
    input: { reason: string },
  ): Promise<{ id: string }>;
  bulkReview(
    siteId: string,
    input: { ids: string[]; action: "approve" | "reject"; reason?: string },
  ): Promise<PortalPaymentBulkResult>;
}

export function createPaymentsNamespace(
  ctx: PortalDALContext,
): PortalPaymentsNamespace {
  return {
    listProofs: (siteId, filter) => listPaymentProofs(ctx, siteId, filter),
    approveProof: (siteId, proofId) => approvePaymentProof(ctx, siteId, proofId),
    rejectProof: (siteId, proofId, input) =>
      rejectPaymentProof(ctx, siteId, proofId, input),
    bulkReview: (siteId, input) => bulkReviewPaymentProofs(ctx, siteId, input),
  };
}
