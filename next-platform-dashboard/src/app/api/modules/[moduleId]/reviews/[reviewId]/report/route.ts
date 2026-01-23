// src/app/api/modules/[moduleId]/reviews/[reviewId]/report/route.ts

import { NextRequest, NextResponse } from "next/server";
import { reportReview } from "@/lib/marketplace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();

    const { reason, details } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Report reason is required." },
        { status: 400 }
      );
    }

    await reportReview(reviewId, reason.trim(), details?.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reviews API] Report error:", error);
    const message = error instanceof Error ? error.message : "Failed to report review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
