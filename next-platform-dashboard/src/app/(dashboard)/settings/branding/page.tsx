import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency, getAgencyBranding } from "@/lib/actions/agency";
import { BrandingForm } from "@/components/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Branding Settings | DRAMAC",
};

export default async function BrandingSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const agency = await getAgency(session.user.id);
  
  if (!agency) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Branding"
          description="Create an agency first to customize branding."
        />
      </div>
    );
  }

  const branding = await getAgencyBranding(agency.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding"
        description="Customize your agency's appearance and white-label settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Brand Identity</CardTitle>
          <CardDescription>
            Upload your logo and set brand colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm 
            agencyId={agency.id} 
            branding={branding?.custom_branding as Record<string, string> || {}} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
