/**
 * LP Countdown Render Component
 *
 * Urgency countdown timer with 4 variants:
 * - boxes: Large digit boxes with labels
 * - inline: Single-line colon-separated timer
 * - minimal: Compact with dot separators
 * - circular: SVG ring progress indicators
 *
 * Two modes:
 * - fixed: Counts down to a specific date/time
 * - evergreen: Per-visitor countdown stored in localStorage
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 * No dark: Tailwind variants — storefront is always light mode.
 *
 * @phase LPB-06 — Conversion Components
 */
"use client";

import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// Props
// ============================================================================

export interface LPCountdownProps {
  targetDate?: string;
  mode?: "fixed" | "evergreen";
  evergreenDays?: number;
  evergreenHours?: number;
  evergreenMinutes?: number;
  expiredAction?: "hide" | "redirect" | "show-message";
  expiredMessage?: string;
  expiredRedirectUrl?: string;
  variant?: "boxes" | "inline" | "minimal" | "circular";
  showLabels?: boolean;
  labelStyle?: "full" | "short" | "single-letter";
  showSeconds?: boolean;
  urgencyText?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: number;
  _componentId?: string;
}

// ============================================================================
// Types & Helpers
// ============================================================================

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getLabels(style: string) {
  if (style === "short") return { d: "Days", h: "Hrs", m: "Min", s: "Sec" };
  if (style === "single-letter") return { d: "D", h: "H", m: "M", s: "S" };
  return { d: "Days", h: "Hours", m: "Minutes", s: "Seconds" };
}

function padNumber(n: number) {
  return String(n).padStart(2, "0");
}

const MAX_VALUES = { days: 365, hours: 24, minutes: 60, seconds: 60 };

// ============================================================================
// Hook: useCountdown
// ============================================================================

function useCountdown(props: LPCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let targetMs: number;

    if (props.mode === "evergreen") {
      const key = `lp_countdown_${props._componentId || "default"}`;
      let firstVisit: string | null = null;
      try {
        firstVisit = localStorage.getItem(key);
        if (!firstVisit) {
          firstVisit = Date.now().toString();
          localStorage.setItem(key, firstVisit);
        }
      } catch {
        firstVisit = Date.now().toString();
      }
      const durationMs =
        (props.evergreenDays || 0) * 86400000 +
        (props.evergreenHours || 0) * 3600000 +
        (props.evergreenMinutes || 0) * 60000;
      targetMs = parseInt(firstVisit) + durationMs;
    } else {
      targetMs = props.targetDate
        ? new Date(props.targetDate).getTime()
        : Date.now() + 86400000;
    }

    const tick = () => {
      const now = Date.now();
      const diff = targetMs - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });

        if (
          props.expiredAction === "redirect" &&
          props.expiredRedirectUrl &&
          !redirectedRef.current
        ) {
          redirectedRef.current = true;
          window.location.href = props.expiredRedirectUrl;
        }
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [
    props.mode,
    props.targetDate,
    props.evergreenDays,
    props.evergreenHours,
    props.evergreenMinutes,
    props.expiredAction,
    props.expiredRedirectUrl,
    props._componentId,
  ]);

  return { timeLeft, isExpired };
}

// ============================================================================
// Sub-Components: Variant Renderers
// ============================================================================

function BoxesVariant({
  units,
  showLabels,
  accentColor,
  textColor,
}: {
  units: { value: number; label: string }[];
  showLabels: boolean;
  accentColor: string;
  textColor?: string;
}) {
  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {units.map((unit, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <span
            className="text-2xl sm:text-4xl font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            {padNumber(unit.value)}
          </span>
          {showLabels && (
            <span
              className="text-xs sm:text-sm mt-1"
              style={{ color: textColor || "var(--muted-foreground, #64748b)" }}
            >
              {unit.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function InlineVariant({
  timeLeft,
  showSeconds,
  accentColor,
}: {
  timeLeft: TimeLeft;
  showSeconds: boolean;
  accentColor: string;
}) {
  const parts = [
    padNumber(timeLeft.days),
    padNumber(timeLeft.hours),
    padNumber(timeLeft.minutes),
  ];
  if (showSeconds) parts.push(padNumber(timeLeft.seconds));

  return (
    <div
      className="text-3xl sm:text-5xl font-bold tabular-nums tracking-wider"
      style={{ color: accentColor }}
    >
      {parts.join(":")}
    </div>
  );
}

function MinimalVariant({
  units,
  showLabels,
  textColor,
}: {
  units: { value: number; label: string }[];
  showLabels: boolean;
  textColor?: string;
}) {
  return (
    <div className="flex justify-center gap-2 text-lg sm:text-xl font-medium">
      {units.map((unit, i) => (
        <span key={i}>
          <span
            className="font-bold"
            style={{ color: textColor || "var(--foreground, #0f172a)" }}
          >
            {unit.value}
          </span>
          {showLabels && (
            <span
              className="text-sm ml-0.5"
              style={{ color: "var(--muted-foreground, #64748b)" }}
            >
              {unit.label}
            </span>
          )}
          {i < units.length - 1 && (
            <span
              className="mx-1"
              style={{ color: "var(--muted-foreground, #94a3b8)" }}
            >
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function CircularVariant({
  units,
  showLabels,
  accentColor,
  textColor,
}: {
  units: { value: number; label: string; max: number }[];
  showLabels: boolean;
  accentColor: string;
  textColor?: string;
}) {
  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex justify-center gap-4 sm:gap-6">
      {units.map((unit, i) => {
        const progress = unit.max > 0 ? unit.value / unit.max : 0;
        const offset = circumference * (1 - progress);

        return (
          <div key={i} className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--muted, #e2e8f0)"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-lg sm:text-xl font-bold tabular-nums"
                  style={{ color: textColor || "var(--foreground, #0f172a)" }}
                >
                  {padNumber(unit.value)}
                </span>
              </div>
            </div>
            {showLabels && (
              <span
                className="text-xs sm:text-sm mt-2"
                style={{
                  color: textColor || "var(--muted-foreground, #64748b)",
                }}
              >
                {unit.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LPCountdownRender(props: LPCountdownProps) {
  const {
    variant = "boxes",
    showLabels = true,
    showSeconds = true,
    labelStyle = "full",
    urgencyText = "Offer ends in:",
    expiredAction = "show-message",
    expiredMessage = "This offer has expired.",
    backgroundColor,
    textColor,
    accentColor,
    paddingY = 48,
  } = props;

  const { timeLeft, isExpired } = useCountdown(props);
  const labels = getLabels(labelStyle);
  const resolvedAccent = accentColor || "var(--primary, #2563eb)";

  // Build units array
  const units = [
    { value: timeLeft.days, label: labels.d, max: MAX_VALUES.days },
    { value: timeLeft.hours, label: labels.h, max: MAX_VALUES.hours },
    { value: timeLeft.minutes, label: labels.m, max: MAX_VALUES.minutes },
  ];
  if (showSeconds) {
    units.push({
      value: timeLeft.seconds,
      label: labels.s,
      max: MAX_VALUES.seconds,
    });
  }

  // Handle expired state
  if (isExpired) {
    if (expiredAction === "hide") return null;
    if (expiredAction === "show-message") {
      return (
        <section
          className="text-center"
          style={{
            backgroundColor: backgroundColor || undefined,
            paddingTop: `${paddingY}px`,
            paddingBottom: `${paddingY}px`,
          }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: textColor || "var(--muted-foreground, #64748b)" }}
          >
            {expiredMessage}
          </p>
        </section>
      );
    }
    // redirect is handled inside the hook
    return null;
  }

  return (
    <section
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        {urgencyText && (
          <p
            className="text-lg font-medium mb-4"
            style={{ color: textColor || "var(--foreground, #0f172a)" }}
          >
            {urgencyText}
          </p>
        )}

        {variant === "boxes" && (
          <BoxesVariant
            units={units}
            showLabels={showLabels}
            accentColor={resolvedAccent}
            textColor={textColor}
          />
        )}
        {variant === "inline" && (
          <InlineVariant
            timeLeft={timeLeft}
            showSeconds={showSeconds}
            accentColor={resolvedAccent}
          />
        )}
        {variant === "minimal" && (
          <MinimalVariant
            units={units}
            showLabels={showLabels}
            textColor={textColor}
          />
        )}
        {variant === "circular" && (
          <CircularVariant
            units={units}
            showLabels={showLabels}
            accentColor={resolvedAccent}
            textColor={textColor}
          />
        )}
      </div>
    </section>
  );
}
