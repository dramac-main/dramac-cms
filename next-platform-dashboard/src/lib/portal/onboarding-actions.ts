"use server";

/**
 * Portal onboarding state — server actions.
 *
 * All 6 checklist steps are auto-derived from real system data.
 * Users cannot manually tick steps — each step completes only when
 * the actual underlying action has been taken.
 */

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortalAuth } from "@/lib/portal/portal-auth";

export interface OnboardingState {
  profile_confirmed: boolean;
  notifications_enabled: boolean;
  app_installed: boolean;
  team_invited: boolean;
  first_order_seen: boolean;
  payments_setup: boolean;
  dismissed: boolean;
}

export type OnboardingFlag = keyof Omit<OnboardingState, "dismissed">;

/**
 * Load the user's onboarding state. Every step is derived from real
 * data — no stored booleans are used for completion tracking (except
 * app_installed, which requires a client-side PWA signal, and dismissed).
 */
export async function loadOnboardingState(): Promise<{
  state: OnboardingState;
  totalSteps: number;
  completedSteps: number;
}> {
  const user = await requirePortalAuth();
  const admin = createAdminClient();

  // Fetch the stored row only for `app_installed` (client-side signal) and `dismissed`.
  const { data: row } = await admin
    .from("portal_onboarding_state" as never)
    .select("app_installed, dismissed")
    .eq("user_id" as never, user.userId)
    .maybeSingle();

  const stored = (row as { app_installed?: boolean; dismissed?: boolean } | null) ?? {};

  const state: OnboardingState = {
    profile_confirmed: false,
    notifications_enabled: false,
    app_installed: stored.app_installed ?? false,
    team_invited: false,
    first_order_seen: false,
    payments_setup: false,
    dismissed: stored.dismissed ?? false,
  };

  // Run all derivations in parallel.
  await Promise.all([
    // 1. profile_confirmed — has the user set their full name?
    (async () => {
      const { data } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.userId)
        .maybeSingle();
      if (data && typeof data.full_name === "string" && data.full_name.trim().length > 0) {
        state.profile_confirmed = true;
      }
    })(),

    // 2. notifications_enabled — has the user configured any notification channel?
    (async () => {
      const { data } = await admin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("portal_notification_preferences" as any)
        .select("category")
        .eq("user_id" as never, user.userId)
        .limit(1);
      if (data && data.length > 0) state.notifications_enabled = true;
    })(),

    // 3. team_invited — does at least one other portal team member exist for this client?
    (async () => {
      if (!user.clientId) return;
      const { data } = await admin
        .from("portal_team_members" as never)
        .select("id")
        .eq("client_id" as never, user.clientId)
        .neq("user_id" as never, user.userId)
        .limit(1);
      if (data && data.length > 0) state.team_invited = true;
    })(),

    // 4 & 5. Resolve client's site ids once, then derive order/payment flags from them.
    (async () => {
      if (!user.clientId) return;

      const { data: clientSites } = await admin
        .from("sites")
        .select("id")
        .eq("client_id", user.clientId);

      const siteIds: string[] = (clientSites ?? [])
        .map((s) => (s as { id: string }).id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (siteIds.length === 0) return;

      await Promise.all([
        // first_order_seen — any order on a site belonging to this client?
        (async () => {
          const { data } = await admin
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from("mod_ecom_orders" as any)
            .select("id")
            .in("site_id", siteIds)
            .limit(1);
          if (data && data.length > 0) state.first_order_seen = true;
        })(),

        // payments_setup — has the client configured any ecommerce payment provider?
        (async () => {
          const { data } = await admin
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from("mod_ecom_settings" as any)
            .select("id")
            .in("site_id", siteIds)
            .not("payment_provider" as never, "is", null)
            .limit(1);
          if (data && data.length > 0) state.payments_setup = true;
        })(),
      ]);
    })(),
  ]);

  const flags: OnboardingFlag[] = [
    "profile_confirmed",
    "notifications_enabled",
    "app_installed",
    "team_invited",
    "first_order_seen",
    "payments_setup",
  ];
  const completedSteps = flags.filter((f) => state[f]).length;

  return { state, totalSteps: flags.length, completedSteps };
}

/**
 * Called by the client-side PWA install detector when the portal app
 * is installed to the home screen. Only the `app_installed` flag may
 * be set this way — all other steps are derived from real system data.
 */
export async function markAppInstalled(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await requirePortalAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("portal_onboarding_state" as never)
    .upsert(
      { user_id: user.userId, app_installed: true } as never,
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal");
  return { ok: true };
}

export async function dismissOnboarding(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await requirePortalAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("portal_onboarding_state" as never)
    .upsert(
      { user_id: user.userId, dismissed: true } as never,
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal");
  return { ok: true };
}
