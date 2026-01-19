import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteOverview } from "@/components/sites/site-overview";
import { SitePagesList } from "@/components/sites/site-pages-list";
import { SiteBlogTab } from "@/components/sites/site-blog-tab";
import { SiteModulesTab } from "@/components/sites/site-modules-tab";
import { SitePublishButton } from "@/components/sites/site-publish-button";
import { CloneSiteDialog } from "@/components/sites/clone-site-dialog";
import { ExportSiteButton } from "@/components/sites/export-site-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Settings, ExternalLink, Search, Copy } from "lucide-react";

interface SiteDetailPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({
  params,
}: SiteDetailPageProps): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId).catch(() => null);
  return {
    title: site ? `${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteDetailPage({ params, searchParams }: SiteDetailPageProps) {
  const { siteId } = await params;
  const { tab } = await searchParams;
  const site = await getSite(siteId).catch(() => null);
  const validTabs = ["overview", "pages", "blog", "modules"];
  const defaultTab = tab && validTabs.includes(tab) ? tab : "overview";

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
        <Link href={`/dashboard/sites/${site.id}/seo`}>
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            SEO
          </Button>
        </Link>
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
        <CloneSiteDialog
          siteId={site.id}
          siteName={site.name}
          clientId={site.client_id}
          agencyId={site.agency_id}
        >
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </Button>
        </CloneSiteDialog>
        <ExportSiteButton siteId={site.id} siteName={site.name} />
        <SitePublishButton site={site} />
      </PageHeader>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages ({site.pages?.length || 0})</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SiteOverview site={site} />
        </TabsContent>

        <TabsContent value="pages">
          <SitePagesList siteId={site.id} pages={site.pages || []} />
        </TabsContent>

        <TabsContent value="blog">
          <SiteBlogTab siteId={site.id} />
        </TabsContent>

        <TabsContent value="modules">
          <SiteModulesTab siteId={site.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
