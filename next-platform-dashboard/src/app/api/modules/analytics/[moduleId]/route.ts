// src/app/api/modules/analytics/[moduleId]/route.ts
// Phase EM-03: Module Analytics Dashboard API

import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsDashboard } from "@/lib/modules/analytics/module-analytics";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const siteId = searchParams.get("siteId") || undefined;
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Invalid days parameter. Must be between 1 and 365." },
        { status: 400 }
      );
    }

    // Verify user has access to this module
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this module
    // Check if user is the module owner or has access through agency
    const { data: moduleAccess } = await supabase
      .from("module_source")
      .select("id, agency_id")
      .eq("id", moduleId)
      .single();

    if (!moduleAccess) {
      // Try to check if this is a module they have installed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: installedModule } = await (supabase as any)
        .from("site_modules")
        .select("id, site_id")
        .eq("module_id", moduleId)
        .limit(1)
        .single();

      if (!installedModule) {
        return NextResponse.json(
          { error: "Module not found or access denied" },
          { status: 404 }
        );
      }
    }

    const dashboard = await getAnalyticsDashboard(moduleId, siteId, days);

    return NextResponse.json(dashboard);
  } catch (error: unknown) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
