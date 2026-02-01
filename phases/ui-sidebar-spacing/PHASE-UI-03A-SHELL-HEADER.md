# PHASE-UI-03A: Update Dashboard Shell and Page Header Components

**Phase ID**: PHASE-UI-03A  
**Priority**: HIGH  
**Estimated Time**: 45 minutes  
**Dependencies**: PHASE-UI-01A (config files with LAYOUT constants)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Update the DashboardShell and PageHeader components to use centralized LAYOUT constants, ensuring consistent padding and spacing across all pages that use these components.

---

## 📋 TASKS

### Task 1: Update DashboardShell Component

**File**: `src/components/layout/dashboard-shell.tsx`

**Action**: Update to use LAYOUT constants from config.

**COMPLETE REPLACEMENT CODE**:

```tsx
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/config/layout';

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Optional override for padding. 
   * Set to false to disable padding (useful when content has its own padding)
   */
  noPadding?: boolean;
  /**
   * Optional override for max width.
   * Set to false to disable max-width constraint
   */
  noMaxWidth?: boolean;
  /**
   * Header content (typically PageHeader component)
   */
  header?: React.ReactNode;
  /**
   * Optional description shown below content
   */
  footer?: React.ReactNode;
}

/**
 * DashboardShell - Consistent wrapper for dashboard page content
 * 
 * Provides:
 * - Consistent responsive padding
 * - Optional max-width constraint
 * - Header/content/footer structure
 * - Gap spacing between sections
 */
export function DashboardShell({
  children,
  noPadding = false,
  noMaxWidth = false,
  header,
  footer,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        // Base styles
        'flex flex-col min-h-full',
        // Responsive padding using CSS custom properties
        !noPadding && [
          'p-4 md:p-6 lg:p-8',
          // Alternative: using explicit values from LAYOUT
          // `p-[${LAYOUT.PAGE_PADDING.MOBILE}px]`,
          // `md:p-[${LAYOUT.PAGE_PADDING.TABLET}px]`,
          // `lg:p-[${LAYOUT.PAGE_PADDING.DESKTOP}px]`,
        ],
        // Max width constraint (keeps content readable on wide screens)
        !noMaxWidth && 'max-w-7xl mx-auto w-full',
        className
      )}
      {...props}
    >
      {/* Header Section */}
      {header && (
        <div className="pb-4 md:pb-6">
          {header}
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Footer Section */}
      {footer && (
        <div className="pt-4 md:pt-6 mt-auto">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * DashboardContent - Inner content wrapper for semantic structure
 * Use inside DashboardShell when you need additional content grouping
 */
export function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('space-y-4 md:space-y-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DashboardSection - For grouping related content with spacing
 */
export function DashboardSection({
  children,
  title,
  description,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn('space-y-4', className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export default DashboardShell;
```

---

### Task 2: Update PageHeader Component

**File**: `src/components/layout/page-header.tsx`

**Action**: Update to use consistent spacing and remove hardcoded values.

**COMPLETE REPLACEMENT CODE**:

```tsx
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface PageHeaderProps {
  /**
   * Page title (required)
   */
  title: string;
  /**
   * Optional description below title
   */
  description?: string;
  /**
   * Optional breadcrumb component
   */
  breadcrumb?: React.ReactNode;
  /**
   * Actions area (buttons, dropdowns, etc.)
   */
  actions?: React.ReactNode;
  /**
   * Badge or status indicator next to title
   */
  badge?: React.ReactNode;
  /**
   * Show separator below header
   */
  separator?: boolean;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * PageHeader - Consistent page header with title, description, and actions
 * 
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   description="Overview of your workspace"
 *   actions={<Button>New Item</Button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  badge,
  separator = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="mb-2">
          {breadcrumb}
        </div>
      )}
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Section */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {description}
            </p>
          )}
        </div>
        
        {/* Actions Section */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {/* Optional Separator */}
      {separator && <Separator />}
    </div>
  );
}

/**
 * PageHeaderSkeleton - Loading state for PageHeader
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
```

---

### Task 3: Update Layout Exports

**File**: `src/components/layout/index.ts`

**Action**: Ensure all layout components are properly exported.

**UPDATE OR CREATE** this index file:

```tsx
// Core Layout Components
export { DashboardLayoutClient } from './dashboard-layout-client';
export { Sidebar } from './sidebar-modern';
export { SidebarProvider, useSidebar } from './sidebar-context';

// Dashboard Shell & Content
export { 
  DashboardShell, 
  DashboardContent, 
  DashboardSection 
} from './dashboard-shell';

// Page Header
export { PageHeader, PageHeaderSkeleton } from './page-header';

// Header
export { HeaderModern } from './header-modern';

// Other Layout Components (if they exist)
export * from './footer';
export * from './breadcrumbs';
```

---

### Task 4: Create CSS Custom Properties for Spacing (Optional Enhancement)

**File**: `src/app/globals.css`

**Action**: Add CSS custom properties for layout spacing (optional but recommended).

**ADD to globals.css** (in the `:root` and `.dark` sections):

```css
:root {
  /* ... existing variables ... */
  
  /* Layout Spacing */
  --page-padding-mobile: 16px;
  --page-padding-tablet: 24px;
  --page-padding-desktop: 32px;
  --section-gap: 24px;
  --content-max-width: 1280px;
}

.dark {
  /* ... existing dark variables ... */
  
  /* Layout Spacing (same in dark mode) */
  --page-padding-mobile: 16px;
  --page-padding-tablet: 24px;
  --page-padding-desktop: 32px;
  --section-gap: 24px;
  --content-max-width: 1280px;
}
```

Then the DashboardShell can use these:

```tsx
className={cn(
  'p-[var(--page-padding-mobile)]',
  'md:p-[var(--page-padding-tablet)]',
  'lg:p-[var(--page-padding-desktop)]',
)}
```

---

### Task 5: Update Components Using Old PageHeader Pattern

Search for files that import PageHeader and ensure they're using it correctly.

**Search command**:
```bash
grep -r "import.*PageHeader" src/
```

**Common issues to fix**:
1. Hardcoded `pb-6` or `mb-6` around PageHeader
2. Wrapper divs with extra padding
3. Missing description prop when it should exist

**Example fix**:

```tsx
// Before (BAD)
<div className="pb-6 mb-4">
  <PageHeader title="Dashboard" />
</div>

// After (GOOD)
<PageHeader title="Dashboard" />
```

The PageHeader component now handles its own spacing internally.

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
git commit -m "feat(ui): update DashboardShell and PageHeader with consistent spacing (PHASE-UI-03A)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/dashboard-shell.tsx` | Replace | Add LAYOUT constants, consistent padding |
| `src/components/layout/page-header.tsx` | Replace | Remove hardcoded spacing, improve structure |
| `src/components/layout/index.ts` | Update | Export all layout components |
| `src/app/globals.css` | Update | Add CSS custom properties (optional) |

---

## 🎯 SUCCESS CRITERIA

- [ ] DashboardShell uses responsive padding (p-4 md:p-6 lg:p-8)
- [ ] DashboardShell exports DashboardContent and DashboardSection helpers
- [ ] PageHeader has proper responsive structure
- [ ] PageHeader supports breadcrumb, badge, and separator props
- [ ] PageHeaderSkeleton exists for loading states
- [ ] All components properly exported from index.ts
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-03B: Update Main Dashboard Layout**

---

**End of Phase UI-03A**
