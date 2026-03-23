/**
 * Auto-install modules for a site based on detected component types
 * and user-selected features from the AI Website Designer.
 *
 * This creates both:
 * 1. agency_module_subscriptions — so the module appears on the Modules tab
 * 2. site_module_installations   — so the module is active on the site
 *
 * Without agency_module_subscriptions, site installations are invisible
 * because the Modules tab filters by agency subscriptions first.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ siteId: string }> };

// Component type prefixes that map to module slugs
const COMPONENT_MODULE_MAP: Record<string, string> = {
  Booking: "booking",
  Ecommerce: "ecommerce",
  Product: "ecommerce",
  Cart: "ecommerce",
  Checkout: "ecommerce",
  Shop: "ecommerce",
  Store: "ecommerce",
  LiveChat: "live-chat",
};

// Feature IDs (from AI designer chip selection) → module slugs
const FEATURE_MODULE_MAP: Record<string, string> = {
  ecommerce: "ecommerce",
  booking: "booking",
  "live-chat": "live-chat",
  "contact-forms": "contact-forms",
  crm: "crm",
  automation: "automation",
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      componentTypes = [],
      selectedFeatures = [],
    }: { componentTypes: string[]; selectedFeatures: string[] } = body;

    // Determine which module slugs are needed from component types
    const neededSlugs = new Set<string>();
    for (const compType of componentTypes) {
      for (const [prefix, slug] of Object.entries(COMPONENT_MODULE_MAP)) {
        if (compType.startsWith(prefix)) {
          neededSlugs.add(slug);
        }
      }
    }

    // Also add modules from user-selected features
    for (const feature of selectedFeatures) {
      const slug = FEATURE_MODULE_MAP[feature];
      if (slug) neededSlugs.add(slug);
    }

    if (neededSlugs.size === 0) {
      return NextResponse.json({ installed: [] });
    }

    console.log(`[AutoInstall] Site ${siteId}: Detected module needs:`, [
      ...neededSlugs,
    ]);

    // Look up the site's agency
    const { data: site } = await supabase
      .from("sites")
      .select("client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    const agencyId = (site?.client as any)?.agency_id;
    if (!agencyId) {
      console.error("[AutoInstall] Could not resolve agency for site", siteId);
      return NextResponse.json(
        { error: "Site agency not found" },
        { status: 404 },
      );
    }

    // Resolve slugs to module UUIDs
    const { data: modules } = await (supabase as any)
      .from("modules_v2")
      .select("id, slug, name")
      .in("slug", [...neededSlugs]);

    if (!modules || modules.length === 0) {
      console.warn("[AutoInstall] No modules found in modules_v2 for slugs:", [
        ...neededSlugs,
      ]);
      return NextResponse.json({
        installed: [],
        warning: "Module definitions not found",
      });
    }

    const installed: string[] = [];

    for (const mod of modules) {
      // Step 1: Ensure agency subscription exists (the Modules tab requires this)
      let subscriptionId: string | null = null;
      const { data: existingSub } = await (supabase as any)
        .from("agency_module_subscriptions")
        .select("id, status")
        .eq("agency_id", agencyId)
        .eq("module_id", mod.id)
        .single();

      if (existingSub) {
        subscriptionId = existingSub.id;
        if (existingSub.status !== "active") {
          await (supabase as any)
            .from("agency_module_subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("id", existingSub.id);
          console.log(
            `[AutoInstall] Re-activated subscription for ${mod.slug}`,
          );
        }
      } else {
        const { data: newSub, error: subError } = await (supabase as any)
          .from("agency_module_subscriptions")
          .insert({
            agency_id: agencyId,
            module_id: mod.id,
            status: "active",
            billing_cycle: "monthly",
          })
          .select("id")
          .single();

        if (subError) {
          console.error(
            `[AutoInstall] Failed to create subscription for ${mod.slug}:`,
            subError.message,
          );
          continue;
        }
        subscriptionId = newSub.id;
        console.log(
          `[AutoInstall] Created agency subscription for ${mod.slug}`,
        );
      }

      // Step 2: Create or update site installation
      const { data: existing } = await supabase
        .from("site_module_installations")
        .select("id, is_enabled")
        .eq("site_id", siteId)
        .eq("module_id", mod.id)
        .single();

      if (existing) {
        if (!existing.is_enabled) {
          await supabase
            .from("site_module_installations")
            .update({
              is_enabled: true,
              enabled_at: new Date().toISOString(),
              agency_subscription_id: subscriptionId,
            })
            .eq("id", existing.id);
          console.log(
            `[AutoInstall] Re-enabled ${mod.slug} for site ${siteId}`,
          );
          installed.push(mod.slug);
        } else {
          // Ensure subscription link exists even if already enabled
          if (subscriptionId) {
            await supabase
              .from("site_module_installations")
              .update({ agency_subscription_id: subscriptionId })
              .eq("id", existing.id);
          }
          console.log(
            `[AutoInstall] ${mod.slug} already installed and enabled for site ${siteId}`,
          );
        }
        continue;
      }

      const { error } = await supabase
        .from("site_module_installations")
        .insert({
          site_id: siteId,
          module_id: mod.id,
          is_enabled: true,
          installed_at: new Date().toISOString(),
          installed_by: user.id,
          enabled_at: new Date().toISOString(),
          agency_subscription_id: subscriptionId,
          settings: {},
        });

      if (error) {
        console.error(
          `[AutoInstall] Failed to install ${mod.slug}:`,
          error.message,
        );
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
      { status: 500 },
    );
  }
}
