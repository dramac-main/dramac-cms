# Phase DM-05: Domain Management Dashboard

> **Priority**: 🔴 HIGH
> **Estimated Time**: 8 hours
> **Prerequisites**: DM-01, DM-02, DM-03, DM-04
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a comprehensive domain management dashboard:
1. Domain overview with status and expiry
2. Domain detail pages with all settings
3. Renewal management
4. Auto-renew configuration
5. Domain assignment to clients/sites
6. Nameserver management

---

## 📁 Files to Create

```
src/app/(dashboard)/dashboard/domains/
├── [domainId]/
│   ├── page.tsx               # Domain details page
│   ├── dns/page.tsx           # DNS management page
│   ├── email/page.tsx         # Email management page
│   └── settings/page.tsx      # Domain settings page
├── loading.tsx                 # Loading state
└── error.tsx                   # Error boundary

src/components/domains/
├── domain-overview-card.tsx    # Individual domain card
├── domain-list.tsx             # Domain list view
├── domain-detail-header.tsx    # Domain detail header
├── domain-info-card.tsx        # Domain info display
├── domain-nameservers.tsx      # Nameserver management
├── domain-auto-renew.tsx       # Auto-renewal toggle
├── domain-assignment.tsx       # Client/site assignment
├── domain-status-badge.tsx     # Status indicator
├── domain-expiry-badge.tsx     # Expiry indicator
├── domain-quick-actions.tsx    # Common actions menu
└── expiring-domains-widget.tsx # Dashboard widget
```

---

## 📋 Implementation Tasks

### Task 1: Domain List Page (60 mins)

```typescript
// src/app/(dashboard)/dashboard/domains/page.tsx

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Filter, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainList } from "@/components/domains/domain-list";
import { DomainFilters } from "@/components/domains/domain-filters";
import { ExpiringDomainsWidget } from "@/components/domains/expiring-domains-widget";
import { getDomains, getDomainStats } from "@/lib/actions/domains";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Clock, AlertTriangle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Domains | DRAMAC",
  description: "Manage your domains",
};

interface DomainsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    tld?: string;
    page?: string;
  }>;
}

async function DomainStats() {
  const { data: stats } = await getDomainStats();
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Domains</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalEmails}</p>
              <p className="text-sm text-muted-foreground">Email Accounts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function DomainListContent({ searchParams }: { searchParams: DomainsPageProps['searchParams'] }) {
  const params = await searchParams;
  
  const { data: domains, total, page, limit } = await getDomains({
    search: params.search,
    status: params.status as 'active' | 'expired' | 'pending' | 'all',
    tld: params.tld,
    page: params.page ? parseInt(params.page) : 1,
  });
  
  return (
    <DomainList 
      domains={domains || []} 
      total={total || 0}
      page={page || 1}
      limit={limit || 20}
    />
  );
}

export default async function DomainsPage({ searchParams }: DomainsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Domains</h1>
          <p className="text-muted-foreground">
            Manage your domain portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/domains/search">
              <Plus className="h-4 w-4 mr-2" />
              Register Domain
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <Suspense fallback={<StatsSkeletons />}>
        <DomainStats />
      </Suspense>
      
      {/* Expiring Domains Alert */}
      <Suspense fallback={null}>
        <ExpiringDomainsWidget />
      </Suspense>
      
      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <DomainFilters />
        </CardContent>
      </Card>
      
      {/* Domain List */}
      <Suspense fallback={<ListSkeleton />}>
        <DomainListContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function StatsSkeletons() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Task 2: Domain List Component (60 mins)

```typescript
// src/components/domains/domain-list.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Globe, 
  ExternalLink, 
  MoreVertical, 
  RefreshCw, 
  Settings,
  Mail,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DomainStatusBadge } from "./domain-status-badge";
import { DomainExpiryBadge } from "./domain-expiry-badge";
import { cn } from "@/lib/utils";
import type { DomainWithDetails } from "@/types/domain";

interface DomainListProps {
  domains: DomainWithDetails[];
  total: number;
  page: number;
  limit: number;
}

export function DomainList({ domains, total, page, limit }: DomainListProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / limit);
  
  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No domains found</h3>
          <p className="text-muted-foreground">
            Register your first domain to get started
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/domains/search">
              Register Domain
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Domain Cards */}
      <div className="space-y-3">
        {domains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`?page=${page - 1}`} />
              </PaginationItem>
            )}
            
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show first, last, and pages around current
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      href={`?page=${pageNum}`}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={`?page=${page + 1}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function DomainCard({ domain }: { domain: DomainWithDetails }) {
  const [isRenewing, setIsRenewing] = useState(false);
  
  const handleRenew = async () => {
    setIsRenewing(true);
    // Would trigger renewal flow
    setIsRenewing(false);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Domain Info */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/dashboard/domains/${domain.id}`}
                  className="font-semibold hover:underline"
                >
                  {domain.domain_name}
                </Link>
                <a 
                  href={`https://${domain.domain_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {domain.client && (
                  <>
                    <span>{domain.client.company || domain.client.name}</span>
                    <span>•</span>
                  </>
                )}
                {domain.site && (
                  <>
                    <span>{domain.site.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>{domain.tld}</span>
              </div>
            </div>
          </div>
          
          {/* Status & Expiry */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end gap-1">
              <DomainStatusBadge status={domain.status} />
              <DomainExpiryBadge expiryDate={domain.expiry_date} />
            </div>
            
            {/* Auto-Renew Indicator */}
            {domain.auto_renew && (
              <Badge variant="outline" className="hidden sm:flex">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-Renew
              </Badge>
            )}
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/domains/${domain.id}`}>
                  Manage
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/domains/${domain.id}/dns`}>
                      <Settings className="h-4 w-4 mr-2" />
                      DNS Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/domains/${domain.id}/email`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRenew} disabled={isRenewing}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isRenewing && "animate-spin")} />
                    Renew Now
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a 
                      href={`https://${domain.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Visit Site
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 3: Domain Detail Page (90 mins)

```typescript
// src/app/(dashboard)/dashboard/domains/[domainId]/page.tsx

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Globe, 
  ExternalLink, 
  Settings,
  Server,
  Mail,
  Shield,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DomainDetailHeader } from "@/components/domains/domain-detail-header";
import { DomainInfoCard } from "@/components/domains/domain-info-card";
import { DomainNameservers } from "@/components/domains/domain-nameservers";
import { DomainAutoRenew } from "@/components/domains/domain-auto-renew";
import { DomainAssignment } from "@/components/domains/domain-assignment";
import { getDomain, getDomainDnsRecords } from "@/lib/actions/domains";
import { Skeleton } from "@/components/ui/skeleton";

interface DomainDetailPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: DomainDetailPageProps): Promise<Metadata> {
  const { domainId } = await params;
  // Would fetch domain name
  return {
    title: `Domain Details | DRAMAC`,
    description: "Manage domain settings",
  };
}

async function DomainContent({ domainId }: { domainId: string }) {
  const { data: domain, error } = await getDomain(domainId);
  
  if (error || !domain) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <DomainDetailHeader domain={domain} />
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dns">DNS Records</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Domain Info */}
            <div className="lg:col-span-2 space-y-6">
              <DomainInfoCard domain={domain} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Nameservers
                  </CardTitle>
                  <CardDescription>
                    Configure where your domain points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DomainNameservers 
                    domainId={domain.id}
                    currentNameservers={domain.nameservers || []}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assigned To</CardTitle>
                </CardHeader>
                <CardContent>
                  <DomainAssignment 
                    domainId={domain.id}
                    currentClientId={domain.client_id}
                    currentSiteId={domain.site_id}
                  />
                </CardContent>
              </Card>
              
              {/* Auto-Renew */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RefreshCw className="h-4 w-4" />
                    Auto-Renewal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DomainAutoRenew 
                    domainId={domain.id}
                    enabled={domain.auto_renew}
                    expiryDate={domain.expiry_date}
                  />
                </CardContent>
              </Card>
              
              {/* Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" />
                    WHOIS Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {domain.whois_privacy ? 'Enabled' : 'Disabled'}
                    </span>
                    <Button variant="outline" size="sm">
                      {domain.whois_privacy ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/dashboard/domains/${domain.id}/dns`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage DNS
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/dashboard/domains/${domain.id}/email`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Setup Email
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a 
                      href={`https://${domain.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Site
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="dns">
          <Card>
            <CardHeader>
              <CardTitle>DNS Records</CardTitle>
              <CardDescription>
                Manage DNS records for {domain.domain_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <Link 
                  href={`/dashboard/domains/${domain.id}/dns`}
                  className="text-primary hover:underline"
                >
                  Open DNS Manager →
                </Link>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Accounts</CardTitle>
              <CardDescription>
                Manage email accounts for {domain.domain_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <Link 
                  href={`/dashboard/domains/${domain.id}/email`}
                  className="text-primary hover:underline"
                >
                  Open Email Manager →
                </Link>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>
                Advanced settings for {domain.domain_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <Link 
                  href={`/dashboard/domains/${domain.id}/settings`}
                  className="text-primary hover:underline"
                >
                  Open Settings →
                </Link>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/domains">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domains
        </Link>
      </Button>
      
      <Suspense fallback={<DomainDetailSkeleton />}>
        <DomainContent domainId={domainId} />
      </Suspense>
    </div>
  );
}

function DomainDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
```

### Task 4: Supporting Components (90 mins)

```typescript
// src/components/domains/domain-status-badge.tsx

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type DomainStatus = 'active' | 'pending' | 'expired' | 'suspended' | 'transferring' | 'redemption';

interface DomainStatusBadgeProps {
  status: DomainStatus;
  className?: string;
}

const statusConfig: Record<DomainStatus, { label: string; icon: React.ElementType; variant: string }> = {
  active: { label: 'Active', icon: CheckCircle, variant: 'bg-green-500/10 text-green-600' },
  pending: { label: 'Pending', icon: Clock, variant: 'bg-yellow-500/10 text-yellow-600' },
  expired: { label: 'Expired', icon: XCircle, variant: 'bg-red-500/10 text-red-600' },
  suspended: { label: 'Suspended', icon: AlertTriangle, variant: 'bg-orange-500/10 text-orange-600' },
  transferring: { label: 'Transferring', icon: RefreshCw, variant: 'bg-blue-500/10 text-blue-600' },
  redemption: { label: 'Redemption', icon: AlertTriangle, variant: 'bg-red-500/10 text-red-600' },
};

export function DomainStatusBadge({ status, className }: DomainStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn(config.variant, "gap-1", className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
```

```typescript
// src/components/domains/domain-expiry-badge.tsx

import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isAfter, addDays } from "date-fns";

interface DomainExpiryBadgeProps {
  expiryDate: string | null;
  className?: string;
}

export function DomainExpiryBadge({ expiryDate, className }: DomainExpiryBadgeProps) {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const isExpired = !isAfter(expiry, now);
  const isExpiringSoon = !isExpired && !isAfter(expiry, addDays(now, 30));
  const isExpiringVerySOon = !isExpired && !isAfter(expiry, addDays(now, 7));
  
  const getVariant = () => {
    if (isExpired) return 'bg-red-500/10 text-red-600';
    if (isExpiringVerySOon) return 'bg-red-500/10 text-red-600';
    if (isExpiringSoon) return 'bg-yellow-500/10 text-yellow-600';
    return 'bg-muted text-muted-foreground';
  };
  
  const getLabel = () => {
    if (isExpired) return 'Expired';
    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`;
  };
  
  return (
    <Badge variant="outline" className={cn(getVariant(), "gap-1 text-xs", className)}>
      <Calendar className="h-3 w-3" />
      {getLabel()}
    </Badge>
  );
}
```

```typescript
// src/components/domains/domain-detail-header.tsx

"use client";

import { useState } from "react";
import { Globe, ExternalLink, Copy, Check, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DomainStatusBadge } from "./domain-status-badge";
import { DomainExpiryBadge } from "./domain-expiry-badge";
import { toast } from "sonner";
import type { DomainWithDetails } from "@/types/domain";

interface DomainDetailHeaderProps {
  domain: DomainWithDetails;
}

export function DomainDetailHeader({ domain }: DomainDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  
  const copyDomain = async () => {
    await navigator.clipboard.writeText(domain.domain_name);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{domain.domain_name}</h1>
            <Button variant="ghost" size="icon" onClick={copyDomain}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <a 
              href={`https://${domain.domain_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <DomainStatusBadge status={domain.status} />
            <DomainExpiryBadge expiryDate={domain.expiry_date} />
            {domain.auto_renew && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                Auto-Renew
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Renew Domain
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Transfer Out</DropdownMenuItem>
            <DropdownMenuItem>Update Contacts</DropdownMenuItem>
            <DropdownMenuItem>Lock Domain</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Domain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

```typescript
// src/components/domains/expiring-domains-widget.tsx

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getDomains } from "@/lib/actions/domains";

export async function ExpiringDomainsWidget() {
  const { data: domains } = await getDomains({
    expiringWithinDays: 30,
    limit: 5,
  });
  
  if (!domains || domains.length === 0) return null;
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Domains Expiring Soon</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You have {domains.length} domain{domains.length !== 1 ? 's' : ''} expiring 
          in the next 30 days.
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/domains?status=expiring">
            View All
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Domain list page with stats
- [ ] Domain list component with pagination
- [ ] Domain detail page with tabs
- [ ] Domain status badge component
- [ ] Domain expiry badge component
- [ ] Domain detail header component
- [ ] Domain info card component
- [ ] Domain nameservers component
- [ ] Domain auto-renew component
- [ ] Domain assignment component
- [ ] Expiring domains widget
- [ ] Domain filters component
- [ ] Loading and error states
- [ ] TypeScript compiles with zero errors

---

## 📚 References

- [Phase DM-02](./PHASE-DM-02-DOMAIN-DATABASE-SCHEMA.md) - Database Schema
- [Phase DM-04](./PHASE-DM-04-DOMAIN-SEARCH-REGISTRATION-UI.md) - Search & Registration
