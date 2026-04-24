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
 * Generate a portal magic sign-in link.
 *
 * IMPORTANT: `@supabase/ssr` browser clients default to the PKCE flow. A raw
 * `action_link` from `admin.generateLink({type:'magiclink'})` redirects to
 * `?code=...` which requires a `code_verifier` that only exists on the
 * browser that INITIATED the flow — not the client who receives the email.
 * That mismatch produces "Invalid or expired link" every time.
 *
 * Canonical SSR fix: use the `hashed_token` returned by admin.generateLink and
 * point users at OUR `/portal/verify` route which calls
 * `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` server-side.
 * This bypasses PKCE and works for any browser the client opens the link in.
 *
 * Returns a fallback URL to `/portal/login` if generation fails so users can
 * still request a fresh link manually.
 */
export async function generatePortalMagicLink(params: {
  email: string;
  next?: string;
}): Promise<{ link: string; generated: boolean; error?: string }> {
  const admin = createAdminClient();
  const base = getPortalBaseUrl();
  const fallback = `${base}/portal/login`;
  const next = params.next && params.next.startsWith("/") ? params.next : "/portal";

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

    // Prefer hashed_token (PKCE-safe verifyOtp flow). Fall back to action_link
    // only if hashed_token is missing for some reason.
    const hashedToken = data?.properties?.hashed_token;
    if (hashedToken) {
      const url = new URL(`${base}/portal/verify`);
      url.searchParams.set("token_hash", hashedToken);
      url.searchParams.set("type", "magiclink");
      url.searchParams.set("next", next);
      return { link: url.toString(), generated: true };
    }

    const actionLink = data?.properties?.action_link;
    if (actionLink) {
      // Last-resort fallback — may still fail on PKCE clients but at least the
      // link reaches Supabase's hosted verify page.
      return { link: actionLink, generated: true };
    }

    return {
      link: fallback,
      generated: false,
      error: "No hashed_token or action_link returned from Supabase",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[portal-activation] generateLink threw:", message);
    return { link: fallback, generated: false, error: message };
  }
}
