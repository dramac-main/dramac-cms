# PHASE-UI-11A: Social Media Dashboard UI Overhaul

## Overview
- **Objective**: Transform the Social Media Dashboard into an enterprise-grade analytics experience comparable to Hootsuite/Sprout Social
- **Scope**: Enhanced dashboard components, visual analytics, better metrics display, improved onboarding
- **Dependencies**: PHASE-UI-05A/05B (Dashboard components, Charts), PHASE-UI-06 (Feedback components)
- **Estimated Effort**: ~6 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (chart components, feedback components exist)
- [x] No conflicts detected

## What Will Be Built

### 1. Enhanced Social Analytics Components
- **SocialMetricCard** - Specialized metric cards for social metrics with platform-aware styling
- **SocialEngagementChart** - Area chart showing engagement trends over time
- **PlatformBreakdown** - Donut chart showing performance by platform
- **TopPostsWidget** - Enhanced top performing posts display
- **AudienceGrowthChart** - Line chart showing follower growth

### 2. Improved Dashboard Layout
- Widget-based responsive grid system
- Quick action cards with animations
- Better visual hierarchy and spacing
- Platform-specific color coding

### 3. Enhanced Onboarding Experience
- Improved empty state with step-by-step guidance
- Platform connection cards with OAuth indicators
- Progress tracking for setup completion

## Implementation Steps

### Step 1: Create Social-Specific Metric Card Component
**File**: `src/modules/social-media/components/ui/social-metric-card.tsx`
**Action**: Create

### Step 2: Create Social Engagement Chart Component
**File**: `src/modules/social-media/components/ui/social-engagement-chart.tsx`
**Action**: Create

### Step 3: Create Platform Breakdown Chart
**File**: `src/modules/social-media/components/ui/platform-breakdown.tsx`
**Action**: Create

### Step 4: Create Top Posts Widget
**File**: `src/modules/social-media/components/ui/top-posts-widget.tsx`
**Action**: Create

### Step 5: Create Audience Growth Chart
**File**: `src/modules/social-media/components/ui/audience-growth-chart.tsx`
**Action**: Create

### Step 6: Create Quick Actions Widget
**File**: `src/modules/social-media/components/ui/social-quick-actions.tsx`
**Action**: Create

### Step 7: Create Enhanced UI Components Index
**File**: `src/modules/social-media/components/ui/index.ts`
**Action**: Create

### Step 8: Update SocialDashboard Component
**File**: `src/modules/social-media/components/SocialDashboard.tsx`
**Action**: Modify - Integrate new components

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing:
   - Navigate to Social Media Dashboard
   - Verify new components render correctly
   - Test with and without connected accounts
   - Verify responsive behavior

## Rollback Plan
If issues arise:
1. Revert files: SocialDashboard.tsx, new ui/ folder components
2. No migrations needed
3. Clear .next cache: `rm -rf .next`

## Files Changed Summary
| File | Action | Purpose |
|------|--------|---------|
| src/modules/social-media/components/ui/social-metric-card.tsx | Create | Social-specific metric cards |
| src/modules/social-media/components/ui/social-engagement-chart.tsx | Create | Engagement trends chart |
| src/modules/social-media/components/ui/platform-breakdown.tsx | Create | Platform performance donut |
| src/modules/social-media/components/ui/top-posts-widget.tsx | Create | Top posts display |
| src/modules/social-media/components/ui/audience-growth-chart.tsx | Create | Follower growth chart |
| src/modules/social-media/components/ui/social-quick-actions.tsx | Create | Quick action cards |
| src/modules/social-media/components/ui/index.ts | Create | Barrel exports |
| src/modules/social-media/components/SocialDashboard.tsx | Modify | Integrate new components |
