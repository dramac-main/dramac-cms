// src/app/api/developer/revenue/route.ts
// Phase EM-43: Revenue Sharing Dashboard - Revenue API

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

    const developerId = developerProfile.id;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const moduleId = searchParams.get("moduleId");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Fetch all data in parallel
    const [summary, analytics, sales, payouts, payoutAccount] =
      await Promise.all([
        revenueService.getEarningsSummary(developerId),
        revenueService.getRevenueAnalytics(developerId, {
          startDate,
          endDate,
          moduleId: moduleId || undefined,
        }),
        revenueService.getSalesHistory(developerId, {
          startDate,
          endDate,
          moduleId: moduleId || undefined,
          limit: 50,
        }),
        payoutService.getPayoutHistory(developerId, { limit: 10 }),
        payoutService.getPayoutAccount(developerId),
      ]);

    return NextResponse.json({
      summary,
      analytics,
      sales,
      payouts,
      payoutAccount,
    });
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
