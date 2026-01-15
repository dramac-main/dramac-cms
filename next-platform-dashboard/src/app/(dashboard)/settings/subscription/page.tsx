import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { SubscriptionDetails } from "@/components/settings/subscription-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Subscription | DRAMAC",
};

export default async function SubscriptionSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your billing and subscription settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            View and manage your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionDetails userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
