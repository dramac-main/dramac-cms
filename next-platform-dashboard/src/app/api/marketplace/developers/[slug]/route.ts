// src/app/api/marketplace/developers/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDeveloperBySlug, getDeveloperModules, getDeveloperReviews } from "@/lib/marketplace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const developer = await getDeveloperBySlug(slug);

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const includeModules = searchParams.get("includeModules") === "true";
    const includeReviews = searchParams.get("includeReviews") === "true";

    const response: Record<string, unknown> = { developer };

    if (includeModules) {
      const { modules, total } = await getDeveloperModules(developer.user_id);
      response.modules = modules;
      response.totalModules = total;
    }

    if (includeReviews) {
      const { reviews, total } = await getDeveloperReviews(developer.user_id);
      response.reviews = reviews;
      response.totalReviews = total;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Developer API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch developer" },
      { status: 500 }
    );
  }
}
