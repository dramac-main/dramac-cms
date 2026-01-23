// src/app/api/developer/revenue/export/route.ts
// Phase EM-43: Revenue Sharing Dashboard - Export API

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revenueService } from "@/lib/revenue";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get developer profile
    const developerProfile = await revenueService.getDeveloperProfile(user.id);

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    const developerId = developerProfile.id;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "csv";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Fetch sales data
    const { sales } = await revenueService.getSalesHistory(developerId, {
      startDate,
      endDate,
      limit: 10000, // Get all sales for export
    });

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date",
        "Module",
        "Transaction Type",
        "Gross Amount",
        "Platform Fee",
        "Net Amount",
        "Status",
        "Currency",
      ];

      const rows = sales.map((sale) => [
        new Date(sale.created_at).toISOString().split("T")[0],
        sale.module?.name || "Unknown",
        sale.transaction_type,
        sale.gross_amount.toFixed(2),
        sale.platform_fee.toFixed(2),
        sale.developer_amount.toFixed(2),
        sale.status,
        sale.currency,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="revenue-${startDate}-${endDate}.csv"`,
        },
      });
    }

    // For PDF format - return a JSON summary that can be rendered as PDF client-side
    // In production, you would use a PDF generation library
    const summary = await revenueService.getEarningsSummary(developerId);
    const analytics = await revenueService.getRevenueAnalytics(developerId, {
      startDate,
      endDate,
    });

    return NextResponse.json({
      period: { startDate, endDate },
      summary,
      analytics,
      sales,
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Failed to export revenue data" },
      { status: 500 }
    );
  }
}
