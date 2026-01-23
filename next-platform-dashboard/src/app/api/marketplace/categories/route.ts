// src/app/api/marketplace/categories/route.ts

import { NextResponse } from "next/server";
import { getCategories } from "@/lib/marketplace";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[Marketplace Categories API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
