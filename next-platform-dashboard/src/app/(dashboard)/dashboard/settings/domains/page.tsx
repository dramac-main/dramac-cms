// src/app/(dashboard)/dashboard/settings/domains/page.tsx
// Domain Settings Overview Page

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { 
  Globe, 
  Coins, 
  Palette, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  Package,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgencyPricingConfig, getUsageSummary, getRevenueAnalytics } from "@/lib/actions/domain-billing";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import { PLATFORM } from "@/lib/constants/platform";
export const metadata: Metadata = {
  title: `Domain Settings | ${PLATFORM.name}`,
  description: "Configure domain pricing, branding, and billing settings",
};

async function DomainSettingsContent() {
  const [configResult, usageResult, revenueResult] = await Promise.all([
    getAgencyPricingConfig(),
    getUsageSummary(),
    getRevenueAnalytics('month'),
  ]);
  
  const config = configResult.data;
  const usage = usageResult.data;
  const revenue = revenueResult.data;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };
  
  const settingsCards = [
    {
      title: "Pricing Configuration",
      description: "Set markup rates and TLD-specific pricing",
      icon: Coins,
      href: "/dashboard/settings/domains/pricing",
      badge: config?.default_markup_type === 'percentage' 
        ? `${config.default_markup_value}% markup` 
        : config?.default_markup_type === 'fixed'
          ? `+${formatPrice(config.default_markup_value || 0)} markup`
          : "Custom pricing",
      badgeVariant: "default" as const,
    },
    {
      title: "White-Label Branding",
      description: "Customize support email and terms URL",
      icon: Palette,
      href: "/dashboard/settings/domains/branding",
      badge: config?.custom_support_email ? "Configured" : "Default",
      badgeVariant: config?.custom_support_email ? "default" as const : "secondary" as const,
    },
    {
      title: "Billing Integration",
      description: "Connect Paddle for automatic payments",
      icon: CreditCard,
      href: "/dashboard/settings/domains/billing",
      badge: config?.paddle_product_id ? "Connected" : "Not configured",
      badgeVariant: config?.paddle_product_id ? "default" as const : "secondary" as const,
    },
  ];
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Globe className="h-8 w-8" />
          Domain Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure pricing, branding, and billing for your domain reselling business
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usage?.domains_registered || 0) + (usage?.domains_renewed || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              domains registered/renewed
            </p>
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
            <p className="text-xs text-muted-foreground">
              last 30 days
            </p>
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
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Tiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config?.client_tiers?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              pricing tiers configured
            </p>
          </CardContent>
        </Card>
      </div>
      
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
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for domain management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/domains">View All Domains</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/domains/search">Register New Domain</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/domains/pricing">Edit Pricing</Link>
            </Button>
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      
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
      
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DomainSettingsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DomainSettingsContent />
    </Suspense>
  );
}
