/**
 * Auto-install modules for a site based on detected component types.
 * 
 * Used by the AI Website Designer to ensure that module components
 * (BookingCalendar, ProductGrid, etc.) actually render on public sites
 * by inserting rows into site_module_installations.
 * 
 * This bypasses subscription checks since the AI designer is creating
 * the site content — the modules need to work for the site to function.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ siteId: string }> };

// Component type prefixes that map to module slugs
const COMPONENT_MODULE_MAP: Record<string, string> = {
  Booking: "booking",
  Product: "ecommerce",
  Cart: "ecommerce",
  Checkout: "ecommerce",
  Shop: "ecommerce",
  Store: "ecommerce",
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { componentTypes = [] }: { componentTypes: string[] } = body;

    if (!componentTypes.length) {
      return NextResponse.json({ installed: [] });
    }

    // Determine which module slugs are needed
    const neededSlugs = new Set<string>();
    for (const compType of componentTypes) {
      for (const [prefix, slug] of Object.entries(COMPONENT_MODULE_MAP)) {
        if (compType.startsWith(prefix)) {
          neededSlugs.add(slug);
        }
      }
    }

    if (neededSlugs.size === 0) {
      return NextResponse.json({ installed: [] });
    }

    console.log(`[AutoInstall] Site ${siteId}: Detected module needs:`, [...neededSlugs]);

    // Resolve slugs to module UUIDs
    const { data: modules } = await (supabase as any)
      .from("modules_v2")
      .select("id, slug, name")
      .in("slug", [...neededSlugs]);

    if (!modules || modules.length === 0) {
      console.warn("[AutoInstall] No modules found in modules_v2 for slugs:", [...neededSlugs]);
      return NextResponse.json({ installed: [], warning: "Module definitions not found" });
    }

    const installed: string[] = [];

    for (const mod of modules) {
      // Check if already installed
      const { data: existing } = await supabase
        .from("site_module_installations")
        .select("id, is_enabled")
        .eq("site_id", siteId)
        .eq("module_id", mod.id)
        .single();

      if (existing) {
        if (!existing.is_enabled) {
          // Re-enable
          await supabase
            .from("site_module_installations")
            .update({
              is_enabled: true,
              enabled_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          console.log(`[AutoInstall] Re-enabled ${mod.slug} for site ${siteId}`);
          installed.push(mod.slug);
        } else {
          console.log(`[AutoInstall] ${mod.slug} already installed and enabled for site ${siteId}`);
        }
        continue;
      }

      // Install the module
      const { error } = await supabase
        .from("site_module_installations")
        .insert({
          site_id: siteId,
          module_id: mod.id,
          is_enabled: true,
          installed_at: new Date().toISOString(),
          installed_by: user.id,
          enabled_at: new Date().toISOString(),
          settings: {},
        });

      if (error) {
        console.error(`[AutoInstall] Failed to install ${mod.slug}:`, error.message);
      } else {
        console.log(`[AutoInstall] Installed ${mod.slug} for site ${siteId}`);
        installed.push(mod.slug);
      }
    }

    return NextResponse.json({ installed });
  } catch (error) {
    console.error("[AutoInstall] Error:", error);
    return NextResponse.json(
      { error: "Failed to auto-install modules" },
      { status: 500 }
    );
  }
}
