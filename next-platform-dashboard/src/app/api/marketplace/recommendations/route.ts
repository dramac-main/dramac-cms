// src/app/api/marketplace/recommendations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const modules = await getRecommendations(Math.min(limit, 50));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("[Marketplace Recommendations API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
