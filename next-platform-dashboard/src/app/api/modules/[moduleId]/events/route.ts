/**
 * Module Events API Route
 * 
 * Handles event emission and retrieval for inter-module communication.
 * Supports both REST API and Server-Sent Events (SSE) for real-time.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  emitEvent,
  getEvents,
  getPendingEvents,
  markEventProcessed,
  acknowledgeEvents,
  getEventStats,
} from "@/lib/modules/module-events";

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

/**
 * GET /api/modules/[moduleId]/events
 * Retrieve events for a module
 * Query params:
 *   - siteId: Required site context
 *   - action: "list" | "pending" | "stats" | "stream"
 *   - eventName: Filter by event name
 *   - sourceModuleId: Filter by source module
 *   - processed: Filter by processed status
 *   - since: Filter events after this ISO date
 *   - limit: Max events to return (default 50)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const action = searchParams.get("action") || "list";

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    switch (action) {
      case "pending": {
        const limit = parseInt(searchParams.get("limit") || "50");
        const events = await getPendingEvents(moduleId, siteId, limit);
        return NextResponse.json({ events });
      }

      case "stats": {
        const since = searchParams.get("since") || undefined;
        const stats = await getEventStats(siteId, since);
        return NextResponse.json(stats);
      }

      case "stream": {
        // Server-Sent Events for real-time
        return createEventStream(moduleId, siteId, supabase);
      }

      case "list":
      default: {
        const filters = {
          eventName: searchParams.get("eventName") || undefined,
          sourceModuleId: searchParams.get("sourceModuleId") || undefined,
          processed: searchParams.has("processed") 
            ? searchParams.get("processed") === "true" 
            : undefined,
          startDate: searchParams.get("since") || undefined,
          limit: parseInt(searchParams.get("limit") || "50"),
        };
        const events = await getEvents(siteId, filters);
        return NextResponse.json({ events });
      }
    }
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules/[moduleId]/events
 * Emit an event from a module
 * Body: {
 *   siteId: string,
 *   eventName: string,
 *   payload?: Record<string, unknown>,
 *   targetModuleId?: string
 * }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, eventName, payload, targetModuleId } = body as {
      siteId: string;
      eventName: string;
      payload?: Record<string, unknown>;
      targetModuleId?: string;
    };

    if (!siteId || !eventName) {
      return NextResponse.json(
        { error: "siteId and eventName are required" },
        { status: 400 }
      );
    }

    // Validate event name format
    if (!/^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/.test(eventName)) {
      return NextResponse.json(
        { error: "Invalid event name format. Use namespace:action pattern (e.g., module:installed)" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const result = await emitEvent(
      moduleId,
      siteId,
      eventName,
      payload || {},
      targetModuleId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
    });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/modules/[moduleId]/events
 * Mark events as processed/acknowledged
 * Body: {
 *   siteId: string,
 *   eventIds: string[]
 * }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, eventIds, action } = body as {
      siteId: string;
      eventIds: string[];
      action?: "acknowledge" | "process";
    };

    if (!siteId || !eventIds || !Array.isArray(eventIds)) {
      return NextResponse.json(
        { error: "siteId and eventIds array are required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "acknowledge") {
      const result = await acknowledgeEvents(moduleId, siteId, eventIds);
      return NextResponse.json({
        success: result.success,
        acknowledged: result.acknowledged,
      });
    } else {
      // Mark as processed
      let processed = 0;
      for (const eventId of eventIds) {
        const result = await markEventProcessed(eventId);
        if (result.success) processed++;
      }
      return NextResponse.json({
        success: true,
        processed,
      });
    }
  } catch (error) {
    console.error("Events PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a Server-Sent Events stream for real-time events
 */
function createEventStream(
  moduleId: string,
  siteId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", moduleId, siteId })}\n\n`)
      );

      // Set up Supabase Realtime subscription
      const channel = supabase
        .channel(`module-events-${moduleId}-${siteId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "module_events",
            filter: `site_id=eq.${siteId}`,
          },
          (payload) => {
            const event = payload.new;
            // Check if this event is for this module (targeted or broadcast)
            if (!event.target_module_id || event.target_module_id === moduleId) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: "event",
                  event: {
                    id: event.id,
                    eventName: event.event_name,
                    sourceModuleId: event.source_module_id,
                    payload: event.payload,
                    createdAt: event.created_at,
                  }
                })}\n\n`)
              );
            }
          }
        )
        .subscribe();

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
          );
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(pingInterval);
        channel.unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/**
 * Verify user has access to module for this site
 */
async function verifyModuleAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  siteId: string,
  userId: string
): Promise<boolean> {
  // Check if user has agency access - use type assertion for agency_members table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: access } = await (supabase as any)
    .from("agency_members")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!access) return false;

  // Admins and owners have full access
  if (access.role === "admin" || access.role === "owner") {
    return true;
  }

  // Check if module is installed on this site
  const { data: installation } = await supabase
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .single();

  return !!installation;
}
