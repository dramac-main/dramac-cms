# Phase 81D: Module Analytics & Monitoring

## Overview
This phase implements comprehensive analytics, real-time monitoring, error tracking, and performance insights for modules. Developers will have full visibility into how their modules perform in production, enabling data-driven optimization and rapid issue resolution.

## Prerequisites
- Phase 80 (Module Studio Core) completed
- Phase 81A (Marketplace Integration) completed
- Phase 81B (Testing System) completed
- Phase 81C (Advanced Development) completed

## Estimated Time: 10-12 hours

---

## Task 1: Analytics Database Schema (45 minutes)

### 1.1 Create Analytics Tables Migration

```sql
-- migrations/20250117000001_module_analytics_enhanced.sql

-- Real-time module events (partitioned for performance)
CREATE TABLE module_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID REFERENCES module_versions(id) ON DELETE SET NULL,
  site_id UUID NOT NULL,
  
  -- Event classification
  event_type TEXT NOT NULL, -- 'render', 'api_call', 'hook_execution', 'user_interaction', 'error', 'performance'
  event_name TEXT NOT NULL, -- Specific event like 'component_mounted', 'api_response', 'button_click'
  event_category TEXT, -- 'lifecycle', 'user', 'system', 'network'
  
  -- Event data
  payload JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}', -- browser, device, location, etc.
  
  -- Performance metrics
  duration_ms INTEGER, -- For timed events
  memory_usage_kb INTEGER,
  
  -- Context
  page_path TEXT,
  session_id TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- Hashed for privacy
  country_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions (auto-managed)
CREATE TABLE module_events_y2025m01 PARTITION OF module_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE module_events_y2025m02 PARTITION OF module_events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- Continue for other months...

-- Aggregated analytics (hourly rollups)
CREATE TABLE module_analytics_hourly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID REFERENCES module_versions(id) ON DELETE SET NULL,
  
  -- Time bucket
  hour_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Render metrics
  total_renders INTEGER DEFAULT 0,
  unique_sites INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_render_time_ms DECIMAL(10, 2),
  p50_render_time_ms DECIMAL(10, 2),
  p95_render_time_ms DECIMAL(10, 2),
  p99_render_time_ms DECIMAL(10, 2),
  max_render_time_ms INTEGER,
  
  -- API metrics
  total_api_calls INTEGER DEFAULT 0,
  api_success_count INTEGER DEFAULT 0,
  api_error_count INTEGER DEFAULT 0,
  avg_api_latency_ms DECIMAL(10, 2),
  
  -- Error metrics
  total_errors INTEGER DEFAULT 0,
  error_breakdown JSONB DEFAULT '{}', -- { "TypeError": 5, "NetworkError": 2 }
  
  -- User interaction metrics
  total_interactions INTEGER DEFAULT 0,
  interaction_breakdown JSONB DEFAULT '{}', -- { "click": 100, "submit": 20 }
  
  -- Memory metrics
  avg_memory_kb DECIMAL(10, 2),
  max_memory_kb INTEGER,
  
  -- Geographic breakdown
  country_breakdown JSONB DEFAULT '{}', -- { "US": 500, "UK": 200 }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_id, version_id, hour_bucket)
);

-- Daily aggregations for dashboards
CREATE TABLE module_analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID REFERENCES module_versions(id) ON DELETE SET NULL,
  
  date_bucket DATE NOT NULL,
  
  -- Summary metrics
  total_renders INTEGER DEFAULT 0,
  unique_sites INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  
  -- Performance summary
  avg_render_time_ms DECIMAL(10, 2),
  p95_render_time_ms DECIMAL(10, 2),
  
  -- Derived metrics
  error_rate DECIMAL(5, 4), -- Percentage
  api_success_rate DECIMAL(5, 4),
  
  -- Breakdowns
  hourly_breakdown JSONB DEFAULT '[]', -- Array of hourly data points
  error_breakdown JSONB DEFAULT '{}',
  country_breakdown JSONB DEFAULT '{}',
  device_breakdown JSONB DEFAULT '{}', -- { "desktop": 60, "mobile": 35, "tablet": 5 }
  browser_breakdown JSONB DEFAULT '{}', -- { "chrome": 70, "safari": 20, "firefox": 10 }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_id, version_id, date_bucket)
);

-- Error tracking with full context
CREATE TABLE module_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID REFERENCES module_versions(id) ON DELETE SET NULL,
  site_id UUID NOT NULL,
  
  -- Error classification
  error_type TEXT NOT NULL, -- 'javascript', 'api', 'render', 'permission', 'timeout'
  error_name TEXT NOT NULL, -- 'TypeError', 'NetworkError', etc.
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Error fingerprint (for grouping)
  error_fingerprint TEXT NOT NULL, -- Hash of type + name + normalized stack
  
  -- Context
  file_path TEXT,
  line_number INTEGER,
  column_number INTEGER,
  
  -- Environment
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  device_type TEXT,
  country_code TEXT,
  
  -- Page context
  page_path TEXT,
  page_title TEXT,
  
  -- Module state at time of error
  module_state JSONB,
  module_settings JSONB,
  
  -- User context (anonymized)
  session_id TEXT,
  
  -- Resolution tracking
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  -- Occurrence tracking
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error groups (aggregated errors by fingerprint)
CREATE TABLE module_error_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  
  -- Error identification
  error_fingerprint TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  sample_stack TEXT,
  
  -- Statistics
  total_occurrences INTEGER DEFAULT 1,
  affected_sites INTEGER DEFAULT 1,
  affected_sessions INTEGER DEFAULT 1,
  
  -- Timeline
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'ignored'
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Affected versions
  affected_versions UUID[] DEFAULT '{}',
  
  -- Notes and resolution
  notes TEXT,
  resolution_commit TEXT,
  resolved_in_version UUID REFERENCES module_versions(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_id, error_fingerprint)
);

-- Performance baselines for anomaly detection
CREATE TABLE module_performance_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID REFERENCES module_versions(id),
  
  -- Metric type
  metric_name TEXT NOT NULL, -- 'render_time', 'api_latency', 'memory_usage'
  
  -- Baseline values (computed from historical data)
  baseline_mean DECIMAL(10, 2),
  baseline_stddev DECIMAL(10, 2),
  baseline_p50 DECIMAL(10, 2),
  baseline_p95 DECIMAL(10, 2),
  baseline_p99 DECIMAL(10, 2),
  
  -- Sample info
  sample_count INTEGER,
  sample_period_start TIMESTAMP WITH TIME ZONE,
  sample_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Thresholds for alerting
  warning_threshold DECIMAL(10, 2),
  critical_threshold DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_id, version_id, metric_name)
);

-- Alerts for anomalies and issues
CREATE TABLE module_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  
  -- Alert classification
  alert_type TEXT NOT NULL, -- 'performance_degradation', 'error_spike', 'availability_issue'
  severity TEXT NOT NULL, -- 'critical', 'warning', 'info'
  
  -- Alert details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Metrics that triggered alert
  metric_name TEXT,
  current_value DECIMAL(10, 2),
  expected_value DECIMAL(10, 2),
  threshold_value DECIMAL(10, 2),
  
  -- Context
  affected_sites INTEGER DEFAULT 0,
  affected_sessions INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Auto-resolution
  auto_resolved BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_module_events_module_time ON module_events (module_id, created_at DESC);
CREATE INDEX idx_module_events_site ON module_events (site_id, created_at DESC);
CREATE INDEX idx_module_events_type ON module_events (event_type, created_at DESC);

CREATE INDEX idx_analytics_hourly_module ON module_analytics_hourly (module_id, hour_bucket DESC);
CREATE INDEX idx_analytics_daily_module ON module_analytics_daily (module_id, date_bucket DESC);

CREATE INDEX idx_module_errors_fingerprint ON module_errors (error_fingerprint, created_at DESC);
CREATE INDEX idx_module_errors_module ON module_errors (module_id, created_at DESC);
CREATE INDEX idx_module_errors_unresolved ON module_errors (module_id) WHERE NOT is_resolved;

CREATE INDEX idx_error_groups_module_status ON module_error_groups (module_id, status);
CREATE INDEX idx_error_groups_priority ON module_error_groups (priority, status) WHERE status = 'open';

CREATE INDEX idx_module_alerts_active ON module_alerts (module_id, status) WHERE status = 'active';
```

---

## Task 2: Analytics Collection Service (90 minutes)

### 2.1 Create Analytics Collector

```typescript
// src/lib/modules/analytics/analytics-collector.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export type EventType = 
  | 'render'
  | 'api_call'
  | 'hook_execution'
  | 'user_interaction'
  | 'error'
  | 'performance'

export type EventCategory = 'lifecycle' | 'user' | 'system' | 'network'

export interface AnalyticsEvent {
  moduleId: string
  versionId?: string
  siteId: string
  eventType: EventType
  eventName: string
  eventCategory?: EventCategory
  payload?: Record<string, any>
  metadata?: Record<string, any>
  durationMs?: number
  memoryUsageKb?: number
  pagePath?: string
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  countryCode?: string
}

export interface ErrorEvent {
  moduleId: string
  versionId?: string
  siteId: string
  errorType: 'javascript' | 'api' | 'render' | 'permission' | 'timeout'
  errorName: string
  errorMessage: string
  errorStack?: string
  filePath?: string
  lineNumber?: number
  columnNumber?: number
  browser?: string
  browserVersion?: string
  os?: string
  deviceType?: string
  countryCode?: string
  pagePath?: string
  pageTitle?: string
  moduleState?: Record<string, any>
  moduleSettings?: Record<string, any>
  sessionId?: string
}

export interface PerformanceMetric {
  moduleId: string
  versionId?: string
  siteId: string
  metricName: string
  value: number
  unit: 'ms' | 'kb' | 'count' | 'percent'
  tags?: Record<string, string>
}

// ============================================================================
// ANALYTICS COLLECTOR
// ============================================================================

class AnalyticsCollector {
  private eventBuffer: AnalyticsEvent[] = []
  private errorBuffer: ErrorEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private bufferSize = 100
  private flushIntervalMs = 5000 // 5 seconds

  constructor() {
    // Start periodic flush
    this.startPeriodicFlush()
  }

  // --------------------------------------------------------------------------
  // Event Collection
  // --------------------------------------------------------------------------

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    this.eventBuffer.push({
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: Date.now(),
      },
    })

    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushEvents()
    }
  }

  async trackError(error: ErrorEvent): Promise<void> {
    this.errorBuffer.push(error)

    // Errors are always flushed immediately for real-time alerting
    await this.flushErrors()
  }

  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    await this.trackEvent({
      moduleId: metric.moduleId,
      versionId: metric.versionId,
      siteId: metric.siteId,
      eventType: 'performance',
      eventName: metric.metricName,
      payload: {
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
      },
    })
  }

  // --------------------------------------------------------------------------
  // Batch Tracking
  // --------------------------------------------------------------------------

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    this.eventBuffer.push(...events)

    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushEvents()
    }
  }

  // --------------------------------------------------------------------------
  // Flush Operations
  // --------------------------------------------------------------------------

  private startPeriodicFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    this.flushInterval = setInterval(async () => {
      await this.flushAll()
    }, this.flushIntervalMs)
  }

  async flushAll(): Promise<void> {
    await Promise.all([
      this.flushEvents(),
      this.flushErrors(),
    ])
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return

    const events = [...this.eventBuffer]
    this.eventBuffer = []

    const supabase = await createClient()

    try {
      const rows = events.map(event => ({
        id: uuidv4(),
        module_id: event.moduleId,
        version_id: event.versionId,
        site_id: event.siteId,
        event_type: event.eventType,
        event_name: event.eventName,
        event_category: event.eventCategory,
        payload: event.payload || {},
        metadata: event.metadata || {},
        duration_ms: event.durationMs,
        memory_usage_kb: event.memoryUsageKb,
        page_path: event.pagePath,
        session_id: event.sessionId,
        user_agent: event.userAgent,
        ip_hash: event.ipAddress ? this.hashIp(event.ipAddress) : null,
        country_code: event.countryCode,
      }))

      await supabase.from('module_events').insert(rows)
    } catch (error) {
      console.error('Failed to flush analytics events:', error)
      // Re-add failed events to buffer for retry
      this.eventBuffer.unshift(...events)
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorBuffer.length === 0) return

    const errors = [...this.errorBuffer]
    this.errorBuffer = []

    const supabase = await createClient()

    try {
      for (const error of errors) {
        const fingerprint = this.generateErrorFingerprint(error)

        // Insert error record
        await supabase.from('module_errors').insert({
          id: uuidv4(),
          module_id: error.moduleId,
          version_id: error.versionId,
          site_id: error.siteId,
          error_type: error.errorType,
          error_name: error.errorName,
          error_message: error.errorMessage,
          error_stack: error.errorStack,
          error_fingerprint: fingerprint,
          file_path: error.filePath,
          line_number: error.lineNumber,
          column_number: error.columnNumber,
          browser: error.browser,
          browser_version: error.browserVersion,
          os: error.os,
          device_type: error.deviceType,
          country_code: error.countryCode,
          page_path: error.pagePath,
          page_title: error.pageTitle,
          module_state: error.moduleState,
          module_settings: error.moduleSettings,
          session_id: error.sessionId,
        })

        // Update or create error group
        await this.updateErrorGroup(error, fingerprint)
      }
    } catch (err) {
      console.error('Failed to flush error events:', err)
    }
  }

  // --------------------------------------------------------------------------
  // Error Grouping
  // --------------------------------------------------------------------------

  private generateErrorFingerprint(error: ErrorEvent): string {
    // Normalize stack trace (remove line numbers for grouping)
    const normalizedStack = error.errorStack
      ?.replace(/:\d+:\d+/g, ':X:X')
      .replace(/\?[^\s]+/g, '')
      || ''

    const fingerprint = `${error.errorType}:${error.errorName}:${normalizedStack.slice(0, 500)}`
    return crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 32)
  }

  private async updateErrorGroup(error: ErrorEvent, fingerprint: string): Promise<void> {
    const supabase = await createClient()

    // Try to update existing group
    const { data: existingGroup } = await supabase
      .from('module_error_groups')
      .select('*')
      .eq('module_id', error.moduleId)
      .eq('error_fingerprint', fingerprint)
      .single()

    if (existingGroup) {
      // Update existing group
      const affectedVersions = new Set(existingGroup.affected_versions || [])
      if (error.versionId) {
        affectedVersions.add(error.versionId)
      }

      await supabase
        .from('module_error_groups')
        .update({
          total_occurrences: existingGroup.total_occurrences + 1,
          last_seen_at: new Date().toISOString(),
          affected_versions: Array.from(affectedVersions),
          updated_at: new Date().toISOString(),
          // Re-open if it was resolved but error recurred
          status: existingGroup.status === 'resolved' ? 'open' : existingGroup.status,
        })
        .eq('id', existingGroup.id)
    } else {
      // Create new group
      await supabase.from('module_error_groups').insert({
        id: uuidv4(),
        module_id: error.moduleId,
        error_fingerprint: fingerprint,
        error_type: error.errorType,
        error_name: error.errorName,
        error_message: error.errorMessage,
        sample_stack: error.errorStack,
        affected_versions: error.versionId ? [error.versionId] : [],
      })
    }
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip + process.env.IP_HASH_SALT || 'salt').digest('hex').slice(0, 16)
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
  }
}

// Singleton instance
export const analyticsCollector = new AnalyticsCollector()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function trackModuleRender(
  moduleId: string,
  siteId: string,
  renderTimeMs: number,
  options?: {
    versionId?: string
    pagePath?: string
    sessionId?: string
  }
): Promise<void> {
  await analyticsCollector.trackEvent({
    moduleId,
    siteId,
    versionId: options?.versionId,
    eventType: 'render',
    eventName: 'component_mounted',
    eventCategory: 'lifecycle',
    durationMs: renderTimeMs,
    pagePath: options?.pagePath,
    sessionId: options?.sessionId,
  })
}

export async function trackModuleApiCall(
  moduleId: string,
  siteId: string,
  endpoint: string,
  success: boolean,
  latencyMs: number,
  options?: {
    versionId?: string
    statusCode?: number
    method?: string
  }
): Promise<void> {
  await analyticsCollector.trackEvent({
    moduleId,
    siteId,
    versionId: options?.versionId,
    eventType: 'api_call',
    eventName: `api_${success ? 'success' : 'error'}`,
    eventCategory: 'network',
    durationMs: latencyMs,
    payload: {
      endpoint,
      statusCode: options?.statusCode,
      method: options?.method,
    },
  })
}

export async function trackModuleInteraction(
  moduleId: string,
  siteId: string,
  interactionType: string,
  options?: {
    versionId?: string
    elementId?: string
    pagePath?: string
    sessionId?: string
    data?: Record<string, any>
  }
): Promise<void> {
  await analyticsCollector.trackEvent({
    moduleId,
    siteId,
    versionId: options?.versionId,
    eventType: 'user_interaction',
    eventName: interactionType,
    eventCategory: 'user',
    pagePath: options?.pagePath,
    sessionId: options?.sessionId,
    payload: {
      elementId: options?.elementId,
      ...options?.data,
    },
  })
}

export async function trackModuleError(
  error: ErrorEvent
): Promise<void> {
  await analyticsCollector.trackError(error)
}
```

### 2.2 Create Client-Side Analytics SDK

```typescript
// src/lib/modules/analytics/client-sdk.ts
// This file is bundled into module sandbox

export interface ModuleAnalyticsSDK {
  trackEvent: (name: string, data?: Record<string, any>) => void
  trackInteraction: (type: string, elementId?: string, data?: Record<string, any>) => void
  trackError: (error: Error, context?: Record<string, any>) => void
  trackPerformance: (metric: string, value: number, unit?: string) => void
  startTimer: (name: string) => () => void
}

export function createModuleAnalyticsSDK(
  moduleId: string,
  versionId: string,
  siteId: string,
  sendMessage: (type: string, payload: any) => void
): ModuleAnalyticsSDK {
  const sessionId = generateSessionId()
  const timers = new Map<string, number>()

  return {
    trackEvent(name: string, data?: Record<string, any>): void {
      sendMessage('analytics:event', {
        moduleId,
        versionId,
        siteId,
        eventName: name,
        payload: data,
        sessionId,
        timestamp: Date.now(),
      })
    },

    trackInteraction(type: string, elementId?: string, data?: Record<string, any>): void {
      sendMessage('analytics:interaction', {
        moduleId,
        versionId,
        siteId,
        interactionType: type,
        elementId,
        data,
        sessionId,
        timestamp: Date.now(),
      })
    },

    trackError(error: Error, context?: Record<string, any>): void {
      sendMessage('analytics:error', {
        moduleId,
        versionId,
        siteId,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        context,
        sessionId,
        timestamp: Date.now(),
      })
    },

    trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
      sendMessage('analytics:performance', {
        moduleId,
        versionId,
        siteId,
        metric,
        value,
        unit,
        sessionId,
        timestamp: Date.now(),
      })
    },

    startTimer(name: string): () => void {
      timers.set(name, performance.now())
      
      return () => {
        const start = timers.get(name)
        if (start !== undefined) {
          const duration = performance.now() - start
          this.trackPerformance(name, duration, 'ms')
          timers.delete(name)
        }
      }
    },
  }
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
```

---

## Task 3: Analytics Aggregation Service (60 minutes)

### 3.1 Create Aggregation Worker

```typescript
// src/lib/modules/analytics/aggregation-service.ts
'use server'

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// HOURLY AGGREGATION
// ============================================================================

export async function aggregateHourlyAnalytics(
  moduleId: string,
  hour: Date
): Promise<void> {
  const supabase = await createClient()
  
  const hourStart = new Date(hour)
  hourStart.setMinutes(0, 0, 0)
  
  const hourEnd = new Date(hourStart)
  hourEnd.setHours(hourEnd.getHours() + 1)

  // Fetch events for this hour
  const { data: events } = await supabase
    .from('module_events')
    .select('*')
    .eq('module_id', moduleId)
    .gte('created_at', hourStart.toISOString())
    .lt('created_at', hourEnd.toISOString())

  if (!events || events.length === 0) return

  // Calculate aggregates
  const renderEvents = events.filter(e => e.event_type === 'render')
  const apiEvents = events.filter(e => e.event_type === 'api_call')
  const errorEvents = events.filter(e => e.event_type === 'error')
  const interactionEvents = events.filter(e => e.event_type === 'user_interaction')

  // Unique counts
  const uniqueSites = new Set(events.map(e => e.site_id)).size
  const uniqueSessions = new Set(events.filter(e => e.session_id).map(e => e.session_id)).size

  // Render time percentiles
  const renderTimes = renderEvents
    .filter(e => e.duration_ms !== null)
    .map(e => e.duration_ms)
    .sort((a, b) => a - b)

  // Error breakdown
  const errorBreakdown: Record<string, number> = {}
  errorEvents.forEach(e => {
    const name = e.payload?.errorName || 'Unknown'
    errorBreakdown[name] = (errorBreakdown[name] || 0) + 1
  })

  // Interaction breakdown
  const interactionBreakdown: Record<string, number> = {}
  interactionEvents.forEach(e => {
    const type = e.event_name || 'unknown'
    interactionBreakdown[type] = (interactionBreakdown[type] || 0) + 1
  })

  // Country breakdown
  const countryBreakdown: Record<string, number> = {}
  events.filter(e => e.country_code).forEach(e => {
    countryBreakdown[e.country_code] = (countryBreakdown[e.country_code] || 0) + 1
  })

  // Memory metrics
  const memoryReadings = events
    .filter(e => e.memory_usage_kb !== null)
    .map(e => e.memory_usage_kb)

  // API metrics
  const apiSuccessCount = apiEvents.filter(e => e.event_name === 'api_success').length
  const apiLatencies = apiEvents
    .filter(e => e.duration_ms !== null)
    .map(e => e.duration_ms)

  // Upsert hourly aggregate
  await supabase.from('module_analytics_hourly').upsert({
    module_id: moduleId,
    hour_bucket: hourStart.toISOString(),
    total_renders: renderEvents.length,
    unique_sites: uniqueSites,
    unique_sessions: uniqueSessions,
    avg_render_time_ms: renderTimes.length > 0 ? average(renderTimes) : null,
    p50_render_time_ms: renderTimes.length > 0 ? percentile(renderTimes, 50) : null,
    p95_render_time_ms: renderTimes.length > 0 ? percentile(renderTimes, 95) : null,
    p99_render_time_ms: renderTimes.length > 0 ? percentile(renderTimes, 99) : null,
    max_render_time_ms: renderTimes.length > 0 ? Math.max(...renderTimes) : null,
    total_api_calls: apiEvents.length,
    api_success_count: apiSuccessCount,
    api_error_count: apiEvents.length - apiSuccessCount,
    avg_api_latency_ms: apiLatencies.length > 0 ? average(apiLatencies) : null,
    total_errors: errorEvents.length,
    error_breakdown: errorBreakdown,
    total_interactions: interactionEvents.length,
    interaction_breakdown: interactionBreakdown,
    avg_memory_kb: memoryReadings.length > 0 ? average(memoryReadings) : null,
    max_memory_kb: memoryReadings.length > 0 ? Math.max(...memoryReadings) : null,
    country_breakdown: countryBreakdown,
  }, {
    onConflict: 'module_id,version_id,hour_bucket',
  })
}

// ============================================================================
// DAILY AGGREGATION
// ============================================================================

export async function aggregateDailyAnalytics(
  moduleId: string,
  date: Date
): Promise<void> {
  const supabase = await createClient()
  
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  // Fetch hourly aggregates for this day
  const { data: hourlyData } = await supabase
    .from('module_analytics_hourly')
    .select('*')
    .eq('module_id', moduleId)
    .gte('hour_bucket', dayStart.toISOString())
    .lt('hour_bucket', dayEnd.toISOString())

  if (!hourlyData || hourlyData.length === 0) return

  // Calculate daily aggregates
  const totalRenders = hourlyData.reduce((sum, h) => sum + (h.total_renders || 0), 0)
  const totalApiCalls = hourlyData.reduce((sum, h) => sum + (h.total_api_calls || 0), 0)
  const totalErrors = hourlyData.reduce((sum, h) => sum + (h.total_errors || 0), 0)
  const totalInteractions = hourlyData.reduce((sum, h) => sum + (h.total_interactions || 0), 0)
  const apiSuccessCount = hourlyData.reduce((sum, h) => sum + (h.api_success_count || 0), 0)

  // Unique sites (max across hours, not sum)
  const uniqueSites = Math.max(...hourlyData.map(h => h.unique_sites || 0))
  const uniqueSessions = hourlyData.reduce((sum, h) => sum + (h.unique_sessions || 0), 0)

  // Average render time (weighted by render count)
  const avgRenderTime = weightedAverage(
    hourlyData.filter(h => h.avg_render_time_ms !== null),
    h => h.avg_render_time_ms,
    h => h.total_renders
  )

  // P95 (max of hourly P95s is a reasonable approximation)
  const p95RenderTime = Math.max(...hourlyData
    .filter(h => h.p95_render_time_ms !== null)
    .map(h => h.p95_render_time_ms))

  // Merge breakdowns
  const errorBreakdown = mergeBreakdowns(hourlyData.map(h => h.error_breakdown || {}))
  const countryBreakdown = mergeBreakdowns(hourlyData.map(h => h.country_breakdown || {}))

  // Hourly breakdown for charts
  const hourlyBreakdown = hourlyData.map(h => ({
    hour: new Date(h.hour_bucket).getHours(),
    renders: h.total_renders,
    errors: h.total_errors,
    avgRenderTime: h.avg_render_time_ms,
  }))

  // Upsert daily aggregate
  await supabase.from('module_analytics_daily').upsert({
    module_id: moduleId,
    date_bucket: dayStart.toISOString().split('T')[0],
    total_renders: totalRenders,
    unique_sites: uniqueSites,
    unique_sessions: uniqueSessions,
    total_api_calls: totalApiCalls,
    total_errors: totalErrors,
    total_interactions: totalInteractions,
    avg_render_time_ms: avgRenderTime,
    p95_render_time_ms: p95RenderTime || null,
    error_rate: totalRenders > 0 ? totalErrors / totalRenders : 0,
    api_success_rate: totalApiCalls > 0 ? apiSuccessCount / totalApiCalls : 1,
    hourly_breakdown: hourlyBreakdown,
    error_breakdown: errorBreakdown,
    country_breakdown: countryBreakdown,
  }, {
    onConflict: 'module_id,version_id,date_bucket',
  })
}

// ============================================================================
// UTILITIES
// ============================================================================

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function percentile(sortedValues: number[], p: number): number {
  const index = Math.ceil((p / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, index)]
}

function weightedAverage<T>(
  items: T[],
  getValue: (item: T) => number,
  getWeight: (item: T) => number
): number | null {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0)
  if (totalWeight === 0) return null
  
  const weightedSum = items.reduce((sum, item) => sum + getValue(item) * getWeight(item), 0)
  return weightedSum / totalWeight
}

function mergeBreakdowns(breakdowns: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {}
  
  for (const breakdown of breakdowns) {
    for (const [key, value] of Object.entries(breakdown)) {
      merged[key] = (merged[key] || 0) + value
    }
  }
  
  return merged
}

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

export async function runHourlyAggregation(): Promise<void> {
  const supabase = await createClient()
  
  // Get all modules with recent events
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)
  
  const { data: modules } = await supabase
    .from('module_events')
    .select('module_id')
    .gte('created_at', oneHourAgo.toISOString())
    .limit(1000)

  if (!modules) return

  const uniqueModuleIds = [...new Set(modules.map(m => m.module_id))]
  
  for (const moduleId of uniqueModuleIds) {
    await aggregateHourlyAnalytics(moduleId, oneHourAgo)
  }
}

export async function runDailyAggregation(): Promise<void> {
  const supabase = await createClient()
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Get all modules with hourly data from yesterday
  const { data: modules } = await supabase
    .from('module_analytics_hourly')
    .select('module_id')
    .gte('hour_bucket', yesterday.toISOString().split('T')[0])
    .lt('hour_bucket', new Date().toISOString().split('T')[0])

  if (!modules) return

  const uniqueModuleIds = [...new Set(modules.map(m => m.module_id))]
  
  for (const moduleId of uniqueModuleIds) {
    await aggregateDailyAnalytics(moduleId, yesterday)
  }
}
```

---

## Task 4: Analytics Dashboard UI (90 minutes)

### 4.1 Create Analytics Overview Component

```typescript
// src/components/modules/studio/analytics/analytics-overview.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { 
  Activity, AlertTriangle, BarChart2, Clock, Download, Globe, 
  Monitor, MousePointer, RefreshCw, TrendingUp, Users, Zap 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, subHours } from 'date-fns'

interface AnalyticsOverviewProps {
  moduleId: string
  versionId?: string
}

interface DailyMetrics {
  date: string
  renders: number
  errors: number
  interactions: number
  apiCalls: number
  avgRenderTime: number
}

interface SummaryMetrics {
  totalRenders: number
  totalErrors: number
  totalInteractions: number
  totalApiCalls: number
  avgRenderTime: number
  p95RenderTime: number
  errorRate: number
  uniqueSites: number
  uniqueSessions: number
  rendersTrend: number // percentage change
  errorsTrend: number
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899']

export function AnalyticsOverview({ moduleId, versionId }: AnalyticsOverviewProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([])
  const [summary, setSummary] = useState<SummaryMetrics | null>(null)
  const [countryData, setCountryData] = useState<{ country: string; count: number }[]>([])
  const [deviceData, setDeviceData] = useState<{ device: string; count: number }[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [moduleId, versionId, timeRange])

  async function loadAnalytics() {
    setIsLoading(true)
    const supabase = createClient()

    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = subDays(new Date(), daysBack)

    // Fetch daily analytics
    const { data: dailyAnalytics } = await supabase
      .from('module_analytics_daily')
      .select('*')
      .eq('module_id', moduleId)
      .gte('date_bucket', startDate.toISOString().split('T')[0])
      .order('date_bucket', { ascending: true })

    if (dailyAnalytics) {
      setDailyData(dailyAnalytics.map(d => ({
        date: format(new Date(d.date_bucket), 'MMM d'),
        renders: d.total_renders,
        errors: d.total_errors,
        interactions: d.total_interactions,
        apiCalls: d.total_api_calls,
        avgRenderTime: d.avg_render_time_ms,
      })))

      // Calculate summary
      const totalRenders = dailyAnalytics.reduce((sum, d) => sum + d.total_renders, 0)
      const totalErrors = dailyAnalytics.reduce((sum, d) => sum + d.total_errors, 0)
      const totalInteractions = dailyAnalytics.reduce((sum, d) => sum + d.total_interactions, 0)
      const totalApiCalls = dailyAnalytics.reduce((sum, d) => sum + d.total_api_calls, 0)

      const avgRenderTime = dailyAnalytics.length > 0
        ? dailyAnalytics.reduce((sum, d) => sum + (d.avg_render_time_ms || 0), 0) / dailyAnalytics.length
        : 0

      const p95RenderTime = Math.max(
        ...dailyAnalytics.map(d => d.p95_render_time_ms || 0)
      )

      // Merge country data
      const countries: Record<string, number> = {}
      dailyAnalytics.forEach(d => {
        if (d.country_breakdown) {
          Object.entries(d.country_breakdown).forEach(([country, count]) => {
            countries[country] = (countries[country] || 0) + (count as number)
          })
        }
      })

      setCountryData(
        Object.entries(countries)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([country, count]) => ({ country, count }))
      )

      // Calculate trends (compare first half to second half of period)
      const midpoint = Math.floor(dailyAnalytics.length / 2)
      const firstHalf = dailyAnalytics.slice(0, midpoint)
      const secondHalf = dailyAnalytics.slice(midpoint)

      const firstHalfRenders = firstHalf.reduce((sum, d) => sum + d.total_renders, 0)
      const secondHalfRenders = secondHalf.reduce((sum, d) => sum + d.total_renders, 0)
      const rendersTrend = firstHalfRenders > 0 
        ? ((secondHalfRenders - firstHalfRenders) / firstHalfRenders) * 100 
        : 0

      const firstHalfErrors = firstHalf.reduce((sum, d) => sum + d.total_errors, 0)
      const secondHalfErrors = secondHalf.reduce((sum, d) => sum + d.total_errors, 0)
      const errorsTrend = firstHalfErrors > 0 
        ? ((secondHalfErrors - firstHalfErrors) / firstHalfErrors) * 100 
        : 0

      setSummary({
        totalRenders,
        totalErrors,
        totalInteractions,
        totalApiCalls,
        avgRenderTime,
        p95RenderTime,
        errorRate: totalRenders > 0 ? (totalErrors / totalRenders) * 100 : 0,
        uniqueSites: Math.max(...dailyAnalytics.map(d => d.unique_sites || 0)),
        uniqueSessions: dailyAnalytics.reduce((sum, d) => sum + (d.unique_sessions || 0), 0),
        rendersTrend,
        errorsTrend,
      })
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Monitor your module's performance and usage</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Renders"
            value={formatNumber(summary.totalRenders)}
            icon={Activity}
            trend={summary.rendersTrend}
          />
          <SummaryCard
            title="Error Rate"
            value={`${summary.errorRate.toFixed(2)}%`}
            icon={AlertTriangle}
            trend={-summary.errorsTrend}
            invertTrend
          />
          <SummaryCard
            title="Avg Render Time"
            value={`${summary.avgRenderTime.toFixed(0)}ms`}
            icon={Clock}
            subtext={`P95: ${summary.p95RenderTime.toFixed(0)}ms`}
          />
          <SummaryCard
            title="Active Sites"
            value={formatNumber(summary.uniqueSites)}
            icon={Globe}
            subtext={`${formatNumber(summary.uniqueSessions)} sessions`}
          />
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Renders Over Time</CardTitle>
              <CardDescription>Total module renders per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="renders"
                    stroke="#8b5cf6"
                    fill="#8b5cf680"
                    name="Renders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Interactions</CardTitle>
                <CardDescription>Clicks, submissions, and other interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="interactions" fill="#06b6d4" name="Interactions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Calls</CardTitle>
                <CardDescription>External API requests made by module</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="apiCalls" fill="#f59e0b" name="API Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Render Time Trend</CardTitle>
              <CardDescription>Average render time in milliseconds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgRenderTime"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Avg Render Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PerformanceCard
                title="Average"
                value={`${summary.avgRenderTime.toFixed(0)}ms`}
                status={summary.avgRenderTime < 100 ? 'good' : summary.avgRenderTime < 300 ? 'warning' : 'critical'}
              />
              <PerformanceCard
                title="P95"
                value={`${summary.p95RenderTime.toFixed(0)}ms`}
                status={summary.p95RenderTime < 200 ? 'good' : summary.p95RenderTime < 500 ? 'warning' : 'critical'}
              />
              <PerformanceCard
                title="API Success Rate"
                value={summary.totalApiCalls > 0 
                  ? `${((1 - summary.errorRate / 100) * 100).toFixed(1)}%`
                  : 'N/A'
                }
                status="good"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Errors Over Time</CardTitle>
              <CardDescription>Total errors per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="errors" fill="#ef4444" name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Module usage by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countryData.map((item, index) => (
                  <div key={item.country} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-muted-foreground">#{index + 1}</span>
                    <span className="w-12 font-mono text-sm">{item.country}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(item.count / countryData[0]?.count || 1) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="w-20 text-sm text-right">{formatNumber(item.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  subtext?: string
  invertTrend?: boolean
}

function SummaryCard({ title, value, icon: Icon, trend, subtext, invertTrend }: SummaryCardProps) {
  const trendColor = trend !== undefined
    ? (invertTrend ? trend < 0 : trend > 0) 
      ? 'text-green-500' 
      : 'text-red-500'
    : ''

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <p className={`text-xs ${trendColor}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs previous period
              </p>
            )}
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  )
}

interface PerformanceCardProps {
  title: string
  value: string
  status: 'good' | 'warning' | 'critical'
}

function PerformanceCard({ title, value, status }: PerformanceCardProps) {
  const statusColors = {
    good: 'bg-green-500/10 border-green-500/20 text-green-600',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
    critical: 'bg-red-500/10 border-red-500/20 text-red-600',
  }

  return (
    <Card className={`${statusColors[status]} border`}>
      <CardContent className="pt-6 text-center">
        <p className="text-sm opacity-70">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}
```

### 4.2 Create Error Tracking Component

```typescript
// src/components/modules/studio/analytics/error-tracker.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  AlertTriangle, Bug, ChevronDown, ChevronRight, Clock, 
  Eye, Filter, Search, CheckCircle, XCircle 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface ErrorTrackerProps {
  moduleId: string
}

interface ErrorGroup {
  id: string
  error_fingerprint: string
  error_type: string
  error_name: string
  error_message: string
  sample_stack: string
  total_occurrences: number
  affected_sites: number
  first_seen_at: string
  last_seen_at: string
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  priority: 'critical' | 'high' | 'medium' | 'low'
  affected_versions: string[]
}

const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

const statusColors = {
  open: 'bg-red-100 text-red-700 border-red-200',
  investigating: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  ignored: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function ErrorTracker({ moduleId }: ErrorTrackerProps) {
  const [errors, setErrors] = useState<ErrorGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadErrors()
  }, [moduleId, statusFilter, priorityFilter])

  async function loadErrors() {
    setIsLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('module_error_groups')
      .select('*')
      .eq('module_id', moduleId)
      .order('last_seen_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter)
    }

    const { data } = await query

    setErrors(data || [])
    setIsLoading(false)
  }

  async function updateErrorStatus(errorId: string, status: string) {
    const supabase = createClient()

    await supabase
      .from('module_error_groups')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', errorId)

    loadErrors()
  }

  async function updateErrorPriority(errorId: string, priority: string) {
    const supabase = createClient()

    await supabase
      .from('module_error_groups')
      .update({ 
        priority, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', errorId)

    loadErrors()
  }

  const toggleExpanded = (errorId: string) => {
    const newExpanded = new Set(expandedErrors)
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId)
    } else {
      newExpanded.add(errorId)
    }
    setExpandedErrors(newExpanded)
  }

  const filteredErrors = errors.filter(error =>
    error.error_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.error_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Summary stats
  const openCount = errors.filter(e => e.status === 'open').length
  const criticalCount = errors.filter(e => e.status === 'open' && e.priority === 'critical').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Error Tracking</h2>
          <p className="text-muted-foreground">Monitor and resolve module errors</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive">
              {criticalCount} Critical
            </Badge>
          )}
          <Badge variant="outline">
            {openCount} Open
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="ignored">Ignored</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error List */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">No errors found</p>
              <p className="text-muted-foreground">Your module is running smoothly!</p>
            </CardContent>
          </Card>
        ) : (
          filteredErrors.map((error) => (
            <ErrorCard
              key={error.id}
              error={error}
              isExpanded={expandedErrors.has(error.id)}
              onToggle={() => toggleExpanded(error.id)}
              onUpdateStatus={(status) => updateErrorStatus(error.id, status)}
              onUpdatePriority={(priority) => updateErrorPriority(error.id, priority)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ErrorCardProps {
  error: ErrorGroup
  isExpanded: boolean
  onToggle: () => void
  onUpdateStatus: (status: string) => void
  onUpdatePriority: (priority: string) => void
}

function ErrorCard({ error, isExpanded, onToggle, onUpdateStatus, onUpdatePriority }: ErrorCardProps) {
  return (
    <Card className={error.priority === 'critical' ? 'border-red-300' : ''}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4">
              {/* Priority indicator */}
              <div className={`w-1 h-12 rounded-full ${priorityColors[error.priority]}`} />
              
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Bug className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm text-muted-foreground">
                    {error.error_type}
                  </span>
                  <span className="font-semibold">{error.error_name}</span>
                  <Badge variant="outline" className={statusColors[error.status]}>
                    {error.status}
                  </Badge>
                </div>
                <p className="text-sm truncate">{error.error_message}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {error.total_occurrences} occurrences
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {error.affected_sites} sites
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last seen {formatDistanceToNow(new Date(error.last_seen_at))} ago
                  </span>
                </div>
              </div>

              {/* Expand indicator */}
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t pt-4">
            {/* Stack trace */}
            {error.sample_stack && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Stack Trace</h4>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {error.sample_stack}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium mr-2">Status:</label>
                <Select value={error.status} onValueChange={onUpdateStatus}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mr-2">Priority:</label>
                <Select value={error.priority} onValueChange={onUpdatePriority}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto text-xs text-muted-foreground">
                First seen: {formatDistanceToNow(new Date(error.first_seen_at))} ago
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
```

---

## Task 5: Real-Time Monitoring (60 minutes)

### 5.1 Create Live Monitor Component

```typescript
// src/components/modules/studio/analytics/live-monitor.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, AlertTriangle, CheckCircle, Clock, 
  Pause, Play, RefreshCw, Zap, Radio 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface LiveMonitorProps {
  moduleId: string
}

interface LiveEvent {
  id: string
  event_type: string
  event_name: string
  site_id: string
  duration_ms?: number
  payload?: Record<string, any>
  created_at: string
}

interface LiveStats {
  rendersLast5Min: number
  errorsLast5Min: number
  avgRenderTime: number
  activeRequests: number
}

export function LiveMonitor({ moduleId }: LiveMonitorProps) {
  const [isLive, setIsLive] = useState(true)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [stats, setStats] = useState<LiveStats>({
    rendersLast5Min: 0,
    errorsLast5Min: 0,
    avgRenderTime: 0,
    activeRequests: 0,
  })
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  
  const channelRef = useRef<any>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isLive) {
      setupRealtimeSubscription()
      startStatsPolling()
    }

    return () => {
      cleanup()
    }
  }, [moduleId, isLive])

  function setupRealtimeSubscription() {
    const supabase = createClient()

    setConnectionStatus('connecting')

    // Subscribe to new events
    channelRef.current = supabase
      .channel(`module_events:${moduleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'module_events',
          filter: `module_id=eq.${moduleId}`,
        },
        (payload) => {
          const newEvent = payload.new as LiveEvent
          setEvents(prev => [newEvent, ...prev].slice(0, 100)) // Keep last 100 events
          
          // Update live stats
          if (newEvent.event_type === 'render' && newEvent.duration_ms) {
            setStats(prev => ({
              ...prev,
              rendersLast5Min: prev.rendersLast5Min + 1,
              avgRenderTime: (prev.avgRenderTime + newEvent.duration_ms!) / 2,
            }))
          } else if (newEvent.event_type === 'error') {
            setStats(prev => ({
              ...prev,
              errorsLast5Min: prev.errorsLast5Min + 1,
            }))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected')
        }
      })
  }

  function startStatsPolling() {
    // Poll for rolling stats every 30 seconds
    const poll = async () => {
      const supabase = createClient()
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

      const { data: recentEvents } = await supabase
        .from('module_events')
        .select('event_type, duration_ms')
        .eq('module_id', moduleId)
        .gte('created_at', fiveMinAgo.toISOString())

      if (recentEvents) {
        const renders = recentEvents.filter(e => e.event_type === 'render')
        const errors = recentEvents.filter(e => e.event_type === 'error')
        const avgTime = renders.length > 0
          ? renders.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / renders.length
          : 0

        setStats({
          rendersLast5Min: renders.length,
          errorsLast5Min: errors.length,
          avgRenderTime: avgTime,
          activeRequests: 0, // Would come from a different source
        })
      }
    }

    poll()
    statsIntervalRef.current = setInterval(poll, 30000)
  }

  function cleanup() {
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
    setConnectionStatus('disconnected')
  }

  function toggleLive() {
    if (isLive) {
      cleanup()
    }
    setIsLive(!isLive)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Live Monitor</h2>
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className={connectionStatus === 'connected' ? 'bg-green-500' : ''}
          >
            <Radio className={`h-3 w-3 mr-1 ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
            {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </Badge>
        </div>

        <Button variant="outline" onClick={toggleLive}>
          {isLive ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          )}
        </Button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Renders (5m)"
          value={stats.rendersLast5Min}
          icon={Activity}
          color="text-blue-500"
        />
        <StatCard
          title="Errors (5m)"
          value={stats.errorsLast5Min}
          icon={AlertTriangle}
          color={stats.errorsLast5Min > 0 ? 'text-red-500' : 'text-green-500'}
        />
        <StatCard
          title="Avg Render"
          value={`${stats.avgRenderTime.toFixed(0)}ms`}
          icon={Clock}
          color={stats.avgRenderTime < 100 ? 'text-green-500' : stats.avgRenderTime < 300 ? 'text-yellow-500' : 'text-red-500'}
        />
        <StatCard
          title="Health"
          value={stats.errorsLast5Min === 0 ? 'Healthy' : 'Issues'}
          icon={stats.errorsLast5Min === 0 ? CheckCircle : AlertTriangle}
          color={stats.errorsLast5Min === 0 ? 'text-green-500' : 'text-red-500'}
        />
      </div>

      {/* Event Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Event Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isLive ? 'Waiting for events...' : 'Monitor paused'}
                </div>
              ) : (
                events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color} opacity-50`} />
        </div>
      </CardContent>
    </Card>
  )
}

interface EventRowProps {
  event: LiveEvent
}

function EventRow({ event }: EventRowProps) {
  const typeColors: Record<string, string> = {
    render: 'bg-blue-500',
    error: 'bg-red-500',
    api_call: 'bg-yellow-500',
    user_interaction: 'bg-green-500',
    performance: 'bg-purple-500',
  }

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    render: Activity,
    error: AlertTriangle,
    api_call: RefreshCw,
    user_interaction: Zap,
    performance: Clock,
  }

  const Icon = typeIcons[event.event_type] || Activity

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${typeColors[event.event_type] || 'bg-gray-500'}`} />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {event.event_type}
          </span>
          <span className="text-sm font-medium">{event.event_name}</span>
        </div>
      </div>
      {event.duration_ms !== undefined && (
        <Badge variant="outline" className="font-mono text-xs">
          {event.duration_ms}ms
        </Badge>
      )}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(event.created_at))} ago
      </span>
    </div>
  )
}
```

---

## Task 6: Alerting System (45 minutes)

### 6.1 Create Alert Configuration

```typescript
// src/lib/modules/analytics/alerting-service.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

export type AlertType = 
  | 'performance_degradation'
  | 'error_spike'
  | 'availability_issue'
  | 'usage_anomaly'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface AlertRule {
  id: string
  moduleId: string
  alertType: AlertType
  metric: string
  condition: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'spike'
  threshold: number
  windowMinutes: number
  severity: AlertSeverity
  enabled: boolean
  notifyEmail: boolean
  notifyWebhook?: string
}

// ============================================================================
// ALERT EVALUATION
// ============================================================================

export async function evaluateAlerts(moduleId: string): Promise<void> {
  const supabase = await createClient()

  // Get module's alert rules
  const { data: rules } = await supabase
    .from('module_alert_rules')
    .select('*')
    .eq('module_id', moduleId)
    .eq('enabled', true)

  if (!rules || rules.length === 0) return

  for (const rule of rules) {
    const triggered = await checkAlertCondition(moduleId, rule)
    
    if (triggered) {
      await createAlert(moduleId, rule, triggered)
    }
  }
}

async function checkAlertCondition(
  moduleId: string,
  rule: AlertRule
): Promise<{ currentValue: number; expectedValue: number } | null> {
  const supabase = await createClient()
  
  const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000)

  // Fetch recent metrics
  const { data: events } = await supabase
    .from('module_events')
    .select('event_type, duration_ms, created_at')
    .eq('module_id', moduleId)
    .gte('created_at', windowStart.toISOString())

  if (!events || events.length === 0) return null

  let currentValue = 0

  switch (rule.metric) {
    case 'error_rate':
      const totalEvents = events.length
      const errorEvents = events.filter(e => e.event_type === 'error').length
      currentValue = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
      break
    
    case 'avg_render_time':
      const renderEvents = events.filter(e => e.event_type === 'render' && e.duration_ms)
      currentValue = renderEvents.length > 0
        ? renderEvents.reduce((sum, e) => sum + e.duration_ms!, 0) / renderEvents.length
        : 0
      break
    
    case 'error_count':
      currentValue = events.filter(e => e.event_type === 'error').length
      break
    
    case 'render_count':
      currentValue = events.filter(e => e.event_type === 'render').length
      break
  }

  // Check condition
  let triggered = false
  switch (rule.condition) {
    case 'gt':
      triggered = currentValue > rule.threshold
      break
    case 'gte':
      triggered = currentValue >= rule.threshold
      break
    case 'lt':
      triggered = currentValue < rule.threshold
      break
    case 'lte':
      triggered = currentValue <= rule.threshold
      break
    case 'eq':
      triggered = currentValue === rule.threshold
      break
    case 'spike':
      // Check if current value is X% higher than baseline
      const { data: baseline } = await supabase
        .from('module_performance_baselines')
        .select('baseline_mean')
        .eq('module_id', moduleId)
        .eq('metric_name', rule.metric)
        .single()

      if (baseline) {
        const spikeThreshold = baseline.baseline_mean * (1 + rule.threshold / 100)
        triggered = currentValue > spikeThreshold
      }
      break
  }

  if (triggered) {
    return {
      currentValue,
      expectedValue: rule.threshold,
    }
  }

  return null
}

async function createAlert(
  moduleId: string,
  rule: AlertRule,
  values: { currentValue: number; expectedValue: number }
): Promise<void> {
  const supabase = await createClient()

  // Check if similar alert already exists and is active
  const { data: existingAlert } = await supabase
    .from('module_alerts')
    .select('id')
    .eq('module_id', moduleId)
    .eq('alert_type', rule.alertType)
    .eq('metric_name', rule.metric)
    .eq('status', 'active')
    .single()

  if (existingAlert) {
    // Don't create duplicate alerts
    return
  }

  const alertId = uuidv4()

  await supabase.from('module_alerts').insert({
    id: alertId,
    module_id: moduleId,
    alert_type: rule.alertType,
    severity: rule.severity,
    title: generateAlertTitle(rule, values),
    description: generateAlertDescription(rule, values),
    metric_name: rule.metric,
    current_value: values.currentValue,
    expected_value: values.expectedValue,
    threshold_value: rule.threshold,
  })

  // Send notifications
  if (rule.notifyEmail) {
    await sendEmailNotification(moduleId, alertId, rule, values)
  }

  if (rule.notifyWebhook) {
    await sendWebhookNotification(rule.notifyWebhook, moduleId, alertId, rule, values)
  }
}

function generateAlertTitle(rule: AlertRule, values: { currentValue: number; expectedValue: number }): string {
  const titles: Record<string, string> = {
    performance_degradation: `Performance Degradation Detected`,
    error_spike: `Error Rate Spike Detected`,
    availability_issue: `Availability Issue Detected`,
    usage_anomaly: `Unusual Usage Pattern Detected`,
  }
  return titles[rule.alertType] || 'Alert Triggered'
}

function generateAlertDescription(
  rule: AlertRule,
  values: { currentValue: number; expectedValue: number }
): string {
  return `${rule.metric} is ${values.currentValue.toFixed(2)}, which exceeds the threshold of ${values.expectedValue.toFixed(2)} over the last ${rule.windowMinutes} minutes.`
}

async function sendEmailNotification(
  moduleId: string,
  alertId: string,
  rule: AlertRule,
  values: { currentValue: number; expectedValue: number }
): Promise<void> {
  // Integration with email service (Resend, SendGrid, etc.)
  console.log('Sending email notification for alert:', alertId)
}

async function sendWebhookNotification(
  webhookUrl: string,
  moduleId: string,
  alertId: string,
  rule: AlertRule,
  values: { currentValue: number; expectedValue: number }
): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId,
        moduleId,
        alertType: rule.alertType,
        severity: rule.severity,
        metric: rule.metric,
        currentValue: values.currentValue,
        threshold: values.expectedValue,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.error('Failed to send webhook notification:', error)
  }
}

// ============================================================================
// AUTO-RESOLUTION
// ============================================================================

export async function checkAlertResolution(): Promise<void> {
  const supabase = await createClient()

  // Get all active alerts
  const { data: activeAlerts } = await supabase
    .from('module_alerts')
    .select('*')
    .eq('status', 'active')

  if (!activeAlerts) return

  for (const alert of activeAlerts) {
    // Re-check the condition
    const { data: rules } = await supabase
      .from('module_alert_rules')
      .select('*')
      .eq('module_id', alert.module_id)
      .eq('alert_type', alert.alert_type)
      .eq('metric', alert.metric_name)
      .single()

    if (!rules) continue

    const stillTriggered = await checkAlertCondition(alert.module_id, rules)

    if (!stillTriggered) {
      // Auto-resolve the alert
      await supabase
        .from('module_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          auto_resolved: true,
        })
        .eq('id', alert.id)
    }
  }
}
```

---

## Task 7: Integrate Analytics into Studio (45 minutes)

### 7.1 Add Analytics Tab to Module Studio

```typescript
// src/components/modules/studio/module-studio-analytics.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalyticsOverview } from './analytics/analytics-overview'
import { ErrorTracker } from './analytics/error-tracker'
import { LiveMonitor } from './analytics/live-monitor'
import { BarChart2, Bug, Radio, Bell } from 'lucide-react'

interface ModuleStudioAnalyticsProps {
  moduleId: string
  currentVersionId?: string
}

export function ModuleStudioAnalytics({ moduleId, currentVersionId }: ModuleStudioAnalyticsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-4 w-full max-w-lg">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="errors" className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Errors
        </TabsTrigger>
        <TabsTrigger value="live" className="flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Live
        </TabsTrigger>
        <TabsTrigger value="alerts" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <AnalyticsOverview moduleId={moduleId} versionId={currentVersionId} />
      </TabsContent>

      <TabsContent value="errors" className="mt-6">
        <ErrorTracker moduleId={moduleId} />
      </TabsContent>

      <TabsContent value="live" className="mt-6">
        <LiveMonitor moduleId={moduleId} />
      </TabsContent>

      <TabsContent value="alerts" className="mt-6">
        {/* Alert configuration component - simplified for brevity */}
        <div className="text-center py-12 text-muted-foreground">
          Alert configuration coming in next iteration
        </div>
      </TabsContent>
    </Tabs>
  )
}
```

---

## Verification Checklist

### Database
- [ ] All analytics tables created with proper indexes
- [ ] Partitioning working for high-volume events table
- [ ] RLS policies in place for multi-tenant security

### Collection
- [ ] Events are being collected from module sandbox
- [ ] Errors are properly fingerprinted and grouped
- [ ] Performance metrics are captured accurately

### Aggregation
- [ ] Hourly aggregation job runs successfully
- [ ] Daily aggregation produces accurate rollups
- [ ] Historical data is preserved efficiently

### Dashboard
- [ ] Analytics overview shows correct metrics
- [ ] Charts render with real data
- [ ] Time range filters work correctly

### Error Tracking
- [ ] Errors are grouped by fingerprint
- [ ] Status and priority can be updated
- [ ] Stack traces are displayed properly

### Live Monitor
- [ ] Real-time subscription connects successfully
- [ ] Events appear in stream as they happen
- [ ] Live stats update every 30 seconds

### Alerting
- [ ] Alert rules can be configured
- [ ] Alerts trigger when thresholds exceeded
- [ ] Auto-resolution works correctly

---

## Summary

Phase 81D implements comprehensive analytics and monitoring for modules:

1. **Analytics Collection** - High-performance event collection with buffering
2. **Error Tracking** - Full error grouping, fingerprinting, and resolution tracking
3. **Real-Time Monitoring** - Live event stream with rolling statistics
4. **Aggregation Pipeline** - Hourly and daily rollups for efficient querying
5. **Visual Dashboards** - Charts, trends, and geographic breakdowns
6. **Alerting System** - Configurable alerts with email/webhook notifications

This gives module developers complete visibility into how their modules perform in production, enabling data-driven optimization and rapid issue resolution.

**Estimated Total Time: 10-12 hours**
