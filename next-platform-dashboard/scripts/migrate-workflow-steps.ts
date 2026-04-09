/**
 * One-shot migration script: upgrade stale workflow steps.
 * Run with: npx tsx scripts/migrate-workflow-steps.ts
 * Safe to re-run (idempotent).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// Import templates directly
import { SYSTEM_WORKFLOW_TEMPLATES } from "../src/modules/automation/lib/system-templates";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STALE_ACTION_TYPES = [
  "email.send_branded_template",
  "email.send_branded",
  "email.send_system",
];

async function migrate() {
  console.log("Starting workflow step migration...\n");

  // Get all sites that have system workflows
  const { data: sites, error: sitesErr } = await supabase
    .from("automation_workflows")
    .select("site_id")
    .eq("is_system", true);

  if (sitesErr) {
    console.error("Failed to query sites:", sitesErr.message);
    process.exit(1);
  }

  const uniqueSiteIds = [
    ...new Set((sites || []).map((s: { site_id: string }) => s.site_id)),
  ];
  console.log(`Found ${uniqueSiteIds.length} site(s) with system workflows.\n`);

  let totalUpgraded = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const siteId of uniqueSiteIds) {
    console.log(`--- Site: ${siteId} ---`);

    const { data: workflows, error: fetchErr } = await supabase
      .from("automation_workflows")
      .select("id, system_event_type, name")
      .eq("site_id", siteId)
      .eq("is_system", true);

    if (fetchErr || !workflows) {
      errors.push(`Site ${siteId}: ${fetchErr?.message || "no workflows"}`);
      continue;
    }

    for (const wf of workflows) {
      const eventType = wf.system_event_type as string | null;
      if (!eventType) {
        totalSkipped++;
        continue;
      }

      const template = SYSTEM_WORKFLOW_TEMPLATES.find(
        (t) => t.systemEventType === eventType,
      );
      if (!template) {
        totalSkipped++;
        continue;
      }

      // Get existing steps
      const { data: existingSteps } = await supabase
        .from("workflow_steps")
        .select("id, action_type")
        .eq("workflow_id", wf.id);

      const hasStale = (existingSteps || []).some(
        (s: { action_type: string }) =>
          STALE_ACTION_TYPES.includes(s.action_type),
      );

      if (!hasStale) {
        totalSkipped++;
        continue;
      }

      // Delete old steps
      const { error: delErr } = await supabase
        .from("workflow_steps")
        .delete()
        .eq("workflow_id", wf.id);

      if (delErr) {
        errors.push(`Workflow "${wf.name}": delete failed — ${delErr.message}`);
        continue;
      }

      // Re-create from template
      const newSteps = template.steps.map((step, index) => ({
        workflow_id: wf.id,
        name: step.name,
        step_type: step.step_type,
        action_type: step.action_type || null,
        action_config:
          step.action_config ||
          step.condition_config ||
          step.delay_config ||
          {},
        position: index + 1,
        is_active: true,
      }));

      const { error: insertErr } = await supabase
        .from("workflow_steps")
        .insert(newSteps);

      if (insertErr) {
        errors.push(
          `Workflow "${wf.name}": insert failed — ${insertErr.message}`,
        );
        continue;
      }

      console.log(`  ✓ ${wf.name} — ${newSteps.length} steps rebuilt`);
      totalUpgraded++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Upgraded: ${totalUpgraded} workflows`);
  console.log(`Skipped:  ${totalSkipped} (already current or no template)`);
  if (errors.length > 0) {
    console.log(`Errors:   ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
