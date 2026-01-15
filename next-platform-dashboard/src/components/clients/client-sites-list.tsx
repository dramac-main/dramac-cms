import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteUrl, getSiteDomain, getBaseDomain } from "@/lib/utils/site-url";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface ClientSitesListProps {
  clientId: string;
  sites: Site[];
}

export function ClientSitesList({ clientId, sites }: ClientSitesListProps) {
  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-lg font-semibold">No sites yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create the first website for this client.
        </p>
        <Link href={`/dashboard/sites/new?clientId=${clientId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Site
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <Card key={site.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base font-medium">
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="hover:underline"
                >
                  {site.name}
                </Link>
              </CardTitle>
              <Badge className={site.published ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                {site.published ? "Published" : "Draft"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {site.subdomain && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {getSiteDomain(site.subdomain, site.custom_domain)}
                  </span>
                  {site.published && (
                    <a
                      href={getSiteUrl(site.subdomain, site.custom_domain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {site.custom_domain && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{site.custom_domain}</span>
                  {site.published && (
                    <a
                      href={`https://${site.custom_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(site.updated_at), { addSuffix: true })}
                </span>
                <div className="flex gap-1">
                  <Link href={`/dashboard/sites/${site.id}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Site Card */}
      <Link href={`/dashboard/sites/new?clientId=${clientId}`}>
        <Card className="h-full min-h-[150px] cursor-pointer border-dashed hover:border-primary hover:bg-accent/50 transition-colors">
          <CardContent className="flex h-full flex-col items-center justify-center p-6">
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">Add New Site</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
