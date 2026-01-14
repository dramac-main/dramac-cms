import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_modules")
      .select(`
        settings,
        module:modules(*)
      `)
      .eq("site_id", siteId)
      .eq("is_enabled", true);

    if (error) throw error;

    const enabledModules = data
      ?.filter((sm) => sm.module)
      .map((sm) => ({
        module: sm.module!,
        settings: sm.settings || {},
      })) || [];

    return NextResponse.json(enabledModules);
  } catch (error) {
    console.error("Error fetching enabled modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}
