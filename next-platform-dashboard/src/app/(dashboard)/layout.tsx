import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { ServerBrandingStyle } from "@/components/providers/server-branding-style";
import { getProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANDING, type AgencyBranding } from "@/types/branding";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const impersonatingId = cookieStore.get("impersonating")?.value;
  
  let impersonatedUser = null;
  if (impersonatingId) {
    impersonatedUser = await getProfile(impersonatingId);
  }

  const isImpersonating = !!impersonatedUser;

  // Check if current user is super_admin for sidebar admin link
  // Also fetch agency_id for BrandingProvider
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isSuperAdmin = false;
  let agencyId: string | null = null;
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id")
      .eq("id", user.id)
      .single();
    isSuperAdmin = profile?.role === "super_admin";
    agencyId = profile?.agency_id ?? null;

    // Fallback: if profile has no agency_id, check agency_members table
    if (!agencyId) {
      const { data: membership } = await supabase
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      agencyId = membership?.agency_id ?? null;
    }
  }

  // Fetch agency regional preferences for CurrencyProvider
  // Uses type assertion because these columns may not exist yet (migration pending)
  let regionalPreferences = null;
  let initialBranding: AgencyBranding | null = null;
  if (agencyId) {
    try {
      const { data: agency } = await (supabase as any)
        .from("agencies")
        .select("id, name, custom_branding, white_label_enabled, default_currency, default_locale, default_timezone, date_format, tax_rate, tax_inclusive, weight_unit, dimension_unit")
        .eq("id", agencyId)
        .single();
      if (agency) {
        regionalPreferences = {
          currency: agency.default_currency ?? undefined,
          locale: agency.default_locale ?? undefined,
          timezone: agency.default_timezone ?? undefined,
          dateFormat: agency.date_format ?? undefined,
          taxRate: agency.tax_rate != null ? Number(agency.tax_rate) : undefined,
          taxInclusive: agency.tax_inclusive ?? undefined,
          weightUnit: agency.weight_unit ?? undefined,
          dimensionUnit: agency.dimension_unit ?? undefined,
        };

        // Server-side branding fetch — eliminates purple flash on load
        const cb = (agency.custom_branding || {}) as Record<string, unknown>;
        initialBranding = {
          id: agency.id,
          agency_id: agency.id,
          agency_display_name: (cb.agency_display_name as string) || (cb.display_name as string) || agency.name || DEFAULT_BRANDING.agency_display_name,
          tagline: (cb.tagline as string) || null,
          logo_url: (cb.logo_url as string) || null,
          logo_dark_url: (cb.logo_dark_url as string) || null,
          favicon_url: (cb.favicon_url as string) || null,
          apple_touch_icon_url: (cb.apple_touch_icon_url as string) || null,
          primary_color: (cb.primary_color as string) || DEFAULT_BRANDING.primary_color,
          primary_foreground: (cb.primary_foreground as string) || DEFAULT_BRANDING.primary_foreground,
          accent_color: (cb.accent_color as string) || (cb.secondary_color as string) || DEFAULT_BRANDING.accent_color,
          accent_foreground: (cb.accent_foreground as string) || DEFAULT_BRANDING.accent_foreground,
          email_from_name: (cb.email_from_name as string) || null,
          email_reply_to: (cb.email_reply_to as string) || null,
          email_footer_text: (cb.email_footer_text as string) || null,
          email_footer_address: (cb.email_footer_address as string) || null,
          email_logo_url: (cb.email_logo_url as string) || null,
          email_social_links: (cb.email_social_links as Record<string, string>) || {},
          portal_welcome_title: (cb.portal_welcome_title as string) || null,
          portal_welcome_subtitle: (cb.portal_welcome_subtitle as string) || null,
          portal_login_background_url: (cb.portal_login_background_url as string) || null,
          portal_custom_css: (cb.portal_custom_css as string) || null,
          support_email: (cb.support_email as string) || null,
          support_url: (cb.support_url as string) || null,
          privacy_policy_url: (cb.privacy_policy_url as string) || null,
          terms_of_service_url: (cb.terms_of_service_url as string) || null,
          white_label_level: (cb.white_label_level as "basic" | "full" | "custom") || (agency.white_label_enabled ? "full" : "basic"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      // Columns may not exist yet — use defaults
    }
  }

  const dashboardContent = (
    <DashboardLayoutClient
      isSuperAdmin={isSuperAdmin}
      isImpersonating={isImpersonating}
      impersonationBanner={
        isImpersonating && impersonatedUser ? (
          <ImpersonationBanner
            userName={impersonatedUser.name || impersonatedUser.email || "User"}
            userEmail={impersonatedUser.email}
          />
        ) : undefined
      }
    >
      {children}
    </DashboardLayoutClient>
  );

  return (
    <TooltipProvider>
      <OnboardingRedirect>
        {agencyId ? (
          <>
            <ServerBrandingStyle branding={initialBranding} />
            <BrandingProvider agencyId={agencyId} initialBranding={initialBranding}>
              <CurrencyProvider initialPreferences={regionalPreferences}>
                {dashboardContent}
              </CurrencyProvider>
            </BrandingProvider>
          </>
        ) : (
          <CurrencyProvider>
            {dashboardContent}
          </CurrencyProvider>
        )}
      </OnboardingRedirect>
    </TooltipProvider>
  );
}
