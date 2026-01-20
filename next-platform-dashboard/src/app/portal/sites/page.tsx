import { Metadata } from "next";
import Link from "next/link";
import { Globe, ExternalLink, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Input import removed - using built-in search functionality
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSites } from "@/lib/portal/portal-service";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "My Sites | Client Portal",
  description: "View and manage your websites",
};

export default async function PortalSitesPage() {
  const user = await requirePortalAuth();
  const sites = await getClientSites(user.clientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Sites</h1>
          <p className="text-muted-foreground mt-1">
            {sites.length} {sites.length === 1 ? "website" : "websites"} managed for you
          </p>
        </div>
      </div>

      {/* Sites Grid */}
      {sites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => {
            const url = site.subdomain 
              ? getSiteUrl(site.subdomain, site.customDomain)
              : null;
            const domain = site.subdomain
              ? getSiteDomain(site.subdomain, site.customDomain)
              : null;

            return (
              <Card key={site.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Site Preview Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  {site.isPublished && url ? (
                    <img
                      src={`https://api.screenshotone.com/take?access_key=8gVT7LCtbdkNjQ&url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&device_scale_factor=1&format=jpg&image_quality=80&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=false&block_trackers=true&delay=0&timeout=60&full_page=false&fresh=false`}
                      alt={`${site.name} preview`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Globe className="h-16 w-16 text-primary/30" />
                  )}
                  <Badge 
                    className="absolute top-3 right-3 z-10"
                    variant={site.isPublished ? "default" : "secondary"}
                  >
                    {site.isPublished ? "Live" : "Draft"}
                  </Badge>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{site.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {domain ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{domain}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span>No domain configured</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>{site.pageCount} {site.pageCount === 1 ? "page" : "pages"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Updated {site.lastUpdatedAt ? formatDistanceToNow(new Date(site.lastUpdatedAt), { addSuffix: true }) : "recently"}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/portal/sites/${site.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {url && site.isPublished && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Sites Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              Your websites will appear here once they&apos;re set up. 
              Contact your agency if you have questions.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/portal/support/new">
                Contact Support
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
