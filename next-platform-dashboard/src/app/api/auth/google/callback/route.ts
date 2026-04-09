/**
 * Google OAuth Callback Handler
 *
 * GET /api/auth/google/callback?code=...&state=...
 *
 * This is the centralized auth relay for multi-tenant Google Sign-In.
 * ALL storefronts (subdomains + custom domains) use this single callback URL.
 *
 * Flow:
 * 1. User clicks "Sign in with Google" on any storefront (mybusiness.com, etc.)
 * 2. Browser redirects to Google with state containing { siteId, returnUrl, nonce }
 * 3. Google redirects here with authorization code + state
 * 4. We exchange code for tokens, get user profile, find/create customer
 * 5. Generate a short-lived exchange token (same mechanism as magic links)
 * 6. Redirect back to the storefront with the exchange token
 * 7. Storefront context consumes token via existing session action
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOMAINS } from "@/lib/constants/domains";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const TABLE = "mod_ecommod01_customers";
const SESSIONS = "mod_ecommod01_customer_sessions";

function getRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || `https://app.dramacagency.com`;
  return `${base}/api/auth/google/callback`;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate that a returnUrl belongs to the given site
 */
function isValidReturnUrl(
  returnHost: string,
  siteSubdomain: string | null,
  customDomain: string | null,
  customDomainVerified: boolean,
): boolean {
  // Dev environments
  if (returnHost === "localhost" || returnHost === "127.0.0.1") return true;

  // Vercel preview deployments
  if (returnHost.endsWith(".vercel.app")) return true;

  // Site subdomain match
  if (
    siteSubdomain &&
    returnHost === `${siteSubdomain}.${DOMAINS.SITES_BASE}`
  ) {
    return true;
  }

  // Custom domain match
  if (customDomain && customDomainVerified && returnHost === customDomain) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateRaw = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  // ── Handle Google errors / user denial ──
  if (errorParam) {
    try {
      const state = JSON.parse(
        Buffer.from(stateRaw || "", "base64url").toString(),
      );
      if (state.returnUrl) {
        const url = new URL(state.returnUrl);
        url.searchParams.set("google_auth_error", "cancelled");
        return NextResponse.redirect(url.toString());
      }
    } catch {
      /* fallback below */
    }
    return NextResponse.redirect(DOMAINS.APP_DOMAIN);
  }

  if (!code || !stateRaw) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  // ── Decode state ──
  let siteId: string;
  let returnUrl: string;
  let nonce: string;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
    siteId = state.siteId;
    returnUrl = state.returnUrl;
    nonce = state.nonce;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  if (!siteId || !returnUrl || !nonce) {
    return NextResponse.json(
      { error: "Incomplete state" },
      { status: 400 },
    );
  }

  // ── Validate siteId format ──
  if (!/^[0-9a-f-]{36}$/.test(siteId)) {
    return NextResponse.json({ error: "Invalid siteId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Look up site ──
  const { data: site } = await (supabase as any)
    .from("sites")
    .select(
      "id, subdomain, custom_domain, custom_domain_verified, agency_id",
    )
    .eq("id", siteId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // ── Validate return URL belongs to this site ──
  try {
    const returnHost = new URL(returnUrl).hostname;
    if (
      !isValidReturnUrl(
        returnHost,
        site.subdomain,
        site.custom_domain,
        !!site.custom_domain_verified,
      )
    ) {
      return NextResponse.json(
        { error: "Return URL does not match this site" },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid return URL" },
      { status: 400 },
    );
  }

  // ── Validate Google OAuth is configured ──
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set");
    const url = new URL(returnUrl);
    url.searchParams.set("google_auth_error", "not_configured");
    return NextResponse.redirect(url.toString());
  }

  // ── Exchange authorization code for tokens ──
  let tokens: { access_token: string };
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error(
        "[Google OAuth] Token exchange failed:",
        await tokenRes.text(),
      );
      const url = new URL(returnUrl);
      url.searchParams.set("google_auth_error", "token_exchange_failed");
      return NextResponse.redirect(url.toString());
    }

    tokens = await tokenRes.json();
  } catch (err) {
    console.error("[Google OAuth] Token exchange error:", err);
    const url = new URL(returnUrl);
    url.searchParams.set("google_auth_error", "token_exchange_failed");
    return NextResponse.redirect(url.toString());
  }

  // ── Get user profile from Google ──
  let userInfo: {
    id: string;
    email: string;
    verified_email?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };
  try {
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      const url = new URL(returnUrl);
      url.searchParams.set("google_auth_error", "userinfo_failed");
      return NextResponse.redirect(url.toString());
    }

    userInfo = await userInfoRes.json();
  } catch {
    const url = new URL(returnUrl);
    url.searchParams.set("google_auth_error", "userinfo_failed");
    return NextResponse.redirect(url.toString());
  }

  if (!userInfo.email) {
    const url = new URL(returnUrl);
    url.searchParams.set("google_auth_error", "no_email");
    return NextResponse.redirect(url.toString());
  }

  const emailLower = userInfo.email.toLowerCase().trim();

  // ── Find or create customer ──
  let customer: { id: string } | null = null;

  // 1. Try by google_id (fastest, most reliable for returning users)
  const { data: byGoogleId } = await (supabase as any)
    .from(TABLE)
    .select("id")
    .eq("site_id", siteId)
    .eq("google_id", userInfo.id)
    .maybeSingle();

  if (byGoogleId) {
    customer = byGoogleId;
  } else {
    // 2. Try by email (existing customer or guest → link Google account)
    const { data: byEmail } = await (supabase as any)
      .from(TABLE)
      .select("id, is_guest, first_name, last_name, avatar_url")
      .eq("site_id", siteId)
      .eq("email", emailLower)
      .maybeSingle();

    if (byEmail) {
      // Link Google account to existing customer
      const updateFields: Record<string, unknown> = {
        google_id: userInfo.id,
        email_verified: true,
        avatar_url: byEmail.avatar_url || userInfo.picture || null,
      };

      // Upgrade guests to full accounts
      if (byEmail.is_guest) {
        updateFields.is_guest = false;
        updateFields.first_name =
          byEmail.first_name || userInfo.given_name || emailLower.split("@")[0];
        updateFields.last_name =
          byEmail.last_name || userInfo.family_name || "";
      }

      await (supabase as any)
        .from(TABLE)
        .update(updateFields)
        .eq("id", byEmail.id);

      customer = { id: byEmail.id };
    }
  }

  // 3. Create new customer if neither google_id nor email matched
  if (!customer) {
    const { data: newCustomer } = await (supabase as any)
      .from(TABLE)
      .insert({
        site_id: siteId,
        agency_id: site.agency_id,
        email: emailLower,
        first_name:
          userInfo.given_name || emailLower.split("@")[0],
        last_name: userInfo.family_name || "",
        avatar_url: userInfo.picture || null,
        google_id: userInfo.id,
        is_guest: false,
        email_verified: true,
        status: "active",
      })
      .select("id")
      .single();

    customer = newCustomer;
  }

  if (!customer) {
    const url = new URL(returnUrl);
    url.searchParams.set("google_auth_error", "customer_creation_failed");
    return NextResponse.redirect(url.toString());
  }

  // ── Update last seen ──
  await (supabase as any)
    .from(TABLE)
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", customer.id);

  // ── Create short-lived exchange token (5 min, single-use via is_magic_link) ──
  const exchangeToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(exchangeToken);

  await (supabase as any).from(SESSIONS).insert({
    customer_id: customer.id,
    site_id: siteId,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    is_magic_link: true, // Reuse magic link mechanism for single-use exchange
    user_agent: request.headers.get("user-agent") || null,
    ip_address:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  });

  // ── Link unlinked quotes to this customer ──
  await (supabase as any)
    .from("mod_ecommod01_quotes")
    .update({ customer_id: customer.id })
    .eq("customer_email", emailLower)
    .is("customer_id", null);

  // ── Redirect back to storefront with exchange token ──
  const redirectUrl = new URL(returnUrl);
  redirectUrl.searchParams.set("google_auth_token", exchangeToken);
  redirectUrl.searchParams.set("google_auth_nonce", nonce);

  return NextResponse.redirect(redirectUrl.toString());
}
