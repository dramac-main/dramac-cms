/**
 * DNS Verification API Route
 *
 * Phase DM-01: Domain Management Overhaul
 * POST /api/domains/verify — Check DNS records for a domain
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyDnsRecords } from "@/lib/services/domain-health";

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

    const { domain } = await request.json();
    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    const result = await verifyDnsRecords(domain);

    return NextResponse.json(result);
  } catch (error) {
    console.error("DNS verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
