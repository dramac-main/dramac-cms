import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency } from "@/lib/actions/agency";
import { DomainsManager } from "@/components/settings/domains-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Domain Settings | DRAMAC",
};

export default async function DomainsSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const agency = await getAgency(session.user.id);
  
  if (!agency) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Domains</h1>
          <p className="text-muted-foreground">
            Create an agency first to manage domains.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Domains</h1>
        <p className="text-muted-foreground">
          Manage custom domains for your agency and client sites
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>
            Connect your own domain for white-label branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DomainsManager agencyId={agency.id} />
        </CardContent>
      </Card>
    </div>
  );
}
