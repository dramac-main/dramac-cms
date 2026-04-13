/**
 * LP Logo Bar Render Component
 *
 * "As Seen On" / "Trusted By" partner logo display bar with 3 variants:
 * - grid: Static flexbox row, wraps on mobile
 * - scroll: CSS-only infinite horizontal auto-scroll (no JS)
 * - carousel: Controlled carousel with prev/next buttons
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 * No dark: Tailwind variants — storefront is always light mode.
 *
 * @phase LPB-06 — Conversion Components
 */
"use client";

import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ============================================================================
// Props
// ============================================================================

export interface LPLogoBarProps {
  title?: string;
  logos?: { imageUrl: string; altText?: string; link?: string }[];
  logosJson?: string;
  variant?: "scroll" | "grid" | "carousel";
  grayscale?: boolean;
  maxHeight?: number;
  backgroundColor?: string;
  spacing?: "tight" | "normal" | "wide";
  fullWidth?: boolean;
  paddingY?: number;
  textColor?: string;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_LOGOS = [
  { imageUrl: "", altText: "Company 1" },
  { imageUrl: "", altText: "Company 2" },
  { imageUrl: "", altText: "Company 3" },
  { imageUrl: "", altText: "Company 4" },
  { imageUrl: "", altText: "Company 5" },
];

// ============================================================================
// Helpers
// ============================================================================

function parseLogos(
  logos?: LPLogoBarProps["logos"],
  logosJson?: string,
): { imageUrl: string; altText?: string; link?: string }[] {
  if (logos && logos.length > 0) return logos;
  if (logosJson) {
    try {
      const parsed = JSON.parse(logosJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_LOGOS;
}

const GAP_CLASSES: Record<string, string> = {
  tight: "gap-4 sm:gap-6",
  normal: "gap-6 sm:gap-10",
  wide: "gap-10 sm:gap-16",
};

// ============================================================================
// Sub-Components
// ============================================================================

function LogoItem({
  logo,
  index,
  maxHeight,
  grayscale,
}: {
  logo: { imageUrl: string; altText?: string; link?: string };
  index: number;
  maxHeight: number;
  grayscale: boolean;
}) {
  const imgStyle: React.CSSProperties = {
    maxHeight: `${maxHeight}px`,
    filter: grayscale ? "grayscale(100%)" : undefined,
    opacity: grayscale ? 0.6 : 1,
    transition: "filter 0.3s ease, opacity 0.3s ease",
  };

  const hoverClass = grayscale
    ? "hover:[filter:grayscale(0)] hover:opacity-100"
    : "";

  const img = logo.imageUrl ? (
    <img
      src={logo.imageUrl}
      alt={logo.altText || `Partner ${index + 1}`}
      style={imgStyle}
      className={`h-auto w-auto object-contain flex-shrink-0 ${hoverClass}`}
      loading="lazy"
    />
  ) : (
    <div
      className="flex items-center justify-center rounded px-4 py-2 text-xs flex-shrink-0"
      style={{
        height: `${maxHeight}px`,
        minWidth: "100px",
        backgroundColor: "var(--muted, #f1f5f9)",
        color: "var(--muted-foreground, #64748b)",
      }}
    >
      {logo.altText || `Logo ${index + 1}`}
    </div>
  );

  if (logo.link) {
    return (
      <a
        href={logo.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center flex-shrink-0"
        aria-label={logo.altText || `Partner ${index + 1}`}
      >
        {img}
      </a>
    );
  }

  return <div className="flex items-center flex-shrink-0">{img}</div>;
}

function GridLayout({
  logos,
  maxHeight,
  grayscale,
  spacing,
}: {
  logos: { imageUrl: string; altText?: string; link?: string }[];
  maxHeight: number;
  grayscale: boolean;
  spacing: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center ${GAP_CLASSES[spacing] || GAP_CLASSES.normal}`}
    >
      {logos.map((logo, i) => (
        <LogoItem
          key={i}
          logo={logo}
          index={i}
          maxHeight={maxHeight}
          grayscale={grayscale}
        />
      ))}
    </div>
  );
}

function ScrollLayout({
  logos,
  maxHeight,
  grayscale,
  spacing,
}: {
  logos: { imageUrl: string; altText?: string; link?: string }[];
  maxHeight: number;
  grayscale: boolean;
  spacing: string;
}) {
  const gap =
    spacing === "tight" ? "2rem" : spacing === "wide" ? "4rem" : "3rem";

  return (
    <>
      <style>{`
        @keyframes lp-logo-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .lp-logo-scroll-track {
          animation: lp-logo-scroll 30s linear infinite;
        }
        .lp-logo-scroll-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="overflow-hidden" aria-label="Partner logos scrolling">
        <div className="lp-logo-scroll-track flex items-center" style={{ gap }}>
          {[...logos, ...logos].map((logo, i) => (
            <LogoItem
              key={i}
              logo={logo}
              index={i % logos.length}
              maxHeight={maxHeight}
              grayscale={grayscale}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function CarouselLayout({
  logos,
  maxHeight,
  grayscale,
}: {
  logos: { imageUrl: string; altText?: string; link?: string }[];
  maxHeight: number;
  grayscale: boolean;
}) {
  const itemsPerPage = 5;
  const totalPages = Math.ceil(logos.length / itemsPerPage);
  const [page, setPage] = useState(0);

  const handlePrev = useCallback(
    () => setPage((p) => (p - 1 + totalPages) % totalPages),
    [totalPages],
  );
  const handleNext = useCallback(
    () => setPage((p) => (p + 1) % totalPages),
    [totalPages],
  );

  const startIdx = page * itemsPerPage;
  const visibleLogos = logos.slice(startIdx, startIdx + itemsPerPage);

  if (totalPages <= 1) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {logos.map((logo, i) => (
          <LogoItem
            key={i}
            logo={logo}
            index={i}
            maxHeight={maxHeight}
            grayscale={grayscale}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-6 sm:gap-10 transition-opacity duration-300">
        {visibleLogos.map((logo, i) => (
          <LogoItem
            key={startIdx + i}
            logo={logo}
            index={startIdx + i}
            maxHeight={maxHeight}
            grayscale={grayscale}
          />
        ))}
      </div>
      <button
        onClick={handlePrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: "var(--muted, #f1f5f9)",
          color: "var(--muted-foreground, #64748b)",
        }}
        aria-label="Previous logos"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: "var(--muted, #f1f5f9)",
          color: "var(--muted-foreground, #64748b)",
        }}
        aria-label="Next logos"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                i === page
                  ? "var(--primary, #2563eb)"
                  : "var(--muted, #d1d5db)",
            }}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LPLogoBarRender({
  title = "Trusted by leading companies",
  logos,
  logosJson,
  variant = "grid",
  grayscale = true,
  maxHeight = 40,
  backgroundColor,
  spacing = "normal",
  fullWidth = false,
  paddingY = 48,
  textColor,
}: LPLogoBarProps) {
  const resolvedLogos = parseLogos(logos, logosJson);

  return (
    <section
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
      }}
    >
      <div
        className={
          fullWidth ? "px-4" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        }
      >
        {title && (
          <p
            className="text-center text-sm font-medium uppercase tracking-wider mb-6 sm:mb-8"
            style={{ color: textColor || "var(--muted-foreground, #64748b)" }}
          >
            {title}
          </p>
        )}

        {variant === "scroll" && (
          <ScrollLayout
            logos={resolvedLogos}
            maxHeight={maxHeight}
            grayscale={grayscale}
            spacing={spacing}
          />
        )}
        {variant === "grid" && (
          <GridLayout
            logos={resolvedLogos}
            maxHeight={maxHeight}
            grayscale={grayscale}
            spacing={spacing}
          />
        )}
        {variant === "carousel" && (
          <CarouselLayout
            logos={resolvedLogos}
            maxHeight={maxHeight}
            grayscale={grayscale}
          />
        )}
      </div>
    </section>
  );
}
