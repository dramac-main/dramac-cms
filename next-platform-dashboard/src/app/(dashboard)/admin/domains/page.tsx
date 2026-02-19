// src/app/(dashboard)/admin/domains/page.tsx
// Super Admin Domain & Email Platform Controls
// Platform-level pricing, revenue, and RC health monitoring

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  Globe,
  Coins,
  TrendingUp,
  Package,
  ChevronRight,
  Server,
  Activity,
  Settings2,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { getRevenueAnalytics, getUsageSummary } from "@/lib/actions/domain-billing";
import { PLATFORM } from "@/lib/constants/platform";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from "@/lib/locale-config";

export const metadata: Metadata = {
  title: `Domain & Email Platform Controls | ${PLATFORM.name}`,
  description: "Platform-level domain pricing, revenue analytics, and supplier health",
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(price);
};

async function PlatformDomainStats() {
  const [usageResult, revenueResult] = await Promise.all([
    getUsageSummary(),
    getRevenueAnalytics("month"),
  ]);

  const usage = usageResult.data;
  const revenue = revenueResult.data;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Domains This Month</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(usage?.domains_registered || 0) + (usage?.domains_renewed || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {usage?.domains_registered || 0} registered · {usage?.domains_renewed || 0} renewed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Accounts</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {usage?.email_accounts_created || 0}
          </div>
          <p className="text-xs text-muted-foreground">created this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(revenue?.total_revenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(revenue?.total_profit || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {revenue?.profit_margin || 0}% margin
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function PlatformDomainContent() {
  const settingsCards = [
    {
      title: "Platform Pricing Controls",
      description:
        "Configure the platform markup applied on top of supplier pricing. Controls what all agencies see as retail prices.",
      icon: Coins,
      href: "/admin/domains/pricing",
      badge: "Platform-Wide",
      badgeVariant: "default" as const,
    },
    {
      title: "Supplier Health",
      description:
        "Monitor ResellerClub API status, account balance, and pricing cache freshness.",
      icon: Activity,
      href: "/admin/domains/health",
      badge: "Live",
      badgeVariant: "default" as const,
    },
    {
      title: "Revenue Analytics",
      description:
        "Detailed revenue breakdown by domain registrations, renewals, transfers, and email.",
      icon: TrendingUp,
      href: "/admin/domains/revenue",
      badge: "Analytics",
      badgeVariant: "secondary" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Globe className="h-8 w-8" />
          Domain & Email Platform Controls
        </h1>
        <p className="text-muted-foreground mt-2">
          Platform-level pricing, supplier monitoring, and revenue analytics.
          These settings control what all agencies and clients see.
        </p>
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <PlatformDomainStats />
      </Suspense>

      {/* Settings Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {settingsCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <card.icon className="h-8 w-8 text-primary" />
                  <Badge variant={card.badgeVariant}>{card.badge}</Badge>
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 h-auto">
                  Configure <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            How Domain Pricing Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 shrink-0">1</Badge>
              <p>
                <strong className="text-foreground">Supplier Cost</strong> — ResellerClub charges a wholesale (cost) price for each domain/email operation.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 shrink-0">2</Badge>
              <p>
                <strong className="text-foreground">RC Panel Markup</strong> — Your ResellerClub panel has a configured profit margin (e.g. 100% = 2× cost). The customer-price API returns prices with this margin already included.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 shrink-0">3</Badge>
              <p>
                <strong className="text-foreground">Platform Markup</strong> — An optional additional markup applied here. When disabled (default), agencies see exactly the prices from your RC panel. When enabled, an extra percentage or fixed amount is added.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 shrink-0">4</Badge>
              <p>
                <strong className="text-foreground">Paddle Checkout</strong> — All payments flow through the platform&apos;s Paddle account. Revenue is collected centrally.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-40 mt-4" />
              <Skeleton className="h-4 w-56 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDomainsPage() {
  await requireSuperAdmin();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PlatformDomainContent />
    </Suspense>
  );
}
