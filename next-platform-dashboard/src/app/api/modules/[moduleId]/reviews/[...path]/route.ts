/**
 * Module Reviews Catch-All API Route
 * 
 * Consolidated route handler for review sub-operations.
 * Replaces individual route files to reduce Vercel route count.
 * 
 * Handles:
 * - GET/PATCH/DELETE /reviews/[reviewId]
 * - POST /reviews/[reviewId]/vote
 * - POST /reviews/[reviewId]/response
 * - POST /reviews/[reviewId]/report
 */

import { NextRequest, NextResponse } from "next/server";
import {
  updateReview,
  deleteReview,
  voteReview,
  reportReview,
  addDeveloperResponse,
} from "@/lib/marketplace";

function notFound(action: string) {
  return NextResponse.json(
    { error: `Unknown review action: ${action}` },
    { status: 404 }
  );
}

// =============================================================
// GET /reviews/[reviewId]
// =============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { path } = await params;

  // Only handle /reviews/[reviewId] (single segment)
  if (path.length !== 1) {
    return notFound(path.join('/'));
  }

  // The base reviews/[reviewId] GET is handled by the individual route
  // This catch-all only handles sub-paths
  return notFound(path.join('/'));
}

// =============================================================
// PATCH /reviews/[reviewId]
// =============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { path } = await params;

  if (path.length !== 1) {
    return notFound(path.join('/'));
  }

  const reviewId = path[0];

  try {
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

// =============================================================
// DELETE /reviews/[reviewId]
// =============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { path } = await params;

  if (path.length !== 1) {
    return notFound(path.join('/'));
  }

  const reviewId = path[0];

  try {
    await deleteReview(reviewId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reviews API] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// =============================================================
// POST /reviews/[reviewId]/vote|response|report
// =============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { path } = await params;

  // Handle /reviews/[reviewId]/action
  if (path.length !== 2) {
    return notFound(path.join('/'));
  }

  const reviewId = path[0];
  const action = path[1];

  switch (action) {
    case 'vote':
      return handleVote(request, reviewId);
    case 'response':
      return handleResponse(request, reviewId);
    case 'report':
      return handleReport(request, reviewId);
    default:
      return notFound(path.join('/'));
  }
}

async function handleVote(request: NextRequest, reviewId: string) {
  try {
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

async function handleResponse(request: NextRequest, reviewId: string) {
  try {
    const body = await request.json();
    const { response } = body;

    if (!response || typeof response !== "string" || response.trim().length === 0) {
      return NextResponse.json(
        { error: "Response text is required." },
        { status: 400 }
      );
    }

    if (response.length > 2000) {
      return NextResponse.json(
        { error: "Response must be 2000 characters or less." },
        { status: 400 }
      );
    }

    await addDeveloperResponse(reviewId, response.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reviews API] Developer response error:", error);
    const message = error instanceof Error ? error.message : "Failed to add response";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function handleReport(request: NextRequest, reviewId: string) {
  try {
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
