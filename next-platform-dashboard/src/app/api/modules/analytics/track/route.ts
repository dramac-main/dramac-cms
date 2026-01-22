// src/app/api/modules/analytics/track/route.ts
// Phase EM-03: Analytics Event Tracking API

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  trackEventServer,
  trackEventsServer,
  type AnalyticsEvent,
} from "@/lib/modules/analytics/module-analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();

    // Get context from headers
    const context = {
      userAgent: headersList.get("user-agent") || undefined,
      ip:
        headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        undefined,
      country: headersList.get("cf-ipcountry") || undefined, // Cloudflare
    };

    // Check if this is a batch request
    if (body.batch && Array.isArray(body.batch)) {
      // Validate batch events
      const validEvents: AnalyticsEvent[] = [];
      for (const event of body.batch) {
        if (isValidEvent(event)) {
          validEvents.push(event);
        }
      }

      if (validEvents.length === 0) {
        return NextResponse.json(
          { error: "No valid events in batch" },
          { status: 400 }
        );
      }

      await trackEventsServer(validEvents, context);

      return NextResponse.json({
        success: true,
        tracked: validEvents.length,
      });
    }

    // Single event tracking
    if (!isValidEvent(body)) {
      return NextResponse.json(
        { error: "Missing required fields: moduleId, eventType, eventName" },
        { status: 400 }
      );
    }

    await trackEventServer(body, context);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

function isValidEvent(
  event: unknown
): event is AnalyticsEvent {
  if (typeof event !== "object" || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.moduleId === "string" &&
    typeof e.eventType === "string" &&
    typeof e.eventName === "string"
  );
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
