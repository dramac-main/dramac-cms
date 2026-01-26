/**
 * Admin Billing Overview Component
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Displays platform-wide billing metrics:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Active subscriptions
 * - Churn rate
 * - ARPU (Average Revenue Per User)
 * - LTV (Lifetime Value)
 * - Plan distribution
 * - Top agencies by revenue
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface BillingOverview {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  ltv: number;
  arpu: number;
  mrrGrowth: number;
  subscriptionsByPlan: {
    starter: number;
    pro: number;
    enterprise: number;
  };
  revenueByMonth: {
    month: string;
    revenue: number;
    subscriptions: number;
  }[];
  topAgencies: {
    id: string;
    name: string;
    plan: string;
    mrr: number;
    usage: number;
  }[];
}

// ============================================================================
// Component
// ============================================================================

export function AdminBillingOverview() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/admin/billing/overview');
        if (res.ok) {
          const data = await res.json();
          setOverview(data);
          setError(null);
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to load billing overview');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOverview();
  }, []);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-8 w-24 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!overview) {
    return (
      <Alert>
        <AlertDescription>No billing data available</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${(overview.mrr / 100).toLocaleString()}`}
          change={overview.mrrGrowth}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={`$${(overview.arr / 100).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Active Subscriptions"
          value={overview.activeSubscriptions.toString()}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Churn Rate"
          value={`${overview.churnRate.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5" />}
          isNegativeGood
        />
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(overview.arpu / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(overview.ltv / 100).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">average per customer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge>Starter: {overview.subscriptionsByPlan.starter}</Badge>
              <Badge variant="secondary">Pro: {overview.subscriptionsByPlan.pro}</Badge>
              <Badge variant="outline">Enterprise: {overview.subscriptionsByPlan.enterprise}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Agencies */}
      <Card>
        <CardHeader>
          <CardTitle>Top Agencies by Revenue</CardTitle>
          <CardDescription>Highest paying customers this month</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.topAgencies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No agency data available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.topAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell className="font-medium">{agency.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {agency.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${(agency.mrr / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {agency.usage.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Metric Card Sub-Component
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  isNegativeGood?: boolean;
}

function MetricCard({ title, value, change, icon, isNegativeGood }: MetricCardProps) {
  const hasChange = change !== undefined && change !== 0;
  const isPositive = hasChange && (isNegativeGood ? change < 0 : change > 0);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hasChange && (
          <div className={cn(
            "flex items-center text-sm",
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
