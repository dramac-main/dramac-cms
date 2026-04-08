/**
 * DRAMAC CMS — Automation Engine Comprehensive Test Suite
 *
 * Tests ALL pure logic functions extracted from the automation pipeline:
 * - Event type consistency (EVENT_REGISTRY)
 * - Notification type mapping (mapEventToNotificationType)
 * - Variable resolution (resolveVariables, getValueByPath)
 * - Key normalization (normalizeKeysToCamelCase, snakeToCamelCase)
 * - Condition evaluation (evaluateOperator)
 * - UUID validation (send_system_message guard)
 * - Email validation (email.send guard)
 * - DB constraint compliance (VALID_DB_TYPES)
 * - System template → event mapping coverage
 * - Workflow step config → handler compatibility
 */

import { describe, it, expect } from "vitest";
import { EVENT_REGISTRY } from "@/modules/automation/lib/event-types";

// ============================================================================
// REPLICATED PURE FUNCTIONS (from source — no side effects, no DB)
// These are private in their modules, so we replicate them here for testing.
// ============================================================================

function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function normalizeKeysToCamelCase(obj: unknown): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return (obj as Record<string, unknown>) || {};
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = value;
    const camelKey = snakeToCamelCase(key);
    if (camelKey !== key) {
      result[camelKey] = value;
    }
  }
  return result;
}

interface ExecutionContext {
  trigger: Record<string, unknown>;
  steps: Record<string, unknown>;
  variables: Record<string, unknown>;
  triggerType?: string;
  execution?: {
    id: string;
    workflowId: string;
    siteId: string;
    startedAt: string;
  };
}

function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function resolveVariables(value: unknown, context: ExecutionContext): unknown {
  if (typeof value !== "string") {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.map((v) => resolveVariables(v, context));
      }
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = resolveVariables(v, context);
      }
      return result;
    }
    return value;
  }
  const fullMatch = value.match(/^\{\{([^}]+)\}\}$/);
  if (fullMatch) {
    const resolved = getValueByPath(context, fullMatch[1].trim());
    return resolved !== undefined ? resolved : value;
  }
  return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const resolved = getValueByPath(context, path.trim());
    if (resolved === undefined) return match;
    if (typeof resolved === "object") return JSON.stringify(resolved);
    return String(resolved);
  });
}

function evaluateOperator(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case "equals":
    case "eq":
      return left === right;
    case "not_equals":
    case "ne":
      return left !== right;
    case "contains":
      return typeof left === "string" && left.includes(String(right));
    case "not_contains":
      return typeof left === "string" && !left.includes(String(right));
    case "starts_with":
      return typeof left === "string" && left.startsWith(String(right));
    case "ends_with":
      return typeof left === "string" && left.endsWith(String(right));
    case "greater_than":
    case "gt":
      return Number(left) > Number(right);
    case "greater_than_or_equals":
    case "gte":
      return Number(left) >= Number(right);
    case "less_than":
    case "lt":
      return Number(left) < Number(right);
    case "less_than_or_equals":
    case "lte":
      return Number(left) <= Number(right);
    case "is_empty":
      return (
        left === null ||
        left === undefined ||
        left === "" ||
        (Array.isArray(left) && left.length === 0)
      );
    case "is_not_empty":
      return (
        left !== null &&
        left !== undefined &&
        left !== "" &&
        (!Array.isArray(left) || left.length > 0)
      );
    case "in":
      return Array.isArray(right) && right.includes(left);
    case "not_in":
      return Array.isArray(right) && !right.includes(left);
    case "matches":
      try {
        return new RegExp(String(right)).test(String(left));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

function mapEventToNotificationType(triggerType?: string): string {
  if (!triggerType) return "system";
  if (triggerType.includes("appointment.confirmed")) return "booking_confirmed";
  if (triggerType.includes("appointment.cancelled")) return "booking_cancelled";
  if (triggerType.includes("order.shipped")) return "order_shipped";
  if (triggerType.includes("order.delivered")) return "order_delivered";
  if (triggerType.includes("order.cancelled")) return "order_cancelled";
  if (triggerType.includes("order.refunded")) return "refund_issued";
  if (triggerType.includes("quote.accepted")) return "quote_accepted";
  if (triggerType.includes("quote.rejected")) return "quote_rejected";
  if (triggerType.includes("product.low_stock")) return "low_stock";
  if (triggerType.includes("conversation.missed")) return "chat_missed";
  if (triggerType.includes("conversation.assigned")) return "chat_assigned";
  const prefix = triggerType.split(".").slice(0, 2).join(".");
  const mapping: Record<string, string> = {
    "booking.appointment": "new_booking",
    "ecommerce.order": "new_order",
    "ecommerce.payment": "payment_received",
    "ecommerce.refund": "refund_issued",
    "ecommerce.product": "low_stock",
    "ecommerce.quote": "new_quote_request",
    "live_chat.message": "chat_message",
    "chat.message": "chat_message",
    "chat.assigned": "chat_assigned",
    "chat.missed": "chat_missed",
    "chat.rating": "chat_rating",
    "form.submission": "form_submission",
    "forms.submission": "form_submission",
  };
  if (mapping[prefix]) return mapping[prefix];
  return "system";
}

// DB check constraint — the notifications table only allows these 34 types
const VALID_DB_TYPES = new Set([
  "welcome", "site_published", "site_updated", "client_created",
  "client_updated", "team_invite", "team_joined", "team_left",
  "payment_success", "payment_failed", "subscription_renewed",
  "subscription_cancelled", "comment_added", "mention",
  "security_alert", "system", "new_booking", "booking_confirmed",
  "booking_cancelled", "new_order", "order_shipped",
  "order_delivered", "order_cancelled", "refund_issued", "low_stock",
  "payment_received", "new_quote_request", "quote_accepted",
  "quote_rejected", "form_submission", "chat_message",
  "chat_assigned", "chat_missed", "chat_rating",
]);

// UUID v4 regex (same as used in send_system_message guard)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// 1. EVENT_REGISTRY CONSISTENCY TESTS
// ============================================================================

describe("EVENT_REGISTRY Consistency", () => {
  // Collect all event strings from the registry
  function collectEventStrings(obj: unknown, prefix = ""): string[] {
    const results: string[] = [];
    if (typeof obj === "string") {
      results.push(obj);
    } else if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        results.push(...collectEventStrings(value, prefix ? `${prefix}.${key}` : key));
      }
    }
    return results;
  }

  const allEvents = collectEventStrings(EVENT_REGISTRY);

  it("should have events in the registry", () => {
    expect(allEvents.length).toBeGreaterThan(50);
  });

  it("should follow module.entity.action naming convention", () => {
    for (const event of allEvents) {
      const parts = event.split(".");
      expect(parts.length).toBeGreaterThanOrEqual(3);
      // Each part should be alphanumeric with underscores only (no hyphens)
      for (const part of parts) {
        expect(part).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });

  it("should have NO hyphens in ANY event string", () => {
    const hyphenated = allEvents.filter((e) => e.includes("-"));
    expect(hyphenated).toEqual([]);
  });

  it("should have all live_chat events using underscores", () => {
    const chatEvents = allEvents.filter(
      (e) => e.startsWith("live_chat.") || e.startsWith("live-chat.")
    );
    const hyphenated = chatEvents.filter((e) => e.includes("-"));
    expect(hyphenated).toEqual([]);
    // Verify specific events exist
    expect(chatEvents).toContain("live_chat.conversation.started");
    expect(chatEvents).toContain("live_chat.conversation.resolved");
    expect(chatEvents).toContain("live_chat.conversation.closed");
    expect(chatEvents).toContain("live_chat.conversation.missed");
    expect(chatEvents).toContain("live_chat.conversation.assigned");
    expect(chatEvents).toContain("live_chat.message.received");
    expect(chatEvents).toContain("live_chat.message.agent_mentioned");
  });

  it("should have all required booking event types", () => {
    const bookingEvents = allEvents.filter((e) => e.startsWith("booking."));
    expect(bookingEvents).toContain("booking.appointment.created");
    expect(bookingEvents).toContain("booking.appointment.confirmed");
    expect(bookingEvents).toContain("booking.appointment.cancelled");
    expect(bookingEvents).toContain("booking.appointment.completed");
    expect(bookingEvents).toContain("booking.appointment.no_show");
    expect(bookingEvents).toContain("booking.appointment.payment_received");
    expect(bookingEvents).toContain("booking.appointment.reminder_sent");
  });

  it("should have all required ecommerce event types", () => {
    const ecomEvents = allEvents.filter((e) => e.startsWith("ecommerce."));
    expect(ecomEvents).toContain("ecommerce.order.created");
    expect(ecomEvents).toContain("ecommerce.order.shipped");
    expect(ecomEvents).toContain("ecommerce.order.delivered");
    expect(ecomEvents).toContain("ecommerce.order.cancelled");
    expect(ecomEvents).toContain("ecommerce.order.refunded");
    expect(ecomEvents).toContain("ecommerce.payment.received");
    expect(ecomEvents).toContain("ecommerce.payment.proof_uploaded");
    expect(ecomEvents).toContain("ecommerce.quote.created");
    expect(ecomEvents).toContain("ecommerce.quote.accepted");
    expect(ecomEvents).toContain("ecommerce.quote.rejected");
    expect(ecomEvents).toContain("ecommerce.product.low_stock");
  });

  it("should have all required form event types", () => {
    const formEvents = allEvents.filter((e) => e.startsWith("form."));
    expect(formEvents).toContain("form.submission.received");
    expect(formEvents).toContain("form.submission.processed");
  });

  it("should have unique event strings (no duplicates)", () => {
    const unique = new Set(allEvents);
    expect(unique.size).toBe(allEvents.length);
  });

  it("should have path structure matching event string", () => {
    // Every key path in the registry should match its value string
    function checkPaths(obj: unknown, pathParts: string[]): void {
      if (typeof obj === "string") {
        const expectedPath = pathParts.join(".");
        expect(obj).toBe(expectedPath);
      } else if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          checkPaths(value, [...pathParts, key]);
        }
      }
    }
    checkPaths(EVENT_REGISTRY, []);
  });
});

// ============================================================================
// 2. NOTIFICATION TYPE MAPPING TESTS
// ============================================================================

describe("mapEventToNotificationType", () => {
  it("should return 'system' for undefined/null/empty input", () => {
    expect(mapEventToNotificationType(undefined)).toBe("system");
    expect(mapEventToNotificationType("")).toBe("system");
  });

  // Every mapped result must be in VALID_DB_TYPES
  it("should ALWAYS return a valid DB type", () => {
    const testEvents = [
      "booking.appointment.created",
      "booking.appointment.confirmed",
      "booking.appointment.cancelled",
      "booking.appointment.completed",
      "booking.appointment.no_show",
      "booking.appointment.payment_received",
      "booking.appointment.reminder_sent",
      "ecommerce.order.created",
      "ecommerce.order.shipped",
      "ecommerce.order.delivered",
      "ecommerce.order.cancelled",
      "ecommerce.order.refunded",
      "ecommerce.payment.received",
      "ecommerce.payment.proof_uploaded",
      "ecommerce.quote.created",
      "ecommerce.quote.accepted",
      "ecommerce.quote.rejected",
      "ecommerce.product.low_stock",
      "form.submission.received",
      "live_chat.conversation.started",
      "live_chat.conversation.resolved",
      "live_chat.conversation.closed",
      "live_chat.conversation.missed",
      "live_chat.conversation.assigned",
      "live_chat.message.received",
      "crm.contact.created",
      "billing.subscription.created",
      "system.webhook.received",
      "unknown.event.type",
      undefined,
    ];

    for (const event of testEvents) {
      const result = mapEventToNotificationType(event);
      expect(VALID_DB_TYPES.has(result)).toBe(true);
    }
  });

  // Specific override tests
  describe("specific overrides", () => {
    it("maps booking.appointment.confirmed → booking_confirmed", () => {
      expect(mapEventToNotificationType("booking.appointment.confirmed")).toBe("booking_confirmed");
    });
    it("maps booking.appointment.cancelled → booking_cancelled", () => {
      expect(mapEventToNotificationType("booking.appointment.cancelled")).toBe("booking_cancelled");
    });
    it("maps ecommerce.order.shipped → order_shipped", () => {
      expect(mapEventToNotificationType("ecommerce.order.shipped")).toBe("order_shipped");
    });
    it("maps ecommerce.order.delivered → order_delivered", () => {
      expect(mapEventToNotificationType("ecommerce.order.delivered")).toBe("order_delivered");
    });
    it("maps ecommerce.order.cancelled → order_cancelled", () => {
      expect(mapEventToNotificationType("ecommerce.order.cancelled")).toBe("order_cancelled");
    });
    it("maps ecommerce.order.refunded → refund_issued", () => {
      expect(mapEventToNotificationType("ecommerce.order.refunded")).toBe("refund_issued");
    });
    it("maps ecommerce.quote.accepted → quote_accepted", () => {
      expect(mapEventToNotificationType("ecommerce.quote.accepted")).toBe("quote_accepted");
    });
    it("maps ecommerce.quote.rejected → quote_rejected", () => {
      expect(mapEventToNotificationType("ecommerce.quote.rejected")).toBe("quote_rejected");
    });
    it("maps ecommerce.product.low_stock → low_stock", () => {
      expect(mapEventToNotificationType("ecommerce.product.low_stock")).toBe("low_stock");
    });
    it("maps live_chat.conversation.missed → chat_missed", () => {
      expect(mapEventToNotificationType("live_chat.conversation.missed")).toBe("chat_missed");
    });
    it("maps live_chat.conversation.assigned → chat_assigned", () => {
      expect(mapEventToNotificationType("live_chat.conversation.assigned")).toBe("chat_assigned");
    });
  });

  // Prefix-based mapping tests
  describe("prefix-based mappings", () => {
    it("maps booking.appointment.created → new_booking", () => {
      expect(mapEventToNotificationType("booking.appointment.created")).toBe("new_booking");
    });
    it("maps booking.appointment.completed → new_booking", () => {
      expect(mapEventToNotificationType("booking.appointment.completed")).toBe("new_booking");
    });
    it("maps ecommerce.order.created → new_order", () => {
      expect(mapEventToNotificationType("ecommerce.order.created")).toBe("new_order");
    });
    it("maps ecommerce.payment.received → payment_received", () => {
      expect(mapEventToNotificationType("ecommerce.payment.received")).toBe("payment_received");
    });
    it("maps ecommerce.quote.created → new_quote_request", () => {
      expect(mapEventToNotificationType("ecommerce.quote.created")).toBe("new_quote_request");
    });
    it("maps live_chat.message.received → chat_message", () => {
      expect(mapEventToNotificationType("live_chat.message.received")).toBe("chat_message");
    });
    it("maps form.submission.received → form_submission", () => {
      expect(mapEventToNotificationType("form.submission.received")).toBe("form_submission");
    });
  });

  // Fallback tests
  describe("fallback to system", () => {
    it("maps crm.contact.created → system", () => {
      expect(mapEventToNotificationType("crm.contact.created")).toBe("system");
    });
    it("maps billing.subscription.created → system", () => {
      expect(mapEventToNotificationType("billing.subscription.created")).toBe("system");
    });
    it("maps totally.unknown.event → system", () => {
      expect(mapEventToNotificationType("totally.unknown.event")).toBe("system");
    });
  });

  // Priority test — specific override must beat prefix mapping
  describe("override priority", () => {
    it("conversation.missed override beats live_chat prefix", () => {
      // Without specific override, live_chat.conversation would get prefix mapping.
      // conversation.missed must return chat_missed, not a prefix-based mapping.
      expect(mapEventToNotificationType("live_chat.conversation.missed")).toBe("chat_missed");
    });
    it("conversation.assigned override beats live_chat prefix", () => {
      expect(mapEventToNotificationType("live_chat.conversation.assigned")).toBe("chat_assigned");
    });
    it("order.cancelled override beats ecommerce.order prefix", () => {
      expect(mapEventToNotificationType("ecommerce.order.cancelled")).toBe("order_cancelled");
    });
    it("order.shipped override beats ecommerce.order prefix", () => {
      expect(mapEventToNotificationType("ecommerce.order.shipped")).toBe("order_shipped");
    });
    it("appointment.confirmed beats booking.appointment prefix", () => {
      expect(mapEventToNotificationType("booking.appointment.confirmed")).toBe("booking_confirmed");
    });
  });
});

// ============================================================================
// 3. VALID_DB_TYPES CONSTRAINT TESTS
// ============================================================================

describe("VALID_DB_TYPES set", () => {
  it("should contain exactly 34 types", () => {
    expect(VALID_DB_TYPES.size).toBe(34);
  });

  it("should contain all notification categories", () => {
    // Generic
    expect(VALID_DB_TYPES.has("welcome")).toBe(true);
    expect(VALID_DB_TYPES.has("system")).toBe(true);
    expect(VALID_DB_TYPES.has("security_alert")).toBe(true);
    // Booking
    expect(VALID_DB_TYPES.has("new_booking")).toBe(true);
    expect(VALID_DB_TYPES.has("booking_confirmed")).toBe(true);
    expect(VALID_DB_TYPES.has("booking_cancelled")).toBe(true);
    // Orders
    expect(VALID_DB_TYPES.has("new_order")).toBe(true);
    expect(VALID_DB_TYPES.has("order_shipped")).toBe(true);
    expect(VALID_DB_TYPES.has("order_delivered")).toBe(true);
    expect(VALID_DB_TYPES.has("order_cancelled")).toBe(true);
    expect(VALID_DB_TYPES.has("refund_issued")).toBe(true);
    // Payment
    expect(VALID_DB_TYPES.has("payment_received")).toBe(true);
    expect(VALID_DB_TYPES.has("payment_success")).toBe(true);
    expect(VALID_DB_TYPES.has("payment_failed")).toBe(true);
    // Quotes
    expect(VALID_DB_TYPES.has("new_quote_request")).toBe(true);
    expect(VALID_DB_TYPES.has("quote_accepted")).toBe(true);
    expect(VALID_DB_TYPES.has("quote_rejected")).toBe(true);
    // Chat
    expect(VALID_DB_TYPES.has("chat_message")).toBe(true);
    expect(VALID_DB_TYPES.has("chat_assigned")).toBe(true);
    expect(VALID_DB_TYPES.has("chat_missed")).toBe(true);
    expect(VALID_DB_TYPES.has("chat_rating")).toBe(true);
    // Forms
    expect(VALID_DB_TYPES.has("form_submission")).toBe(true);
    // Inventory
    expect(VALID_DB_TYPES.has("low_stock")).toBe(true);
  });

  it("should NOT contain generic step config types", () => {
    // These are what workflow step configs used to have (the bug we fixed)
    expect(VALID_DB_TYPES.has("info")).toBe(false);
    expect(VALID_DB_TYPES.has("warning")).toBe(false);
    expect(VALID_DB_TYPES.has("success")).toBe(false);
    expect(VALID_DB_TYPES.has("error")).toBe(false);
    expect(VALID_DB_TYPES.has("notification")).toBe(false);
  });
});

// ============================================================================
// 4. VARIABLE RESOLUTION TESTS
// ============================================================================

describe("resolveVariables", () => {
  const context: ExecutionContext = {
    trigger: {
      customerEmail: "john@example.com",
      customerName: "John Doe",
      orderNumber: "ORD-001",
      amount: 4999,
      items: [{ name: "Widget", qty: 2 }],
      nested: { deep: { value: "found_it" } },
    },
    steps: {
      step1: { notification_id: "notif-123" },
    },
    variables: {
      site_name: "Luxe Spa",
    },
    triggerType: "ecommerce.order.created",
    execution: {
      id: "exec-001",
      workflowId: "wf-001",
      siteId: "site-001",
      startedAt: "2026-04-08T00:00:00Z",
    },
  };

  it("should resolve a full variable reference", () => {
    expect(resolveVariables("{{trigger.customerEmail}}", context)).toBe("john@example.com");
  });

  it("should resolve nested path references", () => {
    expect(resolveVariables("{{trigger.nested.deep.value}}", context)).toBe("found_it");
  });

  it("should resolve numeric values (preserve type for full match)", () => {
    expect(resolveVariables("{{trigger.amount}}", context)).toBe(4999);
  });

  it("should resolve array values (preserve type for full match)", () => {
    const result = resolveVariables("{{trigger.items}}", context);
    expect(result).toEqual([{ name: "Widget", qty: 2 }]);
  });

  it("should resolve step output references", () => {
    expect(resolveVariables("{{steps.step1.notification_id}}", context)).toBe("notif-123");
  });

  it("should resolve variable references", () => {
    expect(resolveVariables("{{variables.site_name}}", context)).toBe("Luxe Spa");
  });

  it("should resolve execution metadata", () => {
    expect(resolveVariables("{{execution.siteId}}", context)).toBe("site-001");
  });

  it("should resolve inline variables within text", () => {
    expect(resolveVariables("Hello {{trigger.customerName}}, your order {{trigger.orderNumber}} is confirmed", context))
      .toBe("Hello John Doe, your order ORD-001 is confirmed");
  });

  it("should keep unresolved variables as-is", () => {
    expect(resolveVariables("{{trigger.nonExistent}}", context)).toBe("{{trigger.nonExistent}}");
  });

  it("should keep unresolved inline variables as-is", () => {
    expect(resolveVariables("Hi {{trigger.missing}}", context)).toBe("Hi {{trigger.missing}}");
  });

  it("should handle non-string values (passthrough)", () => {
    expect(resolveVariables(42, context)).toBe(42);
    expect(resolveVariables(null, context)).toBe(null);
    expect(resolveVariables(true, context)).toBe(true);
  });

  it("should resolve object values recursively", () => {
    const config = {
      to: "{{trigger.customerEmail}}",
      subject: "Order {{trigger.orderNumber}}",
      body: "Amount: {{trigger.amount}}",
    };
    const result = resolveVariables(config, context) as Record<string, unknown>;
    expect(result.to).toBe("john@example.com");
    expect(result.subject).toBe("Order ORD-001");
    // Inline replacement converts amount to string
    expect(result.body).toBe("Amount: 4999");
  });

  it("should resolve arrays recursively", () => {
    const arr = ["{{trigger.customerEmail}}", "literal", "{{trigger.orderNumber}}"];
    const result = resolveVariables(arr, context) as string[];
    expect(result).toEqual(["john@example.com", "literal", "ORD-001"]);
  });

  it("should handle whitespace in variable paths", () => {
    expect(resolveVariables("{{ trigger.customerEmail }}", context)).toBe("john@example.com");
  });

  it("should JSON-stringify objects in inline replacements", () => {
    const result = resolveVariables("Data: {{trigger.items}}", context);
    expect(result).toBe('Data: [{"name":"Widget","qty":2}]');
  });
});

// ============================================================================
// 5. getValueByPath TESTS
// ============================================================================

describe("getValueByPath", () => {
  const obj = {
    trigger: {
      customerEmail: "test@test.com",
      nested: { deep: { value: 42 } },
    },
    steps: {},
    variables: {},
  };

  it("should resolve top-level keys", () => {
    expect(getValueByPath(obj, "trigger")).toBeDefined();
  });

  it("should resolve nested keys", () => {
    expect(getValueByPath(obj, "trigger.customerEmail")).toBe("test@test.com");
  });

  it("should resolve deeply nested keys", () => {
    expect(getValueByPath(obj, "trigger.nested.deep.value")).toBe(42);
  });

  it("should return undefined for missing keys", () => {
    expect(getValueByPath(obj, "trigger.nonExistent")).toBeUndefined();
  });

  it("should return undefined for null in path", () => {
    expect(getValueByPath(null, "any.path")).toBeUndefined();
  });

  it("should return undefined for primitive in path", () => {
    expect(getValueByPath("string", "any.path")).toBeUndefined();
  });

  it("should handle empty object gracefully", () => {
    expect(getValueByPath({}, "missing")).toBeUndefined();
  });
});

// ============================================================================
// 6. normalizeKeysToCamelCase TESTS
// ============================================================================

describe("normalizeKeysToCamelCase", () => {
  it("should add camelCase aliases for snake_case keys", () => {
    const input = { customer_email: "test@test.com", order_number: "ORD-001" };
    const result = normalizeKeysToCamelCase(input);
    expect(result.customer_email).toBe("test@test.com");
    expect(result.customerEmail).toBe("test@test.com");
    expect(result.order_number).toBe("ORD-001");
    expect(result.orderNumber).toBe("ORD-001");
  });

  it("should preserve already-camelCase keys", () => {
    const input = { customerEmail: "test@test.com" };
    const result = normalizeKeysToCamelCase(input);
    expect(result.customerEmail).toBe("test@test.com");
  });

  it("should handle mixed keys", () => {
    const input = { customer_email: "a@a.com", ownerName: "Drake" };
    const result = normalizeKeysToCamelCase(input);
    expect(result.customer_email).toBe("a@a.com");
    expect(result.customerEmail).toBe("a@a.com");
    expect(result.ownerName).toBe("Drake");
  });

  it("should return empty object for null/undefined", () => {
    expect(normalizeKeysToCamelCase(null)).toEqual({});
    expect(normalizeKeysToCamelCase(undefined)).toEqual({});
  });

  it("should passthrough arrays as-is", () => {
    // Arrays are truthy objects, so the fallback `|| {}` doesn't trigger
    expect(normalizeKeysToCamelCase([1, 2])).toEqual([1, 2]);
  });

  it("should handle multi-underscore keys", () => {
    const input = { start_time_utc: "2026-01-01" };
    const result = normalizeKeysToCamelCase(input);
    expect(result.start_time_utc).toBe("2026-01-01");
    expect(result.startTimeUtc).toBe("2026-01-01");
  });
});

// ============================================================================
// 7. snakeToCamelCase TESTS
// ============================================================================

describe("snakeToCamelCase", () => {
  it("converts simple snake_case", () => {
    expect(snakeToCamelCase("customer_email")).toBe("customerEmail");
  });

  it("converts multi-word snake_case", () => {
    expect(snakeToCamelCase("start_time_utc")).toBe("startTimeUtc");
  });

  it("preserves already camelCase", () => {
    expect(snakeToCamelCase("customerEmail")).toBe("customerEmail");
  });

  it("handles single word", () => {
    expect(snakeToCamelCase("email")).toBe("email");
  });

  it("handles numbers in keys", () => {
    expect(snakeToCamelCase("step_1_result")).toBe("step1Result");
  });
});

// ============================================================================
// 8. evaluateOperator TESTS
// ============================================================================

describe("evaluateOperator", () => {
  describe("equality operators", () => {
    it("equals/eq", () => {
      expect(evaluateOperator("a", "equals", "a")).toBe(true);
      expect(evaluateOperator("a", "eq", "a")).toBe(true);
      expect(evaluateOperator("a", "equals", "b")).toBe(false);
    });

    it("not_equals/ne", () => {
      expect(evaluateOperator("a", "not_equals", "b")).toBe(true);
      expect(evaluateOperator("a", "ne", "b")).toBe(true);
      expect(evaluateOperator("a", "not_equals", "a")).toBe(false);
    });
  });

  describe("string operators", () => {
    it("contains", () => {
      expect(evaluateOperator("hello world", "contains", "world")).toBe(true);
      expect(evaluateOperator("hello world", "contains", "foo")).toBe(false);
    });

    it("not_contains", () => {
      expect(evaluateOperator("hello world", "not_contains", "foo")).toBe(true);
      expect(evaluateOperator("hello world", "not_contains", "world")).toBe(false);
    });

    it("starts_with", () => {
      expect(evaluateOperator("hello world", "starts_with", "hello")).toBe(true);
      expect(evaluateOperator("hello world", "starts_with", "world")).toBe(false);
    });

    it("ends_with", () => {
      expect(evaluateOperator("hello world", "ends_with", "world")).toBe(true);
      expect(evaluateOperator("hello world", "ends_with", "hello")).toBe(false);
    });

    it("matches (regex)", () => {
      expect(evaluateOperator("order-123", "matches", "^order-\\d+$")).toBe(true);
      expect(evaluateOperator("ord", "matches", "^order-\\d+$")).toBe(false);
    });

    it("matches with invalid regex returns false", () => {
      expect(evaluateOperator("test", "matches", "[invalid")).toBe(false);
    });
  });

  describe("numeric operators", () => {
    it("greater_than/gt", () => {
      expect(evaluateOperator(10, "gt", 5)).toBe(true);
      expect(evaluateOperator(5, "gt", 10)).toBe(false);
    });

    it("greater_than_or_equals/gte", () => {
      expect(evaluateOperator(10, "gte", 10)).toBe(true);
      expect(evaluateOperator(9, "gte", 10)).toBe(false);
    });

    it("less_than/lt", () => {
      expect(evaluateOperator(5, "lt", 10)).toBe(true);
      expect(evaluateOperator(10, "lt", 5)).toBe(false);
    });

    it("less_than_or_equals/lte", () => {
      expect(evaluateOperator(10, "lte", 10)).toBe(true);
      expect(evaluateOperator(11, "lte", 10)).toBe(false);
    });
  });

  describe("empty operators", () => {
    it("is_empty", () => {
      expect(evaluateOperator(null, "is_empty", null)).toBe(true);
      expect(evaluateOperator(undefined, "is_empty", null)).toBe(true);
      expect(evaluateOperator("", "is_empty", null)).toBe(true);
      expect(evaluateOperator([], "is_empty", null)).toBe(true);
      expect(evaluateOperator("text", "is_empty", null)).toBe(false);
      expect(evaluateOperator([1], "is_empty", null)).toBe(false);
    });

    it("is_not_empty", () => {
      expect(evaluateOperator("text", "is_not_empty", null)).toBe(true);
      expect(evaluateOperator([1], "is_not_empty", null)).toBe(true);
      expect(evaluateOperator(null, "is_not_empty", null)).toBe(false);
      expect(evaluateOperator("", "is_not_empty", null)).toBe(false);
    });
  });

  describe("collection operators", () => {
    it("in", () => {
      expect(evaluateOperator("a", "in", ["a", "b", "c"])).toBe(true);
      expect(evaluateOperator("d", "in", ["a", "b", "c"])).toBe(false);
    });

    it("not_in", () => {
      expect(evaluateOperator("d", "not_in", ["a", "b", "c"])).toBe(true);
      expect(evaluateOperator("a", "not_in", ["a", "b", "c"])).toBe(false);
    });
  });

  it("returns false for unknown operators", () => {
    expect(evaluateOperator("a", "unknown_op", "b")).toBe(false);
  });
});

// ============================================================================
// 9. UUID VALIDATION TESTS (send_system_message guard)
// ============================================================================

describe("UUID validation (send_system_message guard)", () => {
  it("should accept valid UUID v4", () => {
    expect(UUID_REGEX.test("a1a00001-0001-4000-b000-000000000001")).toBe(true);
    expect(UUID_REGEX.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("should accept uppercase UUID", () => {
    expect(UUID_REGEX.test("A1A00001-0001-4000-B000-000000000001")).toBe(true);
  });

  it("should reject unresolved template variables", () => {
    expect(UUID_REGEX.test("{{trigger.conversationId}}")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(UUID_REGEX.test("")).toBe(false);
  });

  it("should reject partial UUIDs", () => {
    expect(UUID_REGEX.test("a1a00001-0001-4000")).toBe(false);
  });

  it("should reject non-hex characters", () => {
    expect(UUID_REGEX.test("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")).toBe(false);
  });

  it("should reject random strings", () => {
    expect(UUID_REGEX.test("not-a-uuid")).toBe(false);
    expect(UUID_REGEX.test("12345")).toBe(false);
  });
});

// ============================================================================
// 10. EMAIL VALIDATION TESTS (email.send guard)
// ============================================================================

describe("Email send validation guard", () => {
  function validateEmail(to: string | undefined): { valid: boolean; error?: string } {
    if (!to || to.includes("{{")) {
      return { valid: false, error: `No recipient email resolved (got: ${to || "empty"})` };
    }
    return { valid: true };
  }

  it("should accept valid email", () => {
    expect(validateEmail("john@example.com").valid).toBe(true);
  });

  it("should reject empty/undefined", () => {
    expect(validateEmail(undefined).valid).toBe(false);
    expect(validateEmail("").valid).toBe(false);
  });

  it("should reject unresolved template variable", () => {
    expect(validateEmail("{{trigger.customerEmail}}").valid).toBe(false);
  });

  it("should reject partial templates", () => {
    expect(validateEmail("prefix-{{trigger.email}}").valid).toBe(false);
  });

  it("should include the bad value in error message", () => {
    const result = validateEmail("{{trigger.customerEmail}}");
    expect(result.error).toContain("{{trigger.customerEmail}}");
  });

  it("should show 'empty' for empty/undefined", () => {
    expect(validateEmail(undefined).error).toContain("empty");
    expect(validateEmail("").error).toContain("empty");
  });
});

// ============================================================================
// 11. SYSTEM TEMPLATE → EVENT MAPPING COVERAGE TESTS
// ============================================================================

describe("System template event coverage", () => {
  // These are the 27 event types that system workflows subscribe to in DB
  // Each must map to a valid notification type
  const systemWorkflowEventTypes = [
    "booking.appointment.created",
    "booking.appointment.confirmed",
    "booking.appointment.cancelled",
    "booking.appointment.completed",
    "booking.appointment.no_show",
    "booking.appointment.payment_received",
    "booking.appointment.reminder_sent",
    "ecommerce.order.created",
    "ecommerce.order.shipped",
    "ecommerce.order.delivered",
    "ecommerce.order.cancelled",
    "ecommerce.order.refunded",
    "ecommerce.payment.received",
    "ecommerce.payment.proof_uploaded",
    "ecommerce.product.low_stock",
    "ecommerce.quote.created",
    "ecommerce.quote.sent",
    "ecommerce.quote.accepted",
    "ecommerce.quote.rejected",
    "ecommerce.quote.amendment_requested",
    "ecommerce.quote.converted_to_order",
    "form.submission.received",
    "live_chat.conversation.started",
    "live_chat.conversation.missed",
    "live_chat.conversation.assigned",
    "live_chat.message.received",
    // Booking cancelled followup reuses booking.appointment.cancelled
  ];

  it("every system event type exists in EVENT_REGISTRY", () => {
    function collectEventStrings(obj: unknown): string[] {
      const results: string[] = [];
      if (typeof obj === "string") {
        results.push(obj);
      } else if (typeof obj === "object" && obj !== null) {
        for (const value of Object.values(obj)) {
          results.push(...collectEventStrings(value));
        }
      }
      return results;
    }

    const registeredEvents = new Set(collectEventStrings(EVENT_REGISTRY));
    for (const event of systemWorkflowEventTypes) {
      expect(registeredEvents.has(event)).toBe(true);
    }
  });

  it("every system event maps to a valid notification type", () => {
    for (const event of systemWorkflowEventTypes) {
      const mapped = mapEventToNotificationType(event);
      expect(VALID_DB_TYPES.has(mapped)).toBe(true);
    }
  });

  it("no system event maps to an invalid notification type", () => {
    const invalidTypes = ["info", "warning", "success", "error", "notification"];
    for (const event of systemWorkflowEventTypes) {
      const mapped = mapEventToNotificationType(event);
      expect(invalidTypes).not.toContain(mapped);
    }
  });
});

// ============================================================================
// 12. WORKFLOW STEP CONFIG → HANDLER COMPATIBILITY TESTS
// ============================================================================

describe("Workflow step config compatibility", () => {
  // Simulate what the execution engine does: workflow step config gets resolved through
  // resolveVariables, then passed to the handler. Test the full flow.

  const sampleTriggerData = {
    customer_email: "jane@spa.com",
    customer_name: "Jane Doe",
    service_name: "Aromatherapy Massage",
    start_time: "2026-04-10T14:00:00Z",
    owner_email: "drake@luxespa.com",
    order_number: "ORD-042",
    conversation_id: "a1a00001-0001-4000-b000-000000000001",
    amount: "99.00",
    currency: "USD",
  };

  function buildContext(triggerData: Record<string, unknown>, eventType: string): ExecutionContext {
    return {
      trigger: normalizeKeysToCamelCase(triggerData),
      steps: {},
      variables: {},
      triggerType: eventType,
      execution: {
        id: "exec-test",
        workflowId: "wf-test",
        siteId: "site-test",
        startedAt: new Date().toISOString(),
      },
    };
  }

  describe("email.send step configs", () => {
    it("should resolve customerEmail for customer-facing emails", () => {
      const context = buildContext(sampleTriggerData, "booking.appointment.created");
      const config = { to: "{{trigger.customerEmail}}", subject: "Booking Confirmed" };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      expect(resolved.to).toBe("jane@spa.com");
      // Must NOT contain {{ since we check for it
      expect(String(resolved.to).includes("{{")).toBe(false);
    });

    it("should resolve ownerEmail for owner-facing emails", () => {
      const context = buildContext(sampleTriggerData, "booking.appointment.created");
      const config = { to: "{{trigger.ownerEmail}}", subject: "New Booking Alert" };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      expect(resolved.to).toBe("drake@luxespa.com");
    });

    it("should resolve template variables in subject and body", () => {
      const context = buildContext(sampleTriggerData, "booking.appointment.created");
      const config = {
        to: "{{trigger.customerEmail}}",
        subject: "Your booking for {{trigger.serviceName}} is confirmed",
        body: "Dear {{trigger.customerName}}, your appointment on {{trigger.startTime}} is confirmed.",
      };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      expect(resolved.subject).toBe("Your booking for Aromatherapy Massage is confirmed");
      expect(resolved.body).toContain("Jane Doe");
      expect(resolved.body).toContain("2026-04-10T14:00:00Z");
    });

    it("should make both snake_case and camelCase available via normalization", () => {
      const context = buildContext(sampleTriggerData, "ecommerce.order.created");
      // snake_case reference
      const resolved1 = resolveVariables("{{trigger.customer_email}}", context);
      expect(resolved1).toBe("jane@spa.com");
      // camelCase reference
      const resolved2 = resolveVariables("{{trigger.customerEmail}}", context);
      expect(resolved2).toBe("jane@spa.com");
    });
  });

  describe("chat.send_system_message step configs", () => {
    it("should resolve conversation_id when available", () => {
      const context = buildContext(sampleTriggerData, "booking.appointment.created");
      const config = {
        conversation_id: "{{trigger.conversationId}}",
        event_type: "booking_created",
      };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      expect(resolved.conversation_id).toBe("a1a00001-0001-4000-b000-000000000001");
      expect(UUID_REGEX.test(resolved.conversation_id as string)).toBe(true);
    });

    it("should leave unresolved when no conversationId in trigger", () => {
      const triggerNoConv = { customer_email: "test@test.com" };
      const context = buildContext(triggerNoConv, "booking.appointment.created");
      const config = {
        conversation_id: "{{trigger.conversationId}}",
        event_type: "booking_created",
      };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      expect(resolved.conversation_id).toBe("{{trigger.conversationId}}");
      // UUID guard should catch this
      expect(UUID_REGEX.test(resolved.conversation_id as string)).toBe(false);
    });

    it("should resolve placeholders for system messages", () => {
      const context = buildContext(sampleTriggerData, "booking.appointment.created");
      const config = {
        event_type: "booking_created",
        placeholders: {
          service_name: "{{trigger.serviceName}}",
          customer_name: "{{trigger.customerName}}",
          date: "{{trigger.startTime}}",
        },
      };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      const placeholders = resolved.placeholders as Record<string, string>;
      expect(placeholders.service_name).toBe("Aromatherapy Massage");
      expect(placeholders.customer_name).toBe("Jane Doe");
      expect(placeholders.date).toBe("2026-04-10T14:00:00Z");
    });
  });

  describe("notification.in_app_targeted step configs", () => {
    it("should resolve notification title and message", () => {
      const context = buildContext(sampleTriggerData, "booking.appointment.created");
      const config = {
        target_role: "owner",
        title: "New Booking: {{trigger.serviceName}}",
        message: "{{trigger.customerName}} booked {{trigger.serviceName}} for {{trigger.startTime}}",
        type: "info",
      };
      const resolved = resolveVariables(config, context) as Record<string, unknown>;
      expect(resolved.title).toBe("New Booking: Aromatherapy Massage");
      expect(resolved.message).toContain("Jane Doe booked Aromatherapy Massage");
      // The "info" type should get mapped by handler since it's not in VALID_DB_TYPES
      expect(VALID_DB_TYPES.has(resolved.type as string)).toBe(false);
      // But the event-to-type mapping should provide a valid fallback
      const mappedType = mapEventToNotificationType(context.triggerType);
      expect(VALID_DB_TYPES.has(mappedType)).toBe(true);
      expect(mappedType).toBe("new_booking");
    });

    it("should preserve valid notification types passthrough", () => {
      // If step config already has a valid type, it should be used directly
      const config = { type: "new_order" };
      expect(VALID_DB_TYPES.has(config.type)).toBe(true);
    });
  });
});

// ============================================================================
// 13. END-TO-END WORKFLOW SIMULATION TESTS
// ============================================================================

describe("End-to-end workflow simulation", () => {
  // Simulate each of the 27 system workflows with realistic trigger data

  const scenarios: Array<{
    name: string;
    eventType: string;
    triggerData: Record<string, unknown>;
    expectedNotificationType: string;
    hasConversation: boolean;
    hasCustomerEmail: boolean;
    hasOwnerEmail: boolean;
  }> = [
    {
      name: "Booking Created",
      eventType: "booking.appointment.created",
      triggerData: {
        customer_email: "client@example.com",
        customer_name: "Alice",
        service_name: "Deep Tissue Massage",
        start_time: "2026-04-10T14:00:00Z",
        conversation_id: "11111111-1111-4111-b111-111111111111",
      },
      expectedNotificationType: "new_booking",
      hasConversation: true,
      hasCustomerEmail: true,
      hasOwnerEmail: false, // enriched by execution engine
    },
    {
      name: "Booking Confirmed",
      eventType: "booking.appointment.confirmed",
      triggerData: {
        customer_email: "client@example.com",
        service_name: "Facial",
        start_time: "2026-04-12T10:00:00Z",
        conversation_id: "22222222-2222-4222-b222-222222222222",
      },
      expectedNotificationType: "booking_confirmed",
      hasConversation: true,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Booking Cancelled",
      eventType: "booking.appointment.cancelled",
      triggerData: {
        customer_email: "client@example.com",
        service_name: "Facial",
        start_time: "2026-04-12T10:00:00Z",
        cancellation_reason: "Schedule conflict",
        conversation_id: "33333333-3333-4333-b333-333333333333",
      },
      expectedNotificationType: "booking_cancelled",
      hasConversation: true,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Order Created",
      eventType: "ecommerce.order.created",
      triggerData: {
        customer_email: "buyer@example.com",
        customer_name: "Bob",
        order_number: "ORD-100",
        total: "199.99",
      },
      expectedNotificationType: "new_order",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Order Shipped",
      eventType: "ecommerce.order.shipped",
      triggerData: {
        customer_email: "buyer@example.com",
        order_number: "ORD-100",
        tracking_number: "TRK123456",
      },
      expectedNotificationType: "order_shipped",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Order Delivered",
      eventType: "ecommerce.order.delivered",
      triggerData: {
        customer_email: "buyer@example.com",
        order_number: "ORD-100",
      },
      expectedNotificationType: "order_delivered",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Order Cancelled",
      eventType: "ecommerce.order.cancelled",
      triggerData: {
        customer_email: "buyer@example.com",
        order_number: "ORD-100",
        reason: "Customer request",
      },
      expectedNotificationType: "order_cancelled",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Order Refunded",
      eventType: "ecommerce.order.refunded",
      triggerData: {
        customer_email: "buyer@example.com",
        order_number: "ORD-100",
        refund_amount: "199.99",
      },
      expectedNotificationType: "refund_issued",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Payment Received",
      eventType: "ecommerce.payment.received",
      triggerData: {
        customer_email: "buyer@example.com",
        order_number: "ORD-100",
        amount: "199.99",
      },
      expectedNotificationType: "payment_received",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Product Low Stock",
      eventType: "ecommerce.product.low_stock",
      triggerData: {
        product_name: "Lavender Oil",
        current_stock: 3,
        threshold: 5,
      },
      expectedNotificationType: "low_stock",
      hasConversation: false,
      hasCustomerEmail: false,
      hasOwnerEmail: false,
    },
    {
      name: "Quote Created",
      eventType: "ecommerce.quote.created",
      triggerData: {
        customer_email: "prospect@example.com",
        customer_name: "Carol",
        quote_number: "QTE-050",
      },
      expectedNotificationType: "new_quote_request",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Quote Accepted",
      eventType: "ecommerce.quote.accepted",
      triggerData: {
        customer_email: "prospect@example.com",
        quote_number: "QTE-050",
        accepted_by_name: "Carol",
      },
      expectedNotificationType: "quote_accepted",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Quote Rejected",
      eventType: "ecommerce.quote.rejected",
      triggerData: {
        customer_email: "prospect@example.com",
        quote_number: "QTE-050",
        rejection_reason: "Too expensive",
      },
      expectedNotificationType: "quote_rejected",
      hasConversation: false,
      hasCustomerEmail: true,
      hasOwnerEmail: false,
    },
    {
      name: "Form Submission",
      eventType: "form.submission.received",
      triggerData: {
        form_name: "Contact Us",
        submitter_email: "visitor@example.com",
        submission_data: { name: "Visitor", message: "Hello" },
      },
      expectedNotificationType: "form_submission",
      hasConversation: false,
      hasCustomerEmail: false,
      hasOwnerEmail: false,
    },
    {
      name: "Chat Conversation Missed",
      eventType: "live_chat.conversation.missed",
      triggerData: {
        conversation_id: "44444444-4444-4444-b444-444444444444",
        visitor_name: "Anonymous",
      },
      expectedNotificationType: "chat_missed",
      hasConversation: true,
      hasCustomerEmail: false,
      hasOwnerEmail: false,
    },
    {
      name: "Chat Conversation Assigned",
      eventType: "live_chat.conversation.assigned",
      triggerData: {
        conversation_id: "55555555-5555-4555-b555-555555555555",
        agent_id: "agent-001",
        assigned_agent_id: "agent-001",
      },
      expectedNotificationType: "chat_assigned",
      hasConversation: true,
      hasCustomerEmail: false,
      hasOwnerEmail: false,
    },
    {
      name: "Chat Message Received",
      eventType: "live_chat.message.received",
      triggerData: {
        conversation_id: "66666666-6666-4666-b666-666666666666",
        visitor_name: "Guest",
        message_text: "Help me please",
      },
      expectedNotificationType: "chat_message",
      hasConversation: true,
      hasCustomerEmail: false,
      hasOwnerEmail: false,
    },
  ];

  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      const context: ExecutionContext = {
        trigger: normalizeKeysToCamelCase(scenario.triggerData),
        steps: {},
        variables: {},
        triggerType: scenario.eventType,
        execution: {
          id: "exec-sim",
          workflowId: "wf-sim",
          siteId: "site-sim",
          startedAt: new Date().toISOString(),
        },
      };

      it("should map to correct notification type", () => {
        const mapped = mapEventToNotificationType(scenario.eventType);
        expect(mapped).toBe(scenario.expectedNotificationType);
        expect(VALID_DB_TYPES.has(mapped)).toBe(true);
      });

      it("should handle generic 'info' type in step config", () => {
        const rawType = "info";
        const resolvedType = VALID_DB_TYPES.has(rawType)
          ? rawType
          : mapEventToNotificationType(context.triggerType);
        expect(VALID_DB_TYPES.has(resolvedType)).toBe(true);
      });

      if (scenario.hasCustomerEmail) {
        it("should resolve customerEmail", () => {
          const resolved = resolveVariables("{{trigger.customerEmail}}", context);
          expect(resolved).not.toBe("{{trigger.customerEmail}}");
          expect(typeof resolved).toBe("string");
          expect((resolved as string).includes("@")).toBe(true);
        });
      }

      if (scenario.hasConversation) {
        it("should resolve conversationId as valid UUID", () => {
          const resolved = resolveVariables("{{trigger.conversationId}}", context);
          expect(typeof resolved).toBe("string");
          expect(UUID_REGEX.test(resolved as string)).toBe(true);
        });
      } else {
        it("should fail UUID check when no conversation context", () => {
          const resolved = resolveVariables("{{trigger.conversationId}}", context);
          // Either unresolved template or undefined
          if (typeof resolved === "string") {
            expect(UUID_REGEX.test(resolved)).toBe(false);
          }
        });
      }
    });
  }
});

// ============================================================================
// 14. EDGE CASE & REGRESSION TESTS
// ============================================================================

describe("Edge cases and regressions", () => {
  it("mapEventToNotificationType should not return live-chat (hyphen) types", () => {
    const allEvents = [
      "live_chat.conversation.started",
      "live_chat.conversation.resolved",
      "live_chat.conversation.closed",
      "live_chat.conversation.missed",
      "live_chat.conversation.assigned",
      "live_chat.message.received",
    ];
    for (const event of allEvents) {
      const result = mapEventToNotificationType(event);
      expect(result.includes("-")).toBe(false);
    }
  });

  it("normalizeKeysToCamelCase should handle real booking payloads", () => {
    const payload = {
      customer_email: "a@b.com",
      customer_name: "Test",
      service_name: "Massage",
      start_time: "2026-01-01T00:00:00Z",
      cancellation_reason: "Weather",
      conversation_id: "11111111-1111-4111-b111-111111111111",
    };
    const normalized = normalizeKeysToCamelCase(payload);
    expect(normalized.customerEmail).toBe("a@b.com");
    expect(normalized.customer_email).toBe("a@b.com");
    expect(normalized.serviceName).toBe("Massage");
    expect(normalized.startTime).toBe("2026-01-01T00:00:00Z");
    expect(normalized.cancellationReason).toBe("Weather");
    expect(normalized.conversationId).toBe("11111111-1111-4111-b111-111111111111");
  });

  it("resolveVariables should handle deeply nested configs", () => {
    const context: ExecutionContext = {
      trigger: { a: { b: { c: { d: "deep_value" } } } },
      steps: {},
      variables: {},
    };
    expect(resolveVariables("{{trigger.a.b.c.d}}", context)).toBe("deep_value");
  });

  it("resolveVariables should handle config with no variables", () => {
    const context: ExecutionContext = {
      trigger: {},
      steps: {},
      variables: {},
    };
    const config = { to: "static@email.com", subject: "Static Subject" };
    const resolved = resolveVariables(config, context) as Record<string, unknown>;
    expect(resolved.to).toBe("static@email.com");
    expect(resolved.subject).toBe("Static Subject");
  });

  it("should handle empty trigger data gracefully", () => {
    const context: ExecutionContext = {
      trigger: normalizeKeysToCamelCase({}),
      steps: {},
      variables: {},
      triggerType: "ecommerce.order.created",
    };
    const resolved = resolveVariables("{{trigger.customerEmail}}", context);
    expect(resolved).toBe("{{trigger.customerEmail}}");
    // Email guard catches this
    expect(typeof resolved === "string" && resolved.includes("{{")).toBe(true);
  });

  it("order.refunded has higher priority than order prefix for notification type", () => {
    // The issue was ecommerce.order.refunded should map to refund_issued (specific override)
    // NOT new_order (prefix mapping for ecommerce.order)
    expect(mapEventToNotificationType("ecommerce.order.refunded")).toBe("refund_issued");
    expect(mapEventToNotificationType("ecommerce.order.refunded")).not.toBe("new_order");
  });

  it("ecommerce.product.low_stock maps to low_stock (not a prefix fallback)", () => {
    expect(mapEventToNotificationType("ecommerce.product.low_stock")).toBe("low_stock");
  });

  it("forms.submission (plural) also maps correctly", () => {
    expect(mapEventToNotificationType("forms.submission.received")).toBe("form_submission");
  });

  it("chat.message prefix (legacy) maps correctly", () => {
    expect(mapEventToNotificationType("chat.message.received")).toBe("chat_message");
  });
});

// ============================================================================
// 15. COMPLETE NOTIFICATION TYPE MAPPING COVERAGE
// ============================================================================

describe("Complete notification mapping coverage", () => {
  // Every possible system workflow trigger type must produce a valid DB type
  // This is the definitive list of all 27 unique event types used by system workflows
  const allSystemEventTypes = [
    "booking.appointment.created",
    "booking.appointment.confirmed",
    "booking.appointment.cancelled",
    "booking.appointment.completed",
    "booking.appointment.no_show",
    "booking.appointment.payment_received",
    "booking.appointment.reminder_sent",
    "ecommerce.order.created",
    "ecommerce.order.shipped",
    "ecommerce.order.delivered",
    "ecommerce.order.cancelled",
    "ecommerce.order.refunded",
    "ecommerce.payment.received",
    "ecommerce.payment.proof_uploaded",
    "ecommerce.product.low_stock",
    "ecommerce.quote.created",
    "ecommerce.quote.sent",
    "ecommerce.quote.accepted",
    "ecommerce.quote.rejected",
    "ecommerce.quote.amendment_requested",
    "ecommerce.quote.converted_to_order",
    "form.submission.received",
    "live_chat.conversation.started",
    "live_chat.conversation.missed",
    "live_chat.conversation.assigned",
    "live_chat.message.received",
  ];

  it("ALL system event types produce valid notification types", () => {
    const results: Array<{ event: string; notificationType: string; valid: boolean }> = [];

    for (const event of allSystemEventTypes) {
      const notificationType = mapEventToNotificationType(event);
      const valid = VALID_DB_TYPES.has(notificationType);
      results.push({ event, notificationType, valid });
    }

    const invalid = results.filter((r) => !r.valid);
    expect(invalid).toEqual([]);
  });

  it("no system event type produces 'info', 'warning', or 'success'", () => {
    const banned = ["info", "warning", "success", "error"];
    for (const event of allSystemEventTypes) {
      const mapped = mapEventToNotificationType(event);
      expect(banned).not.toContain(mapped);
    }
  });
});
