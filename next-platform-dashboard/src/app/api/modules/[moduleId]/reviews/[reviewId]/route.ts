// src/app/api/modules/[moduleId]/reviews/[reviewId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  updateReview,
  deleteReview,
  voteReview,
  reportReview,
  addDeveloperResponse,
} from "@/lib/marketplace";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();

    const { rating, title, content, pros, cons } = body;

    const review = await updateReview(reviewId, {
      rating,
      title,
      content,
      pros,
      cons,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[Reviews API] PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    
    await deleteReview(reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reviews API] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
