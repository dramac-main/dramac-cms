# PHASE-UI-04C: Component Polish - Forms & Inputs

## Overview
- **Objective**: Enhance form components with icons, validation states, counters, and organization helpers
- **Scope**: Input with icons, search input, textarea with counter, form sections, field groups
- **Dependencies**: PHASE-UI-04A (Core UI), PHASE-UI-04B (Dashboard)
- **Estimated Effort**: ~4 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (React Hook Form integration)
- [x] No conflicts detected

## Implementation Steps

### Step 1: Create InputWithIcon Component
**File**: `src/components/ui/input-with-icon.tsx`
**Action**: Create
**Changes**:
- Extends base Input component
- Left and right icon slots
- Loading state with spinner
- Clear button option
- Size variants

### Step 2: Create SearchInput Component
**File**: `src/components/ui/search-input.tsx`
**Action**: Create
**Changes**:
- Specialized search field
- Debounced onChange
- Loading indicator
- Clear button
- Keyboard shortcut display

### Step 3: Create TextareaWithCounter Component
**File**: `src/components/ui/textarea-with-counter.tsx`
**Action**: Create
**Changes**:
- Character/word counter
- Max length warning
- Auto-resize option
- Markdown preview toggle

### Step 4: Create FormSection Component
**File**: `src/components/ui/form-section.tsx`
**Action**: Create
**Changes**:
- Section title and description
- Divider between sections
- Collapsible sections
- Icon support

### Step 5: Create FormFieldGroup Component
**File**: `src/components/ui/form-field-group.tsx`
**Action**: Create
**Changes**:
- Group related fields
- Inline layout option
- Shared error state
- Label for group

### Step 6: Create PasswordInput Component
**File**: `src/components/ui/password-input.tsx`
**Action**: Create
**Changes**:
- Show/hide toggle
- Strength indicator
- Requirements checklist

### Step 7: Create DateInput Component
**File**: `src/components/ui/date-input.tsx`
**Action**: Create
**Changes**:
- Calendar picker integration
- Manual input support
- Range selection option

### Step 8: Update UI Index
**File**: `src/components/ui/index.ts`
**Action**: Modify
**Changes**:
- Export new form components

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing: Check all input variants, validation states
4. Expected: All form components render and function correctly

## Rollback Plan
If issues arise:
1. Revert new files
2. Components are additive, no breaking changes

## Files Changed Summary
| File | Action | Purpose |
|------|--------|---------|
| src/components/ui/input-with-icon.tsx | Created | Icon support for inputs |
| src/components/ui/search-input.tsx | Created | Search field component |
| src/components/ui/textarea-with-counter.tsx | Created | Counter for textareas |
| src/components/ui/form-section.tsx | Created | Form section wrapper |
| src/components/ui/form-field-group.tsx | Created | Group related fields |
| src/components/ui/password-input.tsx | Created | Password with strength |
| src/components/ui/date-input.tsx | Created | Date picker input |
| src/components/ui/index.ts | Modified | Export new components |
