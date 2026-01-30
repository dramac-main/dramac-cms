# PHASE-UI-02A: Layout System Modernization

## Overview
- **Objective**: Modernize the dashboard layout system for enterprise-grade UX
- **Scope**: Sidebar, header, breadcrumbs, main content area
- **Dependencies**: PHASE-UI-01 (Design System Audit) ✅ Complete
- **Estimated Effort**: ~6 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Server→Client wrapper, module access control)
- [x] No conflicts detected with existing functionality

## Before vs After UX

| Aspect | Current | Proposed |
|--------|---------|----------|
| Sidebar | Basic collapse, simple icons | Smooth animations, icon tooltips, better group separation |
| Header | Basic user menu | Breadcrumbs, search, improved user dropdown |
| Layout | Fixed sidebar width | Resizable sidebar with persist state |
| Transitions | Minimal | Smooth Framer Motion animations |
| Mobile | Sheet-based | Improved mobile drawer with gestures |
| Breadcrumbs | None | Full navigation breadcrumbs |

## Components to Create/Refactor

| Component | Location | Change Type |
|-----------|----------|-------------|
| Sidebar | `src/components/layout/sidebar.tsx` | Major Enhancement |
| Header | `src/components/layout/header.tsx` | Enhancement |
| Breadcrumbs | `src/components/layout/breadcrumbs.tsx` | New |
| DashboardShell | `src/components/layout/dashboard-shell.tsx` | New |
| SidebarContext | `src/components/layout/sidebar-context.tsx` | New |

## Implementation Steps

### Step 1: Create Sidebar Context for State Management
**File**: `src/components/layout/sidebar-context.tsx`
**Action**: Create
**Purpose**: Centralized sidebar state management with localStorage persistence

### Step 2: Create Breadcrumbs Component
**File**: `src/components/layout/breadcrumbs.tsx`
**Action**: Create
**Purpose**: Dynamic navigation breadcrumbs based on current route

### Step 3: Modernize Sidebar Component
**File**: `src/components/layout/sidebar.tsx`
**Action**: Major Enhancement
**Changes**:
- Add Framer Motion animations
- Improve collapsed state tooltips
- Better visual hierarchy for nav groups
- Add keyboard navigation support
- Improve mobile experience

### Step 4: Enhance Header Component
**File**: `src/components/layout/header.tsx`
**Action**: Enhancement
**Changes**:
- Add breadcrumbs integration
- Add global search trigger
- Improve user dropdown
- Add quick actions

### Step 5: Create Dashboard Shell Wrapper
**File**: `src/components/layout/dashboard-shell.tsx`
**Action**: Create
**Purpose**: Consistent page wrapper for all dashboard pages

### Step 6: Update Dashboard Layout
**File**: `src/app/(dashboard)/layout.tsx`
**Action**: Enhancement
**Changes**:
- Integrate SidebarContext
- Use new components
- Improve responsive behavior

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing:
   - Sidebar collapse/expand smooth animation
   - Breadcrumbs update on navigation
   - Mobile sidebar works correctly
   - Dark mode renders correctly
   - All navigation links work

## Rollback Plan
If issues arise:
1. Revert files: sidebar.tsx, header.tsx, layout.tsx
2. Remove new files: breadcrumbs.tsx, sidebar-context.tsx, dashboard-shell.tsx
3. Test: Verify original functionality restored

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/layout/sidebar-context.tsx` | Create | State management |
| `src/components/layout/breadcrumbs.tsx` | Create | Navigation breadcrumbs |
| `src/components/layout/dashboard-shell.tsx` | Create | Page wrapper |
| `src/components/layout/sidebar.tsx` | Enhance | Modern sidebar |
| `src/components/layout/header.tsx` | Enhance | Modern header |
| `src/components/layout/index.ts` | Create | Barrel exports |
| `src/app/(dashboard)/layout.tsx` | Modify | Integrate new components |
