import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isSuperAdmin = false;
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isSuperAdmin = profile?.role === "super_admin";
  }

  return (
    <TooltipProvider>
      <OnboardingRedirect>
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
      </OnboardingRedirect>
    </TooltipProvider>
  );
}
