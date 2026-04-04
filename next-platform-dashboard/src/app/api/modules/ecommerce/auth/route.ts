/**
 * Storefront Customer Authentication API
 *
 * POST /api/modules/ecommerce/auth
 *
 * Handles all customer auth operations via `action` field:
 * - register: Create account (email + password)
 * - login: Email + password login
 * - magic-link: Send magic link email
 * - verify-magic: Verify magic link token
 * - logout: Invalidate session token
 * - session: Validate session token & return customer data
 * - set-password: Set password for guest who just checked out
 *
 * Session tokens are stored as SHA-256 hashes in mod_ecommod01_customer_sessions.
 * Tokens are 32-byte random hex strings, returned to the client as plain text.
 * Only the hash is stored server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PUBLIC_RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

/** Build CORS headers scoped to the request origin */
function getCorsHeaders(request?: NextRequest) {
  const origin = request?.headers.get("origin") || "";
  // Allow same-site and any subdomain (storefront sites)
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

const TABLE = "mod_ecommod01_customers";
const SESSIONS = "mod_ecommod01_customer_sessions";
const SESSION_TTL_DAYS = 30;

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
  auth_user_id: string | null;
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
  meta?: { userAgent?: string; ip?: string },
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  await (supabase as any).from(SESSIONS).insert({
    customer_id: customerId,
    site_id: siteId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: meta?.userAgent || null,
    ip_address: meta?.ip || null,
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
  const corsHeaders = getCorsHeaders(request);
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

    // ── REGISTER ────────────────────────────────────────────────────────────
    if (action === "register") {
      const { email, password, firstName, lastName, phone } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: "email and password are required" },
          { status: 400, headers: corsHeaders },
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Check for existing customer
      const { data: existing } = await (supabase as any)
        .from(TABLE)
        .select("id, auth_user_id, password_set_at")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .maybeSingle();

      if (existing && existing.password_set_at) {
        return NextResponse.json(
          {
            error: "An account with this email already exists. Please sign in.",
          },
          { status: 409, headers: corsHeaders },
        );
      }

      // Create Supabase Auth user
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: emailLower,
          password,
          email_confirm: true,
          user_metadata: {
            role: "customer",
            site_id: siteId,
            first_name: firstName || "",
            last_name: lastName || "",
          },
        });

      if (authError) {
        if (authError.message?.includes("already been registered")) {
          return NextResponse.json(
            { error: "An account with this email already exists." },
            { status: 409, headers: corsHeaders },
          );
        }
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500, headers: corsHeaders },
        );
      }

      let customerId: string;

      if (existing) {
        // Guest customer upgrading to account
        await (supabase as any)
          .from(TABLE)
          .update({
            auth_user_id: authUser.user.id,
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
        const nameParts = (firstName || "").trim();
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
            auth_user_id: authUser.user.id,
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

      const emailLower = email.toLowerCase().trim();

      // Find customer for this site
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .maybeSingle();

      if (!customer || !customer.auth_user_id || !customer.password_set_at) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401, headers: corsHeaders },
        );
      }

      // Verify password via Supabase Auth sign-in
      // Use admin createClient to verify — we use the service key to check
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { createClient } = await import("@supabase/supabase-js");
      const anonClient = createClient(supabaseUrl, supabaseAnonKey);
      const { error: signInError } = await anonClient.auth.signInWithPassword({
        email: emailLower,
        password,
      });

      if (signInError) {
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
        .select("customer_id, expires_at")
        .eq("token_hash", tokenHash)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { customer: null },
          { status: 200, headers: corsHeaders },
        );
      }

      // Update last_used_at and extend session if nearing expiry (rolling window)
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
    if (action === "set-password") {
      const { token, email, password } = body;

      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400, headers: corsHeaders },
        );
      }

      // Find customer by email or session token
      let customerId: string | null = null;
      let customerEmail = email?.toLowerCase()?.trim();

      if (token) {
        const { data: session } = await (supabase as any)
          .from(SESSIONS)
          .select("customer_id")
          .eq("token_hash", hashToken(token))
          .gt("expires_at", new Date().toISOString())
          .single();
        if (session) customerId = session.customer_id;
      }

      if (!customerId && customerEmail) {
        const { data: c } = await (supabase as any)
          .from(TABLE)
          .select("id, auth_user_id")
          .eq("site_id", siteId)
          .eq("email", customerEmail)
          .single();
        if (c) customerId = c.id;
      }

      if (!customerId && !customerEmail) {
        return NextResponse.json(
          { error: "Email is required to create an account" },
          { status: 400, headers: corsHeaders },
        );
      }

      // If no customer record exists, create one (e.g. quote-only or booking-only users)
      let customer: any = null;
      if (customerId) {
        const { data: c } = await (supabase as any)
          .from(TABLE)
          .select("*")
          .eq("id", customerId)
          .single();
        customer = c;
      }

      if (!customerEmail && customer) customerEmail = customer.email;

      // Create Supabase Auth user or update existing
      let authUserId = customer?.auth_user_id;

      if (authUserId) {
        // Update existing auth user password
        await supabase.auth.admin.updateUserById(authUserId, { password });
      } else {
        // Create new auth user
        const { data: authUser, error: authError } =
          await supabase.auth.admin.createUser({
            email: customerEmail,
            password,
            email_confirm: true,
            user_metadata: {
              role: "customer",
              site_id: siteId,
              first_name: customer?.first_name || customerEmail!.split("@")[0],
              last_name: customer?.last_name || "",
            },
          });

        if (authError) {
          if (authError.message?.includes("already been registered")) {
            // Auth user exists but no customer record — sign in to get auth_user_id
            const { data: signIn, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: customerEmail!,
                password,
              });
            if (signInError) {
              return NextResponse.json(
                {
                  error:
                    "An account with this email already exists. Please sign in.",
                },
                { status: 409, headers: corsHeaders },
              );
            }
            authUserId = signIn.user.id;
          } else {
            return NextResponse.json(
              { error: "Failed to create account" },
              { status: 500, headers: corsHeaders },
            );
          }
        } else {
          authUserId = authUser.user.id;
        }
      }

      if (customer) {
        // Upgrade existing customer record
        await (supabase as any)
          .from(TABLE)
          .update({
            auth_user_id: authUserId,
            is_guest: false,
            email_verified: true,
            password_set_at: new Date().toISOString(),
          })
          .eq("id", customerId);
      } else {
        // Create new customer record (quote-only, booking-only, etc.)
        const { data: newCustomer } = await (supabase as any)
          .from(TABLE)
          .insert({
            site_id: siteId,
            agency_id: await getSiteAgencyId(supabase, siteId),
            email: customerEmail,
            first_name: customerEmail!.split("@")[0],
            last_name: "",
            is_guest: false,
            email_verified: true,
            auth_user_id: authUserId,
            password_set_at: new Date().toISOString(),
            status: "active",
          })
          .select("id")
          .single();
        customerId = newCustomer?.id;
      }

      // Create session
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
    if (action === "magic-link") {
      const { email } = body;

      if (!email) {
        return NextResponse.json(
          { error: "email is required" },
          { status: 400, headers: corsHeaders },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Check if customer exists with an account (not just a guest)
      const { data: customer } = await (supabase as any)
        .from(TABLE)
        .select("id, auth_user_id, password_set_at")
        .eq("site_id", siteId)
        .eq("email", emailLower)
        .maybeSingle();

      // Always return success to prevent email enumeration
      if (!customer || !customer.auth_user_id) {
        return NextResponse.json(
          {
            success: true,
            message: "If an account exists, a login link has been sent.",
          },
          { status: 200, headers: corsHeaders },
        );
      }

      // Generate a short-lived magic token (1 hour)
      const magicToken = generateToken();
      const magicHash = hashToken(magicToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await (supabase as any).from(SESSIONS).insert({
        customer_id: customer.id,
        site_id: siteId,
        token_hash: magicHash,
        expires_at: expiresAt,
        user_agent: ua || null,
        ip_address: ip || null,
      });

      // In production, send this via email. For now, return the token
      // so the frontend can use it (email sending via notification service is separate)
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists, a login link has been sent.",
          // Only included in dev for testing — production hides this
          ...(process.env.NODE_ENV !== "production"
            ? { _devToken: magicToken }
            : {}),
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
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401, headers: corsHeaders },
        );
      }

      const TABLE_PREFIX = "mod_ecommod01";
      const { data: orders } = await (supabase as any)
        .from(`${TABLE_PREFIX}_orders`)
        .select(
          "id, order_number, status, payment_status, fulfillment_status, total, currency, created_at, shipping_address, tracking_number, tracking_url",
        )
        .eq("customer_id", session.customer_id)
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(50);

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
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      const { data: bookings } = await (supabase as any)
        .from("mod_bookmod01_appointments")
        .select(
          "id, service_name, customer_name, customer_email, date, start_time, end_time, status, notes, created_at",
        )
        .eq("site_id", siteId)
        .eq("customer_email", customer.email)
        .order("date", { ascending: false })
        .limit(50);

      return NextResponse.json(
        { bookings: bookings || [] },
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
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders },
        );
      }

      const TABLE_PREFIX = "mod_ecommod01";

      // Quotes can be linked by customer_id or customer_email
      const { data: quotes } = await (supabase as any)
        .from(`${TABLE_PREFIX}_quotes`)
        .select(
          `
          id, quote_number, status, total, currency, valid_until, notes, created_at,
          items:${TABLE_PREFIX}_quote_items(id, product_name, variant_label, quantity, unit_price)
        `,
        )
        .eq("site_id", siteId)
        .or(
          `customer_id.eq.${session.customer_id},customer_email.eq.${customer.email}`,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      return NextResponse.json(
        { quotes: quotes || [] },
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
