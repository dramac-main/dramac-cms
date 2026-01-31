# PHASE-DS-02B: Site Analytics - Charts & Trends

## Phase Overview
- **Phase ID**: PHASE-DS-02B
- **Dependencies**: PHASE-DS-02A (Site Analytics Dashboard)
- **Estimated Effort**: 4-6 hours
- **Priority**: High (Dashboard Enhancement)

## Objective
Extend the Site Analytics Dashboard with advanced charting capabilities including time series visualization, geographic analytics, realtime metrics, and performance monitoring. Create a comprehensive analytics page integrating all components from DS-02A and DS-02B.

## Prerequisites
- [x] PHASE-DS-02A completed (types, actions, core components)
- [x] Existing widget system functional
- [x] Recharts library available

## Implementation Steps

### Step 1: Time Series Chart Component
Create advanced time series visualization with period selection and metric comparison.

**File**: `src/components/analytics/time-series-chart.tsx`

### Step 2: Geographic Analytics Components
Create geographic distribution visualization for visitor locations.

**File**: `src/components/analytics/geo-analytics.tsx`

### Step 3: Realtime Analytics Widget
Create live visitor tracking widget with active sessions display.

**File**: `src/components/analytics/realtime-widget.tsx`

### Step 4: Performance Metrics Component
Create Core Web Vitals and performance score visualization.

**File**: `src/components/analytics/performance-metrics.tsx`

### Step 5: Full Analytics Dashboard Page
Create the main analytics page integrating all components.

**File**: `src/app/(dashboard)/sites/[siteId]/analytics/page.tsx`

### Step 6: Add Analytics Tab to Site Detail Page
Integrate analytics tab into existing site detail navigation.

## Component Specifications

### Time Series Chart
- Multiple metric selection (visitors, pageViews, bounceRate, sessionDuration)
- Period comparison (current vs previous)
- Granularity options (hourly, daily, weekly)
- Export capabilities

### Geographic Analytics
- Country/region breakdown
- Interactive map visualization (optional)
- Top countries list with flags
- Session metrics by location

### Realtime Widget
- Active users count
- Current page views
- Active sessions list
- Auto-refresh capability

### Performance Metrics
- Core Web Vitals (LCP, FID, CLS)
- Performance score gauge
- Loading time breakdown
- Recommendations

## Verification
1. TypeScript compilation: `npx tsc --noEmit --skipLibCheck`
2. Visual testing of all chart components
3. Responsive design verification
4. Loading states and error handling
