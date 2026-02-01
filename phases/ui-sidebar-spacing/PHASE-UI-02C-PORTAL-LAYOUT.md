# PHASE-UI-02C: Update Portal Layout with Unified Sidebar

**Phase ID**: PHASE-UI-02C  
**Priority**: HIGH  
**Estimated Time**: 45 minutes  
**Dependencies**: PHASE-UI-01A (config files), PHASE-UI-01B (unified sidebar)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Update the Developer Portal section layout to use the unified sidebar component with proper navigation, correct colors using CSS variables, and consistent spacing.

---

## 📋 TASKS

### Task 1: Update Portal Sidebar Component

**File**: `src/components/portal/portal-sidebar.tsx`

**Action**: REPLACE the entire file with unified sidebar approach.

**COMPLETE REPLACEMENT CODE**:

```tsx
'use client';

import { Sidebar } from '@/components/layout/sidebar-modern';
import { getPortalNavigation } from '@/config/portal-navigation';
import { usePathname } from 'next/navigation';

interface PortalSidebarProps {
  className?: string;
}

export function PortalSidebar({ className }: PortalSidebarProps) {
  const pathname = usePathname();
  const navigation = getPortalNavigation();
  
  // Transform portal navigation to sidebar format
  const sidebarSections = navigation.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      title: item.name,
      href: item.href,
      icon: item.icon,
      active: pathname === item.href || pathname.startsWith(item.href + '/'),
      badge: item.badge,
      external: item.external,
    })),
  }));

  return (
    <Sidebar
      variant="portal"
      sections={sidebarSections}
      title="Developer Portal"
      className={className}
    />
  );
}

export default PortalSidebar;
```

---

### Task 2: Create/Update Portal Navigation Config

**File**: `src/config/portal-navigation.ts`

**Action**: Create this file if it doesn't exist.

**COMPLETE FILE**:

```tsx
import {
  Home,
  Package,
  FileCode,
  Upload,
  BarChart3,
  DollarSign,
  Settings,
  Book,
  Code2,
  Webhook,
  TestTube,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Key,
  Shield,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface PortalNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
  external?: boolean;
}

export interface PortalNavSection {
  title: string;
  items: PortalNavItem[];
}

/**
 * Get portal navigation (no team context needed for portal)
 */
export function getPortalNavigation(): PortalNavSection[] {
  const baseUrl = '/portal';
  
  return [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: `${baseUrl}`, icon: Home, description: 'Developer dashboard' },
        { name: 'My Modules', href: `${baseUrl}/modules`, icon: Package, description: 'Your published modules' },
        { name: 'Analytics', href: `${baseUrl}/analytics`, icon: BarChart3, description: 'Usage analytics' },
        { name: 'Earnings', href: `${baseUrl}/earnings`, icon: DollarSign, description: 'Revenue and payouts' },
      ],
    },
    {
      title: 'Development',
      items: [
        { name: 'Create Module', href: `${baseUrl}/create`, icon: FileCode, description: 'Start a new module' },
        { name: 'Upload', href: `${baseUrl}/upload`, icon: Upload, description: 'Upload module files' },
        { name: 'API Keys', href: `${baseUrl}/api-keys`, icon: Key, description: 'Manage API keys' },
        { name: 'Webhooks', href: `${baseUrl}/webhooks`, icon: Webhook, description: 'Configure webhooks' },
        { name: 'Testing', href: `${baseUrl}/testing`, icon: TestTube, description: 'Test your modules' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { name: 'Documentation', href: `${baseUrl}/docs`, icon: Book, description: 'API documentation' },
        { name: 'Code Samples', href: `${baseUrl}/samples`, icon: Code2, description: 'Example code' },
        { name: 'SDK', href: `${baseUrl}/sdk`, icon: Zap, description: 'SDK and tools' },
        { name: 'Guidelines', href: `${baseUrl}/guidelines`, icon: Shield, description: 'Developer guidelines' },
      ],
    },
    {
      title: 'Support',
      items: [
        { name: 'Community', href: `${baseUrl}/community`, icon: MessageSquare, description: 'Developer community' },
        { name: 'Help Center', href: `${baseUrl}/help`, icon: HelpCircle, description: 'Get help' },
        { name: 'Status Page', href: 'https://status.dramac.com', icon: ExternalLink, description: 'System status', external: true },
      ],
    },
    {
      title: 'Account',
      items: [
        { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings, description: 'Portal settings' },
      ],
    },
  ];
}

/**
 * Get flat list of portal navigation items
 */
export function getPortalNavigationFlat(): PortalNavItem[] {
  const sections = getPortalNavigation();
  return sections.flatMap((section) => section.items);
}

export default getPortalNavigation;
```

---

### Task 3: Update Portal Layout File

**File**: `src/app/portal/layout.tsx`

**Action**: Update to use proper layout structure with consistent spacing.

**Look for the current layout and UPDATE to**:

```tsx
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Portal Sidebar - uses unified component */}
      <PortalSidebar />
      
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

**If the portal layout has authentication guards**, preserve them:

```tsx
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalAuthGuard } from '@/components/portal/portal-auth-guard';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <PortalAuthGuard>
      <div className="flex min-h-screen bg-background">
        {/* Portal Sidebar - uses unified component */}
        <PortalSidebar />
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          "p-4 md:p-6 lg:p-8"
        )}>
          {children}
        </main>
      </div>
    </PortalAuthGuard>
  );
}
```

---

### Task 4: Update Sidebar Variant for Portal

**File**: `src/components/layout/sidebar-modern.tsx`

**Action**: Verify the `portal` variant exists in the sidebar. If not, add it.

The sidebar variants should include:

```tsx
const variantStyles = {
  default: 'bg-sidebar text-sidebar-foreground',
  admin: 'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
  settings: 'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
  portal: 'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
};
```

If `portal` is missing, add it. All variants should use `bg-sidebar` to ensure CSS variables are used.

---

### Task 5: Handle External Links in Navigation

The portal navigation includes an external link (Status Page). Ensure the sidebar component handles external links properly.

**In the sidebar item rendering**, check for `external` property:

```tsx
{item.external ? (
  <a
    href={item.href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(itemStyles, 'justify-between')}
  >
    <span className="flex items-center gap-3">
      <item.icon className="h-4 w-4" />
      {item.title}
    </span>
    <ExternalLink className="h-3 w-3 opacity-50" />
  </a>
) : (
  <Link href={item.href} className={itemStyles}>
    {/* ... */}
  </Link>
)}
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
git commit -m "feat(portal): update portal layout with unified sidebar (PHASE-UI-02C)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/components/portal/portal-sidebar.tsx` | Replace | Use unified Sidebar component |
| `src/config/portal-navigation.ts` | Create | Export navigation config |
| `src/app/portal/layout.tsx` | Update | Remove hardcoded padding, use layout |
| `src/components/layout/sidebar-modern.tsx` | Update | Add portal variant if missing |

---

## 🎯 SUCCESS CRITERIA

- [ ] PortalSidebar uses unified Sidebar component
- [ ] Portal sidebar has correct colors (uses `variant="portal"`)
- [ ] Portal sidebar is sticky (doesn't scroll with content)
- [ ] Portal layout uses consistent padding (responsive: p-4 md:p-6 lg:p-8)
- [ ] External links open in new tab with proper attributes
- [ ] No hardcoded color values in portal sidebar
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-03A: Update Dashboard Shell and Page Header**

---

**End of Phase UI-02C**
