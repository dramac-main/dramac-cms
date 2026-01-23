// src/app/api/marketplace/trending/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTrendingModules } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const modules = await getTrendingModules(Math.min(limit, 50));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("[Marketplace Trending API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending modules" },
      { status: 500 }
    );
  }
}
