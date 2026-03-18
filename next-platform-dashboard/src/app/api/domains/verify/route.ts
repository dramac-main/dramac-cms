/**
 * DNS Verification API Route
 *
 * Phase DM-01: Domain Management Overhaul
 * POST /api/domains/verify — Check DNS records for a domain
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyDnsRecords } from "@/lib/services/domain-health";

// Per-user rate limiting for DNS verify (max 10 checks per minute)
const dnsRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const DNS_RATE_LIMIT = 10;
const DNS_RATE_WINDOW = 60000; // 1 minute

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dnsRateLimitMap.entries()) {
    if (now > value.resetAt) {
      dnsRateLimitMap.delete(key);
    }
  }
}, 60000);

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per user
    const now = Date.now();
    const rateEntry = dnsRateLimitMap.get(user.id);
    if (rateEntry && now < rateEntry.resetAt) {
      if (rateEntry.count >= DNS_RATE_LIMIT) {
        return NextResponse.json(
          { error: "Too many verification requests. Please try again later." },
          { status: 429 },
        );
      }
      rateEntry.count++;
    } else {
      dnsRateLimitMap.set(user.id, {
        count: 1,
        resetAt: now + DNS_RATE_WINDOW,
      });
    }

    const { domain } = await request.json();
    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 },
      );
    }

    // Validate domain format
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 },
      );
    }

    const result = await verifyDnsRecords(domain);

    return NextResponse.json(result);
  } catch (error) {
    console.error("DNS verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
