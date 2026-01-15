import { Metadata } from "next";
import { Suspense } from "react";
import { getNotifications } from "@/lib/actions/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { NotificationsFilters } from "@/components/notifications/notifications-filters";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Notifications | DRAMAC",
  description: "View and manage your notifications",
};

interface NotificationsPageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

function NotificationsLoading() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function NotificationsContent({ filter }: { filter?: string }) {
  const unreadOnly = filter === "unread";

  const { notifications, unreadCount } = await getNotifications({
    unreadOnly,
    limit: 100,
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <NotificationsFilters currentFilter={filter} />
      </div>

      <NotificationsList notifications={notifications} />
    </>
  );
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const params = await searchParams;

  return (
    <div className="container py-8 max-w-3xl">
      <Suspense fallback={<NotificationsLoading />}>
        <NotificationsContent filter={params.filter} />
      </Suspense>
    </div>
  );
}
