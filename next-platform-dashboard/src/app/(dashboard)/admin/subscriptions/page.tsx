import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Users, TrendingUp, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = {
  title: "Subscriptions | Admin | DRAMAC",
  description: "Manage platform subscriptions and billing",
};

async function getSubscriptionData() {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get subscription counts (mock data since we may not have Stripe set up)
  const { count: totalAgencies } = await supabase
    .from("agencies")
    .select("*", { count: "exact", head: true });

  // Mock subscription data
  const plans = [
    { name: "Free", count: Math.floor((totalAgencies || 0) * 0.4), price: 0 },
    { name: "Starter", count: Math.floor((totalAgencies || 0) * 0.35), price: 19 },
    { name: "Professional", count: Math.floor((totalAgencies || 0) * 0.2), price: 49 },
    { name: "Enterprise", count: Math.floor((totalAgencies || 0) * 0.05), price: 99 },
  ];

  const mrr = plans.reduce((acc, plan) => acc + plan.count * plan.price, 0);

  return {
    totalSubscribers: totalAgencies || 0,
    mrr,
    plans,
    churnRate: 2.5,
    growthRate: 8.3,
  };
}

export default async function AdminSubscriptionsPage() {
  const data = await getSubscriptionData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">
          Monitor and manage platform subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscribers"
          value={data.totalSubscribers}
          icon={Users}
          change={data.growthRate}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${data.mrr.toLocaleString()}`}
          icon={DollarSign}
          isCurrency
        />
        <StatCard
          title="Churn Rate"
          value={`${data.churnRate}%`}
          icon={TrendingUp}
          change={-0.3}
        />
        <StatCard
          title="Avg Revenue/User"
          value={`$${data.totalSubscribers > 0 ? Math.round(data.mrr / data.totalSubscribers) : 0}`}
          icon={CreditCard}
        />
      </div>

      {/* Plans Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
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
                      `$${plan.price}/mo`
                    )}
                  </TableCell>
                  <TableCell>{plan.count}</TableCell>
                  <TableCell>${(plan.count * plan.price).toLocaleString()}</TableCell>
                  <TableCell>
                    {data.totalSubscribers > 0
                      ? Math.round((plan.count / data.totalSubscribers) * 100)
                      : 0}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Payment integration not configured. Connect a payment provider to see
            transactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
