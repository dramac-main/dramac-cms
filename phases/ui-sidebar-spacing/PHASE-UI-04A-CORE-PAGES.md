# PHASE-UI-04A: Audit and Fix Dashboard Core Pages

**Phase ID**: PHASE-UI-04A  
**Priority**: MEDIUM  
**Estimated Time**: 60 minutes  
**Dependencies**: PHASE-UI-03A (DashboardShell), PHASE-UI-03B (layout)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Audit and fix all core dashboard pages to use consistent DashboardShell/PageHeader patterns and remove hardcoded spacing values.

---

## 📋 PAGES TO AUDIT

This phase covers the main dashboard pages:

1. `src/app/(dashboard)/page.tsx` - Main dashboard
2. `src/app/(dashboard)/[teamId]/page.tsx` - Team dashboard
3. `src/app/(dashboard)/[teamId]/sites/page.tsx` - Sites list
4. `src/app/(dashboard)/[teamId]/modules/page.tsx` - Modules
5. `src/app/(dashboard)/[teamId]/analytics/page.tsx` - Analytics
6. `src/app/(dashboard)/[teamId]/crm/page.tsx` - CRM

---

## 📋 TASKS

### Task 1: Audit Pattern to Follow

**CORRECT PAGE PATTERN**:

```tsx
import { DashboardShell, DashboardContent } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

export default function ExamplePage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Page Title"
        description="Optional page description"
        actions={
          <Button>Action Button</Button>
        }
      />
      
      <DashboardContent>
        {/* Page content here */}
      </DashboardContent>
    </DashboardShell>
  );
}
```

**INCORRECT PATTERNS TO FIX**:

```tsx
// ❌ Hardcoded padding
<div className="p-6">
  <h1>Title</h1>
  {/* content */}
</div>

// ❌ Inline header with spacing
<div className="pb-6 mb-8">
  <h1 className="text-2xl font-bold">Title</h1>
  <p>Description</p>
</div>

// ❌ Inconsistent container
<main className="px-4 py-6 lg:px-8">
  {/* content */}
</main>
```

---

### Task 2: Fix Main Dashboard Page

**File**: `src/app/(dashboard)/page.tsx`

**Check for** and fix:
- Hardcoded `p-*`, `px-*`, `py-*` classes
- Inline header instead of PageHeader component
- Missing DashboardShell wrapper

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
// ... other imports

export default function DashboardPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Dashboard"
        description="Welcome to your dashboard"
      />
      
      {/* Dashboard content - cards, stats, etc. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats cards */}
      </div>
      
      {/* More sections */}
    </DashboardShell>
  );
}
```

---

### Task 3: Fix Team Dashboard Page

**File**: `src/app/(dashboard)/[teamId]/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface TeamDashboardPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDashboardPage({ params }: TeamDashboardPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Team Dashboard"
        description="Overview of your team's activity"
      />
      
      {/* Team dashboard content */}
    </DashboardShell>
  );
}
```

---

### Task 4: Fix Sites List Page

**File**: `src/app/(dashboard)/[teamId]/sites/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SitesPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function SitesPage({ params }: SitesPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Sites"
        description="Manage your websites and domains"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Site
          </Button>
        }
      />
      
      {/* Sites list/grid */}
    </DashboardShell>
  );
}
```

---

### Task 5: Fix Modules Page

**File**: `src/app/(dashboard)/[teamId]/modules/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface ModulesPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Modules"
        description="Browse and manage installed modules"
        actions={
          <Button variant="outline">Browse Marketplace</Button>
        }
      />
      
      {/* Modules content */}
    </DashboardShell>
  );
}
```

---

### Task 6: Fix Analytics Page

**File**: `src/app/(dashboard)/[teamId]/analytics/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface AnalyticsPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell noMaxWidth> {/* Analytics might need full width */}
      <PageHeader
        title="Analytics"
        description="View your site analytics and performance"
      />
      
      {/* Analytics charts and data */}
    </DashboardShell>
  );
}
```

---

### Task 7: Fix CRM Page

**File**: `src/app/(dashboard)/[teamId]/crm/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface CRMPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function CRMPage({ params }: CRMPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="CRM"
        description="Manage contacts and relationships"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        }
      />
      
      {/* CRM content */}
    </DashboardShell>
  );
}
```

---

### Task 8: Common Fixes Checklist

For EACH page, check and fix:

| Issue | Fix |
|-------|-----|
| `<div className="p-6">` wrapping content | Remove, use DashboardShell |
| `<div className="px-4 py-8 lg:px-8">` | Remove, use DashboardShell |
| `<h1 className="...">Title</h1>` | Use PageHeader component |
| `<div className="pb-6">` around header | Remove, PageHeader handles spacing |
| `<div className="space-y-6 p-6">` | Use DashboardShell + DashboardContent |
| Missing DashboardShell | Wrap entire page content |
| Missing PageHeader | Add with appropriate title/description |

---

## ✅ VERIFICATION STEPS

After making all changes, run these commands:

```bash
cd next-platform-dashboard

# 1. Search for remaining hardcoded padding issues
grep -r "className.*p-6\|className.*px-8\|className.*py-8" src/app/\(dashboard\)/ --include="*.tsx"

# 2. Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# 3. If zero errors, commit and push
cd ..
git add .
git commit -m "fix(pages): update core dashboard pages with consistent layout (PHASE-UI-04A)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/page.tsx` | Update | Add DashboardShell, PageHeader |
| `src/app/(dashboard)/[teamId]/page.tsx` | Update | Add DashboardShell, PageHeader |
| `src/app/(dashboard)/[teamId]/sites/page.tsx` | Update | Add DashboardShell, PageHeader |
| `src/app/(dashboard)/[teamId]/modules/page.tsx` | Update | Add DashboardShell, PageHeader |
| `src/app/(dashboard)/[teamId]/analytics/page.tsx` | Update | Add DashboardShell, PageHeader |
| `src/app/(dashboard)/[teamId]/crm/page.tsx` | Update | Add DashboardShell, PageHeader |

---

## 🎯 SUCCESS CRITERIA

- [ ] All core pages use DashboardShell wrapper
- [ ] All pages use PageHeader component (not inline headers)
- [ ] No hardcoded p-6, px-8, py-8 in page files
- [ ] Consistent spacing across all audited pages
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-04B: Audit and Fix Admin Pages**

---

**End of Phase UI-04A**
