/**
 * Quote Portal Authentication
 *
 * Email verification gate for the customer quote portal.
 * Industry-standard approach: token + email verification (like Stripe, HubSpot, PandaDoc).
 *
 * Flow:
 * 1. Customer clicks quote link → sees email verification form
 * 2. Enters email → server checks it matches quote.customer_email
 * 3. If match → sets secure HttpOnly cookie, shows full quote portal
 * 4. All actions (accept/reject/amend) also verify the cookie server-side
 * 5. Cookie expires after 7 days — re-verify next time
 */
"use server";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLE_PREFIX = "mod_ecommod01";

// Secret for HMAC — falls back to NEXTAUTH_SECRET or a default for dev
const QUOTE_ACCESS_SECRET =
  process.env.QUOTE_ACCESS_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dramac-quote-portal-default-key";

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function getQuoteAccessCookieName(token: string): string {
  // Cookie per quote token (first 12 chars for uniqueness + collision resistance)
  return `qa_${token.substring(0, 12)}`;
}

function computeAccessHash(token: string, email: string): string {
  return createHmac("sha256", QUOTE_ACCESS_SECRET)
    .update(`${token}:${email.toLowerCase().trim()}`)
    .digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Verify customer email against the quote and set access cookie.
 * Called from the QuoteEmailGate client component.
 */
export async function verifyQuoteAccess(
  token: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  if (!token || !email?.trim()) {
    return { success: false, error: "Please enter your email address." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("customer_email")
      .eq("access_token", token)
      .single();

    if (error || !quote) {
      return { success: false, error: "Quote not found." };
    }

    // Compare emails (case-insensitive, trimmed)
    const quoteEmail = (quote.customer_email || "").toLowerCase().trim();
    if (!quoteEmail || normalizedEmail !== quoteEmail) {
      return {
        success: false,
        error:
          "This email doesn't match our records. Please use the email address the quote was sent to.",
      };
    }

    // Set verification cookie
    const cookieName = getQuoteAccessCookieName(token);
    const hash = computeAccessHash(token, normalizedEmail);

    const cookieStore = await cookies();
    cookieStore.set(cookieName, hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("[QuotePortalAuth] Verification error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Check if the current request has a valid quote access cookie.
 * Called from the quote page server component.
 */
export async function verifyQuoteAccessCookie(
  token: string,
  customerEmail: string,
): Promise<boolean> {
  if (!token || !customerEmail) return false;

  try {
    const cookieStore = await cookies();
    const cookieName = getQuoteAccessCookieName(token);
    const storedHash = cookieStore.get(cookieName)?.value;

    if (!storedHash) return false;

    const expectedHash = computeAccessHash(
      token,
      customerEmail.toLowerCase().trim(),
    );

    return safeCompare(storedHash, expectedHash);
  } catch {
    return false;
  }
}

/**
 * Require valid quote access for server actions (accept/reject/amend).
 * Returns the verified customer email on success, or an error message.
 */
export async function requireQuoteAccess(
  token: string,
): Promise<
  { verified: true; email: string } | { verified: false; error: string }
> {
  if (!token) {
    return { verified: false, error: "Missing quote token." };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("customer_email")
      .eq("access_token", token)
      .single();

    if (!quote?.customer_email) {
      return { verified: false, error: "Quote not found." };
    }

    const isValid = await verifyQuoteAccessCookie(token, quote.customer_email);
    if (!isValid) {
      return {
        verified: false,
        error: "Your session has expired. Please verify your email again.",
      };
    }

    return { verified: true, email: quote.customer_email };
  } catch {
    return { verified: false, error: "Access verification failed." };
  }
}
