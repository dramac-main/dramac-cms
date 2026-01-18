# Phase 69: Activity Logging - ADD UI Components

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW (Core logging exists!)
>
> **Estimated Time**: 1-2 hours

---

## ⚠️ CRITICAL: ACTIVITY LOGGING ALREADY EXISTS!

**The core logging system is implemented:**
- ✅ `src/lib/services/activity.ts` - Core logging service
- ✅ `src/lib/actions/activity.ts` - Activity actions (108 lines)
- ✅ Table name is `activity_log` (NOT `activity_logs`!)

**What Already Exists:**
```typescript
// src/lib/services/activity.ts
export async function logActivity(options: LogActivityOptions)
export async function getAgencyActivity(agencyId: string, options)

// src/lib/actions/activity.ts
export async function logActivityAction(...)
export async function getRecentActivityAction(...)
```

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAME!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `activity_logs` | `activity_log` |
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

ADD UI components for viewing activity logs. DO NOT recreate the core logging logic!

---

## 📋 Prerequisites

- [ ] `src/lib/services/activity.ts` exists (it does!)
- [ ] `src/lib/actions/activity.ts` exists (it does!)
- [ ] `activity_log` table exists in database

---

## ✅ Tasks

### Task 69.1: Verify Existing Implementation

**Check what exists:**

```typescript
// src/lib/services/activity.ts - EXISTS
import { logActivity, getAgencyActivity } from "@/lib/services/activity";

// src/lib/actions/activity.ts - EXISTS
import { logActivityAction, getRecentActivityAction } from "@/lib/actions/activity";
```

**Activity log table structure (from database.ts):**
- `id`, `agency_id`, `user_id`, `action`, `resource_type`
- `resource_id`, `resource_name`, `details`, `ip_address`, `created_at`

---

### Task 69.2: Activity Feed Component

**File: `src/components/activity/activity-feed.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityItem } from "./activity-item";
import { getRecentActivityAction } from "@/lib/actions/activity";

interface ActivityEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, unknown>;
  created_at: string;
  user_name?: string;
}

interface ActivityFeedProps {
  agencyId?: string;
  limit?: number;
  showRefresh?: boolean;
  title?: string;
}

export function ActivityFeed({
  agencyId,
  limit = 20,
  showRefresh = true,
  title = "Recent Activity",
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchActivities() {
    try {
      const result = await getRecentActivityAction({ limit });
      if (result.success && result.data) {
        setActivities(result.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, [agencyId, limit]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchActivities();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No activity yet
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Task 69.3: Activity Item Component

**File: `src/components/activity/activity-item.tsx`**

```typescript
"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Globe,
  User,
  FileText,
  Settings,
  CreditCard,
  Users,
  Edit,
  Trash,
  Plus,
  Eye,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, unknown>;
  created_at: string;
  user_name?: string;
}

interface ActivityItemProps {
  activity: ActivityEntry;
}

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  site: Globe,
  client: User,
  page: FileText,
  settings: Settings,
  billing: CreditCard,
  team: Users,
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  updated: Edit,
  deleted: Trash,
  viewed: Eye,
};

function getActionIcon(action: string, resourceType: string) {
  // Check action first
  for (const [key, Icon] of Object.entries(ACTION_ICONS)) {
    if (action.toLowerCase().includes(key)) {
      return Icon;
    }
  }
  // Fall back to resource type
  return RESOURCE_ICONS[resourceType] || FileText;
}

function getActionColor(action: string): string {
  if (action.includes("created")) return "text-green-500";
  if (action.includes("deleted")) return "text-red-500";
  if (action.includes("updated")) return "text-blue-500";
  return "text-muted-foreground";
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = getActionIcon(activity.action, activity.resource_type);
  const actionColor = getActionColor(activity.action);
  const initials = activity.user_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${actionColor}`} />
          <span className="text-sm font-medium truncate">
            {activity.user_name || "Someone"}
          </span>
          <span className="text-sm text-muted-foreground">
            {activity.action.toLowerCase()}
          </span>
        </div>

        {activity.resource_name && (
          <p className="text-sm text-muted-foreground truncate">
            {activity.resource_type}: {activity.resource_name}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
```

---

### Task 69.4: Activity Page (Optional)

**File: `src/app/(dashboard)/settings/activity/page.tsx`**

```typescript
import { ActivityFeed } from "@/components/activity/activity-feed";

export default function ActivityPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          View recent activity across your agency
        </p>
      </div>

      <ActivityFeed limit={50} showRefresh={true} />
    </div>
  );
}
```

---

### Task 69.5: Add to Dashboard (Optional)

**Add activity feed to dashboard:**

```typescript
// In dashboard page component
import { ActivityFeed } from "@/components/activity/activity-feed";

// In the dashboard layout
<ActivityFeed limit={10} title="Recent Activity" />
```

---

## ✅ Completion Checklist

- [ ] Verified `activity_log` table exists (correct name!)
- [ ] Verified logging service exists
- [ ] Activity feed component created
- [ ] Activity item component created
- [ ] Activity page route created (optional)
- [ ] Integrated into dashboard (optional)
- [ ] Tested activity displays correctly

---

## 📝 Notes for AI Agent

1. **DON'T RECREATE** - Logging logic exists in `src/lib/services/activity.ts`!
2. **CORRECT TABLE** - Use `activity_log` NOT `activity_logs`
3. **UI ONLY** - Just add display components
4. **EXISTING ACTIONS** - Use `getRecentActivityAction` from actions
5. **MINIMAL CHANGES** - Core system works, just needs UI
