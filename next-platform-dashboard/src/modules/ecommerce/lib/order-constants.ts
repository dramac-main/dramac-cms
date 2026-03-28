/**
 * Shared order constants
 *
 * Single source of truth for order statuses, labels, transitions,
 * and carrier lists used across the ecommerce module and live chat.
 */

import type { OrderStatus } from "@/modules/ecommerce/types/ecommerce-types";

// ─── Status Transitions ──────────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

// ─── Labels ──────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  partially_refunded: "Partially Refunded",
  refunded: "Refunded",
  failed: "Failed",
};

// ─── Email map (status → email type for customer notification) ───────────────

export const STATUS_EMAIL_MAP: Record<
  string,
  "confirmation" | "shipped" | "delivered" | "cancelled" | "refunded"
> = {
  confirmed: "confirmation",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
};

// ─── Carrier List (Zambia-focused) ───────────────────────────────────────────

export const ZAMBIA_CARRIERS = [
  // Top local couriers
  { value: "Yango Deli", label: "Yango Deli" },
  { value: "Platinum Courier", label: "Platinum Courier" },
  { value: "Afri Delivery", label: "Afri Delivery" },
  { value: "Speed Couriers Zambia", label: "Speed Couriers Zambia" },
  { value: "Courier Express Zambia", label: "Courier Express Zambia" },
  { value: "Zampost", label: "Zampost (Zambia Postal Services)" },
  // International couriers active in Zambia
  { value: "DHL", label: "DHL" },
  { value: "FedEx", label: "FedEx" },
  { value: "Skynet Worldwide Express", label: "Skynet Worldwide Express" },
  { value: "G4S Courier", label: "G4S Courier" },
  { value: "UPS", label: "UPS" },
  // Custom
  { value: "other", label: "Other / My Own Delivery" },
] as const;
