"use server";

/**
 * Portal Orders — server actions (Session 6A).
 *
 * All writes flow through the portal DAL (`dal.orders.*`) which enforces
 * scope + permission + audit + automation events.
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import type {
  PortalOrderStatus,
  PortalOrderPaymentStatus,
  PortalOrderListFilter,
} from "@/lib/portal/commerce-data-access";
import { formatPortalCurrency } from "@/lib/portal/format";

async function dal() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  return createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
}

export type OrderActionResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatusAction(
  siteId: string,
  orderId: string,
  input: { status: PortalOrderStatus; internalNote?: string },
): Promise<OrderActionResult> {
  try {
    const d = await dal();
    await d.orders.updateStatus(siteId, orderId, input);
    revalidatePath(`/portal/sites/${siteId}/orders`);
    revalidatePath(`/portal/sites/${siteId}/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function recordShipmentAction(
  siteId: string,
  orderId: string,
  input: {
    trackingNumber: string;
    carrier?: string;
    trackingUrl?: string;
  },
): Promise<OrderActionResult> {
  try {
    const tn = input.trackingNumber.trim();
    if (tn.length < 3) {
      return { ok: false, error: "Tracking number is required." };
    }
    const d = await dal();
    await d.orders.recordShipment(siteId, orderId, {
      trackingNumber: tn,
      carrier: input.carrier?.trim() || undefined,
      trackingUrl: input.trackingUrl?.trim() || undefined,
    });
    revalidatePath(`/portal/sites/${siteId}/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Shipment record failed",
    };
  }
}

export async function issueOrderRefundAction(
  siteId: string,
  orderId: string,
  input: { amountCents: number; reason: string },
): Promise<OrderActionResult> {
  try {
    if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
      return { ok: false, error: "Refund amount must be greater than zero." };
    }
    const reason = input.reason.trim();
    if (reason.length < 3) {
      return {
        ok: false,
        error: "Refund reason must be at least 3 characters.",
      };
    }
    const d = await dal();
    await d.orders.issueRefund(siteId, orderId, {
      amountCents: input.amountCents,
      reason,
    });
    revalidatePath(`/portal/sites/${siteId}/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Refund failed",
    };
  }
}

export async function addOrderInternalNoteAction(
  siteId: string,
  orderId: string,
  note: string,
): Promise<OrderActionResult> {
  try {
    const trimmed = note.trim();
    if (trimmed.length < 1) {
      return { ok: false, error: "Note cannot be empty." };
    }
    const d = await dal();
    await d.orders.addInternalNote(siteId, orderId, { note: trimmed });
    revalidatePath(`/portal/sites/${siteId}/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Note save failed",
    };
  }
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportOrdersCsvAction(
  siteId: string,
  filter: {
    status?: string;
    paymentStatus?: string;
    search?: string;
  },
): Promise<
  { ok: true; csv: string; filename: string } | { ok: false; error: string }
> {
  try {
    const d = await dal();
    const dalFilter: PortalOrderListFilter = {
      status:
        filter.status && filter.status !== "all"
          ? (filter.status as PortalOrderStatus)
          : "all",
      paymentStatus:
        filter.paymentStatus && filter.paymentStatus !== "all"
          ? (filter.paymentStatus as PortalOrderPaymentStatus)
          : "all",
      search: filter.search?.trim() || undefined,
      limit: 1000,
      offset: 0,
    };
    const rows = await d.orders.list(siteId, dalFilter);
    const header = [
      "Order #",
      "Status",
      "Payment",
      "Customer",
      "Email",
      "Items",
      "Total",
      "Currency",
      "Placed",
    ];
    const lines = [header.map(csvEscape).join(",")];
    for (const o of rows) {
      lines.push(
        [
          o.orderNumber,
          o.status,
          o.paymentStatus ?? "",
          o.customerName ?? "",
          o.customerEmail ?? "",
          o.itemCount,
          formatPortalCurrency(o.totalCents, o.currency),
          o.currency,
          o.createdAt ?? "",
        ]
          .map(csvEscape)
          .join(","),
      );
    }
    const csv = lines.join("\r\n");
    const stamp = new Date().toISOString().slice(0, 10);
    return { ok: true, csv, filename: `orders-${stamp}.csv` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Export failed",
    };
  }
}
