/**
 * Payment Proof Upload API
 *
 * Accepts a file upload (FormData) from the storefront and delegates to the
 * `uploadPaymentProof` server action. This route exists because server actions
 * cannot accept FormData with raw file bytes – we convert to base64 here.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadPaymentProof } from "@/modules/ecommerce/actions/public-ecommerce-actions";
import { PUBLIC_RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { isValidUUID, validateFileUpload } from "@/lib/api-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 uploads/minute per IP
    const ip = getClientIp(request);
    const rl = PUBLIC_RATE_LIMITS.paymentProof.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    const formData = await request.formData();

    const siteId = formData.get("siteId") as string | null;
    const orderId = formData.get("orderId") as string | null;
    const orderNumber = formData.get("orderNumber") as string | null;
    const file = formData.get("file") as File | null;

    if (!siteId || !orderId || !orderNumber || !file) {
      return NextResponse.json(
        {
          error: "Missing required fields: siteId, orderId, orderNumber, file",
        },
        { status: 400 },
      );
    }

    // Validate UUID formats
    if (!isValidUUID(siteId) || !isValidUUID(orderId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Validate orderNumber length
    if (orderNumber.length > 50) {
      return NextResponse.json(
        { error: "Invalid order number" },
        { status: 400 },
      );
    }

    // Validate file upload (size, MIME type, filename)
    const fileCheck = validateFileUpload(file);
    if (!fileCheck.valid) {
      return NextResponse.json({ error: fileCheck.error }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const result = await uploadPaymentProof({
      siteId,
      orderId,
      orderNumber,
      fileName: file.name,
      fileBase64: base64,
      contentType: file.type,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PaymentProof API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
