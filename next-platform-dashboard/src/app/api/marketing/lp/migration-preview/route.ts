/**
 * Migration Preview API Route
 *
 * Phase LPB-11: POST handler for block → studio migration preview.
 * Returns original blocks, converted tree, and warnings.
 */
import { NextRequest, NextResponse } from "next/server";
import { previewBlockMigration } from "@/modules/marketing/actions/lp-migration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lpId } = body;

    if (!lpId || typeof lpId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid lpId" },
        { status: 400 },
      );
    }

    const result = await previewBlockMigration(lpId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
