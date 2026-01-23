// src/app/api/modules/[moduleId]/reviews/[reviewId]/response/route.ts

import { NextRequest, NextResponse } from "next/server";
import { addDeveloperResponse } from "@/lib/marketplace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
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
