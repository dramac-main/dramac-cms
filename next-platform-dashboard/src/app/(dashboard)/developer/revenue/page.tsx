// src/app/(dashboard)/developer/revenue/page.tsx
// Phase EM-43: Revenue Sharing Dashboard

"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Download,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from "@/components/ui";
import { RevenueChart } from "@/components/developer/RevenueChart";
import {
  useRevenueData,
  useRequestPayout,
  useStripeConnectOnboarding,
  useExportRevenue,
} from "@/hooks/use-revenue-data";
import { toast } from "sonner";

export default function RevenueDashboardPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const { summary, analytics, sales, payouts, payoutAccount, isLoading } =
    useRevenueData({ dateRange, moduleId: selectedModule });

  const requestPayout = useRequestPayout();
  const stripeConnect = useStripeConnectOnboarding();
  const exportRevenue = useExportRevenue();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSetupPayouts = async () => {
    try {
      const { url } = await stripeConnect.mutateAsync();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to get setup link"
      );
    }
  };

  const handleRequestPayout = async () => {
    const now = new Date();
    const periodEnd = now.toISOString().split("T")[0];
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    try {
      await requestPayout.mutateAsync({ periodStart, periodEnd });
      toast.success("Payout requested successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request payout"
      );
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      await exportRevenue.mutateAsync({ format, dateRange });
      toast.success("Export downloaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export data"
      );
    }
  };

  if (isLoading) {
    return <RevenueDashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <p className="text-muted-foreground">
            Track your earnings and manage payouts
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={exportRevenue.isPending}
          >
            {exportRevenue.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>

      {/* Payout Account Alert */}
      {payoutAccount?.stripe_account_status !== "active" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>
              {payoutAccount?.stripe_account_status === "pending"
                ? "Complete your payout account setup to receive earnings."
                : payoutAccount?.stripe_account_status === "restricted"
                  ? "Your payout account needs attention. Please complete the required steps."
                  : "Set up your payout account to start receiving earnings."}
            </span>
            <Button
              size="sm"
              onClick={handleSetupPayouts}
              disabled={stripeConnect.isPending}
            >
              {stripeConnect.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Setup Payouts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.totalEarnings || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.pendingBalance || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.thisMonth || 0)}
                </p>
                {summary?.growthPercent !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      (summary?.growthPercent || 0) > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(summary?.growthPercent || 0) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(summary?.growthPercent || 0).toFixed(1)}% vs last
                    month
                  </div>
                )}
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.totalPaidOut || 0)}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Download className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Your earnings for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={analytics?.data || []} />
            </CardContent>
          </Card>

          {/* Top Modules & Geography */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Modules</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topModules && analytics.topModules.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topModules.slice(0, 5).map((module, i) => (
                      <div
                        key={module.moduleId}
                        className="flex items-center gap-4"
                      >
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{module.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {module.sales} sales
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(module.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No sales data for this period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Country</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.byCountry && analytics.byCountry.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.byCountry.slice(0, 5).map((country) => (
                      <div
                        key={country.country}
                        className="flex items-center gap-4"
                      >
                        <span className="text-2xl">
                          {getCountryFlag(country.country)}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{country.country}</p>
                          <p className="text-sm text-muted-foreground">
                            {country.sales} sales
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(country.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No geographic data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                All your module sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sales?.sales && sales.sales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {sale.module?.icon && (
                              <span>{sale.module.icon}</span>
                            )}
                            <span>{sale.module?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{sale.buyer?.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.transaction_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.status === "completed"
                                ? "default"
                                : sale.status === "refunded"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {sale.status === "refunded" ? (
                            <span className="text-red-600">
                              -{formatCurrency(sale.refund_amount || 0)}
                            </span>
                          ) : (
                            formatCurrency(sale.developer_amount)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No sales recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>
                  Your completed and pending payouts
                </CardDescription>
              </div>
              <Button
                onClick={handleRequestPayout}
                disabled={
                  requestPayout.isPending ||
                  payoutAccount?.stripe_account_status !== "active" ||
                  (summary?.pendingBalance || 0) <
                    (payoutAccount?.payout_threshold || 50)
                }
              >
                {requestPayout.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Request Payout
              </Button>
            </CardHeader>
            <CardContent>
              {payouts?.payouts && payouts.payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Fees</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          {new Date(payout.period_start).toLocaleDateString()} -{" "}
                          {new Date(payout.period_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(payout.gross_earnings)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          -
                          {formatCurrency(
                            payout.platform_fees + payout.refunds
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.payout_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payout.status === "completed"
                                ? "default"
                                : payout.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.processed_at
                            ? new Date(payout.processed_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {payout.statement_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={payout.statement_url} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No payouts recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    Japan: "🇯🇵",
    Brazil: "🇧🇷",
    India: "🇮🇳",
    China: "🇨🇳",
  };
  return flags[country] || "🌍";
}

function RevenueDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
