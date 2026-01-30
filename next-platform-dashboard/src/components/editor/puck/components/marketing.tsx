/**
 * Puck Marketing Components (PHASE-ED-03B)
 * 
 * Marketing-focused components for lead generation, social proof,
 * and conversion optimization.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Shield,
  Lock,
  CreditCard,
  Check,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  Award,
  Zap,
  Target,
  Gift,
  ArrowRight,
} from "lucide-react";
import type {
  AnnouncementBarProps,
  SocialProofProps,
  TrustBadgesProps,
  LogoCloudProps,
  ComparisonTableProps,
  FeatureComparisonProps,
  BeforeAfterProps,
  TestimonialWallProps,
  ValuePropositionProps,
  LeadCaptureProps,
} from "@/types/puck";

// ============================================
// ANNOUNCEMENT BAR COMPONENT
// ============================================

export function AnnouncementBarRender({
  text = "🎉 Special offer: Get 20% off with code SAVE20",
  linkText,
  linkUrl,
  backgroundColor = "#4f46e5",
  textColor = "#ffffff",
  dismissible = true,
  sticky = true,
  size = "md",
}: AnnouncementBarProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const sizeMap: Record<string, string> = {
    sm: "py-2 text-sm",
    md: "py-3 text-base",
    lg: "py-4 text-lg",
  };

  return (
    <div
      className={cn(
        "w-full flex items-center justify-center gap-4 px-4",
        sizeMap[size || "md"],
        sticky && "sticky top-0 z-50"
      )}
      style={{ backgroundColor, color: textColor }}
    >
      <p className="text-center">
        {text}
        {linkText && linkUrl && (
          <a
            href={linkUrl}
            className="ml-2 underline hover:no-underline inline-flex items-center gap-1"
          >
            {linkText}
            <ChevronRight className="w-4 h-4" />
          </a>
        )}
      </p>
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// SOCIAL PROOF COMPONENT
// ============================================

export function SocialProofRender({
  variant = "counter",
  count = 10000,
  countLabel = "happy customers",
  activities = [],
  showAvatar = true,
  updateInterval = 5000,
  backgroundColor,
  position = "bottom-left",
}: SocialProofProps) {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    if (variant === "live" && activities.length > 0) {
      const interval = setInterval(() => {
        setCurrentActivity((prev) => (prev + 1) % activities.length);
      }, updateInterval);
      return () => clearInterval(interval);
    }
  }, [variant, activities, updateInterval]);

  // Animate counter
  useEffect(() => {
    if (variant === "counter") {
      const duration = 2000;
      const steps = 50;
      const increment = count / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= count) {
          setDisplayCount(count);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [count, variant]);

  const positionMap: Record<string, string> = {
    "bottom-left": "fixed bottom-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    "inline": "relative",
  };

  if (variant === "counter") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg shadow-lg",
          position !== "inline" && positionMap[position || "bottom-left"],
          "bg-card border"
        )}
        style={{ backgroundColor }}
      >
        <div className="p-2 rounded-full bg-primary/10">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">
            {displayCount.toLocaleString()}+
          </p>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
      </div>
    );
  }

  if (variant === "live" && activities.length > 0) {
    const activity = activities[currentActivity];
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5",
          position !== "inline" && positionMap[position || "bottom-left"],
          "bg-card border"
        )}
        style={{ backgroundColor }}
      >
        {showAvatar && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {activity?.avatar ? (
              <img src={activity.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-primary" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activity?.name || "Someone"}</p>
          <p className="text-xs text-muted-foreground">{activity?.action || "just signed up"}</p>
        </div>
        <span className="text-xs text-muted-foreground">{activity?.time || "Just now"}</span>
      </div>
    );
  }

  return (
    <div className="p-4 text-center border border-dashed rounded-lg">
      <p className="text-muted-foreground">Configure social proof settings</p>
    </div>
  );
}

// ============================================
// TRUST BADGES COMPONENT
// ============================================

export function TrustBadgesRender({
  badges = [],
  layout = "horizontal",
  size = "md",
  showLabels = true,
  grayscale = false,
}: TrustBadgesProps) {
  const defaultBadges = [
    { icon: "shield", label: "Secure Checkout", image: "" },
    { icon: "lock", label: "SSL Encrypted", image: "" },
    { icon: "credit-card", label: "Safe Payment", image: "" },
    { icon: "award", label: "Satisfaction Guaranteed", image: "" },
  ];

  const displayBadges = badges.length > 0 ? badges : defaultBadges;

  const iconMap: Record<string, typeof Shield> = {
    shield: Shield,
    lock: Lock,
    "credit-card": CreditCard,
    award: Award,
    check: Check,
  };

  const sizeMap: Record<string, { icon: string; text: string }> = {
    sm: { icon: "w-6 h-6", text: "text-xs" },
    md: { icon: "w-8 h-8", text: "text-sm" },
    lg: { icon: "w-10 h-10", text: "text-base" },
  };

  const layoutClass = layout === "horizontal" 
    ? "flex flex-wrap items-center justify-center gap-6" 
    : "flex flex-col items-center gap-4";

  return (
    <div className={layoutClass}>
      {displayBadges.map((badge, index) => {
        const IconComponent = iconMap[badge.icon || "shield"] || Shield;
        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2",
              layout === "vertical" && "flex-col text-center"
            )}
          >
            {badge.image ? (
              <img
                src={badge.image}
                alt={badge.label || ""}
                className={cn(sizeMap[size || "md"].icon, grayscale && "grayscale")}
              />
            ) : (
              <IconComponent
                className={cn(
                  sizeMap[size || "md"].icon,
                  "text-muted-foreground",
                  grayscale && "opacity-50"
                )}
              />
            )}
            {showLabels && badge.label && (
              <span className={cn(sizeMap[size || "md"].text, "text-muted-foreground")}>
                {badge.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// LOGO CLOUD COMPONENT
// ============================================

export function LogoCloudRender({
  title,
  logos = [],
  columns = 5,
  grayscale = true,
  hoverEffect = true,
  size = "md",
  alignment = "center",
}: LogoCloudProps) {
  const sizeMap: Record<string, string> = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  const alignmentMap: Record<string, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  if (logos.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Add logos to display partner/client logos</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {title && (
        <p className={cn("text-sm text-muted-foreground mb-6", `text-${alignment}`)}>
          {title}
        </p>
      )}
      <div
        className={cn(
          "flex flex-wrap items-center gap-8",
          alignmentMap[alignment || "center"]
        )}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {logos.map((logo, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-center p-4",
              grayscale && "grayscale opacity-50",
              hoverEffect && "transition-all hover:grayscale-0 hover:opacity-100"
            )}
          >
            <img
              src={logo.src}
              alt={logo.alt || `Partner ${index + 1}`}
              className={cn(sizeMap[size || "md"], "object-contain")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPARISON TABLE COMPONENT
// ============================================

export function ComparisonTableRender({
  title,
  headers = [],
  features = [],
  highlightColumn,
  showCheckmarks = true,
}: ComparisonTableProps) {
  if (headers.length === 0 || features.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-lg">
        <p className="text-muted-foreground">Add headers and features to comparison table</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {title && (
        <h3 className="text-2xl font-bold text-center mb-6">{title}</h3>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 border-b font-semibold">Features</th>
            {headers.map((header, index) => (
              <th
                key={index}
                className={cn(
                  "p-4 border-b text-center font-semibold",
                  highlightColumn === index && "bg-primary/5"
                )}
              >
                {header.name}
                {header.price && (
                  <p className="text-sm font-normal text-muted-foreground">{header.price}</p>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, rowIndex) => (
            <tr key={rowIndex}>
              <td className="p-4 border-b">{feature.name}</td>
              {feature.values.map((value, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    "p-4 border-b text-center",
                    highlightColumn === colIndex && "bg-primary/5"
                  )}
                >
                  {showCheckmarks ? (
                    value === true || value === "yes" || value === "✓" ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : value === false || value === "no" || value === "✗" ? (
                      <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                    ) : (
                      value
                    )
                  ) : (
                    value
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// FEATURE COMPARISON COMPONENT
// ============================================

export function FeatureComparisonRender({
  leftTitle = "Before",
  rightTitle = "After",
  leftFeatures = [],
  rightFeatures = [],
  leftColor = "#ef4444",
  rightColor = "#22c55e",
}: FeatureComparisonProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Left Side */}
      <div className="p-6 rounded-lg border bg-card">
        <h3
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ color: leftColor }}
        >
          <X className="w-5 h-5" />
          {leftTitle}
        </h3>
        <ul className="space-y-3">
          {leftFeatures.length > 0 ? (
            leftFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-muted-foreground">
                <X className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: leftColor }} />
                {feature}
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">Add features</li>
          )}
        </ul>
      </div>

      {/* Right Side */}
      <div className="p-6 rounded-lg border bg-card" style={{ borderColor: rightColor }}>
        <h3
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ color: rightColor }}
        >
          <Check className="w-5 h-5" />
          {rightTitle}
        </h3>
        <ul className="space-y-3">
          {rightFeatures.length > 0 ? (
            rightFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: rightColor }} />
                {feature}
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">Add features</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// BEFORE/AFTER IMAGE COMPARISON
// ============================================

export function BeforeAfterRender({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  startPosition = 50,
  orientation = "horizontal",
}: BeforeAfterProps) {
  const [position, setPosition] = useState(startPosition);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    if (orientation === "horizontal") {
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percent);
    } else {
      const y = clientY - rect.top;
      const percent = Math.max(0, Math.min(100, (y / rect.height) * 100));
      setPosition(percent);
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  if (!beforeImage || !afterImage) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Add before and after images</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video overflow-hidden rounded-lg cursor-ew-resize select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* After Image (Background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath:
            orientation === "horizontal"
              ? `inset(0 ${100 - position}% 0 0)`
              : `inset(0 0 ${100 - position}% 0)`,
        }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Slider Handle */}
      <div
        className={cn(
          "absolute bg-white shadow-lg flex items-center justify-center",
          orientation === "horizontal"
            ? "top-0 bottom-0 w-1 cursor-ew-resize"
            : "left-0 right-0 h-1 cursor-ns-resize"
        )}
        style={{
          [orientation === "horizontal" ? "left" : "top"]: `${position}%`,
          transform: orientation === "horizontal" ? "translateX(-50%)" : "translateY(-50%)",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <ChevronRight className="w-4 h-4 text-gray-600 -mr-1.5" />
            <ChevronRight className="w-4 h-4 text-gray-600 rotate-180" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-4 left-4 px-2 py-1 bg-black/60 text-white text-sm rounded">
        {beforeLabel}
      </span>
      <span className="absolute top-4 right-4 px-2 py-1 bg-black/60 text-white text-sm rounded">
        {afterLabel}
      </span>
    </div>
  );
}

// ============================================
// TESTIMONIAL WALL COMPONENT
// ============================================

export function TestimonialWallRender({
  testimonials = [],
  columns = 3,
  variant = "masonry",
  showRating = true,
  cardStyle = "default",
}: TestimonialWallProps) {
  const cardStyles: Record<string, string> = {
    default: "bg-card border p-6 rounded-lg",
    minimal: "p-6",
    elevated: "bg-card p-6 rounded-lg shadow-lg",
  };

  if (testimonials.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-lg">
        <p className="text-muted-foreground">Add testimonials to display</p>
      </div>
    );
  }

  const columnMap: Record<number, string> = {
    2: "columns-1 md:columns-2",
    3: "columns-1 md:columns-2 lg:columns-3",
    4: "columns-1 md:columns-2 lg:columns-4",
  };

  return (
    <div className={cn(variant === "masonry" ? columnMap[columns || 3] : `grid grid-cols-${columns}`, "gap-4")}>
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className={cn(
            cardStyles[cardStyle || "default"],
            variant === "masonry" && "break-inside-avoid mb-4"
          )}
        >
          {showRating && testimonial.rating && (
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < testimonial.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
          <p className="italic mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
          <div className="flex items-center gap-3">
            {testimonial.avatar && (
              <img
                src={testimonial.avatar}
                alt={testimonial.author}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold">{testimonial.author}</p>
              {testimonial.role && (
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// VALUE PROPOSITION COMPONENT
// ============================================

export function ValuePropositionRender({
  title = "Why Choose Us?",
  subtitle,
  propositions = [],
  layout = "grid",
  columns = 3,
  iconStyle = "default",
}: ValuePropositionProps) {
  const iconMap: Record<string, typeof Zap> = {
    zap: Zap,
    target: Target,
    shield: Shield,
    award: Award,
    users: Users,
    trending: TrendingUp,
    star: Star,
  };

  const iconStyles: Record<string, string> = {
    default: "w-10 h-10 p-2 rounded-lg bg-primary/10 text-primary",
    circle: "w-12 h-12 p-3 rounded-full bg-primary/10 text-primary",
    minimal: "w-8 h-8 text-primary",
  };

  const columnMap: Record<number, string> = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      <div
        className={cn(
          layout === "grid" ? `grid gap-8 ${columnMap[columns || 3]}` : "flex flex-col gap-6"
        )}
      >
        {propositions.length > 0 ? (
          propositions.map((prop, index) => {
            const IconComponent = iconMap[prop.icon || "zap"] || Zap;
            return (
              <div
                key={index}
                className={cn(
                  "flex gap-4",
                  layout === "grid" && "flex-col items-center text-center"
                )}
              >
                <IconComponent className={iconStyles[iconStyle || "default"]} />
                <div>
                  <h3 className="font-semibold mb-1">{prop.title}</h3>
                  <p className="text-muted-foreground text-sm">{prop.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground col-span-full">
            Add value propositions to display
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// LEAD CAPTURE COMPONENT
// ============================================

export function LeadCaptureRender({
  title = "Get Your Free Guide",
  subtitle = "Enter your email to receive instant access",
  incentive,
  incentiveIcon = "gift",
  buttonText = "Get Access",
  placeholder = "Enter your email",
  successMessage = "Thanks! Check your inbox.",
  layout = "horizontal",
  backgroundColor,
  showPrivacyNote = true,
  privacyText = "We respect your privacy. Unsubscribe at any time.",
}: LeadCaptureProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const iconMap: Record<string, typeof Gift> = {
    gift: Gift,
    zap: Zap,
    star: Star,
  };

  const IncentiveIcon = iconMap[incentiveIcon || "gift"] || Gift;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-8 text-center rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <p className="text-lg font-semibold text-green-700 dark:text-green-300">{successMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="p-8 rounded-lg"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className={cn(layout === "horizontal" ? "md:flex items-center gap-8" : "")}>
        {/* Content */}
        <div className={cn(layout === "horizontal" ? "md:flex-1 mb-6 md:mb-0" : "text-center mb-6")}>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{subtitle}</p>
          {incentive && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm">
              <IncentiveIcon className="w-4 h-4" />
              {incentive}
            </div>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            layout === "horizontal" ? "md:flex-1" : "",
            layout === "stacked" && "max-w-md mx-auto"
          )}
        >
          <div className={cn(layout === "horizontal" ? "flex gap-3" : "space-y-3")}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className={cn(
                "flex-1 px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                layout === "stacked" && "w-full"
              )}
            />
            <button
              type="submit"
              className={cn(
                "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2",
                layout === "stacked" && "w-full justify-center"
              )}
            >
              {buttonText}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {showPrivacyNote && (
            <p className="text-xs text-muted-foreground mt-3">{privacyText}</p>
          )}
        </form>
      </div>
    </div>
  );
}
