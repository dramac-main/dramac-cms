/**
 * LP Trust Badges Render Component
 *
 * Security, guarantee, and certification badge display with 3 variants:
 * - horizontal: Badges in a row (wraps on mobile)
 * - grid: 2×2 or 4-column grid with larger icons
 * - inline: Small inline badges (like payment method icons)
 *
 * All colors use CSS custom properties for automatic site branding inheritance.
 * No dark: Tailwind variants — storefront is always light mode.
 *
 * @phase LPB-06 — Conversion Components
 */
"use client";

import React from "react";
import {
  Shield,
  ShieldCheck,
  CheckCircle,
  Lock,
  Award,
  Star,
  Zap,
  Clock,
  BadgeCheck,
  Heart,
  ThumbsUp,
  RefreshCcw,
  CreditCard,
  Globe,
  Users,
  Headphones,
} from "lucide-react";

// ============================================================================
// Props
// ============================================================================

export interface LPTrustBadgesProps {
  badges?: { icon?: string; title: string; description?: string }[];
  badgesJson?: string;
  variant?: "horizontal" | "grid" | "inline";
  iconColor?: string;
  showDescriptions?: boolean;
  iconSize?: "sm" | "md" | "lg";
  backgroundColor?: string;
  textColor?: string;
  paddingY?: number;
  heading?: string;
}

// ============================================================================
// Icon Map
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  Shield,
  ShieldCheck,
  CheckCircle,
  Lock,
  Award,
  Star,
  Zap,
  Clock,
  BadgeCheck,
  Heart,
  ThumbsUp,
  RefreshCcw,
  CreditCard,
  Globe,
  Users,
  Headphones,
  // lowercase aliases
  shield: Shield,
  shieldcheck: ShieldCheck,
  check: CheckCircle,
  lock: Lock,
  award: Award,
  star: Star,
  zap: Zap,
  clock: Clock,
  badgecheck: BadgeCheck,
  heart: Heart,
  thumbsup: ThumbsUp,
  refresh: RefreshCcw,
  creditcard: CreditCard,
  globe: Globe,
  users: Users,
  headphones: Headphones,
};

const ICON_SIZES: Record<string, { icon: string; container: string }> = {
  sm: { icon: "w-4 h-4", container: "w-8 h-8" },
  md: { icon: "w-6 h-6", container: "w-12 h-12" },
  lg: { icon: "w-8 h-8", container: "w-16 h-16" },
};

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_BADGES = [
  {
    icon: "ShieldCheck",
    title: "Secure Payment",
    description: "Your data is encrypted and protected",
  },
  {
    icon: "BadgeCheck",
    title: "30-Day Guarantee",
    description: "Full refund if you're not satisfied",
  },
  {
    icon: "Clock",
    title: "24/7 Support",
    description: "Our team is always here to help",
  },
  {
    icon: "Award",
    title: "Award Winning",
    description: "Recognized by industry leaders",
  },
];

// ============================================================================
// Helpers
// ============================================================================

function parseBadges(
  badges?: LPTrustBadgesProps["badges"],
  badgesJson?: string,
): { icon?: string; title: string; description?: string }[] {
  if (badges && badges.length > 0) return badges;
  if (badgesJson) {
    try {
      const parsed = JSON.parse(badgesJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_BADGES;
}

function getIcon(iconName?: string): React.ElementType {
  if (!iconName) return ShieldCheck;
  return ICON_MAP[iconName] || ICON_MAP[iconName.toLowerCase()] || ShieldCheck;
}

// ============================================================================
// Main Component
// ============================================================================

export function LPTrustBadgesRender({
  badges,
  badgesJson,
  variant = "horizontal",
  iconColor,
  showDescriptions = true,
  iconSize = "md",
  backgroundColor,
  textColor,
  paddingY = 48,
  heading,
}: LPTrustBadgesProps) {
  const resolvedBadges = parseBadges(badges, badgesJson);
  const sizes = ICON_SIZES[iconSize] || ICON_SIZES.md;
  const resolvedIconColor = iconColor || "var(--primary, #16a34a)";
  const iconBgColor = iconColor
    ? `${iconColor}15`
    : "var(--primary-light, #f0fdf4)";

  const layoutClasses: Record<string, string> = {
    horizontal: "flex flex-wrap justify-center gap-6 sm:gap-10",
    grid: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6",
    inline: "flex flex-wrap items-center justify-center gap-4",
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
        {heading && (
          <h3
            className="text-lg sm:text-xl font-semibold text-center mb-6"
            style={{ color: textColor || "var(--foreground, #0f172a)" }}
          >
            {heading}
          </h3>
        )}

        <div className={layoutClasses[variant] || layoutClasses.horizontal}>
          {resolvedBadges.map((badge, index) => {
            const IconComponent = getIcon(badge.icon);

            // Inline variant — small compact badges
            if (variant === "inline") {
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <IconComponent
                    className={`${ICON_SIZES.sm.icon} flex-shrink-0`}
                    style={{ color: resolvedIconColor }}
                  />
                  <span
                    className="font-medium"
                    style={{ color: textColor || "var(--foreground, #334155)" }}
                  >
                    {badge.title}
                  </span>
                </div>
              );
            }

            // Grid variant — larger cards with centered content
            if (variant === "grid") {
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-4 rounded-lg"
                >
                  <div
                    className={`${sizes.container} rounded-full flex items-center justify-center mb-3`}
                    style={{ backgroundColor: iconBgColor }}
                  >
                    <IconComponent
                      className={sizes.icon}
                      style={{ color: resolvedIconColor }}
                    />
                  </div>
                  <h4
                    className="font-semibold text-sm"
                    style={{ color: textColor || "var(--foreground, #0f172a)" }}
                  >
                    {badge.title}
                  </h4>
                  {showDescriptions && badge.description && (
                    <p
                      className="text-xs mt-1 max-w-[200px]"
                      style={{
                        color: textColor || "var(--muted-foreground, #64748b)",
                      }}
                    >
                      {badge.description}
                    </p>
                  )}
                </div>
              );
            }

            // Horizontal variant — default
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`${sizes.container} rounded-full flex items-center justify-center mb-3`}
                  style={{ backgroundColor: iconBgColor }}
                >
                  <IconComponent
                    className={sizes.icon}
                    style={{ color: resolvedIconColor }}
                  />
                </div>
                <h4
                  className="font-semibold text-sm"
                  style={{ color: textColor || "var(--foreground, #0f172a)" }}
                >
                  {badge.title}
                </h4>
                {showDescriptions && badge.description && (
                  <p
                    className="text-xs mt-1 max-w-[200px]"
                    style={{
                      color: textColor || "var(--muted-foreground, #64748b)",
                    }}
                  >
                    {badge.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
