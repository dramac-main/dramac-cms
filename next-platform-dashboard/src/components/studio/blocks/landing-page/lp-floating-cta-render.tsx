/**
 * LP Floating CTA Bar Render Component
 *
 * Sticky bottom/top bar with CTA button, urgency text, and optional countdown.
 *
 * Features:
 * - Scroll-triggered visibility (percentage-based)
 * - Dismissible with localStorage memory per component
 * - scrollToId: smooth scroll to target element instead of URL navigation
 * - showOnMobile toggle
 * - Animation variants: slide, fade, none
 * - Optional inline countdown timer
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 *
 * @phase LPB-06 — Conversion Components
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

// ============================================================================
// Props
// ============================================================================

export interface LPFloatingCTAProps {
  text?: string;
  ctaText?: string;
  ctaUrl?: string;
  scrollToId?: string;
  showAfterScroll?: number;
  backgroundColor?: string;
  textColor?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  position?: "bottom" | "top";
  showCountdown?: boolean;
  countdownDate?: string;
  dismissible?: boolean;
  showOnMobile?: boolean;
  animation?: "slide" | "fade" | "none";
  _componentId?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function LPFloatingCTARender({
  text = "Limited time offer — Don't miss out!",
  ctaText = "Get Started Now",
  ctaUrl = "#",
  scrollToId,
  showAfterScroll = 25,
  backgroundColor,
  textColor,
  ctaBackgroundColor,
  ctaTextColor,
  position = "bottom",
  showCountdown = false,
  countdownDate,
  dismissible = true,
  showOnMobile = true,
  animation = "slide",
  _componentId,
}: LPFloatingCTAProps) {
  const [visible, setVisible] = useState(showAfterScroll === 0);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState("");

  // Check localStorage for previous dismissal
  useEffect(() => {
    if (!dismissible) return;
    const key = `lp_cta_dismissed_${_componentId || "default"}`;
    try {
      if (localStorage.getItem(key) === "1") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, [dismissible, _componentId]);

  // Scroll trigger
  useEffect(() => {
    if (showAfterScroll === 0) {
      setVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      setVisible(scrollPercent >= showAfterScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll]);

  // Countdown timer
  useEffect(() => {
    if (!showCountdown || !countdownDate) return;

    const target = new Date(countdownDate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      if (diff <= 0) {
        setCountdown("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [showCountdown, countdownDate]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (dismissible) {
      const key = `lp_cta_dismissed_${_componentId || "default"}`;
      try {
        localStorage.setItem(key, "1");
      } catch {
        // ignore
      }
    }
  }, [dismissible, _componentId]);

  const handleCtaClick = useCallback(
    (e: React.MouseEvent) => {
      if (scrollToId) {
        e.preventDefault();
        const target = document.getElementById(scrollToId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [scrollToId],
  );

  // Don't render if dismissed
  if (dismissed) return null;

  const isShown = visible;
  const resolvedBg = backgroundColor || "var(--primary, #2563eb)";
  const resolvedText = textColor || "#ffffff";
  const resolvedCtaBg = ctaBackgroundColor || "#ffffff";
  const resolvedCtaText = ctaTextColor || "var(--foreground, #0f172a)";

  // Animation classes
  let animationClass = "";
  if (animation === "slide") {
    animationClass = isShown
      ? "translate-y-0"
      : position === "top"
        ? "-translate-y-full"
        : "translate-y-full";
  } else if (animation === "fade") {
    animationClass = isShown ? "opacity-100" : "opacity-0 pointer-events-none";
  } else {
    // none
    if (!isShown) return null;
  }

  return (
    <div
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        position === "top" ? "top-0" : "bottom-0"
      } ${animationClass} ${!showOnMobile ? "hidden sm:block" : ""}`}
      style={{
        backgroundColor: resolvedBg,
        color: resolvedText,
      }}
      role="complementary"
      aria-label="Call to action"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium truncate">{text}</p>
          {showCountdown && countdown && (
            <span
              className="text-sm font-bold tabular-nums whitespace-nowrap"
              style={{ opacity: 0.9 }}
            >
              {countdown}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={scrollToId ? "#" : ctaUrl}
            onClick={scrollToId ? handleCtaClick : undefined}
            className="px-6 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 shadow-sm"
            style={{
              backgroundColor: resolvedCtaBg,
              color: resolvedCtaText,
            }}
          >
            {ctaText}
          </a>

          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full transition-opacity hover:opacity-70"
              aria-label="Dismiss"
              style={{ color: resolvedText }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
