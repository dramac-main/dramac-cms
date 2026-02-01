# PHASE-EH-04: Loading & Empty States

## Overview
- **Objective**: Enhance loading states and empty states for enterprise-grade UX
- **Scope**: Add page loading wrapper, enhanced skeleton utilities, contextual empty states
- **Dependencies**: PHASE-EH-01, EH-02, EH-03 complete
- **Estimated Effort**: ~4 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified
- [x] No conflicts detected

## Current State Analysis

### Already Implemented
1. **Skeleton components** (`src/components/ui/skeleton.tsx`):
   - `Skeleton` - Base skeleton with shape variants
   - `SkeletonText` - Text line placeholders
   - `SkeletonAvatar` - Avatar placeholder
   - `SkeletonCard` - Card placeholder
   - `SkeletonTable` - Table placeholder
   - `SkeletonStats` - Stats grid placeholder
   - `SkeletonList` - List item placeholders

2. **LoadingButton** (`src/components/ui/loading-button.tsx`):
   - Loading state with spinner
   - Configurable spinner position
   - Loading text support

3. **PageLoader** (`src/components/feedback/page-loader.tsx`):
   - Full-page loader with progress
   - ContentLoader with variants

4. **EmptyState** (exists in both locations):
   - `src/components/ui/empty-state.tsx`
   - `src/components/feedback/empty-state.tsx`

## Implementation Steps

### Step 1: Create Page Loading Wrapper

**File**: `src/components/feedback/loading-wrapper.tsx`
**Action**: Create

This component wraps async data fetching with automatic loading and error states.

### Step 2: Create Loading Context Provider

**File**: `src/components/providers/loading-provider.tsx`
**Action**: Create

Centralized loading state management for coordinating multiple loading states.

### Step 3: Create Enhanced Empty State Presets

**File**: `src/components/feedback/empty-state-presets.tsx`
**Action**: Create

Pre-configured empty states for common scenarios.

### Step 4: Create Skeleton Composer

**File**: `src/components/ui/skeleton-composer.tsx`
**Action**: Create

Dynamic skeleton composition based on layout config.

### Step 5: Update Barrel Exports

**Files**: 
- `src/components/feedback/index.ts`
- `src/components/providers/index.ts`

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| feedback/loading-wrapper.tsx | Create | Async data loading wrapper |
| providers/loading-provider.tsx | Create | Centralized loading state |
| feedback/empty-state-presets.tsx | Create | Pre-configured empty states |
| ui/skeleton-composer.tsx | Create | Dynamic skeleton composition |
| feedback/index.ts | Modify | Export new components |
| providers/index.ts | Modify | Export new provider |

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Test loading wrapper with async data
4. Test empty state presets render correctly

## Rollback Plan
1. Delete new files
2. Revert barrel export changes
