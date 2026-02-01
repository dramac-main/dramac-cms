# PHASE-UI-02A: Update Admin Layout with Unified Sidebar

**Phase ID**: PHASE-UI-02A  
**Priority**: HIGH  
**Estimated Time**: 45 minutes  
**Dependencies**: PHASE-UI-01A (config files), PHASE-UI-01B (unified sidebar)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Update the Admin section layout to use the unified sidebar component with proper navigation, correct colors using CSS variables, and consistent spacing.

---

## 📋 TASKS

### Task 1: Update Admin Sidebar Component

**File**: `src/components/admin/admin-sidebar.tsx`

**Action**: REPLACE the entire file with unified sidebar approach.

**COMPLETE REPLACEMENT CODE**:

```tsx
'use client';

import { Sidebar } from '@/components/layout/sidebar-modern';
import { getAdminNavigation } from '@/config/admin-navigation';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  teamId: string;
  className?: string;
}

export function AdminSidebar({ teamId, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const navigation = getAdminNavigation(teamId);
  
  // Transform admin navigation to sidebar format
  const sidebarSections = [
    {
      title: 'Admin',
      items: navigation.map((item) => ({
        title: item.name,
        href: item.href,
        icon: item.icon,
        active: pathname === item.href || pathname.startsWith(item.href + '/'),
        badge: item.badge,
      })),
    },
  ];

  return (
    <Sidebar
      variant="admin"
      sections={sidebarSections}
      title="Admin Panel"
      className={className}
    />
  );
}

export default AdminSidebar;
```

---

### Task 2: Update Admin Navigation Config

**File**: `src/config/admin-navigation.ts`

**Action**: Ensure this file exports properly typed navigation.

**COMPLETE FILE** (if not already created in PHASE-UI-01A):

```tsx
import {
  Users,
  Building2,
  Shield,
  Settings,
  Activity,
  Database,
  FileText,
  BarChart3,
  Bell,
  Mail,
  Zap,
  Key,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/**
 * Get admin navigation items for a specific team
 */
export function getAdminNavigation(teamId: string): AdminNavItem[] {
  const baseUrl = `/admin/${teamId}`;
  
  return [
    { name: 'Overview', href: `${baseUrl}`, icon: BarChart3, description: 'Admin dashboard overview' },
    { name: 'Users', href: `${baseUrl}/users`, icon: Users, description: 'Manage team users' },
    { name: 'Teams', href: `${baseUrl}/teams`, icon: Building2, description: 'Manage teams' },
    { name: 'Roles', href: `${baseUrl}/roles`, icon: Shield, description: 'Manage roles and permissions' },
    { name: 'Activity', href: `${baseUrl}/activity`, icon: Activity, description: 'View activity logs' },
    { name: 'Database', href: `${baseUrl}/database`, icon: Database, description: 'Database management' },
    { name: 'Audit Logs', href: `${baseUrl}/audit`, icon: FileText, description: 'View audit logs' },
    { name: 'API Keys', href: `${baseUrl}/api-keys`, icon: Key, description: 'Manage API keys' },
    { name: 'Notifications', href: `${baseUrl}/notifications`, icon: Bell, description: 'Notification settings' },
    { name: 'Emails', href: `${baseUrl}/emails`, icon: Mail, description: 'Email configuration' },
    { name: 'Automations', href: `${baseUrl}/automations`, icon: Zap, description: 'Automation rules' },
    { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings, description: 'Admin settings' },
  ];
}

/**
 * Get admin navigation grouped into sections
 */
export function getAdminNavigationSections(teamId: string): AdminNavSection[] {
  const baseUrl = `/admin/${teamId}`;
  
  return [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: `${baseUrl}`, icon: BarChart3 },
        { name: 'Activity', href: `${baseUrl}/activity`, icon: Activity },
      ],
    },
    {
      title: 'Users & Teams',
      items: [
        { name: 'Users', href: `${baseUrl}/users`, icon: Users },
        { name: 'Teams', href: `${baseUrl}/teams`, icon: Building2 },
        { name: 'Roles', href: `${baseUrl}/roles`, icon: Shield },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Database', href: `${baseUrl}/database`, icon: Database },
        { name: 'Audit Logs', href: `${baseUrl}/audit`, icon: FileText },
        { name: 'API Keys', href: `${baseUrl}/api-keys`, icon: Key },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { name: 'Notifications', href: `${baseUrl}/notifications`, icon: Bell },
        { name: 'Emails', href: `${baseUrl}/emails`, icon: Mail },
        { name: 'Automations', href: `${baseUrl}/automations`, icon: Zap },
        { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings },
      ],
    },
  ];
}

export default getAdminNavigation;
```

---

### Task 3: Update Admin Layout File

**File**: `src/app/(dashboard)/admin/[teamId]/layout.tsx`

**Action**: Update to use proper layout structure with LAYOUT constants.

**Find the current layout structure and UPDATE to**:

```tsx
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { LAYOUT } from '@/config/layout';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { teamId } = await params;

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <AdminSidebar teamId={teamId} />
      
      {/* Main Content Area */}
      <main 
        className="flex-1 overflow-auto"
        style={{ padding: `${LAYOUT.PAGE_PADDING.DESKTOP}px` }}
      >
        {children}
      </main>
    </div>
  );
}
```

**OR if the layout wraps DashboardShell separately**, update the padding to use variables:

```tsx
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { teamId } = await params;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Sidebar - uses unified component */}
      <AdminSidebar teamId={teamId} />
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        "p-4 md:p-6 lg:p-8" // Responsive padding
      )}>
        {children}
      </main>
    </div>
  );
}
```

---

### Task 4: Update Admin Index Page (if needed)

**File**: `src/app/(dashboard)/admin/[teamId]/page.tsx`

Check if the page has hardcoded padding. If it uses `DashboardShell`, that's fine. If it has hardcoded `p-6` or similar, consider removing since the layout handles padding now.

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
git commit -m "feat(admin): update admin layout with unified sidebar (PHASE-UI-02A)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/admin-sidebar.tsx` | Replace | Use unified Sidebar component |
| `src/config/admin-navigation.ts` | Create/Update | Export navigation config |
| `src/app/(dashboard)/admin/[teamId]/layout.tsx` | Update | Remove hardcoded padding, use layout constants |

---

## 🎯 SUCCESS CRITERIA

- [ ] AdminSidebar uses unified Sidebar component
- [ ] Admin sidebar has correct colors (uses `variant="admin"`)
- [ ] Admin sidebar is sticky (doesn't scroll with content)
- [ ] Admin layout uses consistent padding (responsive: p-4 md:p-6 lg:p-8)
- [ ] No hardcoded color values in admin sidebar
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-02B: Update Settings Layout with Unified Sidebar**

---

**End of Phase UI-02A**
