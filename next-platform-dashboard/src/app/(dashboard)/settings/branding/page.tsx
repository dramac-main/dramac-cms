import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency, getAgencyBranding } from "@/lib/actions/agency";
import { BrandingForm } from "@/components/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div>
          <h1 className="text-2xl font-bold">Branding</h1>
          <p className="text-muted-foreground">
            Create an agency first to customize branding.
          </p>
        </div>
      </div>
    );
  }

  const branding = await getAgencyBranding(agency.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branding</h1>
        <p className="text-muted-foreground">
          Customize your agency&apos;s appearance and white-label settings
        </p>
      </div>

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
