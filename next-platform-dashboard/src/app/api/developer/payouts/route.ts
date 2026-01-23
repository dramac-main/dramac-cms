// src/app/api/developer/payouts/route.ts
// Phase EM-43: Revenue Sharing Dashboard - Payouts API

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revenueService, payoutService } from "@/lib/revenue";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get developer profile
    const developerProfile = await revenueService.getDeveloperProfile(user.id);

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;

    const result = await payoutService.getPayoutHistory(developerProfile.id, {
      page,
      limit,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Payouts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get developer profile
    const developerProfile = await revenueService.getDeveloperProfile(user.id);

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { periodStart, periodEnd } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "periodStart and periodEnd are required" },
        { status: 400 }
      );
    }

    // Create payout request
    const payout = await payoutService.createPayout(
      developerProfile.id,
      periodStart,
      periodEnd
    );

    // Automatically process the payout
    await payoutService.processPayout(payout.id);

    return NextResponse.json({ success: true, payout });
  } catch (error) {
    console.error("Create payout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create payout",
      },
      { status: 500 }
    );
  }
}
