# PHASE-UI-04B: Audit and Fix Admin Pages

**Phase ID**: PHASE-UI-04B  
**Priority**: MEDIUM  
**Estimated Time**: 60 minutes  
**Dependencies**: PHASE-UI-02A (admin layout), PHASE-UI-03A (shell)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Audit and fix all Admin section pages to use consistent DashboardShell/PageHeader patterns and remove hardcoded spacing values.

---

## 📋 PAGES TO AUDIT

Admin section pages under `src/app/(dashboard)/admin/[teamId]/`:

1. `page.tsx` - Admin overview
2. `users/page.tsx` - Users management
3. `teams/page.tsx` - Teams management
4. `roles/page.tsx` - Roles management
5. `activity/page.tsx` - Activity logs
6. `audit/page.tsx` - Audit logs
7. `database/page.tsx` - Database management
8. `api-keys/page.tsx` - API keys
9. `notifications/page.tsx` - Notifications settings
10. `settings/page.tsx` - Admin settings

---

## 📋 TASKS

### Task 1: Standard Admin Page Pattern

**CORRECT ADMIN PAGE PATTERN**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface AdminPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Page Title"
        description="Page description"
        actions={/* Optional actions */}
      />
      
      {/* Page content */}
    </DashboardShell>
  );
}
```

---

### Task 2: Fix Admin Overview Page

**File**: `src/app/(dashboard)/admin/[teamId]/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell, DashboardSection } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminOverviewPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AdminOverviewPage({ params }: AdminOverviewPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Admin Dashboard"
        description="System overview and quick actions"
      />
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat cards */}
      </div>
      
      {/* Additional sections */}
      <DashboardSection title="Recent Activity">
        {/* Activity content */}
      </DashboardSection>
    </DashboardShell>
  );
}
```

---

### Task 3: Fix Users Management Page

**File**: `src/app/(dashboard)/admin/[teamId]/users/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface UsersPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Users"
        description="Manage team users and permissions"
        actions={
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        }
      />
      
      {/* Users table/list */}
    </DashboardShell>
  );
}
```

---

### Task 4: Fix Teams Management Page

**File**: `src/app/(dashboard)/admin/[teamId]/teams/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TeamsPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Teams"
        description="Manage organization teams"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        }
      />
      
      {/* Teams grid/list */}
    </DashboardShell>
  );
}
```

---

### Task 5: Fix Roles Management Page

**File**: `src/app/(dashboard)/admin/[teamId]/roles/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';

interface RolesPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Roles & Permissions"
        description="Configure role-based access control"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        }
      />
      
      {/* Roles table */}
    </DashboardShell>
  );
}
```

---

### Task 6: Fix Activity Logs Page

**File**: `src/app/(dashboard)/admin/[teamId]/activity/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';

interface ActivityPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell noMaxWidth> {/* Activity might need full width for tables */}
      <PageHeader
        title="Activity Log"
        description="View all system activity"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />
      
      {/* Activity table */}
    </DashboardShell>
  );
}
```

---

### Task 7: Fix Audit Logs Page

**File**: `src/app/(dashboard)/admin/[teamId]/audit/page.tsx`

Similar pattern to Activity page but for audit events.

---

### Task 8: Fix Database Management Page

**File**: `src/app/(dashboard)/admin/[teamId]/database/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface DatabasePageProps {
  params: Promise<{ teamId: string }>;
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Database"
        description="Database management and queries"
        badge={<Badge variant="outline">Advanced</Badge>}
      />
      
      {/* Database tools */}
    </DashboardShell>
  );
}
```

---

### Task 9: Fix API Keys Page

**File**: `src/app/(dashboard)/admin/[teamId]/api-keys/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Key, Plus } from 'lucide-react';

interface ApiKeysPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="API Keys"
        description="Manage API access tokens"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Key
          </Button>
        }
      />
      
      {/* API keys table */}
    </DashboardShell>
  );
}
```

---

### Task 10: Batch Search for Issues

Run this search to find remaining issues:

```bash
cd next-platform-dashboard

# Find hardcoded padding in admin pages
grep -r "className.*p-[0-9]\|className.*px-[0-9]\|className.*py-[0-9]" src/app/\(dashboard\)/admin/ --include="*.tsx"

# Find inline headers (h1 without PageHeader)
grep -r "<h1" src/app/\(dashboard\)/admin/ --include="*.tsx"

# Find pages without DashboardShell
grep -L "DashboardShell" src/app/\(dashboard\)/admin/\[teamId\]/*/page.tsx
```

---

## ✅ VERIFICATION STEPS

After making all changes, run these commands:

```bash
cd next-platform-dashboard

# 1. Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# 2. If zero errors, commit and push
cd ..
git add .
git commit -m "fix(admin): update admin pages with consistent layout (PHASE-UI-04B)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action |
|------|--------|
| `src/app/(dashboard)/admin/[teamId]/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/users/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/teams/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/roles/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/activity/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/audit/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/database/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/api-keys/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/notifications/page.tsx` | Update |
| `src/app/(dashboard)/admin/[teamId]/settings/page.tsx` | Update |

---

## 🎯 SUCCESS CRITERIA

- [ ] All admin pages use DashboardShell wrapper
- [ ] All admin pages use PageHeader component
- [ ] No hardcoded padding in admin pages
- [ ] Consistent spacing across all admin pages
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-04C: Audit and Fix Settings Pages**

---

**End of Phase UI-04B**
