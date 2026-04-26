"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import {
  verifyPortalModuleAccess,
  type EffectivePortalPermissions,
} from "@/lib/portal/portal-permissions";
import { writePortalAudit } from "@/lib/portal/audit-log";
import { revalidatePath } from "next/cache";
import {
  renderPaymentMethods,
  type PaymentMethodRow,
} from "@/lib/portal/payment-methods-render";

export type { PaymentMethodRow } from "@/lib/portal/payment-methods-render";

export type PaymentSurface = "ecommerce" | "bookings";

const SURFACE_TABLE: Record<PaymentSurface, string> = {
  ecommerce: "mod_ecommod01_settings",
  bookings: "mod_bookmod01_settings",
};

const SURFACE_PERMISSION: Record<
  PaymentSurface,
  keyof EffectivePortalPermissions
> = {
  ecommerce: "canManageProducts",
  bookings: "canManageBookings",
};

const SURFACE_MODULE: Record<PaymentSurface, string> = {
  ecommerce: "ecommerce",
  bookings: "booking",
};

export async function updatePaymentMethods(
  siteId: string,
  surface: PaymentSurface,
  rows: PaymentMethodRow[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requirePortalAuth();
  await verifyPortalModuleAccess(
    user,
    siteId,
    SURFACE_MODULE[surface],
    SURFACE_PERMISSION[surface],
  );

  const cleaned = rows
    .map((r) => ({ label: r.label.trim(), details: r.details.trim() }))
    .filter((r) => r.label.length > 0);

  const rendered = cleaned.length > 0 ? renderPaymentMethods(cleaned) : "";

  const admin = createAdminClient();
  const table = SURFACE_TABLE[surface];

  // The two settings tables share the same column layout for the field we
  // touch. Cast through `any` to satisfy the strict Supabase types when the
  // table name is dynamic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: prior } = await adminAny
    .from(table)
    .select("manual_payment_instructions")
    .eq("site_id", siteId)
    .maybeSingle();

  const { error } = await adminAny
    .from(table)
    .upsert(
      { site_id: siteId, manual_payment_instructions: rendered || null },
      { onConflict: "site_id" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  await writePortalAudit({
    authUserId: user.userId,
    clientId: user.clientId,
    agencyId: user.agencyId,
    siteId,
    action: `portal.${surface}.payment_methods.updated`,
    resourceType: "site",
    resourceId: siteId,
    permissionKey: SURFACE_PERMISSION[surface],
    metadata: {
      method_count: cleaned.length,
      previous_length:
        (prior?.manual_payment_instructions as string | null | undefined)
          ?.length ?? 0,
    },
  });

  revalidatePath(`/portal/sites/${siteId}/${surface}/payment-methods`);
  return { ok: true };
}
