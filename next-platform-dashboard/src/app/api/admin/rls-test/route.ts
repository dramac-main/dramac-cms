import { NextResponse } from "next/server";
import {
  testRLSPolicies,
  testCrossAgencyIsolation,
  verifySuperAdminAccess,
} from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/rls-test
 * 
 * Test RLS policies and return results.
 * Only accessible to super admins in production.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - must be logged in" },
        { status: 401 }
      );
    }

    // Check if user is super admin (only they should see full test results)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // In production, only allow super admins
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - super admin access required" },
        { status: 403 }
      );
    }

    // Run all RLS tests
    const [rlsResults, isolationResults, superAdminResults] = await Promise.all(
      [
        testRLSPolicies(),
        testCrossAgencyIsolation(),
        profile?.role === "super_admin"
          ? verifySuperAdminAccess()
          : Promise.resolve({ hasFullAccess: false, tables: [] }),
      ]
    );

    // Determine overall security status
    const securityStatus =
      rlsResults.failedTests === 0 && isolationResults.isolated
        ? "SECURE"
        : "ISSUES_DETECTED";

    return NextResponse.json({
      status: securityStatus,
      environment: process.env.NODE_ENV,
      rlsTests: rlsResults,
      dataIsolation: isolationResults,
      superAdminAccess: superAdminResults,
      summary: {
        totalTablesTested: rlsResults.totalTests,
        passedTests: rlsResults.passedTests,
        failedTests: rlsResults.failedTests,
        dataIsolated: isolationResults.isolated,
        criticalIssues: rlsResults.results
          .filter((r) => !r.passed)
          .map((r) => `${r.table}: ${r.message}`),
      },
    });
  } catch (error) {
    console.error("RLS test error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during RLS test",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
