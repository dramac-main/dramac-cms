/**
 * Domain Status API Route
 *
 * Phase DM-01: Domain Management Overhaul
 * GET /api/domains/[domain]/status — Get DNS/SSL status for a domain
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkDomainHealth } from "@/lib/services/domain-health";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await params;

    const report = await checkDomainHealth(domain);

    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (error) {
    console.error("Domain status error:", error);
    return NextResponse.json(
      { error: "Failed to check domain status" },
      { status: 500 }
    );
  }
}
