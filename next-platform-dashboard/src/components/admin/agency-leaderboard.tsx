/**
 * Agency Leaderboard Component
 * 
 * PHASE-DS-04B: Admin Dashboard - Agency Metrics
 * 
 * Displays top agencies by various metrics with rankings and trends.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  Globe,
  Activity,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Crown,
  Medal,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgencyLeaderboard } from "@/lib/actions/admin-analytics";
import type { AgencyLeaderboard, AgencyRankItem } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface AgencyLeaderboardProps {
  className?: string;
  timeRange?: string;
}

type LeaderboardCategory = "revenue" | "sites" | "engagement" | "risk" | "new";

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_CONFIG: Record<
  LeaderboardCategory,
  { label: string; icon: LucideIcon; description: string }
> = {
  revenue: {
    label: "Top Revenue",
    icon: DollarSign,
    description: "Highest MRR agencies",
  },
  sites: {
    label: "Most Sites",
    icon: Globe,
    description: "Agencies with most sites",
  },
  engagement: {
    label: "Most Active",
    icon: Activity,
    description: "Highest engagement scores",
  },
  risk: {
    label: "At Risk",
    icon: AlertTriangle,
    description: "Agencies needing attention",
  },
  new: {
    label: "Recently Joined",
    icon: Sparkles,
    description: "Newly onboarded agencies",
  },
};

const RANK_ICONS = [Crown, Medal, Trophy];

// ============================================================================
// Helper Components
// ============================================================================

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const Icon = RANK_ICONS[rank - 1];
    const colors = [
      "text-yellow-500",
      "text-gray-400",
      "text-amber-600",
    ];
    return <Icon className={cn("h-5 w-5", colors[rank - 1])} />;
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-medium text-muted-foreground">
      {rank}
    </span>
  );
}

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (!trend || trend === "stable") {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  return trend === "up" ? (
    <TrendingUp className="h-3 w-3 text-green-500" />
  ) : (
    <TrendingDown className="h-3 w-3 text-red-500" />
  );
}

function LeaderboardItem({
  item,
  rank,
  category,
}: {
  item: AgencyRankItem;
  rank: number;
  category: LeaderboardCategory;
}) {
  const isRisk = category === "risk";

  return (
    <Link
      href={`/admin/agencies/${item.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        "hover:bg-muted/50"
      )}
    >
      <RankBadge rank={rank} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs capitalize">
            {item.plan}
          </Badge>
          <TrendIcon trend={item.trend} />
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-semibold text-sm",
          isRisk && "text-red-600"
        )}>
          {item.valueLabel}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function LeaderboardList({
  items,
  category,
}: {
  items: AgencyRankItem[];
  category: LeaderboardCategory;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No agencies found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1">
        {items.map((item, index) => (
          <LeaderboardItem
            key={item.id}
            item={item}
            rank={index + 1}
            category={category}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AgencyLeaderboardComponent({ className }: AgencyLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<AgencyLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>("revenue");

  const fetchLeaderboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAgencyLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch agency leaderboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getItemsForCategory = (category: LeaderboardCategory): AgencyRankItem[] => {
    if (!leaderboard) return [];
    switch (category) {
      case "revenue":
        return leaderboard.topByRevenue;
      case "sites":
        return leaderboard.topBySites;
      case "engagement":
        return leaderboard.topByEngagement;
      case "risk":
        return leaderboard.atRisk;
      case "new":
        return leaderboard.newlyOnboarded;
      default:
        return [];
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Agency Leaderboard</CardTitle>
          <CardDescription>Top performing and notable agencies</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchLeaderboard(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardCategory)}>
          <TabsList className="grid grid-cols-5 mb-4">
            {(Object.keys(CATEGORY_CONFIG) as LeaderboardCategory[]).map((category) => {
              const config = CATEGORY_CONFIG[category];
              const Icon = config.icon;
              return (
                <TabsTrigger key={category} value={category} className="gap-1 text-xs">
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(CATEGORY_CONFIG) as LeaderboardCategory[]).map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {CATEGORY_CONFIG[category].description}
              </p>
              {loading ? (
                <LeaderboardSkeleton />
              ) : (
                <LeaderboardList
                  items={getItemsForCategory(category)}
                  category={category}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Compact leaderboard widget for dashboard
 */
export function AgencyLeaderboardCompact({
  category = "revenue",
  limit = 5,
  className,
}: {
  category?: LeaderboardCategory;
  limit?: number;
  className?: string;
}) {
  const [items, setItems] = useState<AgencyRankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAgencyLeaderboard();
        let categoryItems: AgencyRankItem[];
        switch (category) {
          case "revenue":
            categoryItems = data.topByRevenue;
            break;
          case "sites":
            categoryItems = data.topBySites;
            break;
          case "engagement":
            categoryItems = data.topByEngagement;
            break;
          case "risk":
            categoryItems = data.atRisk;
            break;
          case "new":
            categoryItems = data.newlyOnboarded;
            break;
          default:
            categoryItems = [];
        }
        setItems(categoryItems.slice(0, limit));
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [category, limit]);

  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {config.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data available
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <RankBadge rank={index + 1} />
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-muted-foreground">{item.valueLabel}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AgencyLeaderboardComponent;
