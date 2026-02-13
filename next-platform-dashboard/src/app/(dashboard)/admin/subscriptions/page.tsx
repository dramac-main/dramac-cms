import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Users, TrendingUp, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Subscriptions | Admin | ${PLATFORM.name}`,
  description: "Manage platform subscriptions and billing",
};

async function getSubscriptionData() {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get real agency count
  const { count: totalAgencies } = await supabase
    .from("agencies")
    .select("*", { count: "exact", head: true });

  // Get real subscription data if available
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("status, plan_id")
    .eq("status", "active");

  const plans = new Map<string, { count: number; price: number }>();
  if (subscriptions && subscriptions.length > 0) {
    for (const sub of subscriptions) {
      const name = sub.plan_id || "Unknown";
      const existing = plans.get(name) || { count: 0, price: 0 };
      existing.count += 1;
      plans.set(name, existing);
    }
  }

  const planList = Array.from(plans.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    price: data.price,
  }));

  const mrr = planList.reduce((acc, plan) => acc + plan.count * plan.price, 0);
  const activeSubscribers = planList.reduce((acc, plan) => acc + plan.count, 0);

  return {
    totalAgencies: totalAgencies || 0,
    activeSubscribers,
    mrr,
    plans: planList,
    hasRealData: planList.length > 0,
  };
}

export default async function AdminSubscriptionsPage() {
  const data = await getSubscriptionData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Monitor and manage platform subscriptions"
      />

      {!data.hasRealData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active subscriptions found. Subscription data will appear here once agencies subscribe to paid plans via Paddle billing.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Agencies"
          value={data.totalAgencies}
          icon={Users}
        />
        <StatCard
          title="Active Subscribers"
          value={data.activeSubscribers}
          icon={CreditCard}
        />
        <StatCard
          title="Monthly Revenue"
          value={data.hasRealData ? `$ ${data.mrr.toLocaleString("en-US")}` : "—"}
          icon={TrendingUp}
        />
      </div>

      {/* Plans Breakdown */}
      {data.hasRealData && (
        <Card>
          <CardHeader>
            <CardTitle>Active Plans</CardTitle>
            <CardDescription>Breakdown of current subscriptions by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.plans.map((plan) => (
                  <TableRow key={plan.name}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      {plan.price === 0 ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        `$ ${plan.price}/mo`
                      )}
                    </TableCell>
                    <TableCell>{plan.count}</TableCell>
                    <TableCell>$ {(plan.count * plan.price).toLocaleString("en-US")}</TableCell>
                    <TableCell>
                      {data.activeSubscribers > 0
                        ? Math.round((plan.count / data.activeSubscribers) * 100)
                        : 0}
                      %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!data.hasRealData && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No subscription data available yet. Plans will appear here once agencies subscribe via Paddle billing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
