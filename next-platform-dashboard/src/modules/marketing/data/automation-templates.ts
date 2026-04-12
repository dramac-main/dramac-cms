/**
 * Marketing Module - Automation Templates
 *
 * Phase MKT-04: Drip Sequences & Marketing Automation
 *
 * Pre-built sequence templates that users can quickly deploy.
 * Each template defines a trigger, steps, and conversion goal.
 */

import type {
  SequenceStep,
  SequenceTriggerType,
  ConversionGoal,
} from "../types/sequence-types";

// ============================================================================
// TYPES
// ============================================================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: "welcome" | "nurture" | "sales" | "engagement" | "retention";
  triggerType: SequenceTriggerType;
  triggerConfig: Record<string, unknown>;
  steps: SequenceStep[];
  conversionGoal?: ConversionGoal;
  estimatedDuration: string;
  tags: string[];
}

// ============================================================================
// TEMPLATES
// ============================================================================

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ─── Welcome Series ───────────────────────────────────────────
  {
    id: "welcome-3-email",
    name: "Welcome Series (3 Emails)",
    description:
      "Onboard new subscribers with a 3-part welcome sequence. Introduces your brand, highlights key content, and encourages engagement.",
    category: "welcome",
    triggerType: "subscriber_added",
    triggerConfig: {},
    estimatedDuration: "7 days",
    tags: ["onboarding", "welcome", "new-subscriber"],
    conversionGoal: {
      type: "event",
      targetEvent: "first_purchase",
      windowHours: 168, // 7 days
    },
    steps: [
      {
        id: "welcome-1",
        type: "email",
        name: "Welcome Email",
        config: {
          subject: "Welcome to {{companyName}}!",
          previewText: "We're thrilled to have you on board",
        },
        position: 0,
        nextStepId: "welcome-delay-1",
      },
      {
        id: "welcome-delay-1",
        type: "delay",
        name: "Wait 2 days",
        config: {},
        delayMinutes: 2880, // 2 days
        position: 1,
        nextStepId: "welcome-2",
      },
      {
        id: "welcome-2",
        type: "email",
        name: "Getting Started Guide",
        config: {
          subject: "Here's how to get the most out of {{companyName}}",
          previewText: "Quick tips to help you hit the ground running",
        },
        position: 2,
        nextStepId: "welcome-delay-2",
      },
      {
        id: "welcome-delay-2",
        type: "delay",
        name: "Wait 3 days",
        config: {},
        delayMinutes: 4320, // 3 days
        position: 3,
        nextStepId: "welcome-3",
      },
      {
        id: "welcome-3",
        type: "email",
        name: "Your Next Step",
        config: {
          subject: "Ready to take the next step?",
          previewText: "We have something special for you",
        },
        position: 4,
      },
    ],
  },

  // ─── Lead Nurture ─────────────────────────────────────────────
  {
    id: "lead-nurture-5-day",
    name: "5-Day Lead Nurture",
    description:
      "Guide prospects through a 5-day educational sequence with a conversion check midway. Builds trust and authority before making an offer.",
    category: "nurture",
    triggerType: "form_submitted",
    triggerConfig: { formType: "lead_magnet" },
    estimatedDuration: "5 days",
    tags: ["leads", "nurture", "education"],
    conversionGoal: {
      type: "event",
      targetEvent: "signup",
      windowHours: 240, // 10 days
    },
    steps: [
      {
        id: "nurture-1",
        type: "email",
        name: "Resource Delivery",
        config: {
          subject: "Your free resource is here!",
          previewText: "Download your guide now",
        },
        position: 0,
        nextStepId: "nurture-delay-1",
      },
      {
        id: "nurture-delay-1",
        type: "delay",
        name: "Wait 1 day",
        config: {},
        delayMinutes: 1440,
        position: 1,
        nextStepId: "nurture-2",
      },
      {
        id: "nurture-2",
        type: "email",
        name: "Value Add #1",
        config: {
          subject: "Did you know? A key insight for you",
          previewText: "Quick lesson to help you succeed",
        },
        position: 2,
        nextStepId: "nurture-delay-2",
      },
      {
        id: "nurture-delay-2",
        type: "delay",
        name: "Wait 1 day",
        config: {},
        delayMinutes: 1440,
        position: 3,
        nextStepId: "nurture-check",
      },
      {
        id: "nurture-check",
        type: "condition",
        name: "Engaged?",
        config: {
          field: "engagement_score",
          operator: "greater_than",
          value: "40",
        },
        conditionField: "engagement_score",
        conditionOperator: "greater_than",
        conditionValue: "40",
        position: 4,
        trueStepId: "nurture-3-hot",
        falseStepId: "nurture-3-cold",
      },
      {
        id: "nurture-3-hot",
        type: "email",
        name: "Special Offer (Engaged)",
        config: {
          subject: "Because you're interested — a special offer",
          previewText: "Exclusive deal just for you",
        },
        position: 5,
        nextStepId: "nurture-delay-3",
      },
      {
        id: "nurture-3-cold",
        type: "email",
        name: "Value Add #2 (Re-engage)",
        config: {
          subject: "3 tips you might have missed",
          previewText: "Quick wins to get you started",
        },
        position: 6,
        nextStepId: "nurture-delay-3",
      },
      {
        id: "nurture-delay-3",
        type: "delay",
        name: "Wait 2 days",
        config: {},
        delayMinutes: 2880,
        position: 7,
        nextStepId: "nurture-final",
      },
      {
        id: "nurture-final",
        type: "email",
        name: "Final Call to Action",
        config: {
          subject: "Last chance — don't miss out",
          previewText: "Your opportunity is almost over",
        },
        position: 8,
      },
    ],
  },

  // ─── Post-Purchase Follow-up ──────────────────────────────────
  {
    id: "post-purchase-followup",
    name: "Post-Purchase Follow-up",
    description:
      "Thank new customers, request a review, and suggest related products. Builds loyalty and drives repeat purchases.",
    category: "sales",
    triggerType: "event",
    triggerConfig: { eventName: "order_completed" },
    estimatedDuration: "14 days",
    tags: ["ecommerce", "post-purchase", "review", "upsell"],
    conversionGoal: {
      type: "event",
      targetEvent: "repeat_purchase",
      windowHours: 720, // 30 days
    },
    steps: [
      {
        id: "pp-1",
        type: "email",
        name: "Thank You",
        config: {
          subject: "Thank you for your order!",
          previewText: "We appreciate your business",
        },
        position: 0,
        nextStepId: "pp-tag",
      },
      {
        id: "pp-tag",
        type: "action",
        name: "Tag as Customer",
        config: { actionType: "add_tag", value: "customer" },
        position: 1,
        nextStepId: "pp-delay-1",
      },
      {
        id: "pp-delay-1",
        type: "delay",
        name: "Wait 5 days",
        config: {},
        delayMinutes: 7200,
        position: 2,
        nextStepId: "pp-2",
      },
      {
        id: "pp-2",
        type: "email",
        name: "Review Request",
        config: {
          subject: "How was your experience?",
          previewText: "We'd love to hear your feedback",
        },
        position: 3,
        nextStepId: "pp-delay-2",
      },
      {
        id: "pp-delay-2",
        type: "delay",
        name: "Wait 7 days",
        config: {},
        delayMinutes: 10080,
        position: 4,
        nextStepId: "pp-3",
      },
      {
        id: "pp-3",
        type: "email",
        name: "Recommended Products",
        config: {
          subject: "You might also like...",
          previewText: "Handpicked just for you",
        },
        position: 5,
      },
    ],
  },

  // ─── Re-engagement ────────────────────────────────────────────
  {
    id: "re-engagement-winback",
    name: "Re-engagement / Win-back",
    description:
      "Reach out to inactive subscribers. Offers a compelling reason to return, then cleans your list if they don't re-engage.",
    category: "retention",
    triggerType: "manual",
    triggerConfig: {},
    estimatedDuration: "10 days",
    tags: ["re-engagement", "winback", "list-hygiene"],
    steps: [
      {
        id: "re-1",
        type: "email",
        name: "We Miss You",
        config: {
          subject: "We haven't heard from you in a while",
          previewText: "Here's what you've been missing",
        },
        position: 0,
        nextStepId: "re-delay-1",
      },
      {
        id: "re-delay-1",
        type: "delay",
        name: "Wait 3 days",
        config: {},
        delayMinutes: 4320,
        position: 1,
        nextStepId: "re-check",
      },
      {
        id: "re-check",
        type: "condition",
        name: "Did they open?",
        config: {
          field: "engagement_score",
          operator: "greater_than",
          value: "10",
        },
        conditionField: "engagement_score",
        conditionOperator: "greater_than",
        conditionValue: "10",
        position: 2,
        trueStepId: "re-2-engaged",
        falseStepId: "re-2-final",
      },
      {
        id: "re-2-engaged",
        type: "email",
        name: "Welcome Back Offer",
        config: {
          subject: "Welcome back! Here's a special treat",
          previewText: "An exclusive offer just for returning subscribers",
        },
        position: 3,
        nextStepId: "re-tag-active",
      },
      {
        id: "re-tag-active",
        type: "action",
        name: "Tag as Re-engaged",
        config: { actionType: "add_tag", value: "re-engaged" },
        position: 4,
      },
      {
        id: "re-2-final",
        type: "email",
        name: "Last Chance",
        config: {
          subject: "Should we keep in touch?",
          previewText: "Let us know if you'd still like to hear from us",
        },
        position: 5,
        nextStepId: "re-delay-2",
      },
      {
        id: "re-delay-2",
        type: "delay",
        name: "Wait 5 days",
        config: {},
        delayMinutes: 7200,
        position: 6,
        nextStepId: "re-cleanup",
      },
      {
        id: "re-cleanup",
        type: "action",
        name: "Mark as Inactive",
        config: { actionType: "update_status", value: "inactive" },
        position: 7,
      },
    ],
  },

  // ─── Event Reminder ───────────────────────────────────────────
  {
    id: "event-reminder-series",
    name: "Event/Webinar Reminder Series",
    description:
      "Send timed reminders before an event or webinar. Includes confirmation, 1-day reminder, and 1-hour heads-up.",
    category: "engagement",
    triggerType: "event",
    triggerConfig: { eventName: "event_registered" },
    estimatedDuration: "3 days",
    tags: ["events", "webinar", "reminders"],
    conversionGoal: {
      type: "event",
      targetEvent: "event_attended",
      windowHours: 72,
    },
    steps: [
      {
        id: "evt-1",
        type: "email",
        name: "Registration Confirmation",
        config: {
          subject: "You're registered! Here are the details",
          previewText: "Mark your calendar",
        },
        position: 0,
        nextStepId: "evt-delay-1",
      },
      {
        id: "evt-delay-1",
        type: "delay",
        name: "Wait until 1 day before",
        config: {},
        delayMinutes: 2880, // 2 days (placeholder — actual timing depends on event date)
        position: 1,
        nextStepId: "evt-2",
      },
      {
        id: "evt-2",
        type: "email",
        name: "Tomorrow's the Day",
        config: {
          subject: "Reminder: Your event is tomorrow!",
          previewText: "Get ready for an amazing session",
        },
        position: 2,
        nextStepId: "evt-delay-2",
      },
      {
        id: "evt-delay-2",
        type: "delay",
        name: "Wait 23 hours",
        config: {},
        delayMinutes: 1380,
        position: 3,
        nextStepId: "evt-3",
      },
      {
        id: "evt-3",
        type: "email",
        name: "Starting Soon!",
        config: {
          subject: "Starting in 1 hour — join now!",
          previewText: "Don't miss it",
        },
        position: 4,
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const TEMPLATE_CATEGORIES = [
  { value: "welcome", label: "Welcome & Onboarding" },
  { value: "nurture", label: "Lead Nurture" },
  { value: "sales", label: "Sales & Post-Purchase" },
  { value: "engagement", label: "Engagement" },
  { value: "retention", label: "Retention & Win-back" },
] as const;

export function getTemplatesByCategory(
  category?: string,
): AutomationTemplate[] {
  if (!category || category === "all") return AUTOMATION_TEMPLATES;
  return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((t) => t.id === id);
}
