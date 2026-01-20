import Link from "next/link";
import { getSites } from "@/lib/actions/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Eye,
  Globe,
  User,
} from "lucide-react";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { formatDistanceToNow } from "date-fns";
import { DeleteSiteButton } from "./delete-site-button";
import type { SiteFilters } from "@/types/site";

interface SitesGridProps {
  filters?: SiteFilters;
}

const getStatusStyle = (published: boolean) => {
  return published
    ? "bg-success text-success-foreground"
    : "bg-muted text-muted-foreground";
};

const getStatusLabel = (published: boolean) => {
  return published ? "published" : "draft";
};

export async function SitesGrid({ filters }: SitesGridProps) {
  const sites = await getSites(filters);

  if (!sites || sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No sites yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Get started by creating your first website.
        </p>
        <Link href="/dashboard/sites/new">
          <Button>Create Site</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <Card key={site.id} className="group relative hover:shadow-md transition-shadow">
          {/* Site Preview/Thumbnail */}
          <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg overflow-hidden">
            {site.published && (site as any).screenshot_url ? (
              <img
                src={(site as any).screenshot_url}
                alt={`${site.name} preview`}
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : site.published ? (
              <img
                src={`/api/screenshot?url=${encodeURIComponent(getSiteUrl(site.subdomain, site.custom_domain))}`}
                alt={`${site.name} preview`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="h-16 w-16 text-primary/20" />
              </div>
            )}
            {/* Overlay with actions on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Link href={`/dashboard/sites/${site.id}`}>
                <Button size="sm" variant="secondary">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
              {site.published && (
                <a
                  href={getSiteUrl(site.subdomain, site.custom_domain)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </a>
              )}
            </div>
          </div>

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-base font-medium truncate">
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="hover:underline"
                  >
                    {site.name}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{getSiteDomain(site.subdomain, site.custom_domain)}</span>
                  {site.published && (
                    <a
                      href={getSiteUrl(site.subdomain, site.custom_domain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/sites/${site.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/sites/${site.id}/editor`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Open Editor
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getStatusStyle(site.published ?? false)}>
                  {getStatusLabel(site.published ?? false)}
                </Badge>
              </div>
              {site.client && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{site.client.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Updated {site.updated_at ? formatDistanceToNow(new Date(site.updated_at), { addSuffix: true }) : "—"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
