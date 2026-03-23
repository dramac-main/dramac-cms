/**
 * Payment Proof Upload API
 *
 * Accepts a file upload (FormData) from the storefront and delegates to the
 * `uploadPaymentProof` server action. This route exists because server actions
 * cannot accept FormData with raw file bytes – we convert to base64 here.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadPaymentProof } from "@/modules/ecommerce/actions/public-ecommerce-actions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const siteId = formData.get("siteId") as string | null;
    const orderId = formData.get("orderId") as string | null;
    const orderNumber = formData.get("orderNumber") as string | null;
    const file = formData.get("file") as File | null;

    if (!siteId || !orderId || !orderNumber || !file) {
      return NextResponse.json(
        { error: "Missing required fields: siteId, orderId, orderNumber, file" },
        { status: 400 },
      );
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
