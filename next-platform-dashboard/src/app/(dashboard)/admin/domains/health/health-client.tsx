"use client";

// src/app/(dashboard)/admin/domains/health/health-client.tsx
// Super Admin — Supplier Health Dashboard Client

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Activity,
  RefreshCw,
  CircleCheck,
  AlertCircle,
  Clock,
  Database,
  Wallet,
  Wifi,
  Loader2,
  ShieldCheck,
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
import { toast } from "sonner";
import {
  checkSupplierHealth,
  type SupplierHealthStatus,
} from "@/lib/actions/admin-domains";

interface SupplierHealthClientProps {
  initialHealth: SupplierHealthStatus | null;
  error?: string;
}

export function SupplierHealthClient({
  initialHealth,
  error,
}: SupplierHealthClientProps) {
  const [health, setHealth] = useState(initialHealth);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await checkSupplierHealth();
      if (result.success && result.data) {
        setHealth(result.data);
        toast.success("Health check completed");
      } else {
        toast.error(result.error || "Health check failed");
      }
    } catch {
      toast.error("Failed to check supplier health");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCacheAge = (dateStr: string | null) => {
    if (!dateStr) return "Never cached";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/domains">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Supplier Health
            </h1>
            <p className="text-muted-foreground">
              Monitor ResellerClub API status, balance, and cache
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Super Admin Only
          </Badge>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {health && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-5 w-5" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {health.apiReachable ? (
                  <CircleCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {health.apiReachable ? "Connected" : "Unreachable"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Latency: {health.apiLatencyMs}ms</span>
              </div>
              {health.lastError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                  {health.lastError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Account Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {health.accountBalance !== null ? (
                <div>
                  <p className="text-3xl font-bold">
                    ${health.accountBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {health.balanceCurrency}
                  </p>
                  {health.accountBalance < 50 && (
                    <Badge variant="destructive" className="mt-2">
                      Low Balance
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Unable to fetch</p>
              )}
            </CardContent>
          </Card>

          {/* Pricing Cache */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5" />
                Pricing Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Domain pricing
                </p>
                <p className="font-medium">
                  {health.pricingCacheTldCount} TLDs cached
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {formatCacheAge(health.pricingCacheAge)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Email pricing
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {formatCacheAge(health.emailPricingCacheAge)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
