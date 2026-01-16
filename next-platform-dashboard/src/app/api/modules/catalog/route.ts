import { NextRequest, NextResponse } from "next/server";
import { moduleRegistry } from "@/lib/modules/module-registry";
import type { ModuleCategory, ModulePricingType } from "@/lib/modules/module-types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") as ModuleCategory | null;
    const priceType = searchParams.get("priceType") as ModulePricingType | null;
    const sort = searchParams.get("sort") as "popular" | "newest" | "price-low" | "price-high" | "rating" | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const featured = searchParams.get("featured");

    // If requesting featured modules only
    if (featured === "true") {
      const featuredModules = moduleRegistry.getFeatured();
      return NextResponse.json({
        modules: featuredModules,
        total: featuredModules.length,
        page: 1,
        limit: featuredModules.length,
      });
    }

    // Search with filters
    const { modules, total } = moduleRegistry.search({
      query,
      category: category || undefined,
      priceType: priceType || undefined,
      sort: sort || "popular",
      page,
      limit,
    });

    return NextResponse.json({
      modules,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Module catalog fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch module catalog" },
      { status: 500 }
    );
  }
}
