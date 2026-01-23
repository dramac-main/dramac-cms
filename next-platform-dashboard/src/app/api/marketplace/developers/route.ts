// src/app/api/marketplace/developers/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentDeveloperProfile,
  createDeveloperProfile,
  updateDeveloperProfile,
  isSlugAvailable,
  getVerifiedDevelopers,
  getTopDevelopers,
} from "@/lib/marketplace";

// GET /api/marketplace/developers - Get current user's profile or list developers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    // Check slug availability
    if (action === "checkSlug") {
      const slug = searchParams.get("slug");
      if (!slug) {
        return NextResponse.json(
          { error: "Slug parameter required" },
          { status: 400 }
        );
      }
      const available = await isSlugAvailable(slug);
      return NextResponse.json({ available });
    }

    // Get verified developers
    if (action === "verified") {
      const limit = parseInt(searchParams.get("limit") || "10");
      const developers = await getVerifiedDevelopers(limit);
      return NextResponse.json({ developers });
    }

    // Get top developers
    if (action === "top") {
      const metric = (searchParams.get("metric") as "downloads" | "rating" | "modules") || "downloads";
      const limit = parseInt(searchParams.get("limit") || "10");
      const developers = await getTopDevelopers(metric, limit);
      return NextResponse.json({ developers });
    }

    // Get current user's profile
    const profile = await getCurrentDeveloperProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Developer API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch developer profile" },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/developers - Create developer profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      display_name,
      slug,
      bio,
      avatar_url,
      cover_image_url,
      website_url,
      github_url,
      twitter_url,
      linkedin_url,
      accepts_custom_requests,
      custom_request_rate,
    } = body;

    if (!display_name || !slug) {
      return NextResponse.json(
        { error: "display_name and slug are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const profile = await createDeveloperProfile({
      display_name,
      slug,
      bio,
      avatar_url,
      cover_image_url,
      website_url,
      github_url,
      twitter_url,
      linkedin_url,
      accepts_custom_requests,
      custom_request_rate,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("[Developer API] POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create profile";
    const status = message.includes("already exists") || message.includes("already taken") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/marketplace/developers - Update developer profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      display_name,
      slug,
      bio,
      avatar_url,
      cover_image_url,
      website_url,
      github_url,
      twitter_url,
      linkedin_url,
      accepts_custom_requests,
      custom_request_rate,
    } = body;

    // Validate slug format if provided
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const profile = await updateDeveloperProfile({
      display_name,
      slug,
      bio,
      avatar_url,
      cover_image_url,
      website_url,
      github_url,
      twitter_url,
      linkedin_url,
      accepts_custom_requests,
      custom_request_rate,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Developer API] PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update profile";
    const status = message.includes("already taken") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
