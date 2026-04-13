/**
 * LP Hero Render Component
 *
 * High-converting hero section with 6 layout variants:
 * split-left, split-right, full-bleed, video-bg, gradient-overlay, minimal
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 * No dark: Tailwind variants — storefront is always light mode.
 *
 * @phase LPB-04 — Hero Components (6 Variants)
 */
"use client";

import React from "react";
import type { LPHeroVariant } from "@/modules/marketing/types/lp-builder-types";

// ============================================================================
// Props
// ============================================================================

export interface LPHeroProps {
  variant?: LPHeroVariant;
  headline?: string;
  subheadline?: string;
  preheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  backgroundImage?: string;
  videoUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  showForm?: boolean;
  formPosition?: "right" | "left" | "overlay" | "below";
  heroImage?: string;
  minHeight?: "auto" | "screen" | "80vh" | "60vh";
  verticalAlign?: "top" | "center" | "bottom";
  textAlign?: "left" | "center" | "right";
  contentMaxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  benefits?: string[];
  animate?: boolean;
  parallax?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  children?: React.ReactNode;
}

// ============================================================================
// Defaults per Variant
// ============================================================================

export const LP_HERO_DEFAULTS: Record<LPHeroVariant, Partial<LPHeroProps>> = {
  "split-left": {
    headline: "Grow Your Business with Our Platform",
    subheadline:
      "Join thousands of successful businesses that use our tools to increase revenue and streamline operations.",
    preheadline: "The #1 Platform for Growth",
    ctaText: "Start Free Trial",
    ctaUrl: "#",
    ctaSecondaryText: "Watch Demo",
    ctaSecondaryUrl: "#",
    showForm: false,
    minHeight: "auto",
    textAlign: "left",
    contentMaxWidth: "xl",
    benefits: [
      "Free 14-day trial",
      "No credit card required",
      "Cancel anytime",
    ],
  },
  "split-right": {
    headline: "Grow Your Business with Our Platform",
    subheadline: "Join thousands of successful businesses.",
    ctaText: "Get Started",
    showForm: true,
    formPosition: "left",
    minHeight: "auto",
    textAlign: "left",
  },
  "full-bleed": {
    headline: "Transform Your Business Today",
    subheadline:
      "Everything you need to succeed, in one powerful platform.",
    ctaText: "Get Started Free",
    ctaSecondaryText: "Learn More",
    minHeight: "screen",
    textAlign: "center",
    overlayColor: "#000000",
    overlayOpacity: 50,
  },
  "video-bg": {
    headline: "See the Difference",
    subheadline:
      "Watch how our platform works and start your journey today.",
    ctaText: "Start Now",
    minHeight: "screen",
    textAlign: "center",
    overlayColor: "#000000",
    overlayOpacity: 40,
  },
  "gradient-overlay": {
    headline: "The Smart Way to Grow",
    subheadline: "Powerful tools, beautiful results.",
    ctaText: "Join Now",
    minHeight: "80vh",
    textAlign: "center",
    overlayColor: "#667eea",
    overlayOpacity: 80,
  },
  minimal: {
    headline: "Simple. Powerful. Effective.",
    subheadline:
      "The tools you need without the complexity you don't.",
    ctaText: "Get Started",
    minHeight: "auto",
    textAlign: "center",
    contentMaxWidth: "md",
  },
};

// ============================================================================
// Helpers
// ============================================================================

function getMinHeight(h?: string): string {
  switch (h) {
    case "screen":
      return "100vh";
    case "80vh":
      return "80vh";
    case "60vh":
      return "60vh";
    default:
      return "auto";
  }
}

function getContentMaxWidth(w?: string): string {
  switch (w) {
    case "sm":
      return "640px";
    case "md":
      return "768px";
    case "lg":
      return "1024px";
    case "full":
      return "100%";
    default:
      return "1280px"; // xl
  }
}

// ============================================================================
// Shared Sub-Components
// ============================================================================

function PreheadlineTag({ text }: { text: string }) {
  return (
    <span
      className="inline-block text-sm font-semibold uppercase tracking-wider"
      style={{ color: "var(--primary)" }}
    >
      {text}
    </span>
  );
}

function HeroHeadline({ text }: { text: string }) {
  return (
    <h1
      className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
      style={{
        color: "var(--foreground)",
        fontFamily: "var(--font-heading)",
      }}
    >
      {text}
    </h1>
  );
}

function HeroSubheadline({ text }: { text: string }) {
  return (
    <p
      className="mt-6 text-lg leading-8"
      style={{
        color: "var(--muted-foreground)",
        fontFamily: "var(--font-body)",
      }}
    >
      {text}
    </p>
  );
}

function BenefitsList({ benefits }: { benefits: string[] }) {
  return (
    <ul className="mt-6 space-y-2">
      {benefits.map((benefit, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <svg
            className="h-5 w-5 flex-shrink-0"
            style={{ color: "var(--primary)" }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            />
          </svg>
          <span style={{ color: "var(--foreground)" }}>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

function CTAButtons({
  ctaText,
  ctaUrl,
  ctaSecondaryText,
  ctaSecondaryUrl,
  centered,
}: {
  ctaText?: string;
  ctaUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`mt-8 flex flex-wrap gap-4 ${centered ? "justify-center" : ""}`}
    >
      {ctaText && (
        <a
          href={ctaUrl || "#"}
          className="inline-flex items-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {ctaText}
        </a>
      )}
      {ctaSecondaryText && (
        <a
          href={ctaSecondaryUrl || "#"}
          className="inline-flex items-center rounded-lg px-6 py-3 text-base font-semibold border-2 hover:opacity-90 transition-all"
          style={{
            color: "var(--primary)",
            borderColor: "var(--primary)",
          }}
        >
          {ctaSecondaryText}
        </a>
      )}
    </div>
  );
}

// ============================================================================
// Variant: Split (split-left / split-right)
// ============================================================================

function SplitHero(props: LPHeroProps) {
  const isReversed = props.variant === "split-right";
  const textAlign = props.textAlign || "left";

  return (
    <section
      className="w-full"
      style={{
        minHeight: getMinHeight(props.minHeight),
        paddingTop: props.paddingTop ?? 80,
        paddingBottom: props.paddingBottom ?? 80,
      }}
    >
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: getContentMaxWidth(props.contentMaxWidth) }}
      >
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isReversed ? "lg:[direction:rtl]" : ""}`}
        >
          {/* Text Column */}
          <div
            className={`lg:[direction:ltr] ${textAlign === "center" ? "text-center" : ""}`}
          >
            {props.preheadline && (
              <PreheadlineTag text={props.preheadline} />
            )}
            <HeroHeadline text={props.headline || "Build Something Amazing"} />
            {props.subheadline && (
              <HeroSubheadline text={props.subheadline} />
            )}
            {props.benefits && props.benefits.length > 0 && (
              <BenefitsList benefits={props.benefits} />
            )}
            <CTAButtons
              ctaText={props.ctaText}
              ctaUrl={props.ctaUrl}
              ctaSecondaryText={props.ctaSecondaryText}
              ctaSecondaryUrl={props.ctaSecondaryUrl}
            />
          </div>

          {/* Visual Column */}
          <div className="lg:[direction:ltr]">
            {props.showForm && props.children ? (
              props.children
            ) : props.heroImage ? (
              <img
                src={props.heroImage}
                alt=""
                className="rounded-2xl shadow-2xl w-full"
              />
            ) : props.backgroundImage ? (
              <img
                src={props.backgroundImage}
                alt=""
                className="rounded-2xl shadow-2xl w-full"
              />
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Variant: Full-Bleed
// ============================================================================

function FullBleedHero(props: LPHeroProps) {
  const textAlign = props.textAlign || "center";
  const overlayOpacity = (props.overlayOpacity ?? 50) / 100;

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: getMinHeight(props.minHeight || "screen"),
        backgroundImage: props.backgroundImage
          ? `url(${props.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingTop: props.paddingTop ?? 80,
        paddingBottom: props.paddingBottom ?? 80,
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: props.overlayColor || "#000000",
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 w-full ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left"}`}
        style={{ maxWidth: getContentMaxWidth(props.contentMaxWidth) }}
      >
        {props.preheadline && (
          <span className="inline-block text-sm font-semibold uppercase tracking-wider text-white/80">
            {props.preheadline}
          </span>
        )}
        <h1
          className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {props.headline || "Transform Your Business Today"}
        </h1>
        {props.subheadline && (
          <p
            className={`mt-6 text-lg leading-8 text-white/80 sm:text-xl lg:text-2xl ${textAlign === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {props.subheadline}
          </p>
        )}
        {props.benefits && props.benefits.length > 0 && (
          <ul
            className={`mt-6 space-y-2 ${textAlign === "center" ? "inline-flex flex-col items-start" : ""}`}
          >
            {props.benefits.map((benefit, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-white/90"
              >
                <svg
                  className="h-5 w-5 flex-shrink-0 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
        <div
          className={`mt-8 flex flex-wrap gap-4 ${textAlign === "center" ? "justify-center" : ""}`}
        >
          {props.ctaText && (
            <a
              href={props.ctaUrl || "#"}
              className="inline-flex items-center rounded-lg px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {props.ctaText}
            </a>
          )}
          {props.ctaSecondaryText && (
            <a
              href={props.ctaSecondaryUrl || "#"}
              className="inline-flex items-center rounded-lg px-8 py-4 text-base font-semibold text-white border-2 border-white/50 hover:border-white transition-all"
            >
              {props.ctaSecondaryText}
            </a>
          )}
        </div>
        {props.showForm && props.children && (
          <div className="mt-12">{props.children}</div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Variant: Video Background
// ============================================================================

function VideoBackgroundHero(props: LPHeroProps) {
  const textAlign = props.textAlign || "center";
  const overlayOpacity = (props.overlayOpacity ?? 40) / 100;

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: getMinHeight(props.minHeight || "screen"),
        paddingTop: props.paddingTop ?? 80,
        paddingBottom: props.paddingBottom ?? 80,
      }}
    >
      {/* Video background */}
      {props.videoUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={props.backgroundImage || undefined}
        >
          <source src={props.videoUrl} type="video/mp4" />
        </video>
      ) : props.backgroundImage ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${props.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: props.overlayColor || "#000000",
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 w-full ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left"}`}
        style={{ maxWidth: getContentMaxWidth(props.contentMaxWidth) }}
      >
        {props.preheadline && (
          <span className="inline-block text-sm font-semibold uppercase tracking-wider text-white/80">
            {props.preheadline}
          </span>
        )}
        <h1
          className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {props.headline || "See the Difference"}
        </h1>
        {props.subheadline && (
          <p
            className={`mt-6 text-lg leading-8 text-white/80 sm:text-xl lg:text-2xl ${textAlign === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {props.subheadline}
          </p>
        )}
        <div
          className={`mt-8 flex flex-wrap gap-4 ${textAlign === "center" ? "justify-center" : ""}`}
        >
          {props.ctaText && (
            <a
              href={props.ctaUrl || "#"}
              className="inline-flex items-center rounded-lg px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {props.ctaText}
            </a>
          )}
          {props.ctaSecondaryText && (
            <a
              href={props.ctaSecondaryUrl || "#"}
              className="inline-flex items-center rounded-lg px-8 py-4 text-base font-semibold text-white border-2 border-white/50 hover:border-white transition-all"
            >
              {props.ctaSecondaryText}
            </a>
          )}
        </div>
        {props.showForm && props.children && (
          <div className="mt-12">{props.children}</div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Variant: Gradient Overlay
// ============================================================================

function GradientOverlayHero(props: LPHeroProps) {
  const textAlign = props.textAlign || "center";
  const overlayOpacity = (props.overlayOpacity ?? 80) / 100;
  const overlayColor = props.overlayColor || "#667eea";

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: getMinHeight(props.minHeight || "80vh"),
        paddingTop: props.paddingTop ?? 80,
        paddingBottom: props.paddingBottom ?? 80,
      }}
    >
      {/* Background image (under gradient) */}
      {props.backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${props.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${overlayColor}cc, ${overlayColor}33)`,
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 w-full ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left"}`}
        style={{ maxWidth: getContentMaxWidth(props.contentMaxWidth) }}
      >
        {props.preheadline && (
          <span className="inline-block text-sm font-semibold uppercase tracking-wider text-white/80">
            {props.preheadline}
          </span>
        )}
        <h1
          className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {props.headline || "The Smart Way to Grow"}
        </h1>
        {props.subheadline && (
          <p
            className={`mt-6 text-lg leading-8 text-white/80 sm:text-xl lg:text-2xl ${textAlign === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {props.subheadline}
          </p>
        )}
        <div
          className={`mt-8 flex flex-wrap gap-4 ${textAlign === "center" ? "justify-center" : ""}`}
        >
          {props.ctaText && (
            <a
              href={props.ctaUrl || "#"}
              className="inline-flex items-center rounded-lg px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              {props.ctaText}
            </a>
          )}
          {props.ctaSecondaryText && (
            <a
              href={props.ctaSecondaryUrl || "#"}
              className="inline-flex items-center rounded-lg px-8 py-4 text-base font-semibold text-white border-2 border-white/50 hover:border-white transition-all"
            >
              {props.ctaSecondaryText}
            </a>
          )}
        </div>
        {props.showForm && props.children && (
          <div className="mt-12">{props.children}</div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Variant: Minimal
// ============================================================================

function MinimalHero(props: LPHeroProps) {
  const textAlign = props.textAlign || "center";

  return (
    <section
      className="w-full"
      style={{
        minHeight: getMinHeight(props.minHeight),
        paddingTop: props.paddingTop ?? 100,
        paddingBottom: props.paddingBottom ?? 100,
      }}
    >
      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left"}`}
        style={{ maxWidth: getContentMaxWidth(props.contentMaxWidth || "md") }}
      >
        {props.preheadline && <PreheadlineTag text={props.preheadline} />}
        <HeroHeadline
          text={props.headline || "Simple. Powerful. Effective."}
        />
        {props.subheadline && <HeroSubheadline text={props.subheadline} />}
        {props.benefits && props.benefits.length > 0 && (
          <BenefitsList benefits={props.benefits} />
        )}
        <CTAButtons
          ctaText={props.ctaText}
          ctaUrl={props.ctaUrl}
          ctaSecondaryText={props.ctaSecondaryText}
          ctaSecondaryUrl={props.ctaSecondaryUrl}
          centered={textAlign === "center"}
        />
        {props.showForm && props.children && (
          <div className="mt-12">{props.children}</div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Main Export — Variant Switch
// ============================================================================

export function LPHeroRender(props: LPHeroProps) {
  const variant = props.variant || "split-left";

  switch (variant) {
    case "split-left":
    case "split-right":
      return <SplitHero {...props} />;
    case "full-bleed":
      return <FullBleedHero {...props} />;
    case "video-bg":
      return <VideoBackgroundHero {...props} />;
    case "gradient-overlay":
      return <GradientOverlayHero {...props} />;
    case "minimal":
      return <MinimalHero {...props} />;
    default:
      return <SplitHero {...props} />;
  }
}
