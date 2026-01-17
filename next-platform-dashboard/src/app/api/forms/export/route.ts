import { NextRequest, NextResponse } from "next/server";
import { exportSubmissionsCSV, SubmissionFilters } from "@/lib/forms/submission-service";

type SubmissionStatus = "new" | "read" | "archived" | "spam";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status") || undefined;
    const formId = searchParams.get("formId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!siteId) {
      return NextResponse.json(
        { error: "Missing siteId parameter" },
        { status: 400 }
      );
    }

    const filters: SubmissionFilters = {
      status: status as SubmissionStatus | undefined,
      formId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await exportSubmissionsCSV(siteId, filters);

    if (!result) {
      return NextResponse.json(
        { error: "No submissions to export or access denied" },
        { status: 404 }
      );
    }

    // Return CSV file
    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[ExportSubmissions] Error:", error);
    return NextResponse.json(
      { error: "Failed to export submissions" },
      { status: 500 }
    );
  }
}
