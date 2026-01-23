// src/app/api/modules/[moduleId]/view/route.ts

import { NextRequest, NextResponse } from "next/server";
import { logModuleView, updateViewEngagement } from "@/lib/marketplace";

// POST /api/modules/[moduleId]/view - Log a module view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const body = await request.json().catch(() => ({}));

    const { sessionId } = body;

    await logModuleView(moduleId, sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Module View API] POST error:", error);
    // Don't fail on view tracking errors - just log and return success
    return NextResponse.json({ success: true });
  }
}

// PATCH /api/modules/[moduleId]/view - Update view engagement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();

    const { viewDurationSeconds, scrolledToBottom, clickedInstall } = body;

    await updateViewEngagement(moduleId, {
      viewDurationSeconds,
      scrolledToBottom,
      clickedInstall,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Module View API] PATCH error:", error);
    // Don't fail on engagement tracking errors
    return NextResponse.json({ success: true });
  }
}
