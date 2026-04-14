import { NextRequest, NextResponse } from "next/server";
import { checkOverdueInvoices } from "@/modules/invoicing/services/overdue-service";

export const dynamic = "force-dynamic";

/**
 * Check for overdue invoices and send reminders.
 * Called daily by Vercel Cron at 07:00 UTC (09:00 Lusaka).
 * Runs after recurring invoice generation (06:00 UTC).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkOverdueInvoices();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Processing failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
