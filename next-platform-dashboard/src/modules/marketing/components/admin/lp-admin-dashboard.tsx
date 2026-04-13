/**
 * LP Admin Dashboard — Platform Health View
 *
 * Phase LPB-10: Super Admin Health View
 */
"use client";

import { useState, useTransition } from "react";
import {
  LayoutTemplate,
  Globe,
  Eye,
  MousePointerClick,
  TrendingUp,
  RefreshCw,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { LPPlatformStats } from "../../types/lp-builder-types";
import {
  refreshLPAdminStats,
  getLPAdminSiteStats,
} from "../../actions/admin-landing-pages";
import { LPAdminTable } from "./lp-admin-table";

interface LPAdminDashboardProps {
  stats: LPPlatformStats;
}

export function LPAdminDashboard({
  stats: initialStats,
}: LPAdminDashboardProps) {
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const studioPercentage =
    stats.totalLps > 0
      ? Math.round((stats.totalStudio / stats.totalLps) * 100)
      : 0;

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshLPAdminStats();
      if (result.success) {
        toast.success("Stats refreshed");
        // Re-fetch stats after refresh
        const { stats: freshSiteStats } = await getLPAdminSiteStats();
        const freshStats: LPPlatformStats = {
          ...stats,
          topPerformers: freshSiteStats.slice(0, 10),
        };
        setStats(freshStats);
      } else {
        toast.error("Failed to refresh stats");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Platform Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total LPs</CardTitle>
            <LayoutTemplate className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLps}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeSites} active sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPublished}</div>
            <p className="text-muted-foreground text-xs">
              {stats.totalDraft} draft, {stats.totalArchived} archived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studio Format</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studioPercentage}%</div>
            <p className="text-muted-foreground text-xs">
              {stats.totalStudio} studio / {stats.totalLegacy} legacy
            </p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform CVR</CardTitle>
            <ArrowUpDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.platformConversionRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Progress */}
      {stats.totalLps > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Studio Migration Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {stats.totalStudio} of {stats.totalLps} pages using Studio
                format
              </span>
              <span className="font-medium">{studioPercentage}%</span>
            </div>
            <Progress value={studioPercentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search sites or agencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          />
          Refresh Stats
        </Button>
      </div>

      {/* Per-Site Table */}
      <LPAdminTable initialStats={stats.topPerformers} search={search} />
    </div>
  );
}
