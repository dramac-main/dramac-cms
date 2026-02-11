/**
 * Billing Activity Component
 * 
 * PHASE-DS-05: Billing & Revenue Dashboards
 * 
 * Real-time feed of billing events, invoices, and payment activity.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  RefreshCcw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Coins,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBillingActivity, getInvoiceMetrics } from "@/lib/actions/admin-analytics";
import type { BillingActivityItem, InvoiceMetrics, AdminTimeRange } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
// ============================================================================
// Types
// ============================================================================

interface BillingActivityProps {
  timeRange?: AdminTimeRange;
  className?: string;
  limit?: number;
}

// ============================================================================
// Constants
// ============================================================================

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  payment: CreditCard,
  refund: RefreshCcw,
  subscription: Receipt,
  invoice: FileText,
  cancellation: XCircle,
  upgrade: CheckCircle,
  failed: XCircle,
  downgrade: AlertTriangle,
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-600 bg-green-100 dark:bg-green-900/30",
  pending: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  failed: "text-red-600 bg-red-100 dark:bg-red-900/30",
  completed: "text-green-600 bg-green-100 dark:bg-green-900/30",
  refunded: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
};

const STATUS_ICONS: Record<string, LucideIcon> = {
  success: CheckCircle,
  pending: Clock,
  failed: XCircle,
  completed: CheckCircle,
  refunded: RefreshCcw,
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(cents: number): string {
  const isNegative = cents < 0;
  const absValue = Math.abs(cents);
  return `${isNegative ? "-" : ""}${DEFAULT_CURRENCY_SYMBOL}${(absValue / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" });
}

// ============================================================================
// Helper Components
// ============================================================================

function ActivityItem({ item }: { item: BillingActivityItem }) {
  const Icon = ACTIVITY_ICONS[item.type] || Receipt;
  const StatusIcon = STATUS_ICONS[item.status] || Clock;
  const statusClass = STATUS_COLORS[item.status] || "text-muted-foreground bg-muted";
  const isRefund = item.type === "refund";

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={cn("rounded-lg p-2", statusClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.description}</p>
          <Badge 
            variant={item.status === "success" ? "default" : item.status === "pending" ? "secondary" : "destructive"}
            className="text-xs"
          >
            {item.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground truncate">{item.agencyName}</p>
          <span className="text-muted-foreground">•</span>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(new Date(item.timestamp))}
          </p>
        </div>
      </div>
      <div className={cn(
        "text-sm font-medium",
        isRefund ? "text-red-600" : item.status === "success" ? "text-green-600" : "text-muted-foreground"
      )}>
        {isRefund ? "-" : "+"}{formatCurrency(Math.abs(item.amount))}
      </div>
    </div>
  );
}

function InvoiceStatusCard({ data }: { data: InvoiceMetrics }) {
  const total = data.paid + data.pending + data.overdue + data.draft;
  
  const items = [
    { label: "Paid", value: data.paid, color: "#22c55e", percentage: (data.paid / total) * 100 },
    { label: "Pending", value: data.pending, color: "#3b82f6", percentage: (data.pending / total) * 100 },
    { label: "Overdue", value: data.overdue, color: "#ef4444", percentage: (data.overdue / total) * 100 },
    { label: "Draft", value: data.draft, color: "#6b7280", percentage: (data.draft / total) * 100 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Invoice Status</CardTitle>
          <Badge variant="outline">{total} total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stacked Bar */}
        <div className="h-3 flex rounded-full overflow-hidden mb-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="h-full transition-all"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Amount Summary */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-medium">{formatCurrency(data.totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overdue Amount</span>
            <span className="font-medium text-red-600">{formatCurrency(data.overdueAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Invoice</span>
            <span className="font-medium">{formatCurrency(data.avgInvoiceAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FailedPaymentsAlert({ items }: { items: BillingActivityItem[] }) {
  const failed = items.filter(i => i.status === "failed" && i.type === "payment");
  
  if (failed.length === 0) {
    return (
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">No Failed Payments</p>
              <p className="text-xs text-green-600">All recent payments processed successfully</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
            Failed Payments ({failed.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {failed.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-red-700 dark:text-red-300 truncate">{item.agencyName}</span>
              <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
            </div>
          ))}
          {failed.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full text-red-600 hover:text-red-700">
              View all {failed.length} failed payments
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BillingActivityComponent({
  timeRange = "30d",
  className,
  limit = 20,
}: BillingActivityProps) {
  const [activity, setActivity] = useState<BillingActivityItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "payments" | "refunds" | "invoices">("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [activityData, invoiceData] = await Promise.all([
          getBillingActivity(limit),
          getInvoiceMetrics(timeRange),
        ]);
        setActivity(activityData);
        setInvoices(invoiceData);
      } catch (error) {
        console.error("Failed to fetch billing activity:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange, limit]);

  const filteredActivity = activity.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "payments") return item.type === "payment";
    if (activeTab === "refunds") return item.type === "refund";
    if (activeTab === "invoices") return item.type === "invoice";
    return true;
  });

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <ActivitySkeleton />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[280px]" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {/* Activity Feed */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Billing Activity</CardTitle>
                <CardDescription>Recent billing events and transactions</CardDescription>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
                  <TabsTrigger value="refunds" className="text-xs">Refunds</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {filteredActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-4" />
                  <p>No billing activity found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredActivity.map((item) => (
                    <ActivityItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {invoices && <InvoiceStatusCard data={invoices} />}
        <FailedPaymentsAlert items={activity} />
      </div>
    </div>
  );
}

// ============================================================================
// Compact Version for Dashboard
// ============================================================================

export function BillingActivityCompact({
  className,
  limit = 5,
}: BillingActivityProps) {
  const [activity, setActivity] = useState<BillingActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getBillingActivity(limit);
        setActivity(data);
      } catch (error) {
        console.error("Failed to fetch billing activity:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activity.slice(0, limit).map((item) => {
            const StatusIcon = STATUS_ICONS[item.status];
            return (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <StatusIcon className={cn(
                  "h-4 w-4",
                  item.status === "success" && "text-green-600",
                  item.status === "pending" && "text-amber-600",
                  item.status === "failed" && "text-red-600"
                )} />
                <span className="truncate flex-1 text-muted-foreground">
                  {item.agencyName}
                </span>
                <span className={cn(
                  "font-medium",
                  item.type === "refund" ? "text-red-600" : "text-green-600"
                )}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default BillingActivityComponent;
