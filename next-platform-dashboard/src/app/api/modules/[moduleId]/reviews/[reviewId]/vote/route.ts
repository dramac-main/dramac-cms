// src/app/api/modules/[moduleId]/reviews/[reviewId]/vote/route.ts

import { NextRequest, NextResponse } from "next/server";
import { voteReview } from "@/lib/marketplace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();

    const { voteType } = body;

    if (!voteType || !["helpful", "not_helpful"].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type. Must be 'helpful' or 'not_helpful'." },
        { status: 400 }
      );
    }

    await voteReview(reviewId, voteType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reviews API] Vote error:", error);
    const message = error instanceof Error ? error.message : "Failed to vote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
