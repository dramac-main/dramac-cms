"use client";

// src/app/(dashboard)/admin/domains/revenue/revenue-client.tsx
// Super Admin — Revenue Analytics Client Component

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Building2,
  CreditCard,
  PiggyBank,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getPlatformRevenueAnalytics } from "@/lib/actions/admin-domains";
import type { RevenueAnalytics } from "@/types/domain-pricing";

type RevenueData = RevenueAnalytics & {
  agency_count: number;
  top_tlds: Array<{ tld: string; count: number; revenue: number }>;
};

interface RevenueAnalyticsClientProps {
  initialData: RevenueData | null;
  error?: string;
}

export function RevenueAnalyticsClient({
  initialData,
  error,
}: RevenueAnalyticsClientProps) {
  const [data, setData] = useState<RevenueData | null>(initialData);
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePeriodChange = async (
    newPeriod: "month" | "quarter" | "year"
  ) => {
    setPeriod(newPeriod);
    setIsRefreshing(true);
    try {
      const result = await getPlatformRevenueAnalytics(newPeriod);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast.error(result.error || "Failed to load analytics");
      }
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await getPlatformRevenueAnalytics(period);
      if (result.success && result.data) {
        setData(result.data);
        toast.success("Analytics refreshed");
      } else {
        toast.error(result.error || "Failed to refresh");
      }
    } catch {
      toast.error("Failed to refresh analytics");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const periodLabel = {
    month: "Last 30 Days",
    quarter: "Last Quarter",
    year: "Last Year",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/domains">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Revenue Analytics
            </h1>
            <p className="text-muted-foreground">
              Platform-wide domain & email revenue — {periodLabel[period]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Super Admin Only
          </Badge>
          <Select value={period} onValueChange={(v) => handlePeriodChange(v as "month" | "quarter" | "year")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && !data && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.total_revenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Customer payments received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Supplier Cost
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.total_cost)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Paid to ResellerClub
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <PiggyBank className="h-4 w-4" />
                  Gross Profit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.total_profit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Revenue minus cost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  Profit Margin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.profit_margin}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.agency_count} agencies active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue by Type
              </CardTitle>
              <CardDescription>
                Breakdown of revenue by domain and email services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(data.by_type).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No revenue data for this period
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.by_type).map(([type, stats]) => {
                    const typedStats = stats as {
                      revenue: number;
                      cost: number;
                      profit: number;
                      count: number;
                    };
                    const pct =
                      data.total_revenue > 0
                        ? (typedStats.revenue / data.total_revenue) * 100
                        : 0;

                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {type.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {typedStats.count} transactions
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(typedStats.revenue)}
                            </p>
                            <p className="text-xs text-green-600">
                              Profit: {formatCurrency(typedStats.profit)}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agency Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Agency Activity
              </CardTitle>
              <CardDescription>
                Agencies with domain/email transactions this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{data.agency_count}</div>
                <div className="text-sm text-muted-foreground">
                  agencies with transactions in {periodLabel[period].toLowerCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
