import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { getProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";

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
  if (agencyId) {
    try {
      const { data: agency } = await (supabase as any)
        .from("agencies")
        .select("default_currency, default_locale, default_timezone, date_format, tax_rate, tax_inclusive, weight_unit, dimension_unit")
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
          <BrandingProvider agencyId={agencyId}>
            <CurrencyProvider initialPreferences={regionalPreferences}>
              {dashboardContent}
            </CurrencyProvider>
          </BrandingProvider>
        ) : (
          <CurrencyProvider>
            {dashboardContent}
          </CurrencyProvider>
        )}
      </OnboardingRedirect>
    </TooltipProvider>
  );
}
