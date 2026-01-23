// src/app/api/marketplace/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { searchModules, logSearch, type SearchFilters } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: SearchFilters = {
      query: searchParams.get("query") || undefined,
      category: searchParams.get("category") || undefined,
      type: searchParams.get("type") || undefined,
      priceMin: searchParams.get("priceMin") ? parseFloat(searchParams.get("priceMin")!) : undefined,
      priceMax: searchParams.get("priceMax") ? parseFloat(searchParams.get("priceMax")!) : undefined,
      minRating: searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : undefined,
      tags: searchParams.get("tags") ? searchParams.get("tags")!.split(",") : undefined,
      developer: searchParams.get("developer") || undefined,
      isFree: searchParams.get("isFree") === "true",
      sortBy: (searchParams.get("sortBy") as SearchFilters["sortBy"]) || "popular",
    };

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const results = await searchModules(filters, page, limit);

    // Log search for analytics (async, don't wait)
    if (filters.query) {
      logSearch(filters.query, filters, results.total).catch(console.error);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Marketplace Search API] Error:", error);
    return NextResponse.json(
      { error: "Failed to search modules" },
      { status: 500 }
    );
  }
}
