import { BrandingProvider } from "@/components/providers/branding-provider";
import { ServerBrandingStyle } from "@/components/providers/server-branding-style";
import { getAgencyBranding, getDefaultAgencyBranding } from "@/lib/queries/branding";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Try to resolve agency branding for auth pages
  let branding = null;
  let agencyId: string | null = null;

  try {
    // If user already has a session (e.g. onboarding, reset-password), use their agency
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();

      agencyId = profile?.agency_id ?? null;

      if (!agencyId) {
        const { data: membership } = await supabase
          .from("agency_members")
          .select("agency_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        agencyId = membership?.agency_id ?? null;
      }

      if (agencyId) {
        branding = await getAgencyBranding(agencyId);
      }
    }
  } catch {
    // Not authenticated — expected for login/signup pages
  }

  // Fallback: use platform default agency branding
  if (!branding) {
    branding = await getDefaultAgencyBranding();
    agencyId = branding?.agency_id ?? null;
  }

  return (
    <div className="min-h-screen bg-background">
      {branding && <ServerBrandingStyle branding={branding} />}
      <BrandingProvider agencyId={agencyId} initialBranding={branding}>
        {children}
      </BrandingProvider>
    </div>
  );
}
