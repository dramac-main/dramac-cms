# PHASE-UI-02B: Update Settings Layout with Unified Sidebar

**Phase ID**: PHASE-UI-02B  
**Priority**: HIGH  
**Estimated Time**: 45 minutes  
**Dependencies**: PHASE-UI-01A (config files), PHASE-UI-01B (unified sidebar)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Update the Settings section layout to use the unified sidebar component with proper navigation, correct colors using CSS variables, and consistent spacing.

---

## 📋 TASKS

### Task 1: Update Settings Sidebar Component

**File**: `src/components/settings/settings-sidebar.tsx`

**Action**: REPLACE the entire file with unified sidebar approach.

**COMPLETE REPLACEMENT CODE**:

```tsx
'use client';

import { Sidebar } from '@/components/layout/sidebar-modern';
import { getSettingsNavigation } from '@/config/settings-navigation';
import { usePathname } from 'next/navigation';

interface SettingsSidebarProps {
  teamId: string;
  className?: string;
}

export function SettingsSidebar({ teamId, className }: SettingsSidebarProps) {
  const pathname = usePathname();
  const navigation = getSettingsNavigation(teamId);
  
  // Transform settings navigation to sidebar format
  const sidebarSections = navigation.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      title: item.name,
      href: item.href,
      icon: item.icon,
      active: pathname === item.href || pathname.startsWith(item.href + '/'),
      badge: item.badge,
    })),
  }));

  return (
    <Sidebar
      variant="settings"
      sections={sidebarSections}
      title="Settings"
      className={className}
    />
  );
}

export default SettingsSidebar;
```

---

### Task 2: Create/Update Settings Navigation Config

**File**: `src/config/settings-navigation.ts`

**Action**: Create this file if it doesn't exist.

**COMPLETE FILE**:

```tsx
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  CreditCard,
  Users,
  Building,
  Link2,
  Plug,
  Mail,
  Lock,
  FileText,
  Smartphone,
  Laptop,
  type LucideIcon,
} from 'lucide-react';

export interface SettingsNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
}

export interface SettingsNavSection {
  title: string;
  items: SettingsNavItem[];
}

/**
 * Get settings navigation for a specific team
 */
export function getSettingsNavigation(teamId: string): SettingsNavSection[] {
  const baseUrl = `/settings/${teamId}`;
  
  return [
    {
      title: 'Account',
      items: [
        { name: 'Profile', href: `${baseUrl}/profile`, icon: User, description: 'Your personal information' },
        { name: 'Notifications', href: `${baseUrl}/notifications`, icon: Bell, description: 'Notification preferences' },
        { name: 'Security', href: `${baseUrl}/security`, icon: Shield, description: 'Password and 2FA' },
        { name: 'Sessions', href: `${baseUrl}/sessions`, icon: Laptop, description: 'Active sessions' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { name: 'Appearance', href: `${baseUrl}/appearance`, icon: Palette, description: 'Theme and display' },
        { name: 'Language', href: `${baseUrl}/language`, icon: Globe, description: 'Language settings' },
        { name: 'Accessibility', href: `${baseUrl}/accessibility`, icon: Smartphone, description: 'Accessibility options' },
      ],
    },
    {
      title: 'Team',
      items: [
        { name: 'General', href: `${baseUrl}/team`, icon: Building, description: 'Team settings' },
        { name: 'Members', href: `${baseUrl}/members`, icon: Users, description: 'Team members' },
        { name: 'Roles', href: `${baseUrl}/roles`, icon: Lock, description: 'Roles and permissions' },
        { name: 'Invitations', href: `${baseUrl}/invitations`, icon: Mail, description: 'Pending invitations' },
      ],
    },
    {
      title: 'Integrations',
      items: [
        { name: 'Connected Apps', href: `${baseUrl}/integrations`, icon: Plug, description: 'Third-party integrations' },
        { name: 'API Keys', href: `${baseUrl}/api-keys`, icon: Key, description: 'API access tokens' },
        { name: 'Webhooks', href: `${baseUrl}/webhooks`, icon: Link2, description: 'Webhook endpoints' },
      ],
    },
    {
      title: 'Billing',
      items: [
        { name: 'Subscription', href: `${baseUrl}/billing`, icon: CreditCard, description: 'Plan and billing' },
        { name: 'Invoices', href: `${baseUrl}/invoices`, icon: FileText, description: 'Payment history' },
      ],
    },
  ];
}

/**
 * Get flat list of settings navigation items
 */
export function getSettingsNavigationFlat(teamId: string): SettingsNavItem[] {
  const sections = getSettingsNavigation(teamId);
  return sections.flatMap((section) => section.items);
}

export default getSettingsNavigation;
```

---

### Task 3: Update Settings Layout File

**File**: `src/app/(dashboard)/settings/[teamId]/layout.tsx`

**Action**: Update to use proper layout structure with consistent spacing.

**Look for the current layout and UPDATE to**:

```tsx
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const { teamId } = await params;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Settings Sidebar - uses unified component */}
      <SettingsSidebar teamId={teamId} />
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        "p-4 md:p-6 lg:p-8" // Responsive padding - consistent with layout
      )}>
        {children}
      </main>
    </div>
  );
}
```

---

### Task 4: Remove Old Inline Navigation (if present)

Check the settings layout for any inline navigation that might be duplicated with the sidebar. 

**Look for patterns like**:
- `<nav className="...">` with settings links
- Hardcoded navigation items
- `gap-8` or other hardcoded spacing

Remove any duplicate navigation - the sidebar should be the only navigation source.

---

### Task 5: Update Settings Index/Page Files

**Check these files for hardcoded padding**:

- `src/app/(dashboard)/settings/[teamId]/page.tsx`
- `src/app/(dashboard)/settings/[teamId]/profile/page.tsx`
- Other settings subpages

If pages have hardcoded `p-6`, `px-8`, etc., they can be removed since the layout handles padding. Pages should start with their content directly:

```tsx
// Good - let layout handle padding
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your profile" />
      {/* Content */}
    </div>
  );
}

// Bad - remove hardcoded padding
export default function ProfilePage() {
  return (
    <div className="p-6 space-y-6"> {/* Remove p-6 */}
      {/* Content */}
    </div>
  );
}
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
git commit -m "feat(settings): update settings layout with unified sidebar (PHASE-UI-02B)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/settings-sidebar.tsx` | Replace | Use unified Sidebar component |
| `src/config/settings-navigation.ts` | Create | Export navigation config |
| `src/app/(dashboard)/settings/[teamId]/layout.tsx` | Update | Remove hardcoded padding, use layout constants |
| `src/app/(dashboard)/settings/[teamId]/page.tsx` | Update | Remove hardcoded padding if present |

---

## 🎯 SUCCESS CRITERIA

- [ ] SettingsSidebar uses unified Sidebar component
- [ ] Settings sidebar has correct colors (uses `variant="settings"`)
- [ ] Settings sidebar is sticky (doesn't scroll with content)
- [ ] Settings layout uses consistent padding (responsive: p-4 md:p-6 lg:p-8)
- [ ] No hardcoded color values in settings sidebar
- [ ] No duplicate navigation elements
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-02C: Update Portal Layout with Unified Sidebar**

---

**End of Phase UI-02B**
