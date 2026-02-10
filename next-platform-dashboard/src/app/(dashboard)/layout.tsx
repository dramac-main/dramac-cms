import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { BrandingProvider } from "@/components/providers/branding-provider";
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
            {dashboardContent}
          </BrandingProvider>
        ) : (
          dashboardContent
        )}
      </OnboardingRedirect>
    </TooltipProvider>
  );
}
