"use client";

import Link from "next/link";
import { ExternalLink, Globe, Calendar } from "lucide-react";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface PortalSitesListProps {
  sites: Site[];
}

export function PortalSitesList({ sites }: PortalSitesListProps) {
  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Sites Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            Your websites will appear here once they&apos;re set up. 
            Contact your agency if you have questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => {
        const url = site.subdomain 
          ? getSiteUrl(site.subdomain, site.custom_domain)
          : null;

        return (
          <Card key={site.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Site Preview Thumbnail */}
            <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Globe className="h-16 w-16 text-primary/30" />
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{site.name}</CardTitle>
                <Badge className={site.published 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                }>
                  {site.published ? "Live" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {url ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="truncate">{getSiteDomain(site.subdomain, site.custom_domain)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>No domain configured</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated {formatDistanceToNow(new Date(site.updated_at), { addSuffix: true })}</span>
              </div>

              <div className="flex gap-2 pt-2">
                {url && site.published && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Site
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="sm" asChild className="flex-1">
                  <Link href={`/portal/sites/${site.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
