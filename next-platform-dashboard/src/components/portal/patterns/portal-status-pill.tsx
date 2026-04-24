"use client";

/**
 * PortalStatusPill — shared status badge for portal-first surfaces.
 *
 * Normalises common tenant-facing status strings into a small number of
 * visual tones so every portal module presents status the same way.
 */

import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "muted";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-muted text-foreground ring-border",
  info: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900",
  success:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
  warning:
    "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
  danger:
    "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900",
  muted: "bg-muted/40 text-muted-foreground ring-border",
};

const STATUS_TONE: Record<string, Tone> = {
  // Orders
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "muted",
  refunded: "muted",
  // Payment
  paid: "success",
  failed: "danger",
  partially_refunded: "warning",
  // Products
  active: "success",
  draft: "muted",
  archived: "muted",
  // Quotes
  sent: "info",
  viewed: "info",
  accepted: "success",
  rejected: "danger",
  expired: "muted",
  converted: "success",
  pending_approval: "warning",
  // Bookings
  completed: "success",
  no_show: "danger",
  rescheduled: "warning",
  // Low stock flag
  low_stock: "warning",
  out_of_stock: "danger",
  in_stock: "success",
};

function humanise(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PortalStatusPill({
  status,
  tone,
  className,
}: {
  status: string | null | undefined;
  tone?: Tone;
  className?: string;
}) {
  const key = (status ?? "").toLowerCase();
  const resolved: Tone = tone ?? STATUS_TONE[key] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[resolved],
        className,
      )}
    >
      {status ? humanise(status) : "—"}
    </span>
  );
}
