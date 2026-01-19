/**
 * Module Events Service
 * 
 * Provides pub/sub event system for inter-module communication.
 * Features:
 * - Event emission and subscription
 * - Site-scoped events
 * - Targeted module events
 * - Event history/logging
 * - Real-time notifications via SSE
 * 
 * @module module-events
 */

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface ModuleEvent {
  id: string;
  eventName: string;
  sourceModuleId: string;
  targetModuleId?: string;
  siteId: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processedAt?: string;
  createdAt: string;
}

export interface EventSubscription {
  moduleId: string;
  eventNames: string[];
  callback?: (event: ModuleEvent) => void;
}

export interface EmitEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface EventFilter {
  eventName?: string;
  sourceModuleId?: string;
  targetModuleId?: string;
  processed?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================================================
// Event Names (Conventions)
// ============================================================================

/**
 * Standard event name patterns:
 * 
 * module:<action>      - Module lifecycle events
 * data:<entity>:<action> - Data change events  
 * user:<action>        - User action events
 * system:<action>      - System events
 * custom:<name>        - Custom module events
 */
const STANDARD_EVENTS = {
  // Module lifecycle
  MODULE_INSTALLED: "module:installed",
  MODULE_UNINSTALLED: "module:uninstalled",
  MODULE_SETTINGS_CHANGED: "module:settings_changed",
  MODULE_ENABLED: "module:enabled",
  MODULE_DISABLED: "module:disabled",
  
  // Data events
  DATA_CREATED: "data:created",
  DATA_UPDATED: "data:updated",
  DATA_DELETED: "data:deleted",
  
  // User events
  USER_ACTION: "user:action",
  USER_FORM_SUBMITTED: "user:form_submitted",
  
  // System events
  SYSTEM_ERROR: "system:error",
  SYSTEM_WARNING: "system:warning",
} as const;

// ============================================================================
// Event Emission
// ============================================================================

/**
 * Emit an event from a module
 */
export async function emitEvent(
  sourceModuleId: string,
  siteId: string,
  eventName: string,
  payload: Record<string, unknown> = {},
  targetModuleId?: string
): Promise<EmitEventResult> {
  const supabase = await createClient();

  // Validate event name
  if (!eventName || typeof eventName !== "string") {
    return { success: false, error: "Event name is required" };
  }

  // Validate payload is serializable
  try {
    JSON.stringify(payload);
  } catch {
    return { success: false, error: "Event payload must be JSON serializable" };
  }

  // Convert payload to JSON-compatible type
  const jsonPayload = JSON.parse(JSON.stringify(payload));

  const { data, error } = await supabase
    .from("module_events")
    .insert({
      event_name: eventName,
      source_module_id: sourceModuleId,
      target_module_id: targetModuleId || null,
      site_id: siteId,
      payload: jsonPayload,
      processed: false,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Trigger real-time notifications (if using Supabase Realtime)
  // This happens automatically via Supabase subscriptions

  return { success: true, eventId: data.id };
}

/**
 * Emit multiple events in a batch
 */
export async function emitEvents(
  events: Array<{
    sourceModuleId: string;
    siteId: string;
    eventName: string;
    payload?: Record<string, unknown>;
    targetModuleId?: string;
  }>
): Promise<{ success: boolean; eventIds: string[]; errors: string[] }> {
  const supabase = await createClient();
  const eventIds: string[] = [];
  const errors: string[] = [];

  const records = events.map((e) => ({
    event_name: e.eventName,
    source_module_id: e.sourceModuleId,
    target_module_id: e.targetModuleId || null,
    site_id: e.siteId,
    payload: JSON.parse(JSON.stringify(e.payload || {})),
    processed: false,
  }));

  const { data, error } = await supabase
    .from("module_events")
    .insert(records)
    .select("id");

  if (error) {
    errors.push(error.message);
  } else if (data) {
    eventIds.push(...data.map((d) => d.id));
  }

  return {
    success: errors.length === 0,
    eventIds,
    errors,
  };
}

// ============================================================================
// Event Retrieval
// ============================================================================

/**
 * Get pending events for a module
 */
export async function getPendingEvents(
  targetModuleId: string,
  siteId: string,
  limit: number = 50
): Promise<ModuleEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_events")
    .select("*")
    .eq("site_id", siteId)
    .eq("processed", false)
    .or(`target_module_id.eq.${targetModuleId},target_module_id.is.null`)
    .order("created_at", { ascending: true })
    .limit(limit);

  return (data || []).map(mapEventFromDb);
}

/**
 * Get events with filters
 */
export async function getEvents(
  siteId: string,
  filters: EventFilter = {}
): Promise<ModuleEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("module_events")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (filters.eventName) {
    query = query.eq("event_name", filters.eventName);
  }

  if (filters.sourceModuleId) {
    query = query.eq("source_module_id", filters.sourceModuleId);
  }

  if (filters.targetModuleId) {
    query = query.eq("target_module_id", filters.targetModuleId);
  }

  if (filters.processed !== undefined) {
    query = query.eq("processed", filters.processed);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data } = await query;

  return (data || []).map(mapEventFromDb);
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  eventId: string
): Promise<ModuleEvent | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_events")
    .select("*")
    .eq("id", eventId)
    .single();

  return data ? mapEventFromDb(data) : null;
}

// ============================================================================
// Event Processing
// ============================================================================

/**
 * Mark an event as processed
 */
export async function markEventProcessed(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("module_events")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark multiple events as processed
 */
export async function markEventsProcessed(
  eventIds: string[]
): Promise<{ success: boolean; processed: number; error?: string }> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("module_events")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .in("id", eventIds);

  if (error) {
    return { success: false, processed: 0, error: error.message };
  }

  return { success: true, processed: count || 0 };
}

/**
 * Process and acknowledge events for a module
 */
export async function acknowledgeEvents(
  moduleId: string,
  siteId: string,
  eventIds: string[]
): Promise<{ success: boolean; acknowledged: number }> {
  const result = await markEventsProcessed(eventIds);
  
  return {
    success: result.success,
    acknowledged: result.processed,
  };
}

// ============================================================================
// Event Cleanup
// ============================================================================

/**
 * Delete old processed events
 */
export async function cleanupOldEvents(
  olderThanDays: number = 30
): Promise<{ success: boolean; deleted: number; error?: string }> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { error, count } = await supabase
    .from("module_events")
    .delete()
    .eq("processed", true)
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    return { success: false, deleted: 0, error: error.message };
  }

  return { success: true, deleted: count || 0 };
}

/**
 * Delete all events for a module
 */
export async function deleteModuleEvents(
  moduleId: string,
  siteId: string
): Promise<{ success: boolean; deleted: number; error?: string }> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("module_events")
    .delete()
    .eq("site_id", siteId)
    .or(`source_module_id.eq.${moduleId},target_module_id.eq.${moduleId}`);

  if (error) {
    return { success: false, deleted: 0, error: error.message };
  }

  return { success: true, deleted: count || 0 };
}

// ============================================================================
// Event Statistics
// ============================================================================

/**
 * Get event statistics for a site
 */
export async function getEventStats(
  siteId: string,
  since?: string
): Promise<{
  total: number;
  pending: number;
  processed: number;
  byEventName: Record<string, number>;
  bySourceModule: Record<string, number>;
}> {
  const supabase = await createClient();

  let query = supabase
    .from("module_events")
    .select("event_name, source_module_id, processed")
    .eq("site_id", siteId);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data } = await query;
  const events = data || [];

  const stats = {
    total: events.length,
    pending: 0,
    processed: 0,
    byEventName: {} as Record<string, number>,
    bySourceModule: {} as Record<string, number>,
  };

  for (const event of events) {
    if (event.processed) {
      stats.processed++;
    } else {
      stats.pending++;
    }

    stats.byEventName[event.event_name] = (stats.byEventName[event.event_name] || 0) + 1;
    stats.bySourceModule[event.source_module_id] = (stats.bySourceModule[event.source_module_id] || 0) + 1;
  }

  return stats;
}

// ============================================================================
// Real-time Subscriptions (Client-side helper)
// ============================================================================

/**
 * Create subscription config for Supabase Realtime
 * Use this on the client to subscribe to events
 */
function createEventSubscriptionConfig(
  siteId: string,
  moduleId?: string,
  eventNames?: string[]
) {
  const filter = moduleId
    ? `site_id=eq.${siteId},target_module_id=in.(${moduleId},null)`
    : `site_id=eq.${siteId}`;

  return {
    schema: "public",
    table: "module_events",
    filter,
    event: "INSERT" as const,
    // Post-filter in callback if eventNames specified
    eventNames,
  };
}

// ============================================================================
// Event Handlers (Server-side processing)
// ============================================================================

/**
 * Register an event handler (for server-side processing)
 * This would be used with a job queue or webhook system
 */
interface EventHandler {
  eventName: string | RegExp;
  handler: (event: ModuleEvent) => Promise<void>;
}

const eventHandlers: EventHandler[] = [];

function registerEventHandler(
  eventName: string | RegExp,
  handler: (event: ModuleEvent) => Promise<void>
): void {
  eventHandlers.push({ eventName, handler });
}

/**
 * Process an event through registered handlers
 */
export async function processEvent(event: ModuleEvent): Promise<void> {
  for (const { eventName, handler } of eventHandlers) {
    const matches = typeof eventName === "string"
      ? event.eventName === eventName
      : eventName.test(event.eventName);

    if (matches) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[ModuleEvents] Handler error for ${event.eventName}:`, error);
      }
    }
  }
}

/**
 * Process all pending events (for background job)
 */
export async function processAllPendingEvents(
  siteId: string,
  batchSize: number = 100
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  const supabase = await createClient();

  // Get pending events
  const { data: events } = await supabase
    .from("module_events")
    .select("*")
    .eq("site_id", siteId)
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  for (const eventData of events || []) {
    const event = mapEventFromDb(eventData);
    
    try {
      await processEvent(event);
      await markEventProcessed(event.id);
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}

// ============================================================================
// Utility Functions
// ============================================================================

function mapEventFromDb(data: Record<string, unknown>): ModuleEvent {
  return {
    id: data.id as string,
    eventName: data.event_name as string,
    sourceModuleId: data.source_module_id as string,
    targetModuleId: data.target_module_id as string | undefined,
    siteId: data.site_id as string,
    payload: (data.payload || {}) as Record<string, unknown>,
    processed: data.processed as boolean,
    processedAt: data.processed_at as string | undefined,
    createdAt: data.created_at as string,
  };
}

/**
 * Validate event name format
 */
function isValidEventName(eventName: string): boolean {
  // Event names should be lowercase with colons and underscores
  return /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/.test(eventName);
}

/**
 * Create a namespaced event name
 */
function createEventName(namespace: string, action: string): string {
  return `${namespace.toLowerCase()}:${action.toLowerCase()}`;
}
