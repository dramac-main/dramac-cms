import { NextRequest, NextResponse } from "next/server";
import { processRecurringInvoices } from "@/modules/invoicing/services/recurring-engine-service";

export const dynamic = "force-dynamic";

/**
 * Process due recurring invoices.
 * Called by the unified cron dispatcher daily.
 * Also callable standalone with CRON_SECRET auth.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processRecurringInvoices();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Processing failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
