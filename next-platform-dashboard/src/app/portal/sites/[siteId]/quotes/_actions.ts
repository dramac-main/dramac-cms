"use server";

/**
 * Portal Quotes — server actions (Session 6A).
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import type { PortalQuoteStatus } from "@/lib/portal/commerce-data-access";

export type QuoteActionResult =
  | { ok: true; orderId?: string }
  | { ok: false; error: string };

async function dal() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  return createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
}

const ALLOWED_STATUSES: readonly PortalQuoteStatus[] = [
  "draft",
  "pending_approval",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
  "cancelled",
];

export async function updateQuoteStatusAction(input: {
  siteId: string;
  quoteId: string;
  status: PortalQuoteStatus;
  reason?: string;
}): Promise<QuoteActionResult> {
  try {
    if (!ALLOWED_STATUSES.includes(input.status)) {
      return { ok: false, error: "Invalid status." };
    }
    const d = await dal();
    await d.quotes.updateStatus(input.siteId, input.quoteId, {
      status: input.status,
      reason: input.reason?.trim() || undefined,
    });
    revalidatePath(`/portal/sites/${input.siteId}/quotes`);
    revalidatePath(`/portal/sites/${input.siteId}/quotes/${input.quoteId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update quote.",
    };
  }
}

export async function convertQuoteToOrderAction(input: {
  siteId: string;
  quoteId: string;
}): Promise<QuoteActionResult> {
  try {
    const d = await dal();
    const result = await d.quotes.convertToOrder(input.siteId, input.quoteId);
    revalidatePath(`/portal/sites/${input.siteId}/quotes`);
    revalidatePath(`/portal/sites/${input.siteId}/quotes/${input.quoteId}`);
    revalidatePath(`/portal/sites/${input.siteId}/orders`);
    return { ok: true, orderId: result.orderId };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to convert quote to order.",
    };
  }
}
