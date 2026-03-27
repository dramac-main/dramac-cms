"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// All ticker lines — ordered by typical generation flow, then looped
// ---------------------------------------------------------------------------
const TICKER_LINES: string[] = [
  "Initializing the design engine…",
  "Preparing your creative workspace…",
  "Reading your description carefully…",
  "Understanding your business goals…",
  "Identifying your brand personality…",
  "Mapping out the ideal user journey…",
  "Researching your industry best practices…",
  "Analyzing successful competitor layouts…",
  "Selecting typography that matches your tone…",
  "Structuring your site architecture…",
  "Planning the page flow for maximum conversion…",
  "Choosing the perfect layout for each section…",
  "Designing an intuitive navigation system…",
  "Crafting a captivating hero section…",
  "Writing compelling headlines and copy…",
  "Designing product showcases…",
  "Building your featured content grid…",
  "Creating an engaging about section…",
  "Styling interactive call-to-action buttons…",
  "Laying out testimonial cards…",
  "Optimizing layouts for every screen size…",
  "Refining the visual hierarchy…",
  "Adding micro-interactions and polish…",
  "Designing a sleek navigation bar…",
  "Building the footer with all essentials…",
  "Ensuring brand consistency across pages…",
  "Running final quality checks…",
  "Polishing every pixel…",
  "Your website is almost ready…",
];

// Line height in px — must match the CSS line-height exactly
const LINE_HEIGHT = 24;
// How long each line is visible before scrolling to the next
const STEP_INTERVAL_MS = 2200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GenerationNarrativeProps {
  isGenerating: boolean;
  stage?: string;
  progress?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component — Masked auto-scrolling text ticker (teleprompter loader)
// ---------------------------------------------------------------------------
export function GenerationNarrative({
  isGenerating,
  className,
}: GenerationNarrativeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isGenerating) {
      // Reset
      if (intervalRef.current) clearInterval(intervalRef.current);
      indexRef.current = 0;
      if (trackRef.current) {
        trackRef.current.style.transform = "translateY(0)";
      }
      return;
    }

    // Step one line upward every interval
    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      // Loop: when we've scrolled through all lines, jump back to 0
      if (indexRef.current >= TICKER_LINES.length) {
        indexRef.current = 0;
        // Instant reset (no transition) then re-enable transition
        if (trackRef.current) {
          trackRef.current.style.transition = "none";
          trackRef.current.style.transform = "translateY(0)";
          // Force reflow so the instant reset takes effect before re-adding transition
          trackRef.current.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions
          trackRef.current.style.transition =
            "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        }
        return;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translateY(-${indexRef.current * LINE_HEIGHT}px)`;
      }
    }, STEP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  // Total track height = all lines stacked
  const trackHeight = TICKER_LINES.length * LINE_HEIGHT;

  return (
    <div
      className={cn("relative select-none", className)}
      /* Fixed-height window, overflow hidden, gradient mask fades top & bottom */
      style={{
        height: LINE_HEIGHT * 5, // show ~5 lines at once
        overflow: "hidden",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
      }}
    >
      {/* Inner track — slides upward via translateY */}
      <div
        ref={trackRef}
        style={{
          height: trackHeight,
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {TICKER_LINES.map((line, i) => (
          <div
            key={i}
            className="text-xs font-light text-muted-foreground/70 leading-none"
            style={{
              height: LINE_HEIGHT,
              lineHeight: `${LINE_HEIGHT}px`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
