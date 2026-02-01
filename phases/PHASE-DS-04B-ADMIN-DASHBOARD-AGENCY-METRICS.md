# PHASE-DS-04B: Admin Dashboard - Agency Metrics

## Overview
- **Objective**: Build comprehensive agency analytics dashboard with leaderboards, growth metrics, segmentation, and health scoring
- **Scope**: Agency-level statistics, leaderboards, growth trends, segmentation analysis, and risk indicators
- **Dependencies**: PHASE-DS-04A (Platform Overview), types and actions already created
- **Estimated Effort**: ~6 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Types defined in admin-analytics.ts
- [x] Server actions defined in admin-analytics.ts
- [x] Patterns verified (widget system, server actions)
- [x] No conflicts detected

## Implementation Steps

### Step 1: Agency Leaderboard Component
**File**: `src/components/admin/agency-leaderboard.tsx`
**Action**: Create

Displays top agencies by various metrics:
- Top by Revenue
- Top by Sites
- Top by Engagement
- At Risk agencies
- Newly Onboarded

### Step 2: Agency Growth Chart
**File**: `src/components/admin/agency-growth.tsx`
**Action**: Create

Charts showing:
- New vs Churned agencies over time
- Net growth trends
- Conversion rate trends
- LTV trends

### Step 3: Agency Segmentation Component
**File**: `src/components/admin/agency-segmentation.tsx`
**Action**: Create

Visualizations of agency segments:
- By plan distribution
- By size (small/medium/large/enterprise)
- By industry
- By region

### Step 4: Agency Metrics Page
**File**: `src/app/(dashboard)/admin/agencies/analytics/page.tsx`
**Action**: Create

New analytics page for agency insights.

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual: Navigate to /admin/agencies/analytics as super admin
4. Verify all metrics display correctly
5. Test leaderboard interactions

## Files Changed Summary
| File | Action | Purpose |
|------|--------|---------|
| components/admin/agency-leaderboard.tsx | Create | Leaderboard component |
| components/admin/agency-growth.tsx | Create | Growth charts |
| components/admin/agency-segmentation.tsx | Create | Segmentation visualization |
| app/(dashboard)/admin/agencies/analytics/page.tsx | Create | Analytics page |

## Rollback Plan
1. Delete new component files
2. Remove new page route
