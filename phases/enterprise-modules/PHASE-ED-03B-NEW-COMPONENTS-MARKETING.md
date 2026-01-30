# PHASE-ED-03B: New Components - Marketing

## Overview

- **Objective**: Add new marketing-focused Puck editor components for lead generation and conversions
- **Scope**: Announcement Bar, Social Proof, Trust Badges, Logo Cloud, Comparison Table, Feature Comparison, Before/After, Testimonial Wall, Value Proposition, Lead Capture
- **Dependencies**: PHASE-ED-03A completed
- **Estimated Effort**: ~8 hours

## Pre-Implementation Checklist

- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Puck component structure)
- [x] No conflicts detected

## Implementation Steps

### Step 1: Create Marketing Components File

**File**: `src/components/editor/puck/components/marketing.tsx`
**Action**: Create

This file will contain all marketing component render functions.

### Step 2: Add Type Definitions

**File**: `src/types/puck.ts`
**Action**: Modify

Add type definitions for all new marketing components.

### Step 3: Update Component Exports

**File**: `src/components/editor/puck/components/index.ts`
**Action**: Modify

Export all new marketing components.

### Step 4: Register Components in Puck Config

**File**: `src/components/editor/puck/puck-config.tsx`
**Action**: Modify

Add component definitions with fields to the Puck configuration.

## New Components (10 total)

| Component | Description |
|-----------|-------------|
| AnnouncementBar | Top-of-page promotional banner with dismiss |
| SocialProof | "X customers" or real-time activity feed |
| TrustBadges | Security/payment/certification badges |
| LogoCloud | Partner/client logo showcase |
| ComparisonTable | Feature comparison between plans/products |
| FeatureComparison | Side-by-side feature comparison |
| BeforeAfter | Before/after image slider comparison |
| TestimonialWall | Masonry layout of testimonials |
| ValueProposition | Highlight key benefits with icons |
| LeadCapture | Email capture with incentive |

## Verification Steps

1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual: Open editor, verify all components appear in "Marketing" category
4. Manual: Drag each component to canvas, verify rendering

## Rollback Plan

If issues arise:
1. Delete `src/components/editor/puck/components/marketing.tsx`
2. Revert changes to `index.ts`, `puck-config.tsx`, `puck.ts`
3. Run `pnpm build` to verify clean state

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| src/components/editor/puck/components/marketing.tsx | Created | Marketing component renders |
| src/components/editor/puck/components/index.ts | Modified | Export new components |
| src/components/editor/puck/puck-config.tsx | Modified | Register components |
| src/types/puck.ts | Modified | Type definitions |
