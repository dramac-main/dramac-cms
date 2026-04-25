"use server";

/**
 * Portal Products — server actions (Session 6A).
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";

async function dal() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  return createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
}

export type ProductActionResult =
  | { ok: true; newStock?: number; lowStockTriggered?: boolean }
  | { ok: false; error: string };

export async function adjustInventoryAction(
  siteId: string,
  productId: string,
  input: { variantId?: string | null; delta: number; reason: string },
): Promise<ProductActionResult> {
  try {
    if (!Number.isInteger(input.delta) || input.delta === 0) {
      return {
        ok: false,
        error: "Adjustment must be a non-zero whole number.",
      };
    }
    const reason = input.reason.trim();
    if (reason.length < 2) {
      return { ok: false, error: "Reason must be at least 2 characters." };
    }
    const d = await dal();
    const res = await d.products.adjustInventory(siteId, productId, {
      variantId: input.variantId ?? null,
      delta: input.delta,
      reason,
    });
    revalidatePath(`/portal/sites/${siteId}/products`);
    revalidatePath(`/portal/sites/${siteId}/products/${productId}`);
    return {
      ok: true,
      newStock: res.newStock,
      lowStockTriggered: res.lowStockTriggered,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Adjustment failed",
    };
  }
}
