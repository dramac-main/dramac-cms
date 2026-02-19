// src/app/(dashboard)/dashboard/domains/settings/page.tsx
// Domain Management Settings — Agency-Level Overview
// Agencies see: overview stats, client assignment, branding, quick actions
// Pricing controls have been moved to super admin (/admin/domains)

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { 
  Globe, 
  Palette, 
  ChevronRight,
  TrendingUp,
  Package,
  Users,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgencyPricingConfig, getUsageSummary, getRevenueAnalytics } from "@/lib/actions/domain-billing";
import { getDomains, getAgencyClientsForAssignment, getAgencySitesForAssignment } from "@/lib/actions/domains";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import { PLATFORM } from "@/lib/constants/platform";
import { DomainClientAssignmentSection } from "./domain-client-assignment";

export const metadata: Metadata = {
  title: `Domain Settings | ${PLATFORM.name}`,
  description: "Manage your domains — view stats, assign to clients, and configure branding",
};

async function DomainSettingsContent() {
  const [configResult, usageResult, revenueResult, domainsResult, clientsResult, sitesResult] = await Promise.all([
    getAgencyPricingConfig(),
    getUsageSummary(),
    getRevenueAnalytics('month'),
    getDomains({ limit: 100 }),
    getAgencyClientsForAssignment(),
    getAgencySitesForAssignment(),
  ]);
  
  const config = configResult.data;
  const usage = usageResult.data;
  const revenue = revenueResult.data;
  const allDomains = domainsResult.data || [];
  const clients = clientsResult.data || [];
  const sites = sitesResult.data || [];
  
  // Count domains assigned to clients
  const assignedDomains = allDomains.filter((d) => d.client_id);
  const unassignedDomains = allDomains.filter((d) => !d.client_id);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };
  
  const settingsCards = [
    {
      title: "Client Domain Assignment",
      description: "Assign domains to specific clients for tracking and billing",
      icon: LinkIcon,
      href: "#client-assignment",
      badge: `${assignedDomains.length} assigned`,
      badgeVariant: assignedDomains.length > 0 ? "default" as const : "secondary" as const,
      isAnchor: true,
    },
    {
      title: "White-Label Branding",
      description: "Customize support email and terms URL for clients",
      icon: Palette,
      href: "/dashboard/domains/settings/branding",
      badge: config?.custom_support_email ? "Configured" : "Default",
      badgeVariant: config?.custom_support_email ? "default" as const : "secondary" as const,
      isAnchor: false,
    },
  ];
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Globe className="h-8 w-8" />
          Domain Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Overview, client assignment, and branding for your domain services
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allDomains.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {(usage?.domains_registered || 0) + (usage?.domains_renewed || 0)} registered/renewed this month
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
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedDomains.length}
            </div>
            <p className="text-xs text-muted-foreground">
              domains linked to clients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {unassignedDomains.length}
            </div>
            <p className="text-xs text-muted-foreground">
              not linked to any client
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Settings Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((card) => 
          card.isAnchor ? (
            <a key={card.href} href={card.href}>
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
                    Manage <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </a>
          ) : (
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
          )
        )}
      </div>
      
      {/* Client Domain Assignment Section */}
      <div id="client-assignment">
        <DomainClientAssignmentSection
          domains={allDomains.map((d) => ({
            id: d.id,
            domain_name: d.domain_name,
            client_id: d.client_id ?? null,
            site_id: d.site_id ?? null,
            status: d.status,
          }))}
          clients={clients}
          sites={sites}
        />
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
              <Link href="/dashboard/domains/settings/branding">Edit Branding</Link>
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
      
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
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

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
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
