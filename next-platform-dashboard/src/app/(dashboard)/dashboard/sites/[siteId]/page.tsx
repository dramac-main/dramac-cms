import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite, getSiteEnabledModules } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteOverview } from "@/components/sites/site-overview";
import { SitePagesList } from "@/components/sites/site-pages-list";
import { SiteBlogTab } from "@/components/sites/site-blog-tab";
import { SiteModulesTab } from "@/components/sites/site-modules-tab";
import { SiteCRMTab } from "@/components/sites/site-crm-tab";
import { SiteSocialTab } from "@/components/sites/site-social-tab";
import { SitePublishButton } from "@/components/sites/site-publish-button";
import { CloneSiteDialog } from "@/components/sites/clone-site-dialog";
import { ExportSiteButton } from "@/components/sites/export-site-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Settings, ExternalLink, Search, Copy, Bot, Zap, Share2, Users, BarChart3, Wand2 } from "lucide-react";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";

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
  
  if (!site) {
    notFound();
  }

  // Get enabled modules for this site
  const enabledModules = await getSiteEnabledModules(siteId);
  const hasCRM = enabledModules.has("crm");
  const hasSocial = enabledModules.has("social-media");
  const hasAutomation = enabledModules.has("automation");
  const hasAIAgents = enabledModules.has("ai-agents");
  
  // Build valid tabs list based on enabled modules
  const validTabs = ["overview", "pages", "blog", "modules", "analytics"];
  if (hasCRM) validTabs.push("crm");
  if (hasSocial) validTabs.push("social");
  
  const defaultTab = tab && validTabs.includes(tab) ? tab : "overview";

  return (
    <div>
      <PageHeader
        title={site.name}
        description={getSiteDomain(site.subdomain, site.custom_domain)}
      >
        {site.published && (
          <a
            href={getSiteUrl(site.subdomain, site.custom_domain)}
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
        <Link href={`/dashboard/sites/${site.id}/ai-designer`}>
          <Button variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Wand2 className="mr-2 h-4 w-4" />
            AI Designer
          </Button>
        </Link>
        <Link href={`/sites/${site.id}/analytics`}>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </Link>
        {hasAutomation && (
          <Link href={`/dashboard/sites/${site.id}/automation`}>
            <Button variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Automation
            </Button>
          </Link>
        )}
        {hasAIAgents && (
          <Link href={`/dashboard/sites/${site.id}/ai-agents`}>
            <Button variant="outline">
              <Bot className="mr-2 h-4 w-4" />
              AI Agents
            </Button>
          </Link>
        )}
        {hasSocial && (
          <Link href={`/dashboard/sites/${site.id}/social`}>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Social
            </Button>
          </Link>
        )}
        {hasCRM && (
          <Link href={`/dashboard/sites/${site.id}/crm-module`}>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              CRM
            </Button>
          </Link>
        )}
        <Link href={`/dashboard/sites/${site.id}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${site.id}/pages`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Pages
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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {hasCRM && <TabsTrigger value="crm">CRM</TabsTrigger>}
          {hasSocial && <TabsTrigger value="social">Social</TabsTrigger>}
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

        <TabsContent value="analytics">
          <div className="rounded-lg border bg-card p-8 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Site Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                View detailed analytics including traffic sources, visitor metrics, device breakdown, geo data, and performance insights.
              </p>
              <Link href={`/sites/${site.id}/analytics`}>
                <Button size="lg" className="mt-4">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Open Full Analytics Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>

        {hasCRM && (
          <TabsContent value="crm">
            <SiteCRMTab siteId={site.id} />
          </TabsContent>
        )}

        {hasSocial && (
          <TabsContent value="social">
            <SiteSocialTab siteId={site.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
