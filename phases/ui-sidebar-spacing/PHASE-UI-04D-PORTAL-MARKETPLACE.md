# PHASE-UI-04D: Audit and Fix Portal and Marketplace Pages

**Phase ID**: PHASE-UI-04D  
**Priority**: MEDIUM  
**Estimated Time**: 60 minutes  
**Dependencies**: PHASE-UI-02C (portal layout), PHASE-UI-03A (shell)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Audit and fix all Portal and Marketplace pages to use consistent DashboardShell/PageHeader patterns and remove hardcoded spacing values.

---

## 📋 PAGES TO AUDIT

### Portal Pages (`src/app/portal/`):
1. `page.tsx` - Portal dashboard
2. `modules/page.tsx` - Developer's modules
3. `analytics/page.tsx` - Module analytics
4. `earnings/page.tsx` - Earnings dashboard
5. `create/page.tsx` - Create module
6. `settings/page.tsx` - Portal settings
7. `docs/page.tsx` - Documentation

### Marketplace Pages (`src/app/(dashboard)/[teamId]/marketplace/`):
1. `page.tsx` - Marketplace home
2. `[moduleId]/page.tsx` - Module details
3. `categories/page.tsx` - Categories
4. `search/page.tsx` - Search results

---

## 📋 TASKS

### Task 1: Portal Page Pattern

**CORRECT PORTAL PAGE PATTERN**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

export default function PortalPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Developer Portal"
        description="Manage your modules and earnings"
      />
      
      {/* Page content */}
    </DashboardShell>
  );
}
```

---

### Task 2: Fix Portal Dashboard

**File**: `src/app/portal/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell, DashboardSection } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PortalDashboardPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Developer Dashboard"
        description="Overview of your modules and earnings"
        actions={
          <Button>Create New Module</Button>
        }
      />
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Modules</CardDescription>
            <CardTitle className="text-3xl">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Downloads</CardDescription>
            <CardTitle className="text-3xl">1,234</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Revenue</CardDescription>
            <CardTitle className="text-3xl">$4,567</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl">890</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <DashboardSection title="Recent Activity">
        {/* Activity list */}
      </DashboardSection>
    </DashboardShell>
  );
}
```

---

### Task 3: Fix Developer Modules Page

**File**: `src/app/portal/modules/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

export default function PortalModulesPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="My Modules"
        description="Manage your published modules"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Button>
          </div>
        }
      />
      
      {/* Modules grid/list */}
    </DashboardShell>
  );
}
```

---

### Task 4: Fix Earnings Page

**File**: `src/app/portal/earnings/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell, DashboardSection } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EarningsPage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Earnings"
        description="Track your revenue and payouts"
        actions={
          <Button>Request Payout</Button>
        }
      />
      
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Available Balance</CardDescription>
            <CardTitle className="text-3xl">$1,234.56</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">$567.89</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-3xl">$12,345.67</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Earnings Chart */}
      <DashboardSection title="Revenue Over Time">
        {/* Chart component */}
      </DashboardSection>
      
      {/* Transactions */}
      <DashboardSection title="Recent Transactions">
        {/* Transactions table */}
      </DashboardSection>
    </DashboardShell>
  );
}
```

---

### Task 5: Fix Create Module Page

**File**: `src/app/portal/create/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateModulePage() {
  return (
    <DashboardShell>
      <PageHeader
        title="Create Module"
        description="Start building a new module for the marketplace"
      />
      
      {/* Module creation wizard/form */}
      <Card>
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
          <CardDescription>Enter basic information about your module</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form */}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
```

---

### Task 6: Fix Marketplace Home Page

**File**: `src/app/(dashboard)/[teamId]/marketplace/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell, DashboardSection } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MarketplacePageProps {
  params: Promise<{ teamId: string }>;
}

export default async function MarketplacePage({ params }: MarketplacePageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell noMaxWidth> {/* Marketplace may need full width */}
      <PageHeader
        title="Module Marketplace"
        description="Discover and install modules to extend your platform"
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search modules..." className="pl-10" />
          </div>
        }
      />
      
      {/* Featured Modules */}
      <DashboardSection title="Featured Modules">
        {/* Featured modules carousel/grid */}
      </DashboardSection>
      
      {/* Categories */}
      <DashboardSection title="Browse by Category">
        {/* Categories grid */}
      </DashboardSection>
      
      {/* Popular Modules */}
      <DashboardSection title="Most Popular">
        {/* Popular modules grid */}
      </DashboardSection>
    </DashboardShell>
  );
}
```

---

### Task 7: Fix Module Details Page

**File**: `src/app/(dashboard)/[teamId]/marketplace/[moduleId]/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModuleDetailsPageProps {
  params: Promise<{ teamId: string; moduleId: string }>;
}

export default async function ModuleDetailsPage({ params }: ModuleDetailsPageProps) {
  const { teamId, moduleId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Module Name"
        description="Module short description"
        badge={<Badge>v1.2.3</Badge>}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">Preview</Button>
            <Button>Install Module</Button>
          </div>
        }
      />
      
      {/* Module Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {/* Overview content */}
        </TabsContent>
        <TabsContent value="features">
          {/* Features list */}
        </TabsContent>
        <TabsContent value="reviews">
          {/* Reviews */}
        </TabsContent>
        <TabsContent value="changelog">
          {/* Changelog */}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
```

---

### Task 8: Fix Search Results Page

**File**: `src/app/(dashboard)/[teamId]/marketplace/search/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

interface SearchPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { teamId } = await params;
  const { q, category } = await searchParams;
  
  return (
    <DashboardShell>
      <PageHeader
        title={`Search Results${q ? ` for "${q}"` : ''}`}
        description={`Found X modules matching your search`}
      />
      
      {/* Search filters */}
      <div className="flex gap-4 items-center py-4">
        {/* Filter components */}
      </div>
      
      {/* Results grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Module cards */}
      </div>
    </DashboardShell>
  );
}
```

---

### Task 9: Batch Search for Issues

Run this search to find remaining issues:

```bash
cd next-platform-dashboard

# Find hardcoded padding in portal pages
grep -r "className.*p-[0-9]\|className.*px-[0-9]\|className.*py-[0-9]" src/app/portal/ --include="*.tsx"

# Find hardcoded padding in marketplace pages
grep -r "className.*p-[0-9]\|className.*px-[0-9]\|className.*py-[0-9]" src/app/\(dashboard\)/\[teamId\]/marketplace/ --include="*.tsx"

# Find inline headers
grep -r "<h1" src/app/portal/ src/app/\(dashboard\)/\[teamId\]/marketplace/ --include="*.tsx"
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
git commit -m "fix(portal/marketplace): update pages with consistent layout (PHASE-UI-04D)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action |
|------|--------|
| `src/app/portal/page.tsx` | Update |
| `src/app/portal/modules/page.tsx` | Update |
| `src/app/portal/analytics/page.tsx` | Update |
| `src/app/portal/earnings/page.tsx` | Update |
| `src/app/portal/create/page.tsx` | Update |
| `src/app/portal/settings/page.tsx` | Update |
| `src/app/(dashboard)/[teamId]/marketplace/page.tsx` | Update |
| `src/app/(dashboard)/[teamId]/marketplace/[moduleId]/page.tsx` | Update |
| `src/app/(dashboard)/[teamId]/marketplace/search/page.tsx` | Update |
| `src/app/(dashboard)/[teamId]/marketplace/categories/page.tsx` | Update |

---

## 🎯 SUCCESS CRITERIA

- [ ] All portal pages use DashboardShell wrapper
- [ ] All marketplace pages use DashboardShell wrapper
- [ ] All pages use PageHeader component
- [ ] No hardcoded padding in any pages
- [ ] Consistent card layouts
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-05A: Final Audit and Cleanup**

---

**End of Phase UI-04D**
