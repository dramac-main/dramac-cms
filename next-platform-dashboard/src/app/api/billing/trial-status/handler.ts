/**
 * Trial Status API Handler
 *
 * Phase BIL-03: Subscription Checkout & Trial
 *
 * GET /api/billing/paddle/trial-status?agencyId=xxx
 * Returns the current trial status for an agency.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trialService } from "@/lib/paddle/trial-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const agencyId = request.nextUrl.searchParams.get("agencyId");
  if (!agencyId) {
    return NextResponse.json(
      { success: false, error: "agencyId required" },
      { status: 400 },
    );
  }

  // Verify user belongs to this agency
  const { data: member } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 },
    );
  }

  try {
    const status = await trialService.getTrialStatus(agencyId);
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error("[Trial API] Error getting trial status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get trial status" },
      { status: 500 },
    );
  }
}
