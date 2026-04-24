/**
 * Portal activation helpers.
 *
 * Ensures a Supabase Auth user exists for a given client email and that
 * `clients.portal_user_id` is correctly linked. Also generates branded magic
 * links for portal sign-in.
 *
 * Uses the service-role admin client — never call from browser code.
 */

import { createAdminClient } from "@/lib/supabase/admin";

type EnsureAuthUserResult =
  | { success: true; userId: string; created: boolean }
  | { success: false; error: string };

/**
 * Look up an existing Supabase auth user by email, or create a new one.
 * Idempotent: safe to call multiple times for the same email.
 */
export async function ensurePortalAuthUser(params: {
  email: string;
  clientId: string;
  clientName?: string | null;
}): Promise<EnsureAuthUserResult> {
  const admin = createAdminClient();
  const normalizedEmail = params.email.trim().toLowerCase();

  // Try to create first — fastest path for new invitations.
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: {
        role: "portal_client",
        client_id: params.clientId,
        client_name: params.clientName ?? null,
      },
    });

  if (!createErr && created?.user?.id) {
    return { success: true, userId: created.user.id, created: true };
  }

  // Creation failed — most likely the email is already registered. Look it up
  // by paginating listUsers (Supabase JS v2 has no direct email filter).
  const perPage = 200;
  for (let page = 1; page <= 25; page++) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listErr) {
      return {
        success: false,
        error: `Failed to look up existing auth user: ${listErr.message}`,
      };
    }
    const users = list?.users ?? [];
    const match = users.find(
      (u) => u.email && u.email.toLowerCase() === normalizedEmail,
    );
    if (match) {
      return { success: true, userId: match.id, created: false };
    }
    if (users.length < perPage) break;
  }

  return {
    success: false,
    error: createErr?.message || "Failed to create portal auth user",
  };
}

/**
 * Resolve the portal base URL from env, with a production fallback.
 */
export function getPortalBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://app.dramacagency.com"
  );
}

/**
 * Generate a Supabase magic sign-in link that redirects to /portal/verify.
 * Returns a fallback URL to /portal/login if generation fails so the user
 * can still request a fresh link manually.
 */
export async function generatePortalMagicLink(params: {
  email: string;
}): Promise<{ link: string; generated: boolean; error?: string }> {
  const admin = createAdminClient();
  const base = getPortalBaseUrl();
  const fallback = `${base}/portal/login`;

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: params.email.trim().toLowerCase(),
      options: { redirectTo: `${base}/portal/verify` },
    });

    if (error) {
      console.error("[portal-activation] generateLink error:", error);
      return { link: fallback, generated: false, error: error.message };
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return {
        link: fallback,
        generated: false,
        error: "No action_link returned from Supabase",
      };
    }

    return { link: actionLink, generated: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[portal-activation] generateLink threw:", message);
    return { link: fallback, generated: false, error: message };
  }
}
