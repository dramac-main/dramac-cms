# PHASE-ED-03C: New Components - E-Commerce (Advanced)

## Overview

- **Objective**: Add advanced e-commerce Puck editor components beyond the basic ones in ED-04
- **Scope**: ProductShowcase, ProductTabs, ProductReviews, ShippingCalculator, SizeGuide, WishlistButton, RecentlyViewed, RelatedProducts, ProductBundle, StockIndicator
- **Dependencies**: PHASE-ED-03A/03B completed
- **Estimated Effort**: ~8 hours

## Pre-Implementation Checklist

- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Puck component structure)
- [x] No conflicts detected

## Implementation Steps

### Step 1: Create Advanced E-Commerce Components File

**File**: `src/components/editor/puck/components/ecommerce-advanced.tsx`
**Action**: Create

This file will contain all advanced e-commerce component render functions.

### Step 2: Add Type Definitions

**File**: `src/types/puck.ts`
**Action**: Modify

Add type definitions for all new advanced e-commerce components.

### Step 3: Update Component Exports

**File**: `src/components/editor/puck/components/index.ts`
**Action**: Modify

Export all new advanced e-commerce components.

### Step 4: Register Components in Puck Config

**File**: `src/components/editor/puck/puck-config.tsx`
**Action**: Modify

Add component definitions with fields to the Puck configuration.

## New Components (10 total)

| Component | Description |
|-----------|-------------|
| ProductShowcase | Large product hero with multiple images |
| ProductTabs | Tab-based product info (description, specs, reviews) |
| ProductReviews | Customer reviews section with ratings |
| ShippingCalculator | Shipping cost estimator |
| SizeGuide | Size chart/guide modal |
| WishlistButton | Add to wishlist button |
| RecentlyViewed | Recently viewed products carousel |
| RelatedProducts | Related/recommended products grid |
| ProductBundle | Bundle deal display |
| StockIndicator | Stock availability indicator |

## Verification Steps

1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual: Open editor, verify all components appear in "E-Commerce Advanced" category
4. Manual: Drag each component to canvas, verify rendering

## Rollback Plan

If issues arise:
1. Delete `src/components/editor/puck/components/ecommerce-advanced.tsx`
2. Revert changes to `index.ts`, `puck-config.tsx`, `puck.ts`
3. Run `pnpm build` to verify clean state

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| src/components/editor/puck/components/ecommerce-advanced.tsx | Created | Advanced e-commerce component renders |
| src/components/editor/puck/components/index.ts | Modified | Export new components |
| src/components/editor/puck/puck-config.tsx | Modified | Register components |
| src/types/puck.ts | Modified | Type definitions |
