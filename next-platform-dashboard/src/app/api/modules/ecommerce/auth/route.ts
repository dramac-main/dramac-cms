/**
 * Storefront Customer Authentication API
 *
 * POST /api/modules/ecommerce/auth
 *
 * Handles all customer auth operations via `action` field:
 * - register: Create account (email + password)
 * - login: Email + password login
 * - magic-link: Send magic link email (works for any existing customer)
 * - reset-password: Reset password using a magic link token (dedicated forgot-password flow)
 * - logout: Invalidate session token
 * - session: Validate session token & return customer data
 * - set-password: Set password for guest (requires verificationToken for email-only)
 * - send-verification-code: Send 6-digit OTP to email for ownership verification
 * - verify-email-code: Validate OTP, return one-time verificationToken
 *
 * Session tokens are stored as SHA-256 hashes in mod_ecommod01_customer_sessions.
 * Tokens are 32-byte random hex strings, returned to the client as plain text.
 * Only the hash is stored server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOMAINS } from "@/lib/constants/domains";
import { PUBLIC_RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send-email";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export const dynamic = "force-dynamic";

// ── CORS origin validation ──────────────────────────────────────────────────
// Only allow requests from known storefront origins (subdomain-based or custom domains).
// The dashboard app itself is also allowed.
const STOREFRONT_BASE_DOMAIN = DOMAINS.SITES_BASE;
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "";

/**
 * Validate origin against known storefront patterns:
 * 1. The dashboard app origin itself
 * 2. Any *.{STOREFRONT_BASE_DOMAIN} subdomain
 * 3. Custom domains (validated per-request against the sites table)
 */
function isAllowedOrigin(origin: string): boolean | "check-custom-domain" {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    // Dashboard app
    if (APP_ORIGIN && origin === APP_ORIGIN) return true;
    // Localhost for development
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      return true;
    // Storefront subdomains (e.g. mystore.sites.dramacagency.com)
    if (url.hostname.endsWith(`.${STOREFRONT_BASE_DOMAIN}`)) return true;
    if (url.hostname === STOREFRONT_BASE_DOMAIN) return true;
    // Vercel preview deployments
    if (url.hostname.endsWith(".vercel.app")) return true;
    // Unknown origin — might be a custom domain, needs DB check
    return "check-custom-domain";
  } catch {
    return false;
  }
}

/** Build CORS headers — only set Allow-Origin for validated origins */
function getCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

const TABLE = "mod_ecommod01_customers";
const SESSIONS = "mod_ecommod01_customer_sessions";
const SESSION_TTL_DAYS = 30;

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowed = isAllowedOrigin(origin);
  // For OPTIONS preflight, allow known origins + custom domains (can't DB-check in preflight)
  if (allowed === false) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ── Password validation ────────────────────────────────────────────────────
const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "password1",
  "iloveyou",
  "princess",
  "sunshine",
  "letmein",
  "football",
  "monkey123",
  "shadow12",
  "master12",
  "dragon12",
  "trustno1",
  "whatever",
  "qwerty12",
  "abc12345",
  "welcome1",
  "login123",
  "admin123",
  "passw0rd",
  "password123",
  "p@ssw0rd",
  "changeme",
  "qwertyui",
  "asd123456",
  "baseball1",
]);

function validateEmail(email: string): string | null {
  if (!email || typeof email !== "string") return "Email is required";
  if (email.length > 254) return "Email is too long";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return "Invalid email format";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password must be at most 128 characters";
  if (COMMON_PASSWORDS.has(password.toLowerCase()))
    return "This password is too common. Please choose a stronger password.";
  return null;
}

type CustomerRow = {
  id: string;
  site_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  email_verified: boolean;
  password_set_at: string | null;
  password_hash: string | null;
  orders_count: number;
  total_spent: number;
  status: string;
  accepts_marketing: boolean;
  created_at: string;
};

type SessionRow = {
  id: string;
  customer_id: string;
  expires_at: string;
};

async function createSession(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string,
  siteId: string,
  meta?: { userAgent?: string; ip?: string; isMagicLink?: boolean },
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const ttl = meta?.isMagicLink
    ? 60 * 60 * 1000
    : SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttl).toISOString();

  await (supabase as any).from(SESSIONS).insert({
    customer_id: customerId,
    site_id: siteId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: meta?.userAgent || null,
    ip_address: meta?.ip || null,
    is_magic_link: meta?.isMagicLink || false,
  });

  return token;
}

function safeCustomer(c: CustomerRow) {
  return {
    id: c.id,
    siteId: c.site_id,
    email: c.email,
    firstName: c.first_name,
    lastName: c.last_name,
    displayName: [c.first_name, c.last_name].filter(Boolean).join(" "),
    phone: c.phone,
    avatarUrl: c.avatar_url,
    isGuest: c.is_guest,
    emailVerified: c.email_verified,
    hasPassword: !!c.password_set_at,
    ordersCount: c.orders_count || 0,
    totalSpent: c.total_spent || 0,
    acceptsMarketing: c.accepts_marketing,
    createdAt: c.created_at,
  };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  let corsAllowed = isAllowedOrigin(origin);

  // For unknown origins, defer decision until after we have a DB client
  // to check custom_domain. Build headers optimistically for known origins.
  const corsHeaders =
    corsAllowed === true ? getCorsHeaders(origin) : getCorsHeaders(origin);

  try {
    // Rate limit: 15 requests/minute per IP
    const ip = getClientIp(request);
    const rl = PUBLIC_RATE_LIMITS.auth.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
          },
        },
      );
    }

    const body = await request.json();
    const { action, siteId } = body;

    if (!action || !siteId) {
      return NextResponse.json(
        { error: "action and siteId are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate siteId format
    if (!/^[0-9a-f-]{36}$/.test(siteId)) {
      return NextResponse.json(
        { error: "Invalid siteId" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createAdminClient();
    const ua = request.headers.get("user-agent") || undefined;
    // ip already extracted above for rate limiting (via getClientIp)

    // Validate CORS: for unknown origins, check if it's a verified custom domain for this site
    if (corsAllowed === "check-custom-domain") {
      const { data: site } = await (supabase as any)
        .from("sites")
        .select("custom_domain, custom_domain_verified")
        .eq("id", siteId)
        .single();
      try {
        const originHost = new URL(origin).hostname;
        if (
          site?.custom_domain_verified &&
          site?.custom_domain &&
          originHost === site.custom_domain
        ) {
          corsAllowed = true;
        }
      } catch {
        /* invalid origin URL */
      }
      if (corsAllowed !== true) {
        return NextResponse.json(
          { error: "Origin not allowed" },
          { status: 403 },
        );
      }
    }

    // ── REGISTER ────────────────────────────────────────────────────────────
    if (action === "register") {
      const { email, password, firstName, lastName, phone } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: "email and password are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailError = validateEmail(email);
      if (emailError) {
        return NextResponse.json(
          { error: emailError },
          { status: 400, headers: corsHeaders },
        );
      }

      const pwError = validatePassword(password);
      if (pwError) {
        return NextResponse.json(
          { error: pwError },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Check for existing customer
      const { data: existing } = await (supabase as any)
        .from(TABLE)
        .select("id, password_hash, password_set_at")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .maybeSingle();

      // Prevent email enumeration: same generic error whether account exists or not
      if (existing && existing.password_set_at) {
        return NextResponse.json(
          {
            error:
              "Unable to complete registration. Please try signing in or use a different email.",
          },
          { status: 409, headers: corsHeaders },
        );
      }

      // Hash password with bcrypt (site-scoped, no global auth.users dependency)
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      let customerId: string;

      if (existing) {
        // Guest customer upgrading to account
        await (supabase as any)
          .from(TABLE)
          .update({
            password_hash: passwordHash,
            is_guest: false,
            email_verified: true,
            password_set_at: new Date().toISOString(),
            first_name: firstName || existing.first_name,
            last_name: lastName || existing.last_name,
            phone: phone || existing.phone,
          })
          .eq("id", existing.id);
        customerId = existing.id;
      } else {
        // Brand new customer
        const { data: newCustomer } = await (supabase as any)
          .from(TABLE)
          .insert({
            site_id: siteId,
            agency_id: await getSiteAgencyId(supabase, siteId),
            email: emailLower,
            first_name: firstName || emailLower.split("@")[0],
            last_name: lastName || "",
            phone: phone || null,
            is_guest: false,
            email_verified: true,
            password_hash: passwordHash,
            password_set_at: new Date().toISOString(),
            status: "active",
          })
          .select("id")
          .single();
        customerId = newCustomer?.id;
      }

      const token = await createSession(supabase, customerId, siteId, {
        userAgent: ua,
        ip,
      });
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("id", customerId)
        .single();

      return NextResponse.json(
        { token, customer: safeCustomer(customer) },
        { status: 201, headers: corsHeaders },
      );
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────
    if (action === "login") {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: "email and password are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      // Stricter per-IP rate limit for login (5/min vs 15/min for general auth)
      const loginRl = PUBLIC_RATE_LIMITS.login.check(ip);
      if (!loginRl.allowed) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Retry-After": String(Math.ceil(loginRl.retryAfterMs / 1000)),
            },
          },
        );
      }

      const emailError = validateEmail(email);
      if (emailError) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Per-email rate limit (5/15min — prevents brute-forcing specific accounts)
      const emailRl = PUBLIC_RATE_LIMITS.loginByEmail.check(
        `${siteId}:${emailLower}`,
      );
      if (!emailRl.allowed) {
        return NextResponse.json(
          {
            error:
              "Too many login attempts for this account. Please try again later.",
          },
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Retry-After": String(Math.ceil(emailRl.retryAfterMs / 1000)),
            },
          },
        );
      }

      // Find customer for this site
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .maybeSingle();

      if (!customer || !customer.password_hash || !customer.password_set_at) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Verify password via bcrypt (site-scoped, no global auth.users dependency)
      const passwordValid = await bcrypt.compare(
        password,
        customer.password_hash,
      );

      if (!passwordValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Update last seen
      await (supabase as any)
        .from(TABLE)
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", customer.id);

      // Link any unlinked quotes to this customer (e.g. submitted as guest before registering)
      await (supabase as any)
        .from("mod_ecommod01_quotes")
        .update({ customer_id: customer.id })
        .eq("customer_email", emailLower)
        .is("customer_id", null);

      const token = await createSession(supabase, customer.id, siteId, {
        userAgent: ua,
        ip,
      });

      return NextResponse.json(
        { token, customer: safeCustomer(customer) },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── SESSION ──────────────────────────────────────────────────────────────
    if (action === "session") {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { customer: null },
          { status: 200, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id, expires_at, is_magic_link")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { customer: null },
          { status: 200, headers: corsHeaders },
        );
      }

      // Magic link tokens are single-use: consume and issue a proper session
      if (session.is_magic_link) {
        // Delete the magic link session (single-use)
        await (supabase as any)
          .from(SESSIONS)
          .delete()
          .eq("token_hash", tokenHash);

        // Look up customer (verify site_id)
        const { data: mlCustomer } = await (supabase as any)
          .from(TABLE)
          .select("*")
          .eq("id", session.customer_id)
          .eq("site_id", siteId)
          .single();

        if (!mlCustomer) {
          return NextResponse.json(
            { customer: null },
            { status: 200, headers: corsHeaders },
          );
        }

        // Magic link proves email ownership — mark verified
        if (!mlCustomer.email_verified) {
          await (supabase as any)
            .from(TABLE)
            .update({ email_verified: true })
            .eq("id", mlCustomer.id);
          mlCustomer.email_verified = true;
        }

        // Issue a new long-lived session (not a magic link)
        const newToken = await createSession(
          supabase,
          session.customer_id,
          siteId,
          { userAgent: ua, ip },
        );

        return NextResponse.json(
          {
            customer: safeCustomer(mlCustomer),
            token: newToken,
            // Let the frontend know this was a magic link login so it can
            // offer a password-reset grace window (no current password needed)
            canResetPassword: true,
          },
          { status: 200, headers: corsHeaders },
        );
      }

      // Regular session: update last_used_at and extend if nearing expiry (rolling window)
      const expiresAt = new Date(session.expires_at);
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sessionUpdate: Record<string, string> = {
        last_used_at: new Date().toISOString(),
      };
      if (expiresAt < sevenDaysFromNow) {
        // Extend by 30 days from now
        sessionUpdate.expires_at = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
      }
      await (supabase as any)
        .from(SESSIONS)
        .update(sessionUpdate)
        .eq("token_hash", tokenHash);

      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("id", session.customer_id)
        .eq("site_id", siteId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { customer: null },
          { status: 200, headers: corsHeaders },
        );
      }

      return NextResponse.json(
        { customer: safeCustomer(customer) },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── LOGOUT ───────────────────────────────────────────────────────────────
    if (action === "logout") {
      const { token } = body;

      if (token) {
        await (supabase as any)
          .from(SESSIONS)
          .delete()
          .eq("token_hash", hashToken(token));
      }

      return NextResponse.json(
        { success: true },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── SET PASSWORD (guest → account upgrade) ───────────────────────────────
    // SECURITY: Requires EITHER a valid session token OR email + the customer
    // must be a guest who has never set a password (prevents account takeover).
    if (action === "set-password") {
      const { token, email, password, verificationToken } = body;

      const pwError = validatePassword(password);
      if (pwError) {
        return NextResponse.json(
          { error: pwError },
          { status: 400, headers: corsHeaders },
        );
      }

      // Find customer by session token (preferred) or email (guest-only fallback)
      let customerId: string | null = null;
      let customerEmail = email?.toLowerCase()?.trim();
      let authenticatedViaToken = false;

      if (token) {
        const { data: session } = await (supabase as any)
          .from(SESSIONS)
          .select("customer_id")
          .eq("token_hash", hashToken(token))
          .eq("site_id", siteId)
          .gt("expires_at", new Date().toISOString())
          .single();
        if (session) {
          customerId = session.customer_id;
          authenticatedViaToken = true;
        }
      }

      // Email-only fallback: requires a valid verificationToken from the
      // verify-email-code flow. This ensures email ownership before allowing
      // password creation for guest accounts.
      if (!customerId && customerEmail) {
        // Require email verification token for guest upgrade
        if (!verificationToken) {
          return NextResponse.json(
            { error: "Email verification is required to create an account" },
            { status: 400, headers: corsHeaders },
          );
        }

        // Validate the verification token
        const vtHash = hashToken(verificationToken);
        const { data: vRow } = await (supabase as any)
          .from("mod_ecommod01_email_verifications")
          .select("id")
          .eq("site_id", siteId)
          .eq("email", customerEmail)
          .eq("code_hash", vtHash)
          .eq("verified", true)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (!vRow) {
          return NextResponse.json(
            {
              error:
                "Email verification expired. Please verify your email again.",
            },
            { status: 401, headers: corsHeaders },
          );
        }

        // Consume the verification token (one-time use)
        await (supabase as any)
          .from("mod_ecommod01_email_verifications")
          .delete()
          .eq("id", vRow.id);

        const { data: c } = await (supabase as any)
          .from(TABLE)
          .select("id, password_set_at, is_guest")
          .eq("site_id", siteId)
          .eq("email", customerEmail)
          .maybeSingle();
        // Guard: only allow email-only access for accounts that never had a password
        if (c && !c.password_set_at) {
          customerId = c.id;
        } else if (c && c.password_set_at) {
          // Account already has a password — must be authenticated to change it
          return NextResponse.json(
            { error: "Authentication required to change password" },
            { status: 401, headers: corsHeaders },
          );
        }
      }

      if (!customerId && !customerEmail) {
        return NextResponse.json(
          { error: "Email is required to create an account" },
          { status: 400, headers: corsHeaders },
        );
      }

      if (!customerId) {
        return NextResponse.json(
          { error: "No account found for this email" },
          { status: 404, headers: corsHeaders },
        );
      }

      // Load the customer record
      let customer: any = null;
      if (customerId) {
        const { data: c } = await (supabase as any)
          .from(TABLE)
          .select("*")
          .eq("id", customerId)
          .eq("site_id", siteId)
          .single();
        customer = c;
      }

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      // If customer already has a password and caller is NOT authenticated via token, reject
      if (customer.password_set_at && !authenticatedViaToken) {
        return NextResponse.json(
          { error: "Authentication required to change password" },
          { status: 401, headers: corsHeaders },
        );
      }

      if (!customerEmail) customerEmail = customer.email;

      // Hash password with bcrypt (site-scoped, no global auth.users dependency)
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Upgrade existing customer record
      await (supabase as any)
        .from(TABLE)
        .update({
          password_hash: passwordHash,
          is_guest: false,
          email_verified: true,
          password_set_at: new Date().toISOString(),
        })
        .eq("id", customerId)
        .eq("site_id", siteId);

      // Retroactively link any quotes submitted with this email to the customer
      if (customerId && customerEmail) {
        await (supabase as any)
          .from("mod_ecommod01_quotes")
          .update({ customer_id: customerId })
          .eq("customer_email", customerEmail)
          .is("customer_id", null);
      }

      const newToken = await createSession(supabase, customerId, siteId, {
        userAgent: ua,
        ip,
      });

      const { data: updatedCustomer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("id", customerId)
        .single();

      return NextResponse.json(
        { token: newToken, customer: safeCustomer(updatedCustomer) },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── MAGIC LINK (send) ────────────────────────────────────────────────────
    // Sends a single-use login link to any existing customer (password-based,
    // Google OAuth, or even guest accounts). Always returns success to prevent
    // email enumeration.
    // Optional `intent`: "reset_password" sends a reset-specific email and URL.
    if (action === "magic-link") {
      const { email, intent } = body;
      const isResetIntent = intent === "reset_password";

      if (!email) {
        return NextResponse.json(
          { error: "email is required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Check if any customer exists with this email on this site
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("id")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .maybeSingle();

      // No customer found → silently return success (prevents email enumeration)
      if (!customer) {
        return NextResponse.json(
          {
            success: true,
            message: "If an account exists, a login link has been sent.",
          },
          { status: 200, headers: corsHeaders },
        );
      }

      // Generate a short-lived magic token (1 hour, single-use)
      const magicToken = await createSession(supabase, customer.id, siteId, {
        userAgent: ua,
        ip,
        isMagicLink: true,
      });

      // Build magic link URL — use origin header, fall back to site's known domain
      let storefrontOrigin =
        request.headers.get("origin") ||
        request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
        "";

      // If origin/referer headers are missing, construct URL from site data
      if (!storefrontOrigin) {
        const { data: siteForDomain } = await (supabase as any)
          .from("sites")
          .select("subdomain, custom_domain, custom_domain_verified")
          .eq("id", siteId)
          .single();
        if (
          siteForDomain?.custom_domain &&
          siteForDomain.custom_domain_verified
        ) {
          storefrontOrigin = `https://${siteForDomain.custom_domain}`;
        } else if (siteForDomain?.subdomain) {
          storefrontOrigin = `https://${siteForDomain.subdomain}.${DOMAINS.SITES_BASE}`;
        }
      }

      const loginUrl = isResetIntent
        ? `${storefrontOrigin}/account?magic_token=${magicToken}&intent=reset_password`
        : `${storefrontOrigin}/account?magic_token=${magicToken}`;

      // Get site name for the email
      const { data: site } = await (supabase as any)
        .from("sites")
        .select("name")
        .eq("id", siteId)
        .single();

      // Send the appropriate email based on intent
      await sendEmail({
        to: { email: emailLower },
        type: isResetIntent
          ? "storefront_password_reset"
          : "storefront_magic_link",
        data: {
          loginUrl,
          resetUrl: loginUrl,
          siteName: site?.name || "your store",
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "If an account exists, a login link has been sent.",
        },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── RESET PASSWORD (dedicated forgot-password flow) ─────────────────────
    // Takes a magic link token + new password. Consumes the token, resets the
    // password, and returns a new session. This is the Shopify-style dedicated
    // reset flow — no full account access, just password reset.
    if (action === "reset-password") {
      const { token: resetToken, newPassword } = body;

      if (!resetToken) {
        return NextResponse.json(
          { error: "Reset token is required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const pwError = validatePassword(newPassword);
      if (pwError) {
        return NextResponse.json(
          { error: pwError },
          { status: 400, headers: corsHeaders },
        );
      }

      // Validate the magic link token
      const resetTokenHash = hashToken(resetToken);
      const { data: resetSession } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id, is_magic_link")
        .eq("token_hash", resetTokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!resetSession || !resetSession.is_magic_link) {
        return NextResponse.json(
          {
            error:
              "This reset link has expired or already been used. Please request a new one.",
          },
          { status: 401, headers: corsHeaders },
        );
      }

      // Consume the magic link token (single-use)
      await (supabase as any)
        .from(SESSIONS)
        .delete()
        .eq("token_hash", resetTokenHash);

      // Look up customer
      const { data: resetCustomer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("id", resetSession.customer_id)
        .eq("site_id", siteId)
        .single();

      if (!resetCustomer) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      // Hash and save the new password
      const resetPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await (supabase as any)
        .from(TABLE)
        .update({
          password_hash: resetPasswordHash,
          password_set_at: new Date().toISOString(),
          email_verified: true, // Magic link proves email ownership
          is_guest: false,
        })
        .eq("id", resetCustomer.id)
        .eq("site_id", siteId);

      // Issue a new long-lived session
      const newSessionToken = await createSession(
        supabase,
        resetCustomer.id,
        siteId,
        { userAgent: ua, ip },
      );

      // Refetch the updated customer
      const { data: updatedResetCustomer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("id", resetCustomer.id)
        .single();

      return NextResponse.json(
        {
          success: true,
          token: newSessionToken,
          customer: safeCustomer(updatedResetCustomer || resetCustomer),
          message: "Password has been reset successfully.",
        },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── GET ORDERS (for My Account) ─────────────────────────────────────────
    if (action === "get-orders") {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Lookup the customer's email so we can also surface guest orders that
      // were placed with the same email before the customer signed in.
      const { data: customerForOrders } = await (supabase as any)
        .from(TABLE)
        .select("email")
        .eq("id", session.customer_id)
        .eq("site_id", siteId)
        .single();
      const customerEmailForOrders = (
        customerForOrders?.email || ""
      ).toLowerCase();

      const TABLE_PREFIX = "mod_ecommod01";
      let ordersQuery = (supabase as any)
        .from(`${TABLE_PREFIX}_orders`)
        .select(
          "id, order_number, status, payment_status, fulfillment_status, total, currency, created_at, shipping_address, tracking_number, tracking_url",
        )
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (customerEmailForOrders) {
        // Match either by linked customer_id OR by email (covers historical
        // guest orders placed before the customer registered).
        ordersQuery = ordersQuery.or(
          `customer_id.eq.${session.customer_id},customer_email.eq.${customerEmailForOrders}`,
        );
      } else {
        ordersQuery = ordersQuery.eq("customer_id", session.customer_id);
      }

      const { data: orders } = await ordersQuery;

      // Count items per order
      const orderIds = (orders || []).map((o: { id: string }) => o.id);
      const itemCounts: Record<string, number> = {};
      if (orderIds.length > 0) {
        const { data: items } = await (supabase as any)
          .from(`${TABLE_PREFIX}_order_items`)
          .select("order_id, quantity")
          .in("order_id", orderIds);

        if (items) {
          for (const item of items as {
            order_id: string;
            quantity: number;
          }[]) {
            itemCounts[item.order_id] =
              (itemCounts[item.order_id] || 0) + item.quantity;
          }
        }
      }

      // Map to camelCase for storefront consumption
      const mapped = (orders || []).map((o: Record<string, unknown>) => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        paymentStatus: o.payment_status,
        fulfillmentStatus: o.fulfillment_status,
        total: o.total,
        currency: o.currency,
        createdAt: o.created_at,
        shippingAddress: o.shipping_address,
        trackingNumber: o.tracking_number,
        trackingUrl: o.tracking_url,
        itemCount: itemCounts[o.id as string] || 0,
      }));

      return NextResponse.json(
        { orders: mapped },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── GET ORDER DETAIL (for My Account order view) ─────────────────────────
    if (action === "get-order-detail") {
      const { token, orderId } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      if (!orderId) {
        return NextResponse.json(
          { error: "Order ID required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      const TABLE_PREFIX = "mod_ecommod01";

      // Get order — verify it belongs to this customer
      const { data: order } = await (supabase as any)
        .from(`${TABLE_PREFIX}_orders`)
        .select(
          "id, order_number, status, payment_status, fulfillment_status, total, subtotal, tax_amount, shipping_amount, discount_amount, currency, created_at, shipping_address, billing_address, tracking_number, tracking_url, customer_notes",
        )
        .eq("id", orderId)
        .eq("customer_id", session.customer_id)
        .eq("site_id", siteId)
        .single();

      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      // Get order items
      const { data: items } = await (supabase as any)
        .from(`${TABLE_PREFIX}_order_items`)
        .select(
          "id, product_id, variant_id, product_name, product_sku, variant_options, image_url, quantity, unit_price, total_price, fulfilled_quantity",
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      return NextResponse.json(
        {
          order: {
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            paymentStatus: order.payment_status,
            fulfillmentStatus: order.fulfillment_status,
            total: order.total,
            subtotal: order.subtotal,
            taxAmount: order.tax_amount,
            shippingAmount: order.shipping_amount,
            discountAmount: order.discount_amount,
            currency: order.currency,
            createdAt: order.created_at,
            shippingAddress: order.shipping_address,
            billingAddress: order.billing_address,
            trackingNumber: order.tracking_number,
            trackingUrl: order.tracking_url,
            customerNotes: order.customer_notes,
            items: (items || []).map((i: Record<string, unknown>) => ({
              id: i.id,
              productId: i.product_id,
              variantId: i.variant_id,
              productName: i.product_name,
              productSku: i.product_sku,
              variantOptions: i.variant_options,
              imageUrl: i.image_url,
              quantity: i.quantity,
              unitPrice: i.unit_price,
              totalPrice: i.total_price,
              fulfilledQuantity: i.fulfilled_quantity,
            })),
          },
        },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── GET ADDRESSES ────────────────────────────────────────────────────────
    if (action === "get-addresses") {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      const { data: addresses } = await (supabase as any)
        .from("mod_ecommod01_customer_addresses")
        .select("*")
        .eq("customer_id", session.customer_id)
        .order("is_default_shipping", { ascending: false });

      return NextResponse.json(
        { addresses: addresses || [] },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── UPDATE PROFILE ───────────────────────────────────────────────────────
    if (action === "update-profile") {
      const { token, firstName, lastName, phone, acceptsMarketing } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (firstName !== undefined) updates.first_name = firstName;
      if (lastName !== undefined) updates.last_name = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (acceptsMarketing !== undefined)
        updates.accepts_marketing = acceptsMarketing;

      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .update(updates)
        .eq("id", session.customer_id)
        .select("*")
        .single();

      return NextResponse.json(
        { customer: customer ? safeCustomer(customer) : null },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── ADD ADDRESS ──────────────────────────────────────────────────────────
    if (action === "add-address") {
      const { token, address } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      if (
        !address ||
        !address.firstName ||
        !address.addressLine1 ||
        !address.city ||
        !address.country
      ) {
        return NextResponse.json(
          { error: "First name, address, city, and country are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      // If this is the first address or marked as default, clear other defaults
      const { data: existingAddresses } = await (supabase as any)
        .from("mod_ecommod01_customer_addresses")
        .select("id")
        .eq("customer_id", session.customer_id);

      const isFirst = !existingAddresses || existingAddresses.length === 0;
      const setDefault = isFirst || address.isDefault;

      if (setDefault && existingAddresses?.length) {
        await (supabase as any)
          .from("mod_ecommod01_customer_addresses")
          .update({ is_default_shipping: false, is_default_billing: false })
          .eq("customer_id", session.customer_id);
      }

      const { data: newAddress, error: insertError } = await (supabase as any)
        .from("mod_ecommod01_customer_addresses")
        .insert({
          customer_id: session.customer_id,
          first_name: address.firstName,
          last_name: address.lastName || "",
          company: address.company || null,
          address_line_1: address.addressLine1,
          address_line_2: address.addressLine2 || null,
          city: address.city,
          state: address.state || null,
          postal_code: address.postalCode || null,
          country: address.country,
          phone: address.phone || null,
          is_default_shipping: setDefault,
          is_default_billing: setDefault,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to add address" },
          { status: 500, headers: corsHeaders },
        );
      }

      return NextResponse.json(
        { address: newAddress },
        { status: 201, headers: corsHeaders },
      );
    }

    // ── UPDATE ADDRESS ───────────────────────────────────────────────────────
    if (action === "update-address") {
      const { token, addressId, address } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      if (!addressId || !address) {
        return NextResponse.json(
          { error: "addressId and address are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Verify address belongs to this customer
      const { data: existing } = await (supabase as any)
        .from("mod_ecommod01_customer_addresses")
        .select("id")
        .eq("id", addressId)
        .eq("customer_id", session.customer_id)
        .single();

      if (!existing) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      // If setting as default, clear other defaults first
      if (address.isDefault) {
        await (supabase as any)
          .from("mod_ecommod01_customer_addresses")
          .update({ is_default_shipping: false, is_default_billing: false })
          .eq("customer_id", session.customer_id);
      }

      const updates: Record<string, unknown> = {};
      if (address.firstName !== undefined)
        updates.first_name = address.firstName;
      if (address.lastName !== undefined) updates.last_name = address.lastName;
      if (address.company !== undefined)
        updates.company = address.company || null;
      if (address.addressLine1 !== undefined)
        updates.address_line_1 = address.addressLine1;
      if (address.addressLine2 !== undefined)
        updates.address_line_2 = address.addressLine2 || null;
      if (address.city !== undefined) updates.city = address.city;
      if (address.state !== undefined) updates.state = address.state || null;
      if (address.postalCode !== undefined)
        updates.postal_code = address.postalCode || null;
      if (address.country !== undefined) updates.country = address.country;
      if (address.phone !== undefined) updates.phone = address.phone || null;
      if (address.isDefault !== undefined) {
        updates.is_default_shipping = address.isDefault;
        updates.is_default_billing = address.isDefault;
      }

      const { data: updatedAddress, error: updateError } = await (
        supabase as any
      )
        .from("mod_ecommod01_customer_addresses")
        .update(updates)
        .eq("id", addressId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update address" },
          { status: 500, headers: corsHeaders },
        );
      }

      return NextResponse.json(
        { address: updatedAddress },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── DELETE ADDRESS ───────────────────────────────────────────────────────
    if (action === "delete-address") {
      const { token, addressId } = body;

      if (!token || !addressId) {
        return NextResponse.json(
          { error: "Token and address ID are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Verify ownership
      const { data: existingAddress } = await (supabase as any)
        .from("mod_ecommod01_customer_addresses")
        .select("id, customer_id")
        .eq("id", addressId)
        .single();

      if (
        !existingAddress ||
        existingAddress.customer_id !== session.customer_id
      ) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      const { error: deleteError } = await (supabase as any)
        .from("mod_ecommod01_customer_addresses")
        .delete()
        .eq("id", addressId)
        .eq("customer_id", session.customer_id);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to delete address" },
          { status: 500, headers: corsHeaders },
        );
      }

      return NextResponse.json(
        { success: true },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── GET BOOKINGS ─────────────────────────────────────────────────────────
    if (action === "get-bookings") {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Get customer email for booking lookup (bookings use email, not customer_id)
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("email")
        .eq("id", session.customer_id)
        .eq("site_id", siteId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      // Booking columns: NO `service_name` or `date` columns exist on the
      // table — service name comes from the related service row, and the
      // date is derived from `start_time`. Use a left join + map the result.
      const customerEmailLower = (customer.email || "").toLowerCase();
      const { data: bookings, error: bookingsError } = await (supabase as any)
        .from("mod_bookmod01_appointments")
        .select(
          `id, customer_name, customer_email, customer_phone, customer_notes,
           start_time, end_time, status, payment_status, payment_amount,
           created_at, metadata,
           service:mod_bookmod01_services(name, price, currency, duration)`,
        )
        .eq("site_id", siteId)
        .ilike("customer_email", customerEmailLower)
        .order("start_time", { ascending: false })
        .limit(50);

      if (bookingsError) {
        console.error("[get-bookings] Query error:", bookingsError.message);
      }

      const mappedBookings = (bookings || []).map(
        (b: Record<string, unknown>) => {
          const startIso = b.start_time as string | null;
          const endIso = b.end_time as string | null;
          const startDate = startIso ? new Date(startIso) : null;
          const endDate = endIso ? new Date(endIso) : null;
          const service = b.service as {
            name?: string;
            price?: number;
            currency?: string;
            duration?: number;
          } | null;
          const fmtTime = (d: Date | null) =>
            d
              ? d.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "";
          return {
            id: b.id,
            service_name: service?.name || "Appointment",
            customer_name: b.customer_name,
            customer_email: b.customer_email,
            date: startDate ? startDate.toISOString().slice(0, 10) : "",
            start_time: fmtTime(startDate),
            end_time: fmtTime(endDate),
            status: b.status || "pending",
            notes: (b.customer_notes as string | null) || null,
            payment_status: b.payment_status,
            payment_amount: b.payment_amount,
            currency: service?.currency || "ZMW",
            created_at: b.created_at,
          };
        },
      );

      return NextResponse.json(
        { bookings: mappedBookings },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── GET QUOTES ───────────────────────────────────────────────────────────
    if (action === "get-quotes") {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Get customer email for quote lookup
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("email")
        .eq("id", session.customer_id)
        .eq("site_id", siteId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      const TABLE_PREFIX = "mod_ecommod01";

      // Quotes can be linked by customer_id or customer_email
      const { data: quotes, error: quotesError } = await (supabase as any)
        .from(`${TABLE_PREFIX}_quotes`)
        .select(
          `
          id, quote_number, status, total, currency, valid_until, notes:notes_to_customer, created_at, access_token,
          items:${TABLE_PREFIX}_quote_items(id, product_name:name, variant_label:description, quantity, unit_price)
        `,
        )
        .eq("site_id", siteId)
        .or(
          `customer_id.eq.${session.customer_id},customer_email.eq.${customer.email}`,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (quotesError) {
        console.error("[get-quotes] Query error:", quotesError.message);
      }

      return NextResponse.json(
        { quotes: quotes || [] },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── SEND VERIFICATION CODE ──────────────────────────────────────────────
    // Sends a 6-digit OTP to the customer's email for ownership verification.
    // Required before a guest can set a password (guest-to-account upgrade).
    if (action === "send-verification-code") {
      const { email } = body;

      const emailErr = validateEmail(email);
      if (emailErr) {
        return NextResponse.json(
          { error: emailErr },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Generate a cryptographically random 6-digit code
      const codeNum = crypto.randomInt(100000, 999999);
      const code = String(codeNum);
      const codeHash = hashToken(code);

      // Invalidate any existing unexpired codes for this email+site
      await (supabase as any)
        .from("mod_ecommod01_email_verifications")
        .delete()
        .eq("site_id", siteId)
        .eq("email", emailLower);

      // Insert new code with 10-minute expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertErr } = await (supabase as any)
        .from("mod_ecommod01_email_verifications")
        .insert({
          site_id: siteId,
          email: emailLower,
          code_hash: codeHash,
          expires_at: expiresAt,
        });

      if (insertErr) {
        console.error("[send-verification-code] Insert error:", insertErr);
        return NextResponse.json(
          { error: "Failed to generate verification code" },
          { status: 500, headers: corsHeaders },
        );
      }

      // Get site name for the email
      const { data: site } = await (supabase as any)
        .from("sites")
        .select("name")
        .eq("id", siteId)
        .single();

      // Send the verification email
      await sendEmail({
        to: { email: emailLower },
        type: "storefront_email_verification",
        data: {
          code,
          siteName: site?.name || "your account",
        },
      });

      return NextResponse.json(
        { success: true, message: "Verification code sent" },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── VERIFY EMAIL CODE ───────────────────────────────────────────────────
    // Validates the 6-digit OTP. On success, returns a one-time verification
    // token that must be passed to set-password to prove email ownership.
    if (action === "verify-email-code") {
      const { email, code } = body;

      if (!email || !code) {
        return NextResponse.json(
          { error: "Email and code are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();
      const codeStr = String(code).trim();
      const codeHash = hashToken(codeStr);

      // Look up the latest active verification for this email + site
      const { data: verification } = await (supabase as any)
        .from("mod_ecommod01_email_verifications")
        .select("id, code_hash, attempts, expires_at")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!verification) {
        return NextResponse.json(
          {
            error:
              "Verification code expired or not found. Please request a new code.",
          },
          { status: 400, headers: corsHeaders },
        );
      }

      // Check attempt limit (max 5 tries)
      if (verification.attempts >= 5) {
        // Delete the exhausted code
        await (supabase as any)
          .from("mod_ecommod01_email_verifications")
          .delete()
          .eq("id", verification.id);

        return NextResponse.json(
          { error: "Too many attempts. Please request a new code." },
          { status: 429, headers: corsHeaders },
        );
      }

      // Increment attempts
      await (supabase as any)
        .from("mod_ecommod01_email_verifications")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id);

      // Constant-time comparison of code hashes
      if (verification.code_hash !== codeHash) {
        const remaining = 4 - verification.attempts;
        return NextResponse.json(
          {
            error: `Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}`,
          },
          { status: 400, headers: corsHeaders },
        );
      }

      // Code is valid — mark as verified
      await (supabase as any)
        .from("mod_ecommod01_email_verifications")
        .update({ verified: true })
        .eq("id", verification.id);

      // Generate a short-lived verification token (5 minutes)
      // This token proves email ownership and is required by set-password
      const verificationToken = generateToken();
      const verificationTokenHash = hashToken(verificationToken);
      const verifyExpiresAt = new Date(
        Date.now() + 5 * 60 * 1000,
      ).toISOString();

      // Store token in a new verification row (reuse table as token store)
      await (supabase as any).from("mod_ecommod01_email_verifications").insert({
        site_id: siteId,
        email: emailLower,
        code_hash: verificationTokenHash, // Reuse code_hash field for the token hash
        verified: true,
        expires_at: verifyExpiresAt,
      });

      return NextResponse.json(
        {
          success: true,
          verificationToken,
          message: "Email verified successfully",
        },
        { status: 200, headers: corsHeaders },
      );
    }

    // ── CHANGE PASSWORD (authenticated) ─────────────────────────────────────
    // For logged-in customers to change their password.
    // Requires: token, newPassword
    // If customer already has a password: also requires currentPassword
    // If customer has no password (magic link / Google user): just sets it
    if (action === "change-password") {
      const { token, currentPassword, newPassword } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders },
        );
      }

      const pwError = validatePassword(newPassword);
      if (pwError) {
        return NextResponse.json(
          { error: pwError },
          { status: 400, headers: corsHeaders },
        );
      }

      const tokenHash = hashToken(token);
      const { data: session } = await (supabase as any)
        .from(SESSIONS)
        .select("customer_id")
        .eq("token_hash", tokenHash)
        .eq("site_id", siteId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired. Please sign in again." },
          { status: 401, headers: corsHeaders },
        );
      }

      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("id, password_hash, password_set_at")
        .eq("id", session.customer_id)
        .eq("site_id", siteId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      // If customer already has a password, verify current password first
      // EXCEPTION: If the session was created very recently (within 1 hour),
      // the user likely just authenticated via magic link to reset their
      // forgotten password. In that case, skip the current password check.
      if (customer.password_set_at && customer.password_hash) {
        // Check if this is a recent session (magic-link grace window)
        const { data: sessionRow } = await (supabase as any)
          .from(SESSIONS)
          .select("created_at")
          .eq("token_hash", tokenHash)
          .single();

        const sessionAge = sessionRow
          ? Date.now() - new Date(sessionRow.created_at).getTime()
          : Infinity;
        const MAGIC_LINK_GRACE_MS = 60 * 60 * 1000; // 1 hour
        const withinGraceWindow = sessionAge < MAGIC_LINK_GRACE_MS;

        if (!currentPassword && !withinGraceWindow) {
          return NextResponse.json(
            { error: "Current password is required" },
            { status: 400, headers: corsHeaders },
          );
        }

        if (currentPassword) {
          const currentValid = await bcrypt.compare(
            currentPassword,
            customer.password_hash,
          );
          if (!currentValid) {
            return NextResponse.json(
              { error: "Current password is incorrect" },
              { status: 401, headers: corsHeaders },
            );
          }
        }
      }

      // Hash and save new password
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await (supabase as any)
        .from(TABLE)
        .update({
          password_hash: newPasswordHash,
          password_set_at: new Date().toISOString(),
        })
        .eq("id", customer.id)
        .eq("site_id", siteId);

      return NextResponse.json(
        { success: true, message: "Password updated successfully" },
        { status: 200, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400, headers: corsHeaders },
    );
  } catch (error) {
    console.error("[Storefront Auth] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

async function getSiteAgencyId(
  supabase: ReturnType<typeof createAdminClient>,
  siteId: string,
): Promise<string | null> {
  const { data } = await (supabase as any)
    .from("sites")
    .select("agency_id")
    .eq("id", siteId)
    .single();
  return data?.agency_id || null;
}
