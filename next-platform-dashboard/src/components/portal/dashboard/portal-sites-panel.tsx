/**
 * PortalSitesPanel — renders the list of sites the client owns.
 *
 * Demonstrates: DAL → normalized shape → shared empty/error patterns.
 */

import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalEmptyState } from "@/components/portal/patterns";
import type { PortalDAL } from "@/lib/portal/data-access";

interface PortalSitesPanelProps {
  dal: PortalDAL;
}

export async function PortalSitesPanel({ dal }: PortalSitesPanelProps) {
  const sites = await dal.sites.list();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe className="h-4 w-4" aria-hidden />
          Sites
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {sites.length} {sites.length === 1 ? "site" : "sites"}
        </span>
      </CardHeader>
      <CardContent className="pt-2">
        {sites.length === 0 ? (
          <PortalEmptyState
            icon={Globe}
            title="No sites yet"
            description="Your agency hasn't given you access to any sites. Reach out to your account manager."
          />
        ) : (
          <ul className="space-y-2">
            {sites.slice(0, 5).map((site) => (
              <li
                key={site.id}
                className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{site.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {site.customDomain || site.subdomain || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant={site.isPublished ? "default" : "secondary"}
                    className="h-5 text-[10px] uppercase"
                  >
                    {site.isPublished ? "Live" : "Draft"}
                  </Badge>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                  >
                    <Link
                      href={`/portal/sites/${site.id}`}
                      aria-label={`Open ${site.name}`}
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
            {sites.length > 5 ? (
              <li className="pt-1 text-center">
                <Button asChild variant="link" size="sm">
                  <Link href="/portal/sites">
                    View all {sites.length} sites
                  </Link>
                </Button>
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default PortalSitesPanel;
