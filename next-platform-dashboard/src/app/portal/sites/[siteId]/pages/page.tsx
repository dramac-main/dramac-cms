import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FileText,
  ExternalLink,
  Globe,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOMAINS } from "@/lib/constants/domains";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSite } from "@/lib/portal/portal-service";
import { getSiteUrl } from "@/lib/utils/site-url";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pages | Client Portal",
  description: "View your website pages",
};

interface Props {
  params: Promise<{ siteId: string }>;
}

export default async function PortalSitePagesPage({ params }: Props) {
  const { siteId } = await params;
  const user = await requirePortalAuth();
  const site = await getClientSite(user.clientId, siteId);

  if (!site) {
    notFound();
  }

  const url = getSiteUrl(site.subdomain, site.customDomain);

  // Fetch pages for this site
  const supabase = createAdminClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id, name, slug, is_homepage, updated_at")
    .eq("site_id", siteId)
    .order("is_homepage", { ascending: false })
    .order("name");

  const pagesList = pages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Pages
          </h1>
          <p className="text-muted-foreground mt-1">
            {pagesList.length} {pagesList.length === 1 ? "page" : "pages"} on{" "}
            {site.name}
          </p>
        </div>
        {url && site.isPublished && (
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4 mr-2" />
              Visit Site
            </a>
          </Button>
        )}
      </div>

      {/* Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>Site Pages</CardTitle>
          <CardDescription>
            All pages on your website. Contact your agency to make structural
            changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagesList.length > 0 ? (
            <div className="space-y-2">
              {pagesList.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {page.name}
                        {page.is_homepage && (
                          <Badge variant="secondary" className="ml-2">
                            Homepage
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        /{page.slug}
                      </p>
                    </div>
                  </div>
                  {url && site.isPublished && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`${url}${page.is_homepage ? "" : `/${page.slug}`}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No pages found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
