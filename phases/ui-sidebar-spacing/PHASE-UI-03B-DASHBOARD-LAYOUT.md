# PHASE-UI-03B: Update Main Dashboard Layout

**Phase ID**: PHASE-UI-03B  
**Priority**: HIGH  
**Estimated Time**: 30 minutes  
**Dependencies**: PHASE-UI-01B (unified sidebar), PHASE-UI-03A (updated shell)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Update the main dashboard layout client to ensure proper structure, sticky sidebar, and consistent spacing. This is the core layout that wraps most dashboard pages.

---

## 📋 TASKS

### Task 1: Update Dashboard Layout Client

**File**: `src/components/layout/dashboard-layout-client.tsx`

**Action**: Review and update for proper structure.

**EXPECTED STRUCTURE**:

```tsx
'use client';

import { SidebarProvider, useSidebar } from './sidebar-context';
import { Sidebar } from './sidebar-modern';
import { HeaderModern } from './header-modern';
import { cn } from '@/lib/utils';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  /**
   * Optional custom sidebar to render instead of default
   */
  sidebar?: React.ReactNode;
  /**
   * Optional custom header to render instead of default
   */
  header?: React.ReactNode;
  /**
   * Show/hide header
   */
  showHeader?: boolean;
  /**
   * Show/hide sidebar
   */
  showSidebar?: boolean;
}

function DashboardLayoutInner({
  children,
  sidebar,
  header,
  showHeader = true,
  showSidebar = true,
}: DashboardLayoutClientProps) {
  const { isCollapsed, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed at top */}
      {showHeader && (
        <div className="sticky top-0 z-30">
          {header || <HeaderModern />}
        </div>
      )}
      
      {/* Main Layout: Sidebar + Content */}
      <div className="flex">
        {/* Sidebar - Sticky, scrollable independently */}
        {showSidebar && (
          <aside
            className={cn(
              // Sticky positioning - sidebar stays in view
              'sticky top-0 h-screen',
              // Hide on mobile (handled by overlay)
              'hidden lg:block',
              // Width based on collapse state
              isCollapsed ? 'w-16' : 'w-64',
              // Transition
              'transition-all duration-300',
              // Border
              'border-r border-sidebar-border',
              // Background
              'bg-sidebar'
            )}
          >
            {/* Scrollable sidebar content */}
            <div className="h-full overflow-y-auto">
              {sidebar || <Sidebar variant="default" />}
            </div>
          </aside>
        )}
        
        {/* Main Content Area */}
        <main
          className={cn(
            'flex-1',
            'min-h-[calc(100vh-var(--header-height,64px))]',
            'overflow-y-auto'
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay - Rendered by Sidebar component when isMobileOpen */}
    </div>
  );
}

export function DashboardLayoutClient(props: DashboardLayoutClientProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner {...props} />
    </SidebarProvider>
  );
}

export default DashboardLayoutClient;
```

---

### Task 2: Verify Sidebar Context

**File**: `src/components/layout/sidebar-context.tsx`

**Action**: Verify the sidebar context provides all necessary values.

**REQUIRED CONTEXT VALUES**:

```tsx
interface SidebarContextType {
  // Collapse state (desktop)
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapse: () => void;
  
  // Mobile open state
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}
```

If the context is missing any of these, add them.

---

### Task 3: Update Dashboard Root Layout

**File**: `src/app/(dashboard)/layout.tsx`

**Action**: Ensure it uses DashboardLayoutClient properly.

**EXPECTED STRUCTURE**:

```tsx
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutClient>
      {children}
    </DashboardLayoutClient>
  );
}
```

**If there's authentication or other providers**, they should wrap DashboardLayoutClient:

```tsx
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';
import { AuthProvider } from '@/components/providers/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </AuthProvider>
  );
}
```

---

### Task 4: Add CSS Variable for Header Height

**File**: `src/app/globals.css`

**Action**: Add header height variable if not present.

```css
:root {
  /* ... existing variables ... */
  --header-height: 64px;
}

.dark {
  /* ... existing dark variables ... */
  --header-height: 64px;
}
```

This allows the main content to calculate its min-height correctly.

---

### Task 5: Remove Duplicate Mobile Hamburger (if present)

Check `dashboard-layout-client.tsx` for any standalone hamburger button and REMOVE it:

**LOOK FOR AND REMOVE**:

```tsx
{/* Mobile Menu Button - REMOVE THIS */}
<Button 
  variant="ghost" 
  size="icon"
  className="lg:hidden fixed top-4 left-4 z-50"
  onClick={() => setMobileOpen(true)}
>
  <Menu className="h-5 w-5" />
</Button>
```

The hamburger button should ONLY be in the header component.

---

### Task 6: Verify Header Has Mobile Menu Button

**File**: `src/components/layout/header-modern.tsx`

**Action**: Ensure header has the mobile menu trigger.

**EXPECTED CODE** (somewhere in the header):

```tsx
import { useSidebar } from './sidebar-context';

export function HeaderModern() {
  const { setMobileOpen } = useSidebar();
  
  return (
    <header className="...">
      {/* Mobile menu button - triggers sidebar overlay */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-10 w-10 touch-manipulation"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* ... rest of header ... */}
    </header>
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
git commit -m "feat(layout): update main dashboard layout structure (PHASE-UI-03B)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/dashboard-layout-client.tsx` | Update | Proper structure with sticky sidebar |
| `src/components/layout/sidebar-context.tsx` | Verify/Update | Ensure all context values present |
| `src/app/(dashboard)/layout.tsx` | Verify | Uses DashboardLayoutClient |
| `src/app/globals.css` | Update | Add --header-height variable |
| `src/components/layout/header-modern.tsx` | Verify | Has mobile menu button |

---

## 🎯 SUCCESS CRITERIA

- [ ] DashboardLayoutClient has proper structure
- [ ] Sidebar is sticky (sticky top-0 h-screen)
- [ ] Sidebar hidden on mobile via CSS (hidden lg:block)
- [ ] Mobile sidebar triggered via header button
- [ ] Only ONE hamburger menu exists (in header)
- [ ] Header height variable exists (--header-height)
- [ ] Main content calculates min-height correctly
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-04A: Audit and Fix Dashboard Pages (Part 1)**

---

**End of Phase UI-03B**
