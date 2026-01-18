"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, FileText, Calendar, Info } from "lucide-react";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];
type Page = Database["public"]["Tables"]["pages"]["Row"];

interface PortalSiteDetailProps {
  site: Site & {
    pages?: Pick<Page, "id" | "name" | "slug" | "is_homepage">[];
  };
}

export function PortalSiteDetail({ site }: PortalSiteDetailProps) {
  const url = site.subdomain 
    ? getSiteUrl(site.subdomain, site.custom_domain)
    : null;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link href="/portal" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to My Sites
      </Link>

      {/* Site Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{site.name}</h1>
            <Badge className={site.published 
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
            }>
              {site.published ? "Live" : "Draft"}
            </Badge>
          </div>
          {url && (
            <p className="text-muted-foreground mt-1">
              {getSiteDomain(site.subdomain, site.custom_domain)}
            </p>
          )}
        </div>

        {url && site.published && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Site
            </Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Site Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Domain</p>
                  <p className="font-medium">
                    {site.subdomain ? getSiteDomain(site.subdomain, site.custom_domain) : "Not configured"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pages</p>
                  <p className="font-medium">{site.pages?.length || 0} pages</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{site.created_at ? format(new Date(site.created_at), "MMM d, yyyy") : "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{site.updated_at ? formatDistanceToNow(new Date(site.updated_at), { addSuffix: true }) : "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Things you can do with this site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {url && site.published && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Live Site
                </Button>
              </a>
            )}
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/portal/sites/${site.id}/analytics`}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/support">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Request Changes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pages List */}
      {site.pages && site.pages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pages
            </CardTitle>
            <CardDescription>All pages on this website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {site.pages.map((page) => (
                <div key={page.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-muted-foreground">
                        /{page.slug === "/" ? "" : page.slug}
                      </p>
                    </div>
                  </div>
                  {page.is_homepage && (
                    <Badge variant="secondary">Homepage</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
