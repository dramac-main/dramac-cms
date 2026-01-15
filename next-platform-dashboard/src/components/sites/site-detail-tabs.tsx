"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteOverview } from "./site-overview";
import { SitePagesList } from "./site-pages-list";
import { SiteSettingsGeneral } from "./site-settings-general";
import { SiteModulesTab } from "./site-modules-tab";
import { SiteDangerZone } from "./site-danger-zone";
import type { Site } from "@/types/site";

interface SiteDetailTabsProps {
  site: Site & {
    pages?: Array<{
      id: string;
      name: string;
      slug: string;
      is_homepage: boolean;
      created_at: string;
    }>;
    client?: { id: string; name: string; company: string | null } | null;
  };
}

export function SiteDetailTabs({ site }: SiteDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="pages">Pages</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <SiteOverview site={site} />
      </TabsContent>

      <TabsContent value="pages">
        <SitePagesList siteId={site.id} pages={site.pages || []} />
      </TabsContent>

      <TabsContent value="settings">
        <SiteSettingsGeneral site={site} />
      </TabsContent>

      <TabsContent value="modules">
        <SiteModulesTab siteId={site.id} />
      </TabsContent>

      <TabsContent value="danger">
        <SiteDangerZone site={site} />
      </TabsContent>
    </Tabs>
  );
}
