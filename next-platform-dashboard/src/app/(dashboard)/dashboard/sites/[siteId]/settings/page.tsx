import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteSettingsForm } from "@/components/sites/site-settings-form";
import { SiteDangerZone } from "@/components/sites/site-danger-zone";
import { SiteModulesTab } from "@/components/sites/site-modules-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

interface SiteSettingsPageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({
  params,
}: SiteSettingsPageProps): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId).catch(() => null);
  return {
    title: site ? `Settings - ${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteSettingsPage({ params }: SiteSettingsPageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href={`/dashboard/sites/${site.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Site Settings"
        description={`Configure settings for ${site.name}`}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SiteSettingsForm site={site} section="general" />
        </TabsContent>

        <TabsContent value="domains">
          <SiteSettingsForm site={site} section="domains" />
        </TabsContent>

        <TabsContent value="seo">
          <SiteSettingsForm site={site} section="seo" />
        </TabsContent>

        <TabsContent value="modules">
          <SiteModulesTab siteId={site.id} />
        </TabsContent>

        <TabsContent value="danger">
          <SiteDangerZone site={site} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
