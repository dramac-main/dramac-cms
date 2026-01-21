# Phase 16: Dashboard Analytics

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the main dashboard overview with statistics cards, activity feed, and quick actions.

---

## 📋 Prerequisites

- [ ] Phase 1-15 completed

---

## ✅ Tasks

### Task 16.1: Dashboard Overview Page

**File: `src/app/(dashboard)/dashboard/page.tsx`**

```typescript
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentSites } from "@/components/dashboard/recent-sites";
import { getDashboardData } from "@/lib/actions/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | DRAMAC",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${data.user?.email ? `, ${data.user.email.split("@")[0]}` : ""}!`}
        description="Here's an overview of your platform."
      />

      {/* Stats */}
      <DashboardStats stats={data.stats} />

      {/* Quick Actions */}
      <QuickActions hasClients={data.stats.totalClients > 0} />

      {/* Two Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sites */}
        <RecentSites sites={data.recentSites} />

        {/* Recent Activity */}
        <RecentActivity activities={data.recentActivity} />
      </div>
    </div>
  );
}
```

### Task 16.2: Dashboard Data Actions

**File: `src/lib/actions/dashboard.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/actions/organizations";

export interface DashboardStats {
  totalClients: number;
  totalSites: number;
  publishedSites: number;
  totalPages: number;
}

export interface RecentSite {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  updated_at: string;
  client?: { name: string } | null;
}

export interface ActivityItem {
  id: string;
  type: "site_created" | "site_published" | "page_created" | "client_created";
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardData {
  user: { email: string } | null;
  stats: DashboardStats;
  recentSites: RecentSite[];
  recentActivity: ActivityItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  const organization = await getOrganization();

  if (!organization) {
    return {
      user: null,
      stats: { totalClients: 0, totalSites: 0, publishedSites: 0, totalPages: 0 },
      recentSites: [],
      recentActivity: [],
    };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get counts in parallel
  const [clientsResult, sitesResult, publishedSitesResult, pagesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("status", "published"),
    supabase
      .from("pages")
      .select("id, site:sites!inner(organization_id)", { count: "exact", head: true })
      .eq("site.organization_id", organization.id),
  ]);

  // Get recent sites
  const { data: recentSites } = await supabase
    .from("sites")
    .select("id, name, subdomain, status, updated_at, client:clients(name)")
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  // Build activity from recent data
  const activities: ActivityItem[] = [];

  // Recent sites as activity
  recentSites?.slice(0, 3).forEach((site) => {
    activities.push({
      id: `site-${site.id}`,
      type: "site_created",
      title: "Site Updated",
      description: `${site.name} was updated`,
      timestamp: site.updated_at,
    });
  });

  // Get recently published sites
  const { data: publishedSites } = await supabase
    .from("sites")
    .select("id, name, published_at")
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(3);

  publishedSites?.forEach((site) => {
    activities.push({
      id: `published-${site.id}`,
      type: "site_published",
      title: "Site Published",
      description: `${site.name} is now live`,
      timestamp: site.published_at!,
    });
  });

  // Sort activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    user: user ? { email: user.email || "" } : null,
    stats: {
      totalClients: clientsResult.count || 0,
      totalSites: sitesResult.count || 0,
      publishedSites: publishedSitesResult.count || 0,
      totalPages: pagesResult.count || 0,
    },
    recentSites: recentSites || [],
    recentActivity: activities.slice(0, 8),
  };
}
```

### Task 16.3: Dashboard Stats Component

**File: `src/components/dashboard/dashboard-stats.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, FileText, Eye } from "lucide-react";
import type { DashboardStats as Stats } from "@/lib/actions/dashboard";

interface DashboardStatsProps {
  stats: Stats;
}

const statItems = [
  {
    key: "totalClients" as const,
    label: "Total Clients",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    key: "totalSites" as const,
    label: "Total Sites",
    icon: Globe,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    key: "publishedSites" as const,
    label: "Published Sites",
    icon: Eye,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    key: "totalPages" as const,
    label: "Total Pages",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <Card key={item.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

### Task 16.4: Quick Actions Component

**File: `src/components/dashboard/quick-actions.tsx`**

```typescript
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Globe, Sparkles } from "lucide-react";

interface QuickActionsProps {
  hasClients: boolean;
}

export function QuickActions({ hasClients }: QuickActionsProps) {
  const actions = [
    {
      label: "Add Client",
      description: "Register a new client account",
      icon: UserPlus,
      href: "/dashboard/clients/new",
      variant: "outline" as const,
    },
    {
      label: "Create Site",
      description: hasClients ? "Build a new website" : "Add a client first",
      icon: Globe,
      href: "/dashboard/sites/new",
      variant: "outline" as const,
      disabled: !hasClients,
    },
    {
      label: "AI Builder",
      description: "Generate site with AI",
      icon: Sparkles,
      href: "/dashboard/sites/new?mode=ai",
      variant: "default" as const,
      disabled: !hasClients,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            if (action.disabled) {
              return (
                <Button
                  key={action.label}
                  variant={action.variant}
                  disabled
                  className="flex-1 min-w-[150px]"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              );
            }

            return (
              <Link key={action.label} href={action.href}>
                <Button variant={action.variant} className="flex-1 min-w-[150px]">
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 16.5: Recent Sites Component

**File: `src/components/dashboard/recent-sites.tsx`**

```typescript
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RecentSite } from "@/lib/actions/dashboard";

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/10 text-success",
  archived: "bg-warning/10 text-warning",
};

interface RecentSitesProps {
  sites: RecentSite[];
}

export function RecentSites({ sites }: RecentSitesProps) {
  if (sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sites</CardTitle>
          <CardDescription>No sites yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Create your first site to get started.
            </p>
            <Link href="/dashboard/sites/new">
              <Button>Create Site</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent Sites</CardTitle>
          <CardDescription>Recently updated websites</CardDescription>
        </div>
        <Link href="/dashboard/sites">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="font-medium hover:underline"
                  >
                    {site.name}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{site.subdomain}.dramac.app</span>
                    {site.status === "published" && (
                      <a
                        href={`https://${site.subdomain}.dramac.app`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={statusColors[site.status as keyof typeof statusColors]}
                >
                  {site.status}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(site.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 16.6: Recent Activity Component

**File: `src/components/dashboard/recent-activity.tsx`**

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, FileText, User, Eye, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/lib/actions/dashboard";

const activityIcons = {
  site_created: Globe,
  site_published: Eye,
  page_created: FileText,
  client_created: User,
};

const activityColors = {
  site_created: "bg-purple-100 text-purple-600",
  site_published: "bg-green-100 text-green-600",
  page_created: "bg-blue-100 text-blue-600",
  client_created: "bg-orange-100 text-orange-600",
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>No activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Your activity will appear here as you work.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates in your platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || Activity;
            const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 16.7: Export Dashboard Components

**File: `src/components/dashboard/index.ts`**

```typescript
export * from "./dashboard-stats";
export * from "./quick-actions";
export * from "./recent-sites";
export * from "./recent-activity";
```

---

## 📐 Acceptance Criteria

- [ ] Dashboard shows stats cards (clients, sites, published, pages)
- [ ] Quick actions for adding client, creating site, AI builder
- [ ] AI builder disabled when no clients exist
- [ ] Recent sites list with status badges
- [ ] Recent activity feed with icons
- [ ] All cards link to relevant sections
- [ ] Empty states when no data exists

---

## 📁 Files Created This Phase

```
src/lib/actions/
└── dashboard.ts

src/components/dashboard/
├── index.ts
├── dashboard-stats.tsx
├── quick-actions.tsx
├── recent-sites.tsx
└── recent-activity.tsx

src/app/(dashboard)/dashboard/
└── page.tsx (updated)
```

---

## ➡️ Next Phase

**Phase 17: Visual Editor Foundation** - Set up Craft.js, basic canvas, component resolver.
