import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgency } from "@/lib/actions/agency";
import { AgencyForm } from "@/components/settings/agency-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Agency Settings | DRAMAC",
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
        <div>
          <h1 className="text-2xl font-bold">Agency Settings</h1>
          <p className="text-muted-foreground">
            You don&apos;t have an agency yet. Create one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agency Settings</h1>
        <p className="text-muted-foreground">
          Manage your agency details and preferences
        </p>
      </div>

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
