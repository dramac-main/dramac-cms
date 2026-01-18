"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOverview } from "./client-overview";
import { ClientSitesList } from "./client-sites-list";
import { ClientActivityLog } from "./client-activity-log";
import { ClientPortalSettings } from "./client-portal-settings";
import { ClientDangerZone } from "./client-danger-zone";
import type { Client } from "@/types/client";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface ClientDetailTabsProps {
  client: Client & {
    sites?: Site[];
  };
}

export function ClientDetailTabs({ client }: ClientDetailTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["overview", "sites", "portal", "activity", "danger"];
  const defaultTab = tabParam && validTabs.includes(tabParam) ? tabParam : "overview";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sites">Sites ({client.sites?.length || 0})</TabsTrigger>
        <TabsTrigger value="portal">Portal Access</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ClientOverview client={client} />
      </TabsContent>

      <TabsContent value="sites">
        <ClientSitesList clientId={client.id} sites={client.sites || []} />
      </TabsContent>

      <TabsContent value="portal">
        <ClientPortalSettings client={client} />
      </TabsContent>

      <TabsContent value="activity">
        <ClientActivityLog clientId={client.id} />
      </TabsContent>

      <TabsContent value="danger">
        <ClientDangerZone client={client} />
      </TabsContent>
    </Tabs>
  );
}
