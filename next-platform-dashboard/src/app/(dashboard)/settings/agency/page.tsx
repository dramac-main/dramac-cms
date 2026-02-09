import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency } from "@/lib/actions/agency";
import { AgencyForm } from "@/components/settings/agency-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Agency Settings | ${PLATFORM.name}`,
};

export default async function AgencySettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const agency = await getAgency(session.user.id);

  if (!agency) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Agency Settings"
          description="You don't have an agency yet. Create one to get started."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Settings"
        description="Manage your agency details and preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic details about your agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgencyForm agency={agency} />
        </CardContent>
      </Card>
    </div>
  );
}
