import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { error } = await supabase.from("agencies").select("id").limit(1);

    const dbStatus = error ? "error" : "healthy";
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
      responseTime: `${responseTime}ms`,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
