/**
 * Marketing Module - Sequence Types
 *
 * Phase MKT-01: Database Foundation
 *
 * Types for email sequences and sequence enrollments.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type SequenceTriggerType =
  | "subscriber_added"
  | "tag_added"
  | "form_submitted"
  | "event"
  | "manual";

export type SequenceStatus = "draft" | "active" | "paused" | "archived";

export type EnrollmentStatus =
  | "active"
  | "paused"
  | "completed"
  | "converted"
  | "exited"
  | "failed";

export type SequenceStepType =
  | "email"
  | "sms"
  | "whatsapp"
  | "delay"
  | "condition"
  | "action"
  | "split";

// ============================================================================
// SEQUENCES
// ============================================================================

export interface SequenceStep {
  id: string;
  type: SequenceStepType;
  name?: string;
  config: Record<string, unknown>;
  templateId?: string;
  delayMinutes?: number;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  trueStepId?: string;
  falseStepId?: string;
  nextStepId?: string;
  position: number;
}

export interface ConversionGoal {
  type: string;
  targetEvent?: string;
  targetValue?: number;
  windowHours?: number;
}

export interface Sequence {
  id: string;
  siteId: string;
  name: string;
  description?: string | null;
  triggerType: SequenceTriggerType;
  triggerConfig: Record<string, unknown>;
  status: SequenceStatus;
  steps: SequenceStep[];
  automationWorkflowId?: string | null;
  totalEnrolled: number;
  totalCompleted: number;
  totalConverted: number;
  conversionGoal?: ConversionGoal | null;
  enrollmentLimit?: number | null;
  reEnrollment: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SEQUENCE ENROLLMENTS
// ============================================================================

export interface CompletedStep {
  stepId: string;
  completedAt: string;
  result?: string;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  subscriberId: string;
  currentStepId?: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  nextStepAt?: string | null;
  completedAt?: string | null;
  exitReason?: string | null;
  stepsCompleted: CompletedStep[];
  metadata: Record<string, unknown>;
}
