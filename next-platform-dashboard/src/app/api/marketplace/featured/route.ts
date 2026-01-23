// src/app/api/marketplace/featured/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getFeaturedModules } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get("placement") || "staff_picks";

    const validPlacements = ["hero", "trending", "new", "top_rated", "staff_picks", "category"];
    if (!validPlacements.includes(placement)) {
      return NextResponse.json(
        { error: "Invalid placement. Must be one of: " + validPlacements.join(", ") },
        { status: 400 }
      );
    }

    const modules = await getFeaturedModules(placement);

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("[Marketplace Featured API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured modules" },
      { status: 500 }
    );
  }
}
