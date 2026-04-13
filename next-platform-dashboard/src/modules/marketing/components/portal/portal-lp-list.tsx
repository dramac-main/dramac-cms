/**
 * Portal LP List — Client Portal Landing Pages View
 *
 * Phase LPB-10: Client Portal LP Management
 */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  LayoutTemplate,
  Globe,
  Eye,
  MousePointerClick,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalLandingPage } from "../../types/lp-builder-types";
import {
  getPortalLandingPages,
  getPortalLPStats,
} from "../../actions/portal-landing-pages";

interface PortalLPListProps {
  siteId?: string;
}

export function PortalLPList({ siteId }: PortalLPListProps) {
  const [pages, setPages] = useState<PortalLandingPage[]>([]);
  const [stats, setStats] = useState({
    totalPages: 0,
    published: 0,
    totalVisits: 0,
    totalConversions: 0,
    avgConversionRate: 0,
  });
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (!siteId) return;
    startTransition(async () => {
      const [lpData, statsData] = await Promise.all([
        getPortalLandingPages(siteId),
        getPortalLPStats(siteId),
      ]);
      setPages(lpData);
      setStats(statsData);
    });
  }, [siteId]);

  if (!siteId) {
    return (
      <div className="text-muted-foreground rounded-lg border p-8 text-center">
        Select a site to view landing pages.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="bg-muted h-6 w-16 animate-pulse rounded" />
                <div className="bg-muted mt-2 h-4 w-24 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="bg-muted h-64 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <LayoutTemplate className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVisits.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <MousePointerClick className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalConversions.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.avgConversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LP Cards */}
      {pages.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border p-12 text-center">
          <LayoutTemplate className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <h3 className="mb-2 text-lg font-medium">No Landing Pages Yet</h3>
          <p>Your team is building landing pages for your site.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((lp) => (
            <Card key={lp.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">
                    {lp.title}
                  </CardTitle>
                  <Badge
                    variant={
                      lp.status === "published" ? "default" : "secondary"
                    }
                  >
                    {lp.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">/{lp.slug}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Visits</p>
                    <p className="font-medium">
                      {lp.totalVisits.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Conversions</p>
                    <p className="font-medium">
                      {lp.totalConversions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CVR</p>
                    <p className="font-medium">{lp.conversionRate}%</p>
                  </div>
                </div>

                {lp.publishedAt && (
                  <p className="text-muted-foreground text-xs">
                    Published {new Date(lp.publishedAt).toLocaleDateString()}
                  </p>
                )}

                {lp.status === "published" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(lp.publicUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View Live
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
