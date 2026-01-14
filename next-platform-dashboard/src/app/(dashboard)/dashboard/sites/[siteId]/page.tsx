import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteOverview } from "@/components/sites/site-overview";
import { SitePagesList } from "@/components/sites/site-pages-list";
import { SitePublishButton } from "@/components/sites/site-publish-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Settings, ExternalLink } from "lucide-react";

interface SiteDetailPageProps {
  params: { siteId: string };
}

export async function generateMetadata({
  params,
}: SiteDetailPageProps): Promise<Metadata> {
  const site = await getSite(params.siteId).catch(() => null);
  return {
    title: site ? `${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const site = await getSite(params.siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={site.name}
        description={`${site.subdomain}.dramac.app`}
      >
        {site.published && (
          <a
            href={`https://${site.subdomain}.dramac.app`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Live
            </Button>
          </a>
        )}
        <Link href={`/dashboard/sites/${site.id}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${site.id}/editor`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Open Editor
          </Button>
        </Link>
        <SitePublishButton site={site} />
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages ({site.pages?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SiteOverview site={site} />
        </TabsContent>

        <TabsContent value="pages">
          <SitePagesList siteId={site.id} pages={site.pages || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
