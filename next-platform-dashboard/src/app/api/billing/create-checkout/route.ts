import { NextResponse } from "next/server";

/**
 * DEPRECATED: Stripe Checkout Route
 * 
 * This route previously used Stripe. Billing is now handled by Paddle.
 * Use /api/billing/paddle/checkout instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/billing/paddle/checkout instead." },
    { status: 410 }
  );
}
