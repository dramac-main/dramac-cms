import { NextResponse } from "next/server";

// DEPRECATED: Billing has migrated to Paddle. This endpoint is no longer active.
// See /api/webhooks/paddle/route.ts for the active webhook handler.

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been deprecated. Billing uses Paddle." },
    { status: 410 }
  );
}
