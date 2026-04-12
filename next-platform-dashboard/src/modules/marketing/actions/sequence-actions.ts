/**
 * Marketing Module - Sequence Server Actions
 *
 * Phase MKT-04: Drip Sequences & Marketing Automation
 *
 * Server-side actions for sequence CRUD, enrollment,
 * and status management. Steps are stored as JSONB in
 * the sequences table (not a separate table).
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import {
  MKT_TABLES,
  VALID_SEQUENCE_TRANSITIONS,
} from "../lib/marketing-constants";
import type {
  Sequence,
  SequenceStatus,
  SequenceStep,
  SequenceEnrollment,
  EnrollmentStatus,
  SequenceTriggerType,
  ConversionGoal,
} from "../types/sequence-types";

// ============================================================================
// HELPERS
// ============================================================================

const TABLE = MKT_TABLES.sequences;
const ENROLLMENTS_TABLE = MKT_TABLES.sequenceEnrollments;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ============================================================================
// SEQUENCE CRUD
// ============================================================================

export async function getSequences(
  siteId: string,
  filters?: {
    status?: SequenceStatus;
    search?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ sequences: Sequence[]; total: number }> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  query = query.order("created_at", { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 20) - 1,
    );
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return { sequences: (data || []) as Sequence[], total: count || 0 };
}

export async function getSequence(
  siteId: string,
  sequenceId: string,
): Promise<Sequence | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Sequence;
}

export async function createSequence(
  siteId: string,
  input: {
    name: string;
    description?: string;
    triggerType: SequenceTriggerType;
    triggerConfig?: Record<string, unknown>;
    steps?: SequenceStep[];
    conversionGoal?: ConversionGoal;
    enrollmentLimit?: number;
    reEnrollment?: boolean;
  },
): Promise<Sequence> {
  const supabase = await getModuleClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      site_id: siteId,
      name: input.name,
      description: input.description || null,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig || {},
      status: "draft",
      steps: input.steps || [],
      total_enrolled: 0,
      total_completed: 0,
      total_converted: 0,
      conversion_goal: input.conversionGoal || null,
      enrollment_limit: input.enrollmentLimit || null,
      re_enrollment: input.reEnrollment || false,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const sequence = data as Sequence;

  try {
    await logAutomationEvent(
      siteId,
      "marketing.sequence.created",
      {
        id: sequence.id,
        name: (sequence as any).name,
        triggerType: input.triggerType,
      },
      {
        sourceModule: "marketing",
        sourceEntityType: "sequence",
        sourceEntityId: sequence.id,
      },
    );
  } catch {
    // Non-critical - log silently
  }

  return sequence;
}

export async function updateSequence(
  siteId: string,
  sequenceId: string,
  input: {
    name?: string;
    description?: string;
    triggerType?: SequenceTriggerType;
    triggerConfig?: Record<string, unknown>;
    steps?: SequenceStep[];
    conversionGoal?: ConversionGoal | null;
    enrollmentLimit?: number | null;
    reEnrollment?: boolean;
  },
): Promise<Sequence> {
  const supabase = await getModuleClient();

  // Only allow edits when draft or paused
  const { data: existing } = await supabase
    .from(TABLE)
    .select("status")
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .single();

  if (existing && existing.status === "active") {
    throw new Error("Cannot edit an active sequence. Pause it first.");
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.triggerType !== undefined) updates.trigger_type = input.triggerType;
  if (input.triggerConfig !== undefined)
    updates.trigger_config = input.triggerConfig;
  if (input.steps !== undefined) updates.steps = input.steps;
  if (input.conversionGoal !== undefined)
    updates.conversion_goal = input.conversionGoal;
  if (input.enrollmentLimit !== undefined)
    updates.enrollment_limit = input.enrollmentLimit;
  if (input.reEnrollment !== undefined)
    updates.re_enrollment = input.reEnrollment;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Sequence;
}

export async function deleteSequence(
  siteId: string,
  sequenceId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  // Only allow deleting draft sequences
  const { data: existing } = await supabase
    .from(TABLE)
    .select("status")
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .single();

  if (existing && existing.status !== "draft") {
    throw new Error("Only draft sequences can be deleted. Archive it instead.");
  }

  // Delete enrollments first
  await supabase.from(ENROLLMENTS_TABLE).delete().eq("sequence_id", sequenceId);

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("site_id", siteId)
    .eq("id", sequenceId);

  if (error) throw new Error(error.message);
}

export async function updateSequenceStatus(
  siteId: string,
  sequenceId: string,
  newStatus: SequenceStatus,
): Promise<Sequence> {
  const supabase = await getModuleClient();

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const currentStatus = existing.status as SequenceStatus;
  const validTransitions = VALID_SEQUENCE_TRANSITIONS[currentStatus] || [];

  if (!validTransitions.includes(newStatus)) {
    throw new Error(
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
    );
  }

  // Validate sequence has at least one step before activating
  if (newStatus === "active") {
    const steps = existing.steps as SequenceStep[] | null;
    if (!steps || steps.length === 0) {
      throw new Error("Cannot activate a sequence with no steps");
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  try {
    await logAutomationEvent(
      siteId,
      `marketing.sequence.${newStatus}`,
      {
        id: sequenceId,
        name: existing.name,
        fromStatus: currentStatus,
        toStatus: newStatus,
      },
      {
        sourceModule: "marketing",
        sourceEntityType: "sequence",
        sourceEntityId: sequenceId,
      },
    );
  } catch {
    // Non-critical
  }

  return data as Sequence;
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export async function getSequenceEnrollments(
  sequenceId: string,
  filters?: {
    status?: EnrollmentStatus;
    limit?: number;
    offset?: number;
  },
): Promise<{ enrollments: SequenceEnrollment[]; total: number }> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(ENROLLMENTS_TABLE)
    .select("*", { count: "exact" })
    .eq("sequence_id", sequenceId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  query = query.order("enrolled_at", { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 20) - 1,
    );
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    enrollments: (data || []) as SequenceEnrollment[],
    total: count || 0,
  };
}

export async function enrollSubscriber(
  siteId: string,
  sequenceId: string,
  subscriberId: string,
): Promise<SequenceEnrollment> {
  const supabase = await getModuleClient();

  // Check sequence is active
  const { data: sequence } = await supabase
    .from(TABLE)
    .select("status, steps, enrollment_limit, re_enrollment, total_enrolled")
    .eq("site_id", siteId)
    .eq("id", sequenceId)
    .single();

  if (!sequence || sequence.status !== "active") {
    throw new Error("Sequence must be active to enroll subscribers");
  }

  // Check enrollment limit
  if (
    sequence.enrollment_limit &&
    sequence.total_enrolled >= sequence.enrollment_limit
  ) {
    throw new Error("Enrollment limit reached");
  }

  // Check re-enrollment
  if (!sequence.re_enrollment) {
    const { data: existing } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select("id")
      .eq("sequence_id", sequenceId)
      .eq("subscriber_id", subscriberId)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(
        "Subscriber already enrolled and re-enrollment is disabled",
      );
    }
  }

  const steps = (sequence.steps as SequenceStep[]) || [];
  const firstStep = steps.length > 0 ? steps[0] : null;

  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .insert({
      sequence_id: sequenceId,
      subscriber_id: subscriberId,
      current_step_id: firstStep?.id || null,
      status: "active",
      enrolled_at: new Date().toISOString(),
      next_step_at: firstStep ? new Date().toISOString() : null,
      steps_completed: [],
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Increment total_enrolled
  await supabase
    .from(TABLE)
    .update({
      total_enrolled: (sequence.total_enrolled || 0) + 1,
    })
    .eq("id", sequenceId);

  return data as SequenceEnrollment;
}

export async function exitEnrollment(
  sequenceId: string,
  enrollmentId: string,
  reason: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .update({
      status: "exited",
      exit_reason: reason,
      completed_at: new Date().toISOString(),
    })
    .eq("sequence_id", sequenceId)
    .eq("id", enrollmentId);

  if (error) throw new Error(error.message);
}
