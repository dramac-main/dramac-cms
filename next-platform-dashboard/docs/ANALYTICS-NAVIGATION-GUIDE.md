# Analytics Navigation Guide

## Overview

This guide explains how to access the analytics dashboards for CRM, Social Media, and Automation modules.

**IMPORTANT:** All analytics dashboards currently use **MOCK DATA** (seeded random) for testing purposes. They do NOT query real database data because the required database tables don't exist in the current Supabase schema.

## Accessing Analytics

### 1. CRM Analytics Dashboard

**Location:** `/dashboard/sites/[siteId]/crm-module/analytics`

**How to Access:**
1. Navigate to your site's CRM module
2. Click on the **"Analytics"** tab in the CRM Dashboard
3. Click **"Open Analytics Dashboard"** button

**Features:**
- Pipeline metrics and funnel visualization
- Deal velocity and win/loss analysis
- Contact insights and lead scoring
- Activity analytics with heatmaps
- Revenue forecasts and pipeline value

### 2. Social Media Analytics Dashboard

**Location:** `/dashboard/sites/[siteId]/social/analytics`

**How to Access:**
1. Navigate to your site's Social Media module
2. Click **"Analytics"** button in the quick actions section (or metric cards)
3. Dashboard opens with 6 comprehensive tabs

**Features:**
- Platform overview with follower distribution
- Engagement metrics and trends
- Reach analytics by source
- Top content performance
- Audience demographics and growth
- Optimal posting times

### 3. Automation Analytics Dashboard

**Location:** `/dashboard/sites/[siteId]/automation/analytics`

**How to Access:**
1. Navigate to your site's Automation module
2. Click **"Analytics"** button in the quick actions section
3. Dashboard opens with comprehensive workflow analytics

**Features:**
- Execution overview and success rates
- Workflow performance metrics
- Error analytics and debugging
- Timing analysis (P50/P90/P99)
- Trigger performance by type
- Step-by-step analytics

## Mock Data Explanation

### Why Mock Data?

The analytics dashboards use **seeded random data** because:
1. Database tables for analytics don't exist in current Supabase schema
2. Provides consistent demo data for testing purposes
3. Seeded by `siteId` ensures same data per site across sessions

### Data Generation

All mock data is generated using:
- **Seeded Random Function:** Based on `siteId` for consistency
- **Realistic Patterns:** Growth trends, engagement rates, conversion funnels
- **Time-based Data:** Last 7, 30, 90 days with proper date formatting
- **Statistical Variety:** Different metrics, percentages, distributions

### Converting to Real Data

To replace mock data with real database queries:

1. **Create Database Tables:**
   - `crm_deals`, `crm_contacts`, `crm_activities`
   - `social_analytics`, `social_posts_analytics`
   - `workflow_execution_analytics`, `workflow_step_analytics`

2. **Update Server Actions:**
   - Replace seeded random functions with Supabase queries
   - Keep the same return types and interfaces
   - Add proper error handling for database operations

3. **Maintain Type Safety:**
   - All TypeScript types are already defined
   - Server actions follow the same signature
   - No client-side changes needed

## Navigation Components

### CRM Module
- **Component:** `src/modules/crm/components/crm-dashboard.tsx`
- **Tab:** "Analytics" with LineChart icon
- **Action:** Link button to analytics route

### Social Media Module
- **Component:** `src/modules/social-media/components/SocialDashboardWrapper.tsx`
- **Handler:** `handleViewAnalytics` callback
- **Route:** Already integrated via quick actions

### Automation Module
- **Component:** `src/app/(dashboard)/dashboard/sites/[siteId]/automation/page.tsx`
- **Button:** "Analytics" with BarChart3 icon
- **Route:** Direct link in quick actions section

## Files Modified

### Navigation Updates
1. `src/modules/crm/components/crm-dashboard.tsx`
   - Added "Analytics" tab to Tabs component
   - Added LineChart icon import
   - Added TabsContent with link to analytics route
   - Display note about demo data

2. `src/app/(dashboard)/dashboard/sites/[siteId]/social/analytics/page.tsx`
   - Replaced old SocialAnalyticsPage component
   - Now uses SocialAnalyticsDashboardEnhanced
   - Added demo data notice

### Already Integrated
- Automation module already had analytics navigation (no changes needed)
- Social media wrapper already had `handleViewAnalytics` callback

## Testing Checklist

- [ ] Navigate to CRM module → Analytics tab → Click "Open Analytics Dashboard"
- [ ] Verify CRM analytics displays 5 tabs: Pipeline, Deals, Contacts, Activities, Revenue
- [ ] Navigate to Social Media module → Click "Analytics" in quick actions
- [ ] Verify Social analytics displays 6 tabs: Overview, Engagement, Reach, Content, Audience, Timing
- [ ] Navigate to Automation module → Click "Analytics" button
- [ ] Verify Automation analytics displays 6 tabs: Overview, Workflows, Errors, Timing, Triggers, Steps
- [ ] Confirm all dashboards show consistent demo data per siteId
- [ ] Verify time range selectors work (7d, 30d, 90d)
- [ ] Check that charts render without errors

## Known Limitations

1. **Mock Data Only:** All analytics use seeded random data, not real database data
2. **No Real-time Updates:** Data doesn't reflect actual user actions
3. **Consistent Demo:** Same siteId always shows same mock data (by design)
4. **No Historical Data:** Cannot query past data beyond mock generation logic

## Next Steps

To make analytics production-ready:

1. Design and create database schema for analytics tables
2. Implement data collection triggers on user actions
3. Replace mock data server actions with real Supabase queries
4. Add data aggregation and caching for performance
5. Implement real-time data refresh mechanisms
6. Add export functionality (CSV, PDF)
7. Add custom date range selectors
8. Implement comparison features (period over period)

---

**Implementation Date:** January 2025  
**Phase:** DS-03A, DS-03B, DS-03C  
**Status:** Navigation Complete, Mock Data Active
