/**
 * Portal Analytics Dashboard
 *
 * Phase MKT-11: Client Portal Marketing Views
 *
 * Simplified analytics overview for portal clients showing
 * aggregated email campaign metrics.
 */
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaigns } from "@/modules/marketing/actions/campaign-actions";
import {
  Mail,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface PortalAnalyticsDashboardProps {
  siteId: string;
}

interface AggregatedStats {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export function PortalAnalyticsDashboard({
  siteId,
}: PortalAnalyticsDashboardProps) {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getCampaigns(siteId, { limit: 100, offset: 0 });
        const campaigns = result.campaigns || [];

        const agg: AggregatedStats = {
          totalCampaigns: campaigns.length,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalBounced: 0,
          totalUnsubscribed: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
        };

        for (const c of campaigns) {
          agg.totalSent += (c as any).totalSent || 0;
          agg.totalDelivered += (c as any).totalDelivered || 0;
          agg.totalOpened += (c as any).totalOpened || 0;
          agg.totalClicked += (c as any).totalClicked || 0;
          agg.totalBounced += (c as any).totalBounced || 0;
          agg.totalUnsubscribed += (c as any).totalUnsubscribed || 0;
        }

        if (agg.totalDelivered > 0) {
          agg.openRate = (agg.totalOpened / agg.totalDelivered) * 100;
          agg.clickRate = (agg.totalClicked / agg.totalDelivered) * 100;
          agg.bounceRate = (agg.totalBounced / agg.totalSent) * 100;
        }

        setStats(agg);
      } catch {
        setError("Failed to load analytics data");
      }
    });
  }, [siteId]);

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending || !stats) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Sent",
      value: stats.totalSent.toLocaleString(),
      icon: Send,
      description: `${stats.totalCampaigns} campaigns`,
    },
    {
      title: "Delivered",
      value: stats.totalDelivered.toLocaleString(),
      icon: Mail,
      description:
        stats.totalSent > 0
          ? `${((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)}% delivery rate`
          : "No sends yet",
    },
    {
      title: "Open Rate",
      value: `${stats.openRate.toFixed(1)}%`,
      icon: Eye,
      description: `${stats.totalOpened.toLocaleString()} total opens`,
    },
    {
      title: "Click Rate",
      value: `${stats.clickRate.toFixed(1)}%`,
      icon: MousePointerClick,
      description: `${stats.totalClicked.toLocaleString()} total clicks`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Email Analytics</h1>
        <p className="text-muted-foreground">
          Aggregated performance across all campaigns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.totalBounced > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Health Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="text-lg font-semibold">
                  {stats.bounceRate.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bounces</p>
                <p className="text-lg font-semibold">
                  {stats.totalBounced.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unsubscribes</p>
                <p className="text-lg font-semibold">
                  {stats.totalUnsubscribed.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
