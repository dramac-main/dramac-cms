# PHASE-EH-05: Dialogs & Warnings

## Overview
- **Objective**: Implement unsaved changes warnings, session timeout, and enhanced dialog patterns
- **Scope**: useUnsavedChanges hook, session timeout handling, enhanced confirmations
- **Dependencies**: PHASE-EH-01, EH-02, EH-03, EH-04 complete
- **Estimated Effort**: ~4 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified
- [x] No conflicts detected

## Current State Analysis

### Already Implemented
1. **ConfirmDialog** (`src/components/feedback/confirm-dialog.tsx`):
   - Standard confirmation dialog
   - DeleteDialog preset
   - AlertBanner component
   - Multiple variants (default, warning, destructive)

### Missing
1. **useUnsavedChanges hook** - Browser navigation warning
2. **Session timeout warning** - Auto-logout warning
3. **Destructive action confirmations** - Type-to-confirm pattern
4. **Batch action confirmations** - Multiple items warning

## Implementation Steps

### Step 1: Create useUnsavedChanges Hook

**File**: `src/hooks/use-unsaved-changes.ts`
**Action**: Create

Browser navigation warning hook with beforeunload support.

### Step 2: Create Session Timeout Handler

**File**: `src/components/feedback/session-timeout.tsx`
**Action**: Create

Session timeout warning dialog with auto-logout countdown.

### Step 3: Create Destructive Confirmation Dialog

**File**: `src/components/feedback/destructive-confirm.tsx`
**Action**: Create

Enhanced destructive confirmation with type-to-confirm pattern.

### Step 4: Update Barrel Exports

**Files**: 
- `src/hooks/index.ts`
- `src/components/feedback/index.ts`

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| hooks/use-unsaved-changes.ts | Create | Browser navigation warning |
| feedback/session-timeout.tsx | Create | Session timeout handling |
| feedback/destructive-confirm.tsx | Create | Type-to-confirm dialogs |
| hooks/index.ts | Modify | Export new hooks |
| feedback/index.ts | Modify | Export new components |

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Test unsaved changes with form edits
4. Test session timeout countdown

## Rollback Plan
1. Delete new files
2. Revert barrel export changes
