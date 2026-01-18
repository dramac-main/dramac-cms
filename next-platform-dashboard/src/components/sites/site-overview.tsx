import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Calendar,
  Clock,
  FileText,
  User,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { Site } from "@/types/site";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";

interface SiteOverviewProps {
  site: Site & {
    client?: { id: string; name: string; company: string | null } | null;
    pages?: { id: string }[];
  };
}

const statusColors = {
  published: "bg-success text-success-foreground",
  draft: "bg-muted text-muted-foreground",
};

export function SiteOverview({ site }: SiteOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Site Info Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subdomain */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subdomain</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getSiteDomain(site.subdomain, site.custom_domain)}</span>
                  {site.published && (
                    <a
                      href={getSiteUrl(site.subdomain, site.custom_domain)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Domain */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custom Domain</p>
                <p className="font-medium">
                  {site.custom_domain || (
                    <span className="text-muted-foreground">Not configured</span>
                  )}
                </p>
              </div>
            </div>

            {/* Client */}
            {site.client && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{site.client.name}</p>
                </div>
              </div>
            )}

            {/* Created */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {site.created_at ? format(new Date(site.created_at), "MMM d, yyyy") : "—"}
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {site.updated_at ? format(new Date(site.updated_at), "MMM d, yyyy") : "—"}
                </p>
              </div>
            </div>

            {/* Published At */}
            {site.published_at && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="font-medium">
                    {format(new Date(site.published_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{site.pages?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={site.published ? statusColors.published : statusColors.draft}>
                  {site.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
