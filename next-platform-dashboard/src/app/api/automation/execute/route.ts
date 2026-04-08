/**
 * Internal Automation Execution API
 *
 * Runs workflow executions in their own serverless function invocation,
 * independent of the caller's lifecycle. This prevents Vercel from killing
 * the execution when the original request (booking/order) completes.
 *
 * Auth: CRON_SECRET bearer token (same as other internal endpoints).
 */

import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow } from "@/modules/automation/services/execution-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — enough for multi-step workflows

export async function POST(request: NextRequest) {
  // Authenticate with CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { executionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { executionId } = body;
  if (!executionId || typeof executionId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid executionId" },
      { status: 400 },
    );
  }

  try {
    await executeWorkflow(executionId);
    return NextResponse.json({ success: true, executionId });
  } catch (error) {
    console.error(
      `[Automation Execute API] Workflow ${executionId} failed:`,
      error,
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        executionId,
      },
      { status: 500 },
    );
  }
}
