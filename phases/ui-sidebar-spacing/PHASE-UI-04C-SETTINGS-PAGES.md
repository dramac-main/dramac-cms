# PHASE-UI-04C: Audit and Fix Settings Pages

**Phase ID**: PHASE-UI-04C  
**Priority**: MEDIUM  
**Estimated Time**: 60 minutes  
**Dependencies**: PHASE-UI-02B (settings layout), PHASE-UI-03A (shell)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Audit and fix all Settings section pages to use consistent DashboardShell/PageHeader patterns and remove hardcoded spacing values.

---

## 📋 PAGES TO AUDIT

Settings section pages under `src/app/(dashboard)/settings/[teamId]/`:

1. `page.tsx` - Settings overview
2. `profile/page.tsx` - Profile settings
3. `notifications/page.tsx` - Notification settings
4. `security/page.tsx` - Security settings
5. `appearance/page.tsx` - Appearance/theme
6. `team/page.tsx` - Team settings
7. `members/page.tsx` - Team members
8. `billing/page.tsx` - Billing settings
9. `integrations/page.tsx` - Integrations
10. `api-keys/page.tsx` - API keys

---

## 📋 TASKS

### Task 1: Settings Page Pattern

Settings pages often use a two-column layout with navigation on the left. Since the Settings section already has a sidebar (from PHASE-UI-02B), the pages should use a simplified structure:

**CORRECT SETTINGS PAGE PATTERN**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Settings"
        description="Manage your preferences"
      />
      
      <div className="space-y-6">
        {/* Settings cards/sections */}
        <Card>
          <CardHeader>
            <CardTitle>Section Title</CardTitle>
            <CardDescription>Section description</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Settings form */}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
```

---

### Task 2: Fix Settings Overview Page

**File**: `src/app/(dashboard)/settings/[teamId]/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface SettingsOverviewProps {
  params: Promise<{ teamId: string }>;
}

export default async function SettingsOverview({ params }: SettingsOverviewProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Settings"
        description="Manage your account and team settings"
      />
      
      {/* Settings categories overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href={`/settings/${teamId}/profile`}>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        
        {/* More category cards */}
      </div>
    </DashboardShell>
  );
}
```

---

### Task 3: Fix Profile Settings Page

**File**: `src/app/(dashboard)/settings/[teamId]/profile/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfilePageProps {
  params: Promise<{ teamId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences"
      />
      
      <div className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Avatar upload */}
          </CardContent>
        </Card>
        
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Profile form */}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
```

---

### Task 4: Fix Notification Settings Page

**File**: `src/app/(dashboard)/settings/[teamId]/notifications/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface NotificationsPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Notifications"
        description="Configure how you receive notifications"
      />
      
      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Manage email notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notification toggles */}
          </CardContent>
        </Card>
        
        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>Browser push notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Push notification toggles */}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
```

---

### Task 5: Fix Security Settings Page

**File**: `src/app/(dashboard)/settings/[teamId]/security/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SecurityPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Security"
        description="Manage your account security settings"
      />
      
      <div className="space-y-6">
        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Change Password</Button>
          </CardContent>
        </Card>
        
        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security</CardDescription>
            </div>
            <Badge variant="outline">Not Enabled</Badge>
          </CardHeader>
          <CardContent>
            <Button>Enable 2FA</Button>
          </CardContent>
        </Card>
        
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage your logged-in devices</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Sessions list */}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
```

---

### Task 6: Fix Appearance Settings Page

**File**: `src/app/(dashboard)/settings/[teamId]/appearance/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AppearancePageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AppearancePage({ params }: AppearancePageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Appearance"
        description="Customize how the dashboard looks"
      />
      
      <div className="space-y-6">
        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Select your preferred color theme</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Theme selector */}
          </CardContent>
        </Card>
        
        {/* Density Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Density</CardTitle>
            <CardDescription>Adjust spacing and layout density</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Density options */}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
```

---

### Task 7: Fix Billing Settings Page

**File**: `src/app/(dashboard)/settings/[teamId]/billing/page.tsx`

**Expected structure**:

```tsx
import { DashboardShell, DashboardSection } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BillingPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { teamId } = await params;
  
  return (
    <DashboardShell>
      <PageHeader
        title="Billing"
        description="Manage your subscription and payment methods"
      />
      
      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">Pro Plan</p>
              <p className="text-muted-foreground">$29/month</p>
            </div>
            <Button variant="outline">Change Plan</Button>
          </CardContent>
        </Card>
        
        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your saved payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Payment methods list */}
          </CardContent>
        </Card>
        
        {/* Billing History */}
        <DashboardSection title="Billing History">
          {/* Invoices table */}
        </DashboardSection>
      </div>
    </DashboardShell>
  );
}
```

---

### Task 8: Batch Search for Issues

Run this search to find remaining issues:

```bash
cd next-platform-dashboard

# Find hardcoded padding in settings pages
grep -r "className.*p-[0-9]\|className.*px-[0-9]\|className.*py-[0-9]" src/app/\(dashboard\)/settings/ --include="*.tsx"

# Find inline headers (h1 without PageHeader)
grep -r "<h1" src/app/\(dashboard\)/settings/ --include="*.tsx"

# Find pages without DashboardShell
grep -L "DashboardShell" src/app/\(dashboard\)/settings/\[teamId\]/*/page.tsx 2>/dev/null
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
git commit -m "fix(settings): update settings pages with consistent layout (PHASE-UI-04C)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action |
|------|--------|
| `src/app/(dashboard)/settings/[teamId]/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/profile/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/notifications/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/security/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/appearance/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/team/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/members/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/billing/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/integrations/page.tsx` | Update |
| `src/app/(dashboard)/settings/[teamId]/api-keys/page.tsx` | Update |

---

## 🎯 SUCCESS CRITERIA

- [ ] All settings pages use DashboardShell wrapper
- [ ] All settings pages use PageHeader component
- [ ] No hardcoded padding in settings pages
- [ ] Consistent card-based layout for settings forms
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-04D: Audit and Fix Portal Pages**

---

**End of Phase UI-04C**
