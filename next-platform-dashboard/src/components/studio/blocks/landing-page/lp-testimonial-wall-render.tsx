/**
 * LP Testimonial Wall Render Component
 *
 * Social proof testimonials in 4 layout variants:
 * - grid: Responsive column grid
 * - carousel: Auto-scrolling carousel with controls
 * - masonry: CSS columns masonry layout
 * - single-featured: Highlighted single large testimonial
 *
 * Supports JSON field input for Studio editor and cardStyle customization.
 * All colors use CSS custom properties for automatic site branding inheritance.
 *
 * @phase LPB-06 — Conversion Components
 */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

// ============================================================================
// Props & Types
// ============================================================================

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  text: string;
  imageUrl?: string;
  rating?: number;
}

export interface LPTestimonialWallProps {
  testimonials?: Testimonial[];
  testimonialsJson?: string;
  variant?: "grid" | "carousel" | "masonry" | "single-featured";
  columns?: number;
  showRatings?: boolean;
  showImages?: boolean;
  showQuoteIcon?: boolean;
  maxVisible?: number;
  cardStyle?: "default" | "bordered" | "shadow" | "flat";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  backgroundColor?: string;
  textColor?: string;
  title?: string;
  subtitle?: string;
  paddingY?: number;
}

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "CEO",
    company: "TechCorp",
    text: "This completely transformed how we approach our marketing. The results speak for themselves.",
    rating: 5,
  },
  {
    name: "Mike Chen",
    role: "Founder",
    company: "StartupXYZ",
    text: "We saw a 3x increase in conversions within the first month. Absolutely incredible platform.",
    rating: 5,
  },
  {
    name: "Emily Davis",
    role: "Marketing Director",
    company: "GrowthCo",
    text: "The landing page builder is intuitive and powerful. Our team loves it.",
    rating: 4,
  },
];

function parseTestimonials(props: LPTestimonialWallProps): Testimonial[] {
  if (props.testimonials?.length) return props.testimonials;
  if (props.testimonialsJson) {
    try {
      const parsed = JSON.parse(props.testimonialsJson);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to defaults
    }
  }
  return DEFAULT_TESTIMONIALS;
}

function getCardClasses(style: string) {
  switch (style) {
    case "bordered":
      return "rounded-xl p-6 border-2";
    case "shadow":
      return "rounded-xl p-6 shadow-lg";
    case "flat":
      return "rounded-xl p-6";
    default:
      return "rounded-xl p-6 shadow-sm border";
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-4 h-4"
          style={{
            color: star <= rating ? "#f59e0b" : "var(--muted, #e2e8f0)",
            fill: star <= rating ? "#f59e0b" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  item,
  showRatings,
  showImages,
  showQuoteIcon,
  cardStyle,
  textColor,
}: {
  item: Testimonial;
  showRatings: boolean;
  showImages: boolean;
  showQuoteIcon: boolean;
  cardStyle: string;
  textColor?: string;
}) {
  return (
    <div
      className={getCardClasses(cardStyle)}
      style={{
        backgroundColor:
          cardStyle === "flat" ? "transparent" : "var(--card, #ffffff)",
        borderColor: "var(--border, #e2e8f0)",
      }}
    >
      {showQuoteIcon && (
        <Quote
          className="w-6 h-6 mb-3"
          style={{ color: "var(--primary, #2563eb)", opacity: 0.4 }}
        />
      )}
      {showRatings && item.rating && <StarRating rating={item.rating} />}
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: textColor || "var(--muted-foreground, #64748b)" }}
      >
        &ldquo;{item.text}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        {showImages &&
          (item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: "var(--muted, #f1f5f9)",
                color: "var(--muted-foreground, #64748b)",
              }}
            >
              {item.name.charAt(0)}
            </div>
          ))}
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: textColor || "var(--foreground, #0f172a)" }}
          >
            {item.name}
          </p>
          {(item.role || item.company) && (
            <p
              className="text-xs"
              style={{ color: "var(--muted-foreground, #64748b)" }}
            >
              {item.role}
              {item.role && item.company ? ", " : ""}
              {item.company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Layout Variants
// ============================================================================

function GridLayout({
  testimonials,
  columns,
  cardProps,
}: {
  testimonials: Testimonial[];
  columns: number;
  cardProps: Omit<Parameters<typeof TestimonialCard>[0], "item">;
}) {
  const cols = Math.min(columns, 4);
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {testimonials.map((item, i) => (
        <TestimonialCard key={i} item={item} {...cardProps} />
      ))}
    </div>
  );
}

function MasonryLayout({
  testimonials,
  columns,
  cardProps,
}: {
  testimonials: Testimonial[];
  columns: number;
  cardProps: Omit<Parameters<typeof TestimonialCard>[0], "item">;
}) {
  const cols = Math.min(columns, 4);
  return (
    <div
      className="gap-6"
      style={{
        columnCount: cols,
        columnGap: "1.5rem",
      }}
    >
      {testimonials.map((item, i) => (
        <div key={i} className="mb-6" style={{ breakInside: "avoid" }}>
          <TestimonialCard item={item} {...cardProps} />
        </div>
      ))}
    </div>
  );
}

function CarouselLayout({
  testimonials,
  cardProps,
  autoPlay,
  autoPlayInterval,
}: {
  testimonials: Testimonial[];
  cardProps: Omit<Parameters<typeof TestimonialCard>[0], "item">;
  autoPlay: boolean;
  autoPlayInterval: number;
}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  }, [testimonials.length]);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;
    timerRef.current = setInterval(next, autoPlayInterval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, autoPlayInterval, next, testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <div className="relative max-w-2xl mx-auto">
      <TestimonialCard item={testimonials[current]} {...cardProps} />

      {testimonials.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--muted, #f1f5f9)",
              color: "var(--foreground, #0f172a)",
            }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--muted, #f1f5f9)",
              color: "var(--foreground, #0f172a)",
            }}
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i === current
                      ? "var(--primary, #2563eb)"
                      : "var(--muted, #e2e8f0)",
                }}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LPTestimonialWallRender(props: LPTestimonialWallProps) {
  const {
    variant = "grid",
    columns = 3,
    showRatings = true,
    showImages = true,
    showQuoteIcon = false,
    maxVisible = 6,
    cardStyle = "default",
    autoPlay = true,
    autoPlayInterval = 5000,
    backgroundColor,
    textColor,
    title = "What Our Customers Say",
    subtitle,
    paddingY = 48,
  } = props;

  const allTestimonials = parseTestimonials(props);
  const visibleTestimonials = allTestimonials.slice(0, maxVisible);

  const cardProps = {
    showRatings,
    showImages,
    showQuoteIcon,
    cardStyle,
    textColor,
  };

  return (
    <section
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
            style={{
              color: textColor || "var(--foreground, #0f172a)",
              fontFamily: "var(--font-heading, inherit)",
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto"
            style={{ color: "var(--muted-foreground, #64748b)" }}
          >
            {subtitle}
          </p>
        )}

        {variant === "single-featured" && visibleTestimonials.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            <TestimonialCard item={visibleTestimonials[0]} {...cardProps} />
          </div>
        ) : variant === "carousel" ? (
          <CarouselLayout
            testimonials={visibleTestimonials}
            cardProps={cardProps}
            autoPlay={autoPlay}
            autoPlayInterval={autoPlayInterval}
          />
        ) : variant === "masonry" ? (
          <MasonryLayout
            testimonials={visibleTestimonials}
            columns={columns}
            cardProps={cardProps}
          />
        ) : (
          <GridLayout
            testimonials={visibleTestimonials}
            columns={columns}
            cardProps={cardProps}
          />
        )}
      </div>
    </section>
  );
}
