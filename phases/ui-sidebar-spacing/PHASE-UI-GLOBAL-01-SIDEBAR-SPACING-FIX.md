# **PHASE-UI-GLOBAL-01: Platform-Wide Sidebar & Spacing Standardization**

**Phase ID**: PHASE-UI-GLOBAL-01  
**Priority**: CRITICAL  
**Estimated Effort**: 8-12 hours  
**Dependencies**: None  
**Last Updated**: February 1, 2026

---

## 📋 EXECUTIVE SUMMARY

This phase addresses **critical UI inconsistencies** across the entire DRAMAC CMS platform. The goal is to create **truly global, single-source-of-truth** layout and spacing systems so that **one tweak updates the entire platform**.

**Impact**: This fix will make the entire platform visually consistent and enable global theming changes with a single constant update.

---

## 🔴 CRITICAL ISSUES DISCOVERED

### 1. SIDEBAR ISSUES (Priority: CRITICAL)

#### **Problem A: Multiple Overlapping Sidebars**

Found **8 different sidebar implementations**:

1. `next-platform-dashboard/src/components/layout/sidebar.tsx` - Legacy sidebar (227 lines)
2. `next-platform-dashboard/src/components/layout/sidebar-modern.tsx` - Modern sidebar (345 lines)
3. `next-platform-dashboard/src/components/admin/admin-sidebar.tsx` - Admin panel sidebar
4. `next-platform-dashboard/src/components/settings/settings-sidebar.tsx` - Settings sidebar
5. `next-platform-dashboard/src/components/portal/portal-sidebar.tsx` - Client portal sidebar
6. `next-platform-dashboard/src/components/modules/marketplace/marketplace-sidebar.tsx` - Marketplace filters
7. Module-specific sidebars in booking, CRM, automation, etc.

**Issue**: The `sidebar.tsx` (legacy) and `sidebar-modern.tsx` both exist and are exported from `index.ts`. This creates confusion and inconsistent behavior.

#### **Problem B: Double Hamburger Menu on Mobile**

- `sidebar-modern.tsx` (lines 177-185) has a mobile menu button
- `header-modern.tsx` (lines 98-106) ALSO has a mobile menu button
- Both trigger `setMobileOpen(true)` creating double controls

**Visual Result**: Two hamburger icons appear on mobile screens, causing user confusion.

#### **Problem C: Sidebar NOT Sticky**

Current implementations:
- Main sidebar uses `h-screen` but is inside flex container without `sticky top-0`
- Admin sidebar: `<aside className="relative w-64">` - NO sticky positioning!
- Portal sidebar: `<aside className="w-64 border-r bg-background min-h-[calc(100vh-64px)]">` - NO sticky!

**Visual Result**: Sidebars scroll away when user scrolls page content, requiring them to scroll back up to access navigation.

#### **Problem D: Sidebar Colors NOT Following Global Theme**

Current color usage:
- Main sidebar: `bg-sidebar` ✅ (correct)
- Admin sidebar: `bg-card` ❌ (wrong - should use sidebar colors)
- Portal sidebar: `bg-background` ❌ (wrong - should use sidebar colors)
- Settings sidebar: NO background defined ❌

Inconsistent active item colors:
- Main: `bg-sidebar-primary text-sidebar-primary-foreground`
- Admin: `bg-destructive text-white`
- Settings: `bg-primary text-primary-foreground`
- Portal: `bg-primary text-primary-foreground`

**Visual Result**: Each section of the platform looks different, breaking visual consistency.

---

### 2. SPACING ISSUES (Priority: HIGH)

#### **Problem A: Inconsistent Page Padding**

| Location | Padding Used | Should Be |
|----------|-------------|-----------|
| `dashboard-layout-client.tsx` | No padding on `<main>` | Global constant |
| `app/(dashboard)/admin/layout.tsx` | `p-6` | Global constant |
| `app/(dashboard)/settings/layout.tsx` | `p-6` + `gap-8` | Global constant |
| `app/portal/layout.tsx` | `p-6 lg:p-8` | Global constant |
| `app/(dashboard)/marketplace/page.tsx` | `container mx-auto py-6` | Global constant |
| Individual dashboard pages | Various `p-4`, `p-6`, `p-8` | Global constant |

**Visual Result**: Pages have different side margins, some content feels cramped while others feel too spacious.

#### **Problem B: No Global Spacing Constants Being Used**

CSS variables exist in `globals.css`:
```css
--spacing-4: 1rem;        /* 16px */
--spacing-6: 1.5rem;      /* 24px */
--spacing-8: 2rem;        /* 32px */
```

**BUT** pages hardcode Tailwind classes like `p-4`, `p-6`, `p-8` instead of using these variables or a global constant system.

**Result**: Cannot change spacing globally - must edit hundreds of files individually.

#### **Problem C: DashboardShell Exists But Not Used Consistently**

- `dashboard-shell.tsx` exists with proper padding logic
- Many pages DON'T use it, applying their own padding
- No enforcement of the pattern

**Result**: Spacing inconsistencies across the platform.

---

## ✅ REQUIRED FIXES (IMPLEMENTATION SPEC)

### PHASE 1: Unify Sidebar System

#### **Step 1.1: Create Single Sidebar Component**

**Objective**: Create a unified sidebar that handles all contexts with variants.

**Action**: Enhance `src/components/layout/sidebar-modern.tsx` to handle all sidebar contexts:

```typescript
// Add to sidebar-modern.tsx
interface SidebarProps {
  className?: string;
  isSuperAdmin?: boolean;
  variant?: 'main' | 'admin' | 'portal' | 'settings';
  navigation?: NavGroup[];
  showLogo?: boolean;
  collapsible?: boolean;
  headerComponent?: React.ReactNode;
}
```

**Key Requirements**:
- Remove `sidebar.tsx` (legacy version)
- All variants MUST use `--sidebar-*` CSS variables for colors
- Add `sticky top-0 h-screen overflow-hidden` for fixed positioning
- Support custom navigation per variant
- Support custom header components (like "Admin Panel" badge)

#### **Step 1.2: Fix Double Hamburger Menu**

**Decision Required**: Choose ONE location for mobile menu button.

**Option A** (Recommended): Keep in header only
- Remove hamburger from `sidebar-modern.tsx` (lines 177-185)
- Keep hamburger in `header-modern.tsx` (lines 98-106)

**Option B**: Keep in sidebar only
- Keep hamburger in `sidebar-modern.tsx`
- Remove hamburger from `header-modern.tsx`

**Rationale for Option A**: Header is always visible, making it more intuitive for users.

#### **Step 1.3: Create Sidebar Variant Configs**

**Action**: Create new file `src/config/sidebar-variants.ts`:

```typescript
import { mainNavigation, adminNavigation, bottomNavigation } from '@/config/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface SidebarVariantConfig {
  navigation: NavGroup[];
  bottomNavigation?: NavItem[];
  showLogo: boolean;
  collapsible: boolean;
  headerComponent?: React.ComponentType;
  footerComponent?: React.ComponentType;
}

// Admin Header Component
function AdminHeader() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
        <Shield className="w-4 h-4 text-destructive" />
      </div>
      <div>
        <h2 className="font-semibold text-sm">Admin Panel</h2>
        <p className="text-xs text-sidebar-foreground/60">Super Admin Access</p>
      </div>
    </div>
  );
}

// Admin Footer Component
function AdminFooter() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors px-3 py-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  );
}

export const sidebarVariants: Record<string, SidebarVariantConfig> = {
  main: {
    navigation: mainNavigation,
    bottomNavigation: bottomNavigation,
    showLogo: true,
    collapsible: true,
  },
  admin: {
    navigation: adminNavigation,
    showLogo: true,
    collapsible: false,
    headerComponent: AdminHeader,
    footerComponent: AdminFooter,
  },
  portal: {
    navigation: [], // Set dynamically based on user permissions
    showLogo: false, // Uses portal header logo instead
    collapsible: false,
  },
  settings: {
    navigation: [], // Set from settings nav config
    showLogo: false,
    collapsible: false,
  },
};
```

#### **Step 1.4: Update Sidebar CSS to Ensure Sticky Positioning**

**Action**: Update `sidebar-modern.tsx` desktop sidebar container:

**Current**:
```tsx
<motion.aside
  className="hidden lg:flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground"
>
```

**Replace with**:
```tsx
<motion.aside
  className="hidden lg:flex sticky top-0 h-screen flex-col border-r bg-sidebar text-sidebar-foreground overflow-hidden"
>
```

**Add overflow handling**:
```tsx
{/* Navigation - should scroll if content overflows */}
<nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
  {/* navigation items */}
</nav>
```

#### **Step 1.5: Update All Layouts to Use Unified Sidebar**

**Files to Update**:

1. **Admin Layout** - `src/app/(dashboard)/admin/layout.tsx`:
```tsx
// BEFORE
<AdminSidebar />

// AFTER
<Sidebar variant="admin" />
```

2. **Settings Layout** - `src/app/(dashboard)/settings/layout.tsx`:
```tsx
// BEFORE
<aside className="w-full lg:w-64 shrink-0">
  <SettingsSidebar />
</aside>

// AFTER
<Sidebar variant="settings" navigation={settingsNavigation} showLogo={false} collapsible={false} />
```

3. **Portal Layout** - `src/app/portal/layout.tsx`:
```tsx
// BEFORE
<PortalSidebar user={session.user} openTicketCount={openTicketCount} />

// AFTER
<Sidebar 
  variant="portal" 
  navigation={getPortalNavigation(session.user, openTicketCount)}
  showLogo={false}
  collapsible={false}
/>
```

#### **Step 1.6: Ensure Sidebar CSS Variables Are Complete**

**Action**: Verify `src/app/globals.css` has ALL sidebar variables for light AND dark mode.

**Required Variables**:
```css
:root {
  --sidebar: oklch(0.985 0 0);                    /* Sidebar background */
  --sidebar-foreground: oklch(0.145 0 0);         /* Text color */
  --sidebar-primary: oklch(0.205 0 0);            /* Active item bg */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Active item text */
  --sidebar-accent: oklch(0.97 0 0);              /* Hover bg */
  --sidebar-accent-foreground: oklch(0.205 0 0);  /* Hover text */
  --sidebar-border: oklch(0.922 0 0);             /* Border color */
  --sidebar-ring: oklch(0.708 0 0);               /* Focus ring */
}

.dark {
  --sidebar: oklch(0.205 0 0);                    /* Dark sidebar bg */
  --sidebar-foreground: oklch(0.985 0 0);         /* Dark text */
  --sidebar-primary: oklch(0.488 0.243 264.376);  /* Dark active bg */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Dark active text */
  --sidebar-accent: oklch(0.269 0 0);             /* Dark hover bg */
  --sidebar-accent-foreground: oklch(0.985 0 0);  /* Dark hover text */
  --sidebar-border: oklch(1 0 0 / 10%);           /* Dark border */
  --sidebar-ring: oklch(0.556 0 0);               /* Dark focus ring */
}
```

**Verification**: Check that these are already present (they appear to be), but ensure NO component overrides them with hardcoded colors.

---

### PHASE 2: Standardize Global Spacing

#### **Step 2.1: Create Layout Constants**

**Action**: Create new file `src/config/layout.ts`:

```typescript
/**
 * Global Layout Constants
 * 
 * SINGLE SOURCE OF TRUTH for all spacing, dimensions, and layout values.
 * Change these values to update the entire platform globally.
 * 
 * @example
 * import { LAYOUT } from '@/config/layout';
 * <div className={LAYOUT.PAGE_PADDING}>...</div>
 */

export const LAYOUT = {
  // ============================================
  // PAGE PADDING (Main Content Area)
  // ============================================
  
  /** Standard page padding: 16px mobile, 24px desktop */
  PAGE_PADDING: 'p-4 lg:p-6',
  
  /** Horizontal page padding only */
  PAGE_PADDING_X: 'px-4 lg:px-6',
  
  /** Vertical page padding only */
  PAGE_PADDING_Y: 'py-4 lg:py-6',
  
  /** No padding (for full-width layouts like editors) */
  PAGE_PADDING_NONE: 'p-0',
  
  /** Dense padding (for compact layouts) */
  PAGE_PADDING_DENSE: 'p-2 lg:p-4',
  
  // ============================================
  // CONTENT MAX WIDTH
  // ============================================
  
  /** Standard content width: 1280px (80rem) */
  CONTENT_MAX_WIDTH: 'max-w-screen-2xl',
  
  /** Extra large content width: 1536px */
  CONTENT_MAX_WIDTH_XL: 'max-w-screen-3xl',
  
  /** Large content width: 1024px */
  CONTENT_MAX_WIDTH_LG: 'max-w-screen-lg',
  
  /** Medium content width: 768px */
  CONTENT_MAX_WIDTH_MD: 'max-w-screen-md',
  
  /** Full width (no constraint) */
  CONTENT_MAX_WIDTH_FULL: 'max-w-full',
  
  // ============================================
  // SECTION SPACING (Vertical gaps between sections)
  // ============================================
  
  /** Standard section gap: 24px */
  SECTION_GAP: 'space-y-6',
  
  /** Large section gap: 32px */
  SECTION_GAP_LG: 'space-y-8',
  
  /** Small section gap: 16px */
  SECTION_GAP_SM: 'space-y-4',
  
  /** Extra small section gap: 8px */
  SECTION_GAP_XS: 'space-y-2',
  
  // ============================================
  // GRID GAPS (For card grids, form layouts)
  // ============================================
  
  /** Standard grid gap: 16px mobile, 24px desktop */
  GRID_GAP: 'gap-4 lg:gap-6',
  
  /** Small grid gap: 8px mobile, 16px desktop */
  GRID_GAP_SM: 'gap-2 lg:gap-4',
  
  /** Large grid gap: 24px mobile, 32px desktop */
  GRID_GAP_LG: 'gap-6 lg:gap-8',
  
  // ============================================
  // SIDEBAR DIMENSIONS
  // ============================================
  
  /** Expanded sidebar width: 256px (16rem) */
  SIDEBAR_WIDTH: 'w-64',
  
  /** Collapsed sidebar width: 64px (4rem) */
  SIDEBAR_COLLAPSED_WIDTH: 'w-16',
  
  /** Sidebar should be sticky with screen height */
  SIDEBAR_POSITION: 'sticky top-0 h-screen',
  
  // ============================================
  // HEADER DIMENSIONS
  // ============================================
  
  /** Header height: 56px mobile, 64px desktop */
  HEADER_HEIGHT: 'h-14 md:h-16',
  
  /** Header should be sticky at top */
  HEADER_POSITION: 'sticky top-0',
  
  // ============================================
  // CONTAINER WIDTHS (For centered content)
  // ============================================
  
  /** Full width container with auto margins */
  CONTAINER: 'container mx-auto',
  
  /** Container with standard padding */
  CONTAINER_PADDED: 'container mx-auto px-4 lg:px-6',
  
  // ============================================
  // CARD PADDING
  // ============================================
  
  /** Standard card padding: 24px */
  CARD_PADDING: 'p-6',
  
  /** Small card padding: 16px */
  CARD_PADDING_SM: 'p-4',
  
  /** Large card padding: 32px */
  CARD_PADDING_LG: 'p-8',
  
  // ============================================
  // FORM SPACING
  // ============================================
  
  /** Form field vertical gap: 16px */
  FORM_GAP: 'space-y-4',
  
  /** Form field vertical gap (large): 24px */
  FORM_GAP_LG: 'space-y-6',
  
  /** Form field vertical gap (small): 8px */
  FORM_GAP_SM: 'space-y-2',
  
  // ============================================
  // PAGE HEADER SPACING
  // ============================================
  
  /** Space below page header: 24px */
  PAGE_HEADER_MARGIN: 'mb-6',
  
  /** Space below page header (large): 32px */
  PAGE_HEADER_MARGIN_LG: 'mb-8',
  
} as const;

/**
 * Helper function to combine layout classes safely
 * @example
 * combineLayout(LAYOUT.PAGE_PADDING, LAYOUT.SECTION_GAP)
 */
export function combineLayout(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Type for layout constant keys (for type-safe usage)
 */
export type LayoutKey = keyof typeof LAYOUT;
```

#### **Step 2.2: Update DashboardShell to Use Constants**

**Action**: Modify `src/components/layout/dashboard-shell.tsx`:

```typescript
import { LAYOUT } from '@/config/layout';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
}

const maxWidthClasses = {
  sm: LAYOUT.CONTENT_MAX_WIDTH_MD,
  md: LAYOUT.CONTENT_MAX_WIDTH_LG,
  lg: LAYOUT.CONTENT_MAX_WIDTH_LG,
  xl: LAYOUT.CONTENT_MAX_WIDTH_XL,
  '2xl': LAYOUT.CONTENT_MAX_WIDTH,
  full: LAYOUT.CONTENT_MAX_WIDTH_FULL,
  none: '',
};

export function DashboardShell({
  children,
  className,
  noPadding = false,
  maxWidth = '2xl',
}: DashboardShellProps) {
  return (
    <div 
      className={cn(
        'flex-1 flex flex-col',
        !noPadding && LAYOUT.PAGE_PADDING,
        className
      )}
    >
      <div className={cn('mx-auto w-full', maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </div>
  );
}
```

#### **Step 2.3: Remove Hardcoded Padding from Layouts**

**Files to Update**:

1. **Admin Layout** - `src/app/(dashboard)/admin/layout.tsx`:
```tsx
// BEFORE
<main className="flex-1 p-6 overflow-auto bg-background">{children}</main>

// AFTER
<main className="flex-1 overflow-auto bg-background">{children}</main>
// Note: Let DashboardShell handle padding in each page
```

2. **Settings Layout** - `src/app/(dashboard)/settings/layout.tsx`:
```tsx
// BEFORE
<div className="flex flex-col lg:flex-row gap-8 p-6">
  <aside className="w-full lg:w-64 shrink-0">
    <SettingsSidebar />
  </aside>
  <main className="flex-1 min-w-0">{children}</main>
</div>

// AFTER
import { LAYOUT } from '@/config/layout';

<div className={cn('flex flex-col lg:flex-row gap-8', LAYOUT.PAGE_PADDING)}>
  <aside className="w-full lg:w-64 shrink-0">
    <Sidebar variant="settings" />
  </aside>
  <main className="flex-1 min-w-0">{children}</main>
</div>
```

3. **Portal Layout** - `src/app/portal/layout.tsx`:
```tsx
// BEFORE
<main className="flex-1 p-6 lg:p-8">
  <div className="max-w-6xl mx-auto">
    {children}
  </div>
</main>

// AFTER
import { LAYOUT } from '@/config/layout';

<main className={cn('flex-1', LAYOUT.PAGE_PADDING)}>
  <div className={LAYOUT.CONTENT_MAX_WIDTH + ' mx-auto'}>
    {children}
  </div>
</main>
```

#### **Step 2.4: Update PageHeader Component**

**Action**: Ensure `src/components/layout/page-header.tsx` uses constants:

```typescript
import { LAYOUT } from '@/config/layout';

export function PageHeader({ title, description, children, className, backHref }: PageHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
      LAYOUT.PAGE_HEADER_MARGIN,  // Uses global constant instead of hardcoded 'pb-6'
      className
    )}>
      {/* ... rest of component */}
    </div>
  );
}
```

#### **Step 2.5: Enforce DashboardShell Usage in Pages**

**Pattern to Follow**:

```tsx
// ✅ CORRECT - Uses DashboardShell for consistent padding
import { DashboardShell } from '@/components/layout';

export default function MyPage() {
  return (
    <DashboardShell>
      <PageHeader title="My Page" description="Page description" />
      
      <div className={LAYOUT.SECTION_GAP}>
        {/* Page content */}
      </div>
    </DashboardShell>
  );
}

// ❌ INCORRECT - Hardcoded padding
export default function MyPage() {
  return (
    <div className="p-6">
      <h1>My Page</h1>
      {/* content */}
    </div>
  );
}
```

**Pages to Update** (Examples - audit all):
- `src/app/(dashboard)/marketplace/page.tsx`
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/dashboard/clients/page.tsx`
- `src/app/(dashboard)/dashboard/sites/page.tsx`
- All pages in `src/app/(dashboard)/dashboard/`
- All pages in `src/app/(dashboard)/admin/`

#### **Step 2.6: Update Existing Components Using Hardcoded Spacing**

Search and replace patterns:

| Hardcoded | Replace With |
|-----------|-------------|
| `className="p-6"` | `className={LAYOUT.PAGE_PADDING}` |
| `className="space-y-6"` | `className={LAYOUT.SECTION_GAP}` |
| `className="gap-4 lg:gap-6"` | `className={LAYOUT.GRID_GAP}` |
| `className="max-w-screen-2xl"` | `className={LAYOUT.CONTENT_MAX_WIDTH}` |
| `className="mb-6"` | `className={LAYOUT.PAGE_HEADER_MARGIN}` |

**Files to Audit**:
- All files in `src/app/(dashboard)/`
- All files in `src/components/dashboard/`
- All files in `src/components/clients/`
- All files in `src/components/sites/`
- All module components

---

## 📁 FILES TO MODIFY

### ✅ New Files to Create:

1. `src/config/layout.ts` - Layout constants (350+ lines)
2. `src/config/sidebar-variants.ts` - Sidebar variant configurations (150+ lines)

### ✏️ Files to Modify:

#### Sidebar System (Priority 1):
1. `src/components/layout/sidebar-modern.tsx` - Enhance with variant support, add sticky positioning
2. `src/components/layout/sidebar.tsx` - **DELETE** (legacy, no longer needed)
3. `src/components/layout/index.ts` - Update exports, remove legacy sidebar
4. `src/components/layout/header-modern.tsx` - Remove duplicate hamburger menu
5. `src/components/admin/admin-sidebar.tsx` - Convert to use unified sidebar or delete
6. `src/components/settings/settings-sidebar.tsx` - Convert to use unified sidebar or delete
7. `src/components/portal/portal-sidebar.tsx` - Convert to use unified sidebar or delete
8. `src/app/globals.css` - Verify all `--sidebar-*` variables exist (they do)

#### Layout System (Priority 2):
9. `src/components/layout/dashboard-shell.tsx` - Import and use LAYOUT constants
10. `src/components/layout/page-header.tsx` - Use LAYOUT.PAGE_HEADER_MARGIN
11. `src/components/layout/dashboard-layout-client.tsx` - Verify structure
12. `src/app/(dashboard)/layout.tsx` - Main dashboard layout (verify)
13. `src/app/(dashboard)/admin/layout.tsx` - Remove hardcoded padding, use unified sidebar
14. `src/app/(dashboard)/settings/layout.tsx` - Remove hardcoded padding, use unified sidebar
15. `src/app/portal/layout.tsx` - Use LAYOUT constants, unified sidebar

#### Page Updates (Priority 3) - Examples:
16. `src/app/(dashboard)/marketplace/page.tsx`
17. `src/app/(dashboard)/admin/page.tsx`
18. `src/app/(dashboard)/dashboard/dashboard-client.tsx`
19. `src/app/(dashboard)/dashboard/clients/page.tsx`
20. `src/app/(dashboard)/dashboard/sites/page.tsx`
21. **ALL pages** in `src/app/(dashboard)/` (50+ files estimated)

---

## 🎯 ACCEPTANCE CRITERIA

### Must Have:
- [ ] **Single sidebar component** with variant prop (no separate implementations)
- [ ] **ONE hamburger menu** on mobile (not two)
- [ ] **ALL sidebars use sticky positioning** and don't scroll with content
- [ ] **ALL sidebars use `--sidebar-*` CSS variables** (no hardcoded colors)
- [ ] **LAYOUT constants file created** with all spacing values
- [ ] **ALL layouts use LAYOUT constants** (no hardcoded `p-*` classes)
- [ ] **DashboardShell enforced** on all dashboard pages
- [ ] **Zero TypeScript errors** after implementation
- [ ] **Zero console warnings** in browser

### Nice to Have:
- [ ] ESLint rule to prevent hardcoded padding in pages
- [ ] Storybook stories for sidebar variants
- [ ] Visual regression tests for layouts

---

## 🧪 TESTING CHECKLIST

### Visual Testing Routes:

Test each route on Desktop (1920px), Tablet (768px), and Mobile (375px):

#### Main Dashboard:
- [ ] `/dashboard` - Main dashboard with metrics
- [ ] `/dashboard/clients` - Client listing
- [ ] `/dashboard/sites` - Site grid
- [ ] `/marketplace` - Module marketplace
- [ ] `/dashboard/modules/subscriptions` - Module subscriptions

#### Admin Panel:
- [ ] `/admin` - Admin dashboard
- [ ] `/admin/agencies` - Agency list
- [ ] `/admin/users` - User management
- [ ] `/admin/modules` - Module management
- [ ] `/admin/analytics` - Platform analytics

#### Settings:
- [ ] `/settings` - Settings redirect
- [ ] `/settings/profile` - Profile settings
- [ ] `/settings/team` - Team management
- [ ] `/settings/branding` - Branding settings

#### Client Portal:
- [ ] `/portal` - Portal dashboard
- [ ] `/portal/sites` - Portal sites view
- [ ] `/portal/support` - Support tickets

### Behavior Testing:

- [ ] **Sidebar stays fixed** when scrolling page content (all routes)
- [ ] **Only ONE hamburger menu** appears on mobile (all routes)
- [ ] **Mobile sidebar opens/closes** correctly with hamburger button
- [ ] **Sidebar collapse** works on desktop (main dashboard only)
- [ ] **Active nav item** highlights correctly in all variants
- [ ] **Dark mode** sidebar colors work correctly (all variants)
- [ ] **Spacing is identical** on all dashboard pages
- [ ] **Page header margins** are consistent across pages
- [ ] **Card grids** have consistent gaps
- [ ] **Form layouts** have consistent spacing

### Responsive Testing:

- [ ] Mobile (375px): All sidebars open as overlays
- [ ] Tablet (768px): Sidebars appear inline or collapse
- [ ] Desktop (1920px): Sidebars fixed with smooth transitions
- [ ] Ultra-wide (2560px): Content max-width constraint works

### Browser Testing:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if possible)

---

## 🔧 IMPLEMENTATION ORDER

1. **Create Config Files** (30 mins)
   - Create `src/config/layout.ts`
   - Create `src/config/sidebar-variants.ts`

2. **Update Sidebar System** (2-3 hours)
   - Modify `sidebar-modern.tsx` with variant support
   - Add sticky positioning
   - Remove duplicate hamburger menu
   - Update layouts to use unified sidebar
   - Delete legacy `sidebar.tsx`

3. **Update Spacing System** (2-3 hours)
   - Modify `dashboard-shell.tsx` to use LAYOUT constants
   - Update `page-header.tsx`
   - Update main layouts (`admin`, `settings`, `portal`)

4. **Audit and Fix Pages** (3-4 hours)
   - Update marketplace page
   - Update admin pages
   - Update dashboard pages
   - Update all remaining pages

5. **Testing** (1-2 hours)
   - Visual testing on all routes
   - Responsive testing
   - Dark mode testing
   - Fix any issues found

6. **Documentation** (30 mins)
   - Update memory bank
   - Update component documentation
   - Create PR description

---

## 📊 METRICS TO TRACK

Before and after measurements:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Number of sidebar components | 8+ | 1 | 1 |
| Number of hardcoded padding values in pages | 100+ | 0 | 0 |
| TypeScript errors | TBD | 0 | 0 |
| Inconsistent spacing instances | 50+ | 0 | 0 |
| Mobile hamburger buttons | 2 | 1 | 1 |
| Files using DashboardShell | ~20% | 100% | 100% |

---

## 🚀 DEPLOYMENT PLAN

### Pre-Deployment:
1. Run full TypeScript check: `npx tsc --noEmit --skipLibCheck`
2. Run build: `pnpm build`
3. Visual smoke test on dev environment
4. Create comprehensive PR with screenshots

### Deployment:
1. Merge to main branch
2. Deploy to staging
3. Full QA pass on staging
4. Deploy to production
5. Monitor for any issues

### Post-Deployment:
1. Update memory bank files
2. Create follow-up tickets for any edge cases
3. Document the new patterns in team wiki

---

## 📝 MEMORY BANK UPDATES

After completing this phase, update these files:

### `memory-bank/activeContext.md`:
Add section:
```markdown
## Layout System (February 1, 2026)

### Unified Sidebar
- Single sidebar component with variants: main, admin, portal, settings
- All sidebars use --sidebar-* CSS variables
- Sticky positioning: `sticky top-0 h-screen`
- One hamburger menu on mobile (in header)

### Global Spacing Constants
- All spacing in `src/config/layout.ts`
- All pages use DashboardShell for consistent padding
- PAGE_PADDING: p-4 lg:p-6 (global standard)
- SECTION_GAP: space-y-6 (global standard)
- GRID_GAP: gap-4 lg:gap-6 (global standard)

### Usage Pattern
```tsx
import { LAYOUT } from '@/config/layout';
import { DashboardShell } from '@/components/layout';

<DashboardShell>
  <PageHeader title="..." />
  <div className={LAYOUT.SECTION_GAP}>
    {/* content */}
  </div>
</DashboardShell>
```
```

### `memory-bank/systemPatterns.md`:
Add section:
```markdown
## Layout Patterns

### Global Sidebar Pattern
All sidebars use the unified sidebar component with variants:
- `<Sidebar variant="main" />` - Main dashboard
- `<Sidebar variant="admin" />` - Admin panel
- `<Sidebar variant="portal" />` - Client portal
- `<Sidebar variant="settings" />` - Settings pages

### Global Spacing Pattern
All spacing values come from `src/config/layout.ts`:
- Import: `import { LAYOUT } from '@/config/layout';`
- Use: `className={LAYOUT.PAGE_PADDING}`
- Never hardcode spacing values

### Page Structure Pattern
```tsx
import { DashboardShell } from '@/components/layout';
import { LAYOUT } from '@/config/layout';

export default function Page() {
  return (
    <DashboardShell>
      <PageHeader title="..." />
      <div className={LAYOUT.SECTION_GAP}>
        {/* sections */}
      </div>
    </DashboardShell>
  );
}
```
```

### `memory-bank/progress.md`:
Add entry:
```markdown
## 🚀 PHASE-UI-GLOBAL-01: Sidebar & Spacing Standardization (February 1, 2026)

**Status**: ✅ COMPLETE
**TypeScript**: ✅ Zero errors
**Build**: ✅ Compiles successfully

### What Was Fixed
1. **Unified Sidebar System**: Consolidated 8+ sidebar implementations into 1 component with variants
2. **Fixed Sticky Positioning**: All sidebars now use `sticky top-0 h-screen`
3. **Removed Double Hamburger**: Only one mobile menu button (in header)
4. **Global Sidebar Colors**: All sidebars use --sidebar-* CSS variables
5. **Global Spacing System**: Created LAYOUT constants in `src/config/layout.ts`
6. **Enforced DashboardShell**: All pages now use consistent padding
7. **Removed Hardcoded Values**: Replaced 100+ hardcoded spacing values with constants

### Files Created
- `src/config/layout.ts` (350+ lines)
- `src/config/sidebar-variants.ts` (150+ lines)

### Files Modified
- 60+ layout and page files updated
- All sidebars consolidated
- All spacing standardized

### Benefits
- One-line changes update entire platform
- Perfect visual consistency
- Easy to maintain and theme
```

---

## 💡 TIPS FOR AI IMPLEMENTATION

### Start with Config Files:
Create `layout.ts` and `sidebar-variants.ts` first. This gives you the constants to reference throughout the rest of the work.

### Work in Phases:
Don't try to fix everything at once. Follow the implementation order:
1. Config files
2. Sidebar unification
3. Layout updates
4. Page audits

### Use Multi-Replace:
When updating multiple files with similar changes, use `multi_replace_string_in_file` for efficiency.

### Test Incrementally:
After each major change (sidebar fix, spacing fix), run TypeScript check and test visually.

### Don't Break Existing Functionality:
When updating sidebars, ensure navigation still works, mobile menus still open, and all links are preserved.

### Watch for Edge Cases:
- Editor pages that need full width (no padding)
- Module pages with custom layouts
- Portal pages with specific header structure

---

## 🎨 VISUAL REFERENCE

### Current Issues:
```
┌─────────────┬───────────────────────────────┐
│  Sidebar    │ Main Content                  │
│  (scrolls)  │ - Different padding on each   │
│             │   page (p-4, p-6, p-8)        │
│             │ - Inconsistent spacing        │
│             │ - Double hamburger on mobile  │
└─────────────┴───────────────────────────────┘
```

### After Fix:
```
┌─────────────┬───────────────────────────────┐
│  Sidebar    │ Main Content                  │
│  (sticky!)  │ - Global padding (p-4 lg:p-6) │
│  (fixed)    │ - Consistent spacing          │
│             │ - ONE hamburger menu          │
│             │ - All colors from CSS vars    │
└─────────────┴───────────────────────────────┘
```

---

## ✅ FINAL CHECKLIST

Before considering this phase complete:

- [ ] All sidebar implementations consolidated into one
- [ ] Sidebar has sticky positioning on all routes
- [ ] Only one hamburger menu on mobile
- [ ] All sidebar colors use CSS variables
- [ ] LAYOUT constants file created
- [ ] DashboardShell uses LAYOUT constants
- [ ] All layouts updated to use constants
- [ ] All pages audited and updated
- [ ] TypeScript: Zero errors
- [ ] Build: Successful
- [ ] Visual testing: Passed on all routes
- [ ] Responsive testing: Passed on all breakpoints
- [ ] Dark mode: Works correctly
- [ ] Memory bank: Updated
- [ ] PR created with screenshots
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] QA passed
- [ ] Deployed to production

---

**End of Phase Specification**

This comprehensive spec should give your AI agent everything needed to implement the sidebar and spacing fixes globally across the DRAMAC CMS platform. The result will be a perfectly consistent, maintainable, and themeable layout system where one change updates the entire platform.
