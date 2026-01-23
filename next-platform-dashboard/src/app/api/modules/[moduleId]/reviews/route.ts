// src/app/api/modules/[moduleId]/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createReview,
  getModuleReviews,
  getReviewStats,
  canReviewModule,
} from "@/lib/marketplace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") as "newest" | "oldest" | "highest" | "lowest" | "helpful" || "newest";
    const filterRating = searchParams.get("filterRating");

    const [reviewsData, stats, reviewability] = await Promise.all([
      getModuleReviews(moduleId, {
        page,
        limit,
        sortBy,
        filterRating: filterRating ? parseInt(filterRating) : undefined,
      }),
      getReviewStats(moduleId),
      canReviewModule(moduleId),
    ]);

    return NextResponse.json({
      reviews: reviewsData.reviews,
      total: reviewsData.total,
      stats,
      canReview: reviewability.canReview,
      hasExistingReview: reviewability.hasExistingReview,
      isVerifiedPurchase: reviewability.isVerifiedPurchase,
    });
  } catch (error) {
    console.error("[Reviews API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();

    const { rating, title, content, pros, cons } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating. Must be between 1 and 5." },
        { status: 400 }
      );
    }

    const review = await createReview(moduleId, {
      rating,
      title,
      content,
      pros,
      cons,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[Reviews API] POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create review";
    const status = message.includes("already reviewed") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
