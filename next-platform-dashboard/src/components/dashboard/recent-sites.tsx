import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSiteUrl, getSiteDomain, getBaseDomain } from "@/lib/utils/site-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RecentSite } from "@/lib/actions/dashboard";

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/10 text-success",
  archived: "bg-warning/10 text-warning",
};

interface RecentSitesProps {
  sites: RecentSite[];
}

export function RecentSites({ sites }: RecentSitesProps) {
  if (sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sites</CardTitle>
          <CardDescription>No sites yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Create your first site to get started.
            </p>
            <Link href="/dashboard/sites/new">
              <Button>Create Site</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent Sites</CardTitle>
          <CardDescription>Recently updated websites</CardDescription>
        </div>
        <Link href="/dashboard/sites">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="font-medium hover:underline"
                  >
                    {site.name}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getSiteDomain(site.subdomain, site.custom_domain)}</span>
                    {site.status === "published" && (
                      <a
                        href={getSiteUrl(site.subdomain, site.custom_domain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={statusColors[site.status as keyof typeof statusColors]}
                >
                  {site.status}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {site.updated_at ? formatDistanceToNow(new Date(site.updated_at), { addSuffix: true }) : "-"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
