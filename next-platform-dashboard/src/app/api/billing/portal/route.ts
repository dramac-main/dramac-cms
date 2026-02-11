import { NextResponse } from "next/server";

/**
 * DEPRECATED: Stripe Billing Portal Route
 * 
 * This route previously used Stripe. Billing is now handled by Paddle.
 * Use /api/billing/paddle/subscription/update-payment instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/billing/paddle/subscription/update-payment instead." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/billing/paddle/subscription/update-payment instead." },
    { status: 410 }
  );
}
