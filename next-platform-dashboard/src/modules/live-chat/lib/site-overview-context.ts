/**
 * Site overview context loader for the AI assistant.
 *
 * Pulls a comprehensive snapshot of the site so Chiko can answer questions
 * about installed modules, business info, products, and services.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface SiteOverviewContext {
  siteName: string | null;
  subdomain: string | null;
  customDomain: string | null;
  siteDescription: string | null;
  installedModules: string[];
  ecommerce: {
    storeName: string | null;
    currency: string | null;
    productCount: number;
    sampleProducts: Array<{
      name: string;
      price: number | null;
      currency: string | null;
    }>;
  } | null;
  booking: {
    businessName: string | null;
    currency: string | null;
    timezone: string | null;
    dateFormat: string | null;
    timeFormat: string | null;
    serviceCount: number;
    sampleServices: Array<{
      name: string;
      durationMinutes: number | null;
      price: number | null;
      currency: string | null;
    }>;
  } | null;
}

export async function loadSiteOverviewContext(
  siteId: string,
): Promise<SiteOverviewContext | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  try {
    const [
      siteRes,
      installsRes,
      ecomSettingsRes,
      productsRes,
      productCountRes,
      bookSettingsRes,
      servicesRes,
      serviceCountRes,
    ] = await Promise.all([
      admin
        .from("sites")
        .select("name, subdomain, custom_domain, settings")
        .eq("id", siteId)
        .maybeSingle(),
      admin
        .from("site_module_installations")
        .select("is_enabled, modules_v2(slug, name)")
        .eq("site_id", siteId)
        .eq("is_enabled", true),
      admin
        .from("mod_ecommod01_settings")
        .select("store_name, currency")
        .eq("site_id", siteId)
        .maybeSingle(),
      admin
        .from("mod_ecommod01_products")
        .select("name, price, currency")
        .eq("site_id", siteId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("mod_ecommod01_products")
        .select("id", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("status", "active"),
      admin
        .from("mod_bookmod01_settings")
        .select("business_name, currency, timezone, date_format, time_format")
        .eq("site_id", siteId)
        .maybeSingle(),
      admin
        .from("mod_bookmod01_services")
        .select("name, duration_minutes, price, currency")
        .eq("site_id", siteId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("mod_bookmod01_services")
        .select("id", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("is_active", true),
    ]);

    const installedModules: string[] = (installsRes.data || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => row?.modules_v2?.slug)
      .filter(
        (s: unknown): s is string => typeof s === "string" && s.length > 0,
      );

    const hasEcom = installedModules.includes("ecommerce");
    const hasBooking = installedModules.includes("booking");

    return {
      siteName: siteRes.data?.name ?? null,
      subdomain: siteRes.data?.subdomain ?? null,
      customDomain: siteRes.data?.custom_domain ?? null,
      siteDescription:
        (siteRes.data?.settings as { description?: string } | null)
          ?.description ?? null,
      installedModules,
      ecommerce: hasEcom
        ? {
            storeName: ecomSettingsRes.data?.store_name ?? null,
            currency: ecomSettingsRes.data?.currency ?? null,
            productCount: productCountRes.count ?? 0,
            sampleProducts: (productsRes.data || []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (p: any) => ({
                name: p.name,
                price: p.price ?? null,
                currency: p.currency ?? ecomSettingsRes.data?.currency ?? null,
              }),
            ),
          }
        : null,
      booking: hasBooking
        ? {
            businessName: bookSettingsRes.data?.business_name ?? null,
            currency: bookSettingsRes.data?.currency ?? null,
            timezone: bookSettingsRes.data?.timezone ?? null,
            dateFormat: bookSettingsRes.data?.date_format ?? null,
            timeFormat: bookSettingsRes.data?.time_format ?? null,
            serviceCount: serviceCountRes.count ?? 0,
            sampleServices: (servicesRes.data || []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (s: any) => ({
                name: s.name,
                durationMinutes: s.duration_minutes ?? null,
                price: s.price ?? null,
                currency: s.currency ?? bookSettingsRes.data?.currency ?? null,
              }),
            ),
          }
        : null,
    };
  } catch (err) {
    console.warn("[ai-responder] loadSiteOverviewContext failed:", err);
    return null;
  }
}

export function formatSiteOverviewContext(ctx: SiteOverviewContext): string {
  const lines: string[] = [];
  if (ctx.siteName) lines.push(`Site: ${ctx.siteName}`);
  const domain =
    ctx.customDomain || (ctx.subdomain ? `${ctx.subdomain}.dramac.cms` : null);
  if (domain) lines.push(`Domain: ${domain}`);
  if (ctx.siteDescription) lines.push(`About: ${ctx.siteDescription}`);
  if (ctx.installedModules.length > 0) {
    lines.push(`Installed modules: ${ctx.installedModules.join(", ")}`);
  }

  if (ctx.ecommerce) {
    lines.push("");
    lines.push("STORE:");
    if (ctx.ecommerce.storeName)
      lines.push(`- Name: ${ctx.ecommerce.storeName}`);
    if (ctx.ecommerce.currency)
      lines.push(`- Currency: ${ctx.ecommerce.currency}`);
    lines.push(`- Active products: ${ctx.ecommerce.productCount}`);
    if (ctx.ecommerce.sampleProducts.length > 0) {
      lines.push("- Sample products:");
      for (const p of ctx.ecommerce.sampleProducts) {
        const priceStr =
          p.price !== null
            ? ` — ${p.currency || ""} ${(p.price / 100).toFixed(2)}`.trim()
            : "";
        lines.push(`  • ${p.name}${priceStr}`);
      }
    }
  }

  if (ctx.booking) {
    lines.push("");
    lines.push("BOOKINGS:");
    if (ctx.booking.businessName)
      lines.push(`- Name: ${ctx.booking.businessName}`);
    if (ctx.booking.timezone) lines.push(`- Timezone: ${ctx.booking.timezone}`);
    if (ctx.booking.currency) lines.push(`- Currency: ${ctx.booking.currency}`);
    lines.push(`- Active services: ${ctx.booking.serviceCount}`);
    if (ctx.booking.sampleServices.length > 0) {
      lines.push("- Sample services:");
      for (const s of ctx.booking.sampleServices) {
        const dur = s.durationMinutes ? `${s.durationMinutes}min` : "";
        const priceStr =
          s.price !== null
            ? `${s.currency || ""} ${(s.price / 100).toFixed(2)}`.trim()
            : "";
        const meta = [dur, priceStr].filter(Boolean).join(" / ");
        lines.push(`  • ${s.name}${meta ? ` — ${meta}` : ""}`);
      }
    }
  }

  return lines.join("\n");
}
