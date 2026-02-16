import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency } from "@/lib/actions/agency";
import { DomainsManager } from "@/components/settings/domains-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM } from "@/lib/constants/platform";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Custom Domains | ${PLATFORM.name}`,
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
          <h1 className="text-2xl font-bold">Custom Domains</h1>
          <p className="text-muted-foreground">
            Create an agency first to manage custom domains.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the agency's sites for domain management
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, subdomain, custom_domain, custom_domain_verified")
    .eq("agency_id", agency.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Domains</h1>
        <p className="text-muted-foreground">
          Manage custom domains for your agency and client sites
        </p>
      </div>

      {sites && sites.length > 0 ? (
        sites.map((site) => (
          <Card key={site.id}>
            <CardHeader>
              <CardTitle>{site.name}</CardTitle>
              <CardDescription>
                {site.subdomain} · {site.custom_domain ? site.custom_domain : "No custom domain"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainsManager
                siteId={site.id}
                currentSubdomain={site.subdomain}
                currentCustomDomain={site.custom_domain}
                domainVerified={site.custom_domain_verified ?? false}
              />
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sites found. Create a site first to manage domains.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
