// src/app/api/developer/payout-account/route.ts
// Phase EM-43: Revenue Sharing Dashboard - Payout Account API

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revenueService, payoutService } from "@/lib/revenue";

export async function GET() {
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

    const account = await payoutService.getPayoutAccount(developerProfile.id);

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Payout account API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout account" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
    const { payout_frequency, payout_threshold, payout_currency } = body;

    // Validate input
    const validFrequencies = ["weekly", "biweekly", "monthly"];
    if (payout_frequency && !validFrequencies.includes(payout_frequency)) {
      return NextResponse.json(
        { error: "Invalid payout frequency" },
        { status: 400 }
      );
    }

    if (payout_threshold !== undefined && payout_threshold < 0) {
      return NextResponse.json(
        { error: "Payout threshold must be non-negative" },
        { status: 400 }
      );
    }

    const validCurrencies = ["USD", "EUR", "GBP"];
    if (payout_currency && !validCurrencies.includes(payout_currency)) {
      return NextResponse.json(
        { error: "Invalid payout currency" },
        { status: 400 }
      );
    }

    // Update preferences
    await payoutService.updatePayoutPreferences(developerProfile.id, {
      payout_frequency,
      payout_threshold,
      payout_currency,
    });

    const account = await payoutService.getPayoutAccount(developerProfile.id);

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error("Update payout account error:", error);
    return NextResponse.json(
      { error: "Failed to update payout preferences" },
      { status: 500 }
    );
  }
}
