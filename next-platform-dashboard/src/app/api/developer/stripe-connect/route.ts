// src/app/api/developer/stripe-connect/route.ts
// DEPRECATED: Stripe Connect is no longer used. Payout setup is handled via /api/developer/payout-account
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/developer/payout-account instead." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/developer/payout-account instead." },
    { status: 410 }
  );
}
