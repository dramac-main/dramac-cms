// src/app/api/developer/stripe-connect/route.ts
// Phase EM-43: Revenue Sharing Dashboard - Stripe Connect API

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revenueService, payoutService } from "@/lib/revenue";

export async function POST() {
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

    // Get the return URL from headers
    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const returnUrl = `${origin}/developer/revenue`;

    // Get onboarding link
    const url = await payoutService.getOnboardingLink(
      developerProfile.id,
      returnUrl
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Stripe Connect API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get Stripe Connect link",
      },
      { status: 500 }
    );
  }
}

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

    // Refresh account status from Stripe
    const status = await payoutService.refreshAccountStatus(developerProfile.id);

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Stripe Connect status API error:", error);
    return NextResponse.json(
      { error: "Failed to get Stripe account status" },
      { status: 500 }
    );
  }
}
