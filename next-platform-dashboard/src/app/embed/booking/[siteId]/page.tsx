/**
 * Booking Embed Page
 *
 * Public-facing embeddable booking widget.
 * This route renders the interactive booking wizard without token auth
 * since booking pages are meant to be publicly accessible.
 *
 * URL: /embed/booking/{siteId}?color=8B5CF6&radius=8&hideHeader=1&...
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { EmbedBookingClient } from "./EmbedBookingClient";

interface BookingEmbedPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{
    color?: string;
    radius?: string;
    hideHeader?: string;
    hideServices?: string;
    hideStaff?: string;
    theme?: "light" | "dark" | "auto";
  }>;
}

export default async function BookingEmbedPage({
  params,
  searchParams,
}: BookingEmbedPageProps) {
  const { siteId } = await params;
  const {
    color = "0f172a",
    radius = "8",
    hideHeader,
    hideServices,
    hideStaff,
    theme = "auto",
  } = await searchParams;

  // Verify module is installed & enabled
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: moduleData } = await db
    .from("modules_v2")
    .select("id")
    .eq("slug", "booking")
    .single();

  let isEnabled = false;

  if (moduleData) {
    const { data: inst } = await db
      .from("site_module_installations")
      .select("is_enabled")
      .eq("site_id", siteId)
      .eq("module_id", moduleData.id)
      .single();
    isEnabled = inst?.is_enabled ?? false;
  }

  if (!isEnabled) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Booking Not Available</title>
          <style>{`
            html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #fafafa; }
          `}</style>
        </head>
        <body>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "2rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#dc2626",
                  margin: 0,
                }}
              >
                Booking Not Available
              </h1>
              <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
                The booking module is not enabled for this site.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Fetch site font settings for branding
  const { data: siteData } = await db
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();
  const siteSettings = (siteData?.settings || {}) as Record<string, string>;
  const siteFontBody = siteSettings.font_body || "";
  const siteFontHeading = siteSettings.font_heading || "";
  const siteFontFamily = siteFontBody
    ? `'${siteFontBody}', system-ui, -apple-system, sans-serif`
    : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const googleFontsUrl = [siteFontBody, siteFontHeading]
    .filter(Boolean)
    .map((f) => f!.replace(/ /g, "+"))
    .join("&family=");

  const primaryColor = `#${color}`;
  const borderRadius = `${radius}px`;
  const showHeader = hideHeader !== "1";
  const showServiceStep = hideServices !== "1";
  const showStaffStep = hideStaff !== "1";
  const themeClass = theme === "dark" ? "dark" : "";

  return (
    <html lang="en" className={themeClass}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Book an Appointment</title>
        {googleFontsUrl && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${googleFontsUrl}:wght@300;400;500;600;700&display=swap`}
            rel="stylesheet"
          />
        )}
        <style>{`
          html, body {
            margin: 0; padding: 0;
            font-family: ${siteFontFamily};
            background: #fff;
            color: #111827;
            min-height: 100vh;
          }
          .dark { background: #18181b; color: #fafafa; }
          * { box-sizing: border-box; }
        `}</style>
      </head>
      <body>
        <EmbedBookingClient
          siteId={siteId}
          primaryColor={primaryColor}
          borderRadius={borderRadius}
          showHeader={showHeader}
          showServiceStep={showServiceStep}
          showStaffStep={showStaffStep}
          theme={theme}
        />
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";

// Note: X-Frame-Options / frame-ancestors headers are configured in next.config.ts for /embed/* routes
