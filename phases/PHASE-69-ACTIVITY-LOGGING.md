# Phase 69: Activity Logging - User Action Audit Trail

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Implement comprehensive activity logging that tracks all user actions across the platform, providing an audit trail for security, debugging, and analytics purposes.

---

## 📋 Prerequisites

- [ ] Phase 59 RLS Security Audit completed (creates activity_logs table)
- [ ] Supabase database configured
- [ ] Authentication system working
- [ ] Server actions infrastructure in place

---

## ⚠️ IMPORTANT: Table Created in Phase 59

Phase 59 (RLS Security Audit) creates the `activity_logs` table as part of the security audit infrastructure. This phase focuses on:
1. ✅ **USE** the activity_logs table created in Phase 59
2. ✅ **ADD** logging service and functions
3. ✅ **ADD** UI components
4. ✅ **ADD** action constants and types

---

## 💼 Business Value

1. **Security** - Track suspicious activities
2. **Compliance** - Audit trail for regulations
3. **Debugging** - Trace user actions for support
4. **Analytics** - Understand user behavior
5. **Accountability** - Know who did what when

---

## 📁 Files to Create

```
src/lib/activity/
├── activity-types.ts            # Type definitions
├── activity-logger.ts           # Core logging service
├── activity-constants.ts        # Action types & categories

src/actions/activity/
├── log-activity.ts              # Server action for logging
├── get-activities.ts            # Fetch activities

src/components/activity/
├── activity-feed.tsx            # Activity timeline feed
├── activity-item.tsx            # Individual activity entry
├── activity-filters.tsx         # Filter controls
├── activity-export.tsx          # Export functionality

src/app/(dashboard)/settings/activity/
├── page.tsx                     # Activity log page
```

---

## ✅ Tasks

### Task 69.1: Skip Database Migration

**The `activity_logs` table is created in Phase 59!**

Phase 59 creates:
```sql
-- Created in Phase 59 RLS Security Audit
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  resource_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

**Only run additional migrations if extending the schema.**

-- Indexes for efficient querying
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_agency_id ON activity_logs(agency_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_category ON activity_logs(category);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_activity_logs_agency_created 
ON activity_logs(agency_id, created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own agency's activities
CREATE POLICY "Users can view own agency activities"
ON activity_logs FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM agency_members 
    WHERE user_id = auth.uid()
  )
);

-- Only allow insert through service role or authenticated users
CREATE POLICY "Users can log their own activities"
ON activity_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Cleanup function for old logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run cleanup daily (if pg_cron is available)
-- SELECT cron.schedule('cleanup-activity-logs', '0 2 * * *', 'SELECT cleanup_old_activity_logs()');
```

---

### Task 69.2: Activity Types

**File: `src/lib/activity/activity-types.ts`**

```typescript
export type ActivityCategory =
  | "auth"
  | "client"
  | "site"
  | "page"
  | "editor"
  | "ai"
  | "billing"
  | "team"
  | "settings"
  | "module"
  | "export";

export type ActivityAction =
  // Auth actions
  | "user.login"
  | "user.logout"
  | "user.signup"
  | "user.password_reset"
  | "user.password_changed"
  | "user.email_changed"
  // Client actions
  | "client.created"
  | "client.updated"
  | "client.deleted"
  | "client.archived"
  | "client.restored"
  // Site actions
  | "site.created"
  | "site.updated"
  | "site.deleted"
  | "site.published"
  | "site.unpublished"
  | "site.cloned"
  | "site.domain_changed"
  // Page actions
  | "page.created"
  | "page.updated"
  | "page.deleted"
  | "page.content_updated"
  | "page.seo_updated"
  // Editor actions
  | "editor.opened"
  | "editor.saved"
  | "editor.preview"
  | "editor.component_added"
  | "editor.component_deleted"
  // AI actions
  | "ai.site_generated"
  | "ai.section_regenerated"
  | "ai.content_generated"
  // Billing actions
  | "billing.subscription_created"
  | "billing.subscription_updated"
  | "billing.subscription_cancelled"
  | "billing.payment_succeeded"
  | "billing.payment_failed"
  // Team actions
  | "team.member_invited"
  | "team.member_joined"
  | "team.member_removed"
  | "team.role_changed"
  // Settings actions
  | "settings.updated"
  | "settings.api_key_generated"
  | "settings.api_key_revoked"
  // Module actions
  | "module.installed"
  | "module.uninstalled"
  | "module.updated"
  // Export actions
  | "export.site_exported"
  | "export.site_imported"
  | "export.backup_created"
  | "export.backup_restored";

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: ActivityAction;
  category: ActivityCategory;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  agencyId?: string;
  clientId?: string;
  siteId?: string;
  createdAt: Date;
}

export interface ActivityLogInput {
  action: ActivityAction;
  category: ActivityCategory;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, any>;
  clientId?: string;
  siteId?: string;
}

export interface ActivityFilter {
  category?: ActivityCategory;
  action?: ActivityAction;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  clientId?: string;
  siteId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface ActivityPagination {
  page: number;
  pageSize: number;
}
```

---

### Task 69.3: Activity Constants

**File: `src/lib/activity/activity-constants.ts`**

```typescript
import {
  LogIn,
  LogOut,
  UserPlus,
  Key,
  Building2,
  Globe,
  FileText,
  Pencil,
  Sparkles,
  CreditCard,
  Users,
  Settings,
  Package,
  Download,
  Upload,
  type LucideIcon,
} from "lucide-react";
import type { ActivityCategory, ActivityAction } from "./activity-types";

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  auth: "Authentication",
  client: "Clients",
  site: "Sites",
  page: "Pages",
  editor: "Editor",
  ai: "AI Builder",
  billing: "Billing",
  team: "Team",
  settings: "Settings",
  module: "Modules",
  export: "Export/Import",
};

export const CATEGORY_ICONS: Record<ActivityCategory, LucideIcon> = {
  auth: LogIn,
  client: Building2,
  site: Globe,
  page: FileText,
  editor: Pencil,
  ai: Sparkles,
  billing: CreditCard,
  team: Users,
  settings: Settings,
  module: Package,
  export: Download,
};

export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  auth: "#6366f1",
  client: "#8b5cf6",
  site: "#0ea5e9",
  page: "#14b8a6",
  editor: "#f59e0b",
  ai: "#a855f7",
  billing: "#22c55e",
  team: "#ec4899",
  settings: "#64748b",
  module: "#f97316",
  export: "#06b6d4",
};

export const ACTION_DESCRIPTIONS: Record<ActivityAction, string> = {
  // Auth
  "user.login": "logged in",
  "user.logout": "logged out",
  "user.signup": "signed up",
  "user.password_reset": "requested password reset",
  "user.password_changed": "changed password",
  "user.email_changed": "changed email",
  // Client
  "client.created": "created client",
  "client.updated": "updated client",
  "client.deleted": "deleted client",
  "client.archived": "archived client",
  "client.restored": "restored client",
  // Site
  "site.created": "created site",
  "site.updated": "updated site",
  "site.deleted": "deleted site",
  "site.published": "published site",
  "site.unpublished": "unpublished site",
  "site.cloned": "cloned site",
  "site.domain_changed": "changed site domain",
  // Page
  "page.created": "created page",
  "page.updated": "updated page",
  "page.deleted": "deleted page",
  "page.content_updated": "updated page content",
  "page.seo_updated": "updated page SEO",
  // Editor
  "editor.opened": "opened editor",
  "editor.saved": "saved changes",
  "editor.preview": "previewed page",
  "editor.component_added": "added component",
  "editor.component_deleted": "deleted component",
  // AI
  "ai.site_generated": "generated site with AI",
  "ai.section_regenerated": "regenerated section with AI",
  "ai.content_generated": "generated content with AI",
  // Billing
  "billing.subscription_created": "created subscription",
  "billing.subscription_updated": "updated subscription",
  "billing.subscription_cancelled": "cancelled subscription",
  "billing.payment_succeeded": "payment succeeded",
  "billing.payment_failed": "payment failed",
  // Team
  "team.member_invited": "invited team member",
  "team.member_joined": "joined team",
  "team.member_removed": "removed team member",
  "team.role_changed": "changed member role",
  // Settings
  "settings.updated": "updated settings",
  "settings.api_key_generated": "generated API key",
  "settings.api_key_revoked": "revoked API key",
  // Module
  "module.installed": "installed module",
  "module.uninstalled": "uninstalled module",
  "module.updated": "updated module",
  // Export
  "export.site_exported": "exported site",
  "export.site_imported": "imported site",
  "export.backup_created": "created backup",
  "export.backup_restored": "restored backup",
};
```

---

### Task 69.4: Activity Logger Service

**File: `src/lib/activity/activity-logger.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { ActivityLogInput, ActivityLog, ActivityFilter, ActivityPagination } from "./activity-types";
import { headers } from "next/headers";

export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Get user's agency
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();
    
    // Get request info
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || 
                      headersList.get("x-real-ip") || 
                      undefined;
    const userAgent = headersList.get("user-agent") || undefined;
    
    // Insert activity log
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      action: input.action,
      category: input.category,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      resource_name: input.resourceName,
      metadata: input.metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
      agency_id: membership?.agency_id,
      client_id: input.clientId,
      site_id: input.siteId,
    });
  } catch (error) {
    // Log error but don't throw - activity logging shouldn't break the app
    console.error("Failed to log activity:", error);
  }
}

export async function getActivities(
  filter: ActivityFilter = {},
  pagination: ActivityPagination = { page: 1, pageSize: 50 }
): Promise<{ activities: ActivityLog[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" });
  
  // Apply filters
  if (filter.category) {
    query = query.eq("category", filter.category);
  }
  if (filter.action) {
    query = query.eq("action", filter.action);
  }
  if (filter.userId) {
    query = query.eq("user_id", filter.userId);
  }
  if (filter.resourceType) {
    query = query.eq("resource_type", filter.resourceType);
  }
  if (filter.resourceId) {
    query = query.eq("resource_id", filter.resourceId);
  }
  if (filter.clientId) {
    query = query.eq("client_id", filter.clientId);
  }
  if (filter.siteId) {
    query = query.eq("site_id", filter.siteId);
  }
  if (filter.startDate) {
    query = query.gte("created_at", filter.startDate.toISOString());
  }
  if (filter.endDate) {
    query = query.lte("created_at", filter.endDate.toISOString());
  }
  if (filter.search) {
    query = query.or(
      `user_email.ilike.%${filter.search}%,user_name.ilike.%${filter.search}%,resource_name.ilike.%${filter.search}%`
    );
  }
  
  // Apply pagination
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize - 1;
  
  query = query
    .order("created_at", { ascending: false })
    .range(start, end);
  
  const { data, count, error } = await query;
  
  if (error) {
    throw new Error(error.message);
  }
  
  const activities: ActivityLog[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    action: row.action,
    category: row.category,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    agencyId: row.agency_id,
    clientId: row.client_id,
    siteId: row.site_id,
    createdAt: new Date(row.created_at),
  }));
  
  return { activities, total: count || 0 };
}

// Convenience functions for common activities
export const Activity = {
  // Auth
  login: () => logActivity({ action: "user.login", category: "auth" }),
  logout: () => logActivity({ action: "user.logout", category: "auth" }),
  
  // Client
  clientCreated: (clientId: string, clientName: string) =>
    logActivity({
      action: "client.created",
      category: "client",
      resourceType: "client",
      resourceId: clientId,
      resourceName: clientName,
      clientId,
    }),
  
  clientUpdated: (clientId: string, clientName: string, changes?: Record<string, any>) =>
    logActivity({
      action: "client.updated",
      category: "client",
      resourceType: "client",
      resourceId: clientId,
      resourceName: clientName,
      clientId,
      metadata: changes,
    }),
  
  clientDeleted: (clientId: string, clientName: string) =>
    logActivity({
      action: "client.deleted",
      category: "client",
      resourceType: "client",
      resourceId: clientId,
      resourceName: clientName,
      clientId,
    }),
  
  // Site
  siteCreated: (siteId: string, siteName: string, clientId?: string) =>
    logActivity({
      action: "site.created",
      category: "site",
      resourceType: "site",
      resourceId: siteId,
      resourceName: siteName,
      siteId,
      clientId,
    }),
  
  sitePublished: (siteId: string, siteName: string) =>
    logActivity({
      action: "site.published",
      category: "site",
      resourceType: "site",
      resourceId: siteId,
      resourceName: siteName,
      siteId,
    }),
  
  siteCloned: (originalSiteId: string, newSiteId: string, siteName: string) =>
    logActivity({
      action: "site.cloned",
      category: "site",
      resourceType: "site",
      resourceId: newSiteId,
      resourceName: siteName,
      siteId: newSiteId,
      metadata: { originalSiteId },
    }),
  
  // Editor
  editorSaved: (pageId: string, pageName: string, siteId: string) =>
    logActivity({
      action: "editor.saved",
      category: "editor",
      resourceType: "page",
      resourceId: pageId,
      resourceName: pageName,
      siteId,
    }),
  
  // AI
  siteGenerated: (siteId: string, siteName: string, prompt: string) =>
    logActivity({
      action: "ai.site_generated",
      category: "ai",
      resourceType: "site",
      resourceId: siteId,
      resourceName: siteName,
      siteId,
      metadata: { promptLength: prompt.length },
    }),
  
  sectionRegenerated: (pageId: string, sectionId: string, mode: string) =>
    logActivity({
      action: "ai.section_regenerated",
      category: "ai",
      resourceType: "section",
      resourceId: sectionId,
      metadata: { pageId, mode },
    }),
};
```

---

### Task 69.5: Get Activities Server Action

**File: `src/actions/activity/get-activities.ts`**

```typescript
"use server";

import { z } from "zod";
import { getActivities } from "@/lib/activity/activity-logger";
import type { ActivityLog, ActivityFilter } from "@/lib/activity/activity-types";

const filterSchema = z.object({
  category: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export type GetActivitiesInput = z.infer<typeof filterSchema>;

export async function getActivitiesAction(
  input: GetActivitiesInput
): Promise<{ activities: ActivityLog[]; total: number }> {
  const validated = filterSchema.parse(input);
  
  const filter: ActivityFilter = {
    category: validated.category as any,
    action: validated.action as any,
    userId: validated.userId,
    resourceType: validated.resourceType,
    resourceId: validated.resourceId,
    clientId: validated.clientId,
    siteId: validated.siteId,
    startDate: validated.startDate ? new Date(validated.startDate) : undefined,
    endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    search: validated.search,
  };
  
  return getActivities(filter, {
    page: validated.page,
    pageSize: validated.pageSize,
  });
}
```

---

### Task 69.6: Activity Item Component

**File: `src/components/activity/activity-item.tsx`**

```tsx
import { formatDistanceToNow } from "date-fns";
import { User, Clock, Globe, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CATEGORY_ICONS, CATEGORY_COLORS, ACTION_DESCRIPTIONS } from "@/lib/activity/activity-constants";
import type { ActivityLog } from "@/lib/activity/activity-types";

interface ActivityItemProps {
  activity: ActivityLog;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = CATEGORY_ICONS[activity.category];
  const color = CATEGORY_COLORS[activity.category];
  const description = ACTION_DESCRIPTIONS[activity.action] || activity.action;
  
  const initials = activity.userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="flex gap-4 p-4 hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm">
              <span className="font-medium">{activity.userName || activity.userEmail}</span>
              {" "}
              <span className="text-muted-foreground">{description}</span>
              {activity.resourceName && (
                <>
                  {" "}
                  <span className="font-medium">{activity.resourceName}</span>
                </>
              )}
            </p>

            {/* Metadata */}
            {Object.keys(activity.metadata || {}).length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {Object.entries(activity.metadata).map(([key, value]) => (
                  <span key={key} className="mr-3">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {activity.createdAt.toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {activity.userEmail}
          </div>
          {activity.ipAddress && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {activity.ipAddress}
            </div>
          )}
          <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
            {activity.category}
          </Badge>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 69.7: Activity Filters Component

**File: `src/components/activity/activity-filters.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/activity/activity-constants";
import type { ActivityCategory } from "@/lib/activity/activity-types";

interface ActivityFiltersProps {
  onFilterChange: (filters: {
    category?: ActivityCategory;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export function ActivityFilters({ onFilterChange }: ActivityFiltersProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ActivityCategory | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ category, search: value, startDate, endDate });
  };

  const handleCategoryChange = (value: string) => {
    const cat = value === "all" ? undefined : (value as ActivityCategory);
    setCategory(cat);
    onFilterChange({ category: cat, search, startDate, endDate });
  };

  const handleDateChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
    onFilterChange({ category, search, startDate: start, endDate: end });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  };

  const hasFilters = search || category || startDate || endDate;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <Select value={category || "all"} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            {startDate && endDate ? (
              <>
                {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
              </>
            ) : (
              "Date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={(range) =>
              handleDateChange(range?.from, range?.to)
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
```

---

### Task 69.8: Activity Feed Component

**File: `src/components/activity/activity-feed.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ActivityItem } from "./activity-item";
import { ActivityFilters } from "./activity-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivitiesAction, type GetActivitiesInput } from "@/actions/activity/get-activities";
import type { ActivityLog, ActivityCategory } from "@/lib/activity/activity-types";

interface ActivityFeedProps {
  initialActivities?: ActivityLog[];
  siteId?: string;
  clientId?: string;
  showFilters?: boolean;
  pageSize?: number;
}

export function ActivityFeed({
  initialActivities = [],
  siteId,
  clientId,
  showFilters = true,
  pageSize = 20,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [loading, setLoading] = useState(!initialActivities.length);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{
    category?: ActivityCategory;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});

  const loadActivities = async (reset = false) => {
    setLoading(true);
    
    try {
      const input: GetActivitiesInput = {
        page: reset ? 1 : page,
        pageSize,
        category: filters.category,
        search: filters.search,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        siteId,
        clientId,
      };
      
      const result = await getActivitiesAction(input);
      
      if (reset) {
        setActivities(result.activities);
        setPage(1);
      } else {
        setActivities((prev) => [...prev, ...result.activities]);
      }
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialActivities.length) {
      loadActivities(true);
    }
  }, []);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    loadActivities(true);
  };

  const handleLoadMore = () => {
    setPage((p) => p + 1);
    loadActivities();
  };

  const hasMore = activities.length < total;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Activity Log</CardTitle>
        {showFilters && (
          <div className="mt-4">
            <ActivityFilters onFilterChange={handleFilterChange} />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No activities found
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load more ({total - activities.length} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Task 69.9: Activity Export Component

**File: `src/components/activity/activity-export.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getActivitiesAction } from "@/actions/activity/get-activities";
import type { ActivityLog } from "@/lib/activity/activity-types";

interface ActivityExportProps {
  filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function ActivityExport({ filters = {} }: ActivityExportProps) {
  const [exporting, setExporting] = useState(false);

  const exportActivities = async (format: "json" | "csv") => {
    setExporting(true);

    try {
      // Fetch all activities with current filters (up to 1000)
      const result = await getActivitiesAction({
        ...filters,
        page: 1,
        pageSize: 1000,
      });

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(result.activities, null, 2);
        filename = `activity-log-${Date.now()}.json`;
        mimeType = "application/json";
      } else {
        // CSV export
        const headers = [
          "Date",
          "User",
          "Email",
          "Action",
          "Category",
          "Resource Type",
          "Resource Name",
          "IP Address",
        ];
        const rows = result.activities.map((a) => [
          a.createdAt.toISOString(),
          a.userName || "",
          a.userEmail || "",
          a.action,
          a.category,
          a.resourceType || "",
          a.resourceName || "",
          a.ipAddress || "",
        ]);
        content = [headers, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
          .join("\n");
        filename = `activity-log-${Date.now()}.csv`;
        mimeType = "text/csv";
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportActivities("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportActivities("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Task 69.10: Activity Log Page

**File: `src/app/(dashboard)/settings/activity/page.tsx`**

```tsx
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ActivityExport } from "@/components/activity/activity-export";

export const metadata = {
  title: "Activity Log | Settings",
  description: "View all platform activity and audit trail",
};

export default function ActivityLogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground">
            View all actions performed across your agency
          </p>
        </div>
        <ActivityExport />
      </div>

      <ActivityFeed showFilters />
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Activity logger inserts correctly
- [ ] Filter parsing works
- [ ] Date range filtering works
- [ ] Search filtering works

### Integration Tests
- [ ] Activities are logged on actions
- [ ] RLS policies work correctly
- [ ] Pagination works
- [ ] Export functionality works

### E2E Tests
- [ ] Activity feed loads
- [ ] Filters work correctly
- [ ] Load more works
- [ ] Export downloads file

---

## ✅ Completion Checklist

- [ ] Database migration applied
- [ ] Activity types defined
- [ ] Activity constants created
- [ ] Activity logger service working
- [ ] Server actions created
- [ ] Activity item component created
- [ ] Activity filters component created
- [ ] Activity feed component created
- [ ] Activity export component created
- [ ] Activity log page created
- [ ] Integration with existing actions
- [ ] Tests passing

---

**Next Phase**: Phase 70 - Sitemap Generation
