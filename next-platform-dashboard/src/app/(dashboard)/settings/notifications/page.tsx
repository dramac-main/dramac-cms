import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getNotificationPreferences } from "@/lib/actions/notifications";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { PushNotificationSettings } from "@/components/settings/push-notification-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Notification Settings | ${PLATFORM.name}`,
};

export default async function NotificationSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const preferences = await getNotificationPreferences(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Configure how and when you receive notifications"
      />

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Receive browser push notifications even when the dashboard is not open
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which emails you&apos;d like to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
