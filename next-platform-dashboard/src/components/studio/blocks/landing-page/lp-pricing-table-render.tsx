/**
 * LP Pricing Table Render Component
 *
 * Side-by-side pricing comparison in 3 variants:
 * - cards: Side-by-side cards with highlighted popular plan
 * - table: Tabular comparison with check/cross feature matrix
 * - minimal: Compact stacked layout
 *
 * Supports monthly/annual toggle with discount, JSON field input, and
 * features with included/excluded status.
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 *
 * @phase LPB-06 — Conversion Components
 */
"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";

// ============================================================================
// Types & Props
// ============================================================================

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description?: string;
  price: string;
  annualPrice?: string;
  period?: string;
  features: (string | PlanFeature)[];
  ctaText?: string;
  ctaUrl?: string;
  isPopular?: boolean;
  badgeText?: string;
}

export interface LPPricingTableProps {
  plans?: Plan[];
  plansJson?: string;
  variant?: "cards" | "table" | "minimal";
  columns?: number;
  highlightPopular?: boolean;
  showAnnualToggle?: boolean;
  annualDiscount?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  title?: string;
  subtitle?: string;
  paddingY?: number;
}

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_PLANS: Plan[] = [
  {
    name: "Starter",
    description: "Perfect for getting started",
    price: "K0",
    annualPrice: "K0",
    period: "/month",
    features: [
      { text: "1 Landing Page", included: true },
      { text: "100 Visits/month", included: true },
      { text: "Basic Analytics", included: true },
      { text: "A/B Testing", included: false },
      { text: "Custom Branding", included: false },
    ],
    ctaText: "Start Free",
    ctaUrl: "#",
  },
  {
    name: "Professional",
    description: "Best for growing businesses",
    price: "K299",
    annualPrice: "K249",
    period: "/month",
    features: [
      { text: "10 Landing Pages", included: true },
      { text: "10,000 Visits/month", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "A/B Testing", included: true },
      { text: "Custom Branding", included: true },
    ],
    ctaText: "Get Started",
    ctaUrl: "#",
    isPopular: true,
    badgeText: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    price: "K999",
    annualPrice: "K799",
    period: "/month",
    features: [
      { text: "Unlimited Landing Pages", included: true },
      { text: "Unlimited Visits", included: true },
      { text: "Full Analytics Suite", included: true },
      { text: "A/B Testing", included: true },
      { text: "Custom Branding", included: true },
    ],
    ctaText: "Contact Sales",
    ctaUrl: "#",
  },
];

function parsePlans(props: LPPricingTableProps): Plan[] {
  if (props.plans?.length) return props.plans;
  if (props.plansJson) {
    try {
      const parsed = JSON.parse(props.plansJson);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return DEFAULT_PLANS;
}

function normalizeFeature(f: string | PlanFeature): PlanFeature {
  if (typeof f === "string") return { text: f, included: true };
  return f;
}

function getDisplayPrice(plan: Plan, isAnnual: boolean) {
  return isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
}

// ============================================================================
// Variant: Cards
// ============================================================================

function CardsVariant({
  plans,
  highlightPopular,
  isAnnual,
  accentColor,
  textColor,
}: {
  plans: Plan[];
  highlightPopular: boolean;
  isAnnual: boolean;
  accentColor: string;
  textColor?: string;
}) {
  return (
    <div
      className="grid gap-6 lg:gap-8 items-stretch"
      style={{
        gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)`,
      }}
    >
      {plans.map((plan, index) => {
        const isHighlighted = highlightPopular && plan.isPopular;
        return (
          <div
            key={index}
            className={`relative rounded-xl p-6 sm:p-8 border flex flex-col ${
              isHighlighted ? "shadow-xl scale-[1.02]" : "shadow-sm"
            }`}
            style={{
              backgroundColor: "var(--card, #ffffff)",
              borderColor: isHighlighted
                ? accentColor
                : "var(--border, #e2e8f0)",
              borderWidth: isHighlighted ? "2px" : "1px",
            }}
          >
            {isHighlighted && plan.badgeText && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {plan.badgeText}
              </div>
            )}

            <div className="mb-6">
              <h3
                className="text-lg font-semibold"
                style={{ color: textColor || "var(--foreground, #0f172a)" }}
              >
                {plan.name}
              </h3>
              {plan.description && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--muted-foreground, #64748b)" }}
                >
                  {plan.description}
                </p>
              )}
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: textColor || "var(--foreground, #0f172a)" }}
                >
                  {getDisplayPrice(plan, isAnnual)}
                </span>
                {plan.period && (
                  <span
                    className="text-sm"
                    style={{ color: "var(--muted-foreground, #64748b)" }}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((f, fi) => {
                const feature = normalizeFeature(f);
                return (
                  <li key={fi} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "#22c55e" }}
                      />
                    ) : (
                      <X
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "var(--muted-foreground, #94a3b8)" }}
                      />
                    )}
                    <span
                      style={{
                        color: feature.included
                          ? textColor || "var(--foreground, #0f172a)"
                          : "var(--muted-foreground, #94a3b8)",
                      }}
                    >
                      {feature.text}
                    </span>
                  </li>
                );
              })}
            </ul>

            {plan.ctaText && (
              <a
                href={plan.ctaUrl || "#"}
                className="block w-full text-center py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                style={
                  isHighlighted
                    ? { backgroundColor: accentColor, color: "#ffffff" }
                    : {
                        border: "1px solid var(--border, #e2e8f0)",
                        color: textColor || "var(--foreground, #0f172a)",
                      }
                }
              >
                {plan.ctaText}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Variant: Table
// ============================================================================

function TableVariant({
  plans,
  isAnnual,
  accentColor,
  textColor,
}: {
  plans: Plan[];
  isAnnual: boolean;
  accentColor: string;
  textColor?: string;
}) {
  // Collect all unique feature texts across plans
  const allFeatures: string[] = [];
  for (const plan of plans) {
    for (const f of plan.features) {
      const text = typeof f === "string" ? f : f.text;
      if (!allFeatures.includes(text)) allFeatures.push(text);
    }
  }

  const getFeatureStatus = (plan: Plan, featureText: string): boolean => {
    const found = plan.features.find((f) => {
      const t = typeof f === "string" ? f : f.text;
      return t === featureText;
    });
    if (!found) return false;
    if (typeof found === "string") return true;
    return found.included;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className="text-left p-4 font-medium text-sm"
              style={{
                color: "var(--muted-foreground, #64748b)",
                borderBottom: "1px solid var(--border, #e2e8f0)",
              }}
            >
              Features
            </th>
            {plans.map((plan, i) => (
              <th
                key={i}
                className="text-center p-4 min-w-[140px]"
                style={{ borderBottom: "1px solid var(--border, #e2e8f0)" }}
              >
                <span
                  className="block text-lg font-semibold"
                  style={{ color: textColor || "var(--foreground, #0f172a)" }}
                >
                  {plan.name}
                </span>
                <span
                  className="block text-2xl font-bold mt-1"
                  style={{
                    color: plan.isPopular
                      ? accentColor
                      : textColor || "var(--foreground, #0f172a)",
                  }}
                >
                  {getDisplayPrice(plan, isAnnual)}
                </span>
                {plan.period && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--muted-foreground, #64748b)" }}
                  >
                    {plan.period}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatures.map((featureText, fi) => (
            <tr key={fi}>
              <td
                className="p-4 text-sm"
                style={{
                  color: textColor || "var(--foreground, #0f172a)",
                  borderBottom: "1px solid var(--border, #e2e8f0)",
                }}
              >
                {featureText}
              </td>
              {plans.map((plan, pi) => {
                const included = getFeatureStatus(plan, featureText);
                return (
                  <td
                    key={pi}
                    className="text-center p-4"
                    style={{ borderBottom: "1px solid var(--border, #e2e8f0)" }}
                  >
                    {included ? (
                      <Check
                        className="w-5 h-5 mx-auto"
                        style={{ color: "#22c55e" }}
                      />
                    ) : (
                      <X
                        className="w-5 h-5 mx-auto"
                        style={{ color: "var(--muted-foreground, #d1d5db)" }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="p-4" />
            {plans.map((plan, i) => (
              <td key={i} className="p-4 text-center">
                {plan.ctaText && (
                  <a
                    href={plan.ctaUrl || "#"}
                    className="inline-block px-6 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                    style={
                      plan.isPopular
                        ? { backgroundColor: accentColor, color: "#ffffff" }
                        : {
                            border: "1px solid var(--border, #e2e8f0)",
                            color: textColor || "var(--foreground, #0f172a)",
                          }
                    }
                  >
                    {plan.ctaText}
                  </a>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Variant: Minimal
// ============================================================================

function MinimalVariant({
  plans,
  isAnnual,
  accentColor,
  textColor,
}: {
  plans: Plan[];
  isAnnual: boolean;
  accentColor: string;
  textColor?: string;
}) {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      {plans.map((plan, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 rounded-lg border"
          style={{
            backgroundColor: plan.isPopular
              ? `${accentColor}08`
              : "var(--card, #ffffff)",
            borderColor: plan.isPopular
              ? accentColor
              : "var(--border, #e2e8f0)",
          }}
        >
          <div>
            <h3
              className="font-semibold"
              style={{ color: textColor || "var(--foreground, #0f172a)" }}
            >
              {plan.name}
            </h3>
            {plan.description && (
              <p
                className="text-sm"
                style={{ color: "var(--muted-foreground, #64748b)" }}
              >
                {plan.description}
              </p>
            )}
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <span
                className="text-xl font-bold"
                style={{ color: textColor || "var(--foreground, #0f172a)" }}
              >
                {getDisplayPrice(plan, isAnnual)}
              </span>
              {plan.period && (
                <span
                  className="text-xs"
                  style={{ color: "var(--muted-foreground, #64748b)" }}
                >
                  {plan.period}
                </span>
              )}
            </div>
            {plan.ctaText && (
              <a
                href={plan.ctaUrl || "#"}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
                style={
                  plan.isPopular
                    ? { backgroundColor: accentColor, color: "#ffffff" }
                    : {
                        border: "1px solid var(--border, #e2e8f0)",
                        color: textColor || "var(--foreground, #0f172a)",
                      }
                }
              >
                {plan.ctaText}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LPPricingTableRender(props: LPPricingTableProps) {
  const {
    variant = "cards",
    highlightPopular = true,
    showAnnualToggle = false,
    annualDiscount,
    backgroundColor,
    textColor,
    accentColor,
    title = "Simple, Transparent Pricing",
    subtitle = "Choose the plan that works for you",
    paddingY = 48,
  } = props;

  const [isAnnual, setIsAnnual] = useState(false);
  const plans = parsePlans(props);
  const resolvedAccent = accentColor || "var(--primary, #2563eb)";

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
            className="text-center mb-6 sm:mb-8"
            style={{ color: "var(--muted-foreground, #64748b)" }}
          >
            {subtitle}
          </p>
        )}

        {showAnnualToggle && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <span
              className="text-sm font-medium"
              style={{
                color: !isAnnual
                  ? textColor || "var(--foreground, #0f172a)"
                  : "var(--muted-foreground, #64748b)",
              }}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{
                backgroundColor: isAnnual
                  ? resolvedAccent
                  : "var(--muted, #e2e8f0)",
              }}
              aria-label="Toggle annual pricing"
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ left: isAnnual ? "26px" : "2px" }}
              />
            </button>
            <span
              className="text-sm font-medium"
              style={{
                color: isAnnual
                  ? textColor || "var(--foreground, #0f172a)"
                  : "var(--muted-foreground, #64748b)",
              }}
            >
              Annual
              {annualDiscount && (
                <span
                  className="ml-1 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${resolvedAccent}15`,
                    color: resolvedAccent,
                  }}
                >
                  Save {annualDiscount}%
                </span>
              )}
            </span>
          </div>
        )}

        {variant === "table" ? (
          <TableVariant
            plans={plans}
            isAnnual={isAnnual}
            accentColor={resolvedAccent}
            textColor={textColor}
          />
        ) : variant === "minimal" ? (
          <MinimalVariant
            plans={plans}
            isAnnual={isAnnual}
            accentColor={resolvedAccent}
            textColor={textColor}
          />
        ) : (
          <CardsVariant
            plans={plans}
            highlightPopular={highlightPopular}
            isAnnual={isAnnual}
            accentColor={resolvedAccent}
            textColor={textColor}
          />
        )}
      </div>
    </section>
  );
}
