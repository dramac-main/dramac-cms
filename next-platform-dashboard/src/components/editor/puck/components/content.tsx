/**
 * Puck Content Components (PHASE-ED-02B)
 * 
 * Rich content components for displaying various types of information.
 * Includes RichText, Quote, Code, List, Table, Badge, Alert, Progress, etc.
 */

import React, { useState, useEffect } from "react";
import type {
  RichTextProps,
  QuoteProps,
  CodeBlockProps,
  ListProps,
  TableProps,
  BadgeProps,
  AlertProps,
  ProgressProps,
  TooltipWrapperProps,
  TimelineProps,
  PricingTableProps,
  CounterProps,
  AvatarProps,
  AvatarGroupProps,
  IconProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";
import { DropZone } from "@puckeditor/core";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Star,
  Circle,
  CheckSquare,
  Quote as QuoteIcon,
  User,
} from "lucide-react";

// Max width utilities
const maxWidthMap: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "max-w-full",
};

// Font size utilities
const fontSizeMap: Record<string, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

// Line height utilities
const lineHeightMap: Record<string, string> = {
  tight: "leading-tight",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
};

/**
 * RichText Component
 * Multi-line rich text content display.
 */
export function RichTextRender({
  content = "Enter your rich text content here...",
  alignment = "left",
  maxWidth = "full",
  fontSize = "base",
  lineHeight = "normal",
}: RichTextProps) {
  const alignmentMap: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  };

  return (
    <div
      className={cn(
        "prose prose-slate dark:prose-invert w-full mx-auto",
        maxWidthMap[maxWidth || "full"],
        fontSizeMap[fontSize || "base"],
        lineHeightMap[lineHeight || "normal"],
        alignmentMap[alignment || "left"]
      )}
      dangerouslySetInnerHTML={{ __html: content || "" }}
    />
  );
}

/**
 * Quote Component
 * Blockquote with optional citation.
 */
export function QuoteRender({
  text = "This is a beautiful quote that inspires and motivates.",
  author,
  authorRole,
  authorImage,
  variant = "default",
  alignment = "left",
  backgroundColor,
}: QuoteProps) {
  const variantClasses: Record<string, string> = {
    default: "border-l-4 border-primary pl-4",
    bordered: "border border-border rounded-lg p-6",
    highlight: "bg-primary/10 rounded-lg p-6",
    minimal: "italic",
  };

  const alignmentClasses: Record<string, string> = {
    left: "text-left",
    center: "text-center",
  };

  return (
    <blockquote
      className={cn(
        "w-full",
        variantClasses[variant || "default"],
        alignmentClasses[alignment || "left"]
      )}
      style={{ backgroundColor: variant === "highlight" ? undefined : backgroundColor }}
    >
      {variant !== "minimal" && (
        <QuoteIcon className="h-8 w-8 text-primary/30 mb-2" />
      )}
      <p className="text-lg md:text-xl font-medium mb-4">{text}</p>
      {author && (
        <footer className="flex items-center gap-3">
          {authorImage && (
            <img
              src={authorImage}
              alt={author}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <cite className="not-italic font-semibold">{author}</cite>
            {authorRole && (
              <p className="text-sm text-muted-foreground">{authorRole}</p>
            )}
          </div>
        </footer>
      )}
    </blockquote>
  );
}

/**
 * Code Block Component
 * Display code with syntax highlighting theme.
 */
export function CodeBlockRender({
  code = 'console.log("Hello, World!");',
  language = "javascript",
  theme = "dark",
  showLineNumbers = true,
  showCopyButton = true,
  highlightLines,
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeClasses: Record<string, string> = {
    dark: "bg-gray-900 text-gray-100",
    light: "bg-gray-100 text-gray-900",
  };

  const lines = (code || "").split("\n");
  const highlightedLines = highlightLines
    ? highlightLines.split(",").map((l) => parseInt(l.trim()))
    : [];

  return (
    <div className={cn("rounded-lg overflow-hidden", themeClasses[theme || "dark"])}>
      {/* Header */}
      {(filename || showCopyButton) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm text-muted-foreground">{filename}</span>
            )}
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300">
              {language}
            </span>
          </div>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-gray-700/50 transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Code */}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono">
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                highlightedLines.includes(index + 1) && "bg-yellow-500/10 -mx-4 px-4"
              )}
            >
              {showLineNumbers && (
                <span className="select-none w-8 pr-4 text-right text-gray-500">
                  {index + 1}
                </span>
              )}
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/**
 * List Component
 * Ordered, unordered, or checklist display.
 */
export function ListRender({
  items = [
    { text: "First item" },
    { text: "Second item" },
    { text: "Third item" },
  ],
  variant = "unordered",
  icon,
  iconColor,
  spacing = "normal",
}: ListProps) {
  const spacingClasses: Record<string, string> = {
    compact: "space-y-1",
    normal: "space-y-2",
    relaxed: "space-y-4",
  };

  const IconComponent = variant === "checklist" ? CheckSquare : Circle;

  const renderIcon = () => {
    if (variant === "icon" || variant === "checklist") {
      return (
        <IconComponent
          className="h-4 w-4 shrink-0 mt-1"
          style={{ color: iconColor || undefined }}
        />
      );
    }
    return null;
  };

  if (variant === "ordered") {
    return (
      <ol className={cn("list-decimal list-inside", spacingClasses[spacing || "normal"])}>
        {(items || []).map((item, index) => (
          <li key={index} className="text-foreground">
            {item.text}
            {item.subItems && (
              <ul className="list-disc list-inside ml-4 mt-1">
                {item.subItems.map((sub, subIndex) => (
                  <li key={subIndex} className="text-muted-foreground text-sm">
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    );
  }

  if (variant === "unordered") {
    return (
      <ul className={cn("list-disc list-inside", spacingClasses[spacing || "normal"])}>
        {(items || []).map((item, index) => (
          <li key={index} className="text-foreground">
            {item.text}
            {item.subItems && (
              <ul className="list-disc list-inside ml-4 mt-1">
                {item.subItems.map((sub, subIndex) => (
                  <li key={subIndex} className="text-muted-foreground text-sm">
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // Checklist or Icon variant
  return (
    <ul className={cn("space-y-2", spacingClasses[spacing || "normal"])}>
      {(items || []).map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          {renderIcon()}
          <span className="text-foreground">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Table Component
 * Data table display.
 */
export function TableRender({
  headers = [{ key: "col1", label: "Column 1" }, { key: "col2", label: "Column 2" }],
  rows = [
    { col1: "Data 1", col2: "Data 2" },
    { col1: "Data 3", col2: "Data 4" },
  ],
  striped = true,
  bordered = true,
  hoverable = true,
  compact = false,
  alignment = "left",
  headerBackground,
}: TableProps) {
  const alignmentClasses: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  // Normalize headers to object format
  const normalizedHeaders = (headers || []).map((h) =>
    typeof h === "string" ? { key: h, label: h } : h
  );

  // Get cell value from row
  const getCellValue = (row: Record<string, string> | string[], key: string, index: number): string => {
    if (Array.isArray(row)) {
      return row[index] || "";
    }
    return row[key] || "";
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full", bordered && "border border-border")}>
        <thead
          style={{ backgroundColor: headerBackground || undefined }}
          className={cn(!headerBackground && "bg-muted/50")}
        >
          <tr>
            {normalizedHeaders.map((header, index) => (
              <th
                key={index}
                className={cn(
                  "font-semibold",
                  alignmentClasses[alignment || "left"],
                  compact ? "px-3 py-2 text-sm" : "px-4 py-3",
                  bordered && "border-b border-border"
                )}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                striped && rowIndex % 2 === 1 && "bg-muted/30",
                hoverable && "hover:bg-muted/50 transition-colors"
              )}
            >
              {normalizedHeaders.map((header, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    alignmentClasses[alignment || "left"],
                    compact ? "px-3 py-2 text-sm" : "px-4 py-3",
                    bordered && "border-b border-border"
                  )}
                >
                  {getCellValue(row, header.key, cellIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Badge Component
 * Status or label badge.
 */
export function BadgeRender({
  text = "Badge",
  variant = "default",
  size = "md",
  rounded = false,
  icon,
  outline = false,
}: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: outline
      ? "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    primary: outline
      ? "border-primary text-primary"
      : "bg-primary text-primary-foreground",
    secondary: outline
      ? "border-secondary text-secondary-foreground"
      : "bg-secondary text-secondary-foreground",
    success: outline
      ? "border-green-500 text-green-700 dark:text-green-400"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    warning: outline
      ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    danger: outline
      ? "border-red-500 text-red-700 dark:text-red-400"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    info: outline
      ? "border-blue-500 text-blue-700 dark:text-blue-400"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  };

  const sizeClasses: Record<string, string> = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        variantClasses[variant || "default"],
        sizeClasses[size || "md"],
        rounded ? "rounded-full" : "rounded-md",
        outline && "border bg-transparent"
      )}
    >
      {text}
    </span>
  );
}

/**
 * Alert Component
 * Info, success, warning, or error alert.
 */
export function AlertRender({
  title,
  message = "This is an alert message.",
  variant = "info",
  icon,
  dismissible = false,
  showIcon = true,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const variantClasses: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    danger: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  };

  const iconComponents: Record<string, React.ReactNode> = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    danger: <XCircle className="h-5 w-5" />,
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        variantClasses[variant || "info"]
      )}
      role="alert"
    >
      {showIcon && (
        <div className="shrink-0">{iconComponents[variant || "info"]}</div>
      )}
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Progress Component
 * Progress bar indicator.
 */
export function ProgressRender({
  value = 60,
  max = 100,
  label,
  showValue = true,
  variant = "default",
  size = "md",
  animated = false,
  striped = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value || 0) / (max || 100) * 100, 0), 100);

  const variantClasses: Record<string, string> = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  const sizeClasses: Record<string, string> = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5 text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showValue && <span className="text-muted-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size || "md"])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            variantClasses[variant || "default"],
            striped && "bg-stripes",
            animated && "animate-progress"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Tooltip Wrapper Component
 * Adds hover tooltip to child content.
 */
export function TooltipWrapperRender({
  content = "Tooltip content",
  position = "top",
  trigger = "hover",
  maxWidth = 200,
}: TooltipWrapperProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => trigger === "hover" && setVisible(true)}
      onMouseLeave={() => trigger === "hover" && setVisible(false)}
      onClick={() => trigger === "click" && setVisible(!visible)}
    >
      <DropZone zone="tooltip-trigger" />

      {visible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg",
            positionClasses[position || "top"]
          )}
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {content}
          <div
            className={cn(
              "absolute w-2 h-2 bg-gray-900 rotate-45",
              position === "top" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
              position === "bottom" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
              position === "left" && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
              position === "right" && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Timeline Component
 * Vertical timeline display.
 */
export function TimelineRender({
  items = [
    { title: "Event 1", description: "Description for event 1", date: "Jan 2024" },
    { title: "Event 2", description: "Description for event 2", date: "Feb 2024" },
    { title: "Event 3", description: "Description for event 3", date: "Mar 2024" },
  ],
  variant = "default",
  lineStyle = "solid",
  showConnector = true,
}: TimelineProps) {
  const lineStyleClasses: Record<string, string> = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  return (
    <div className="w-full">
      {(items || []).map((item, index) => (
        <div
          key={index}
          className={cn(
            "relative pl-8 pb-8",
            index === (items || []).length - 1 && "pb-0"
          )}
        >
          {/* Connector line */}
          {showConnector && index !== (items || []).length - 1 && (
            <div
              className={cn(
                "absolute left-3 top-3 bottom-0 w-0 border-l-2 border-border",
                lineStyleClasses[lineStyle || "solid"]
              )}
            />
          )}

          {/* Dot */}
          <div
            className={cn(
              "absolute left-0 top-1 w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center",
              item.color ? "" : "border-primary"
            )}
            style={{ borderColor: item.color || undefined }}
          >
            {item.icon ? (
              <span className="text-xs">{item.icon}</span>
            ) : (
              <div
                className="w-2 h-2 rounded-full bg-primary"
                style={{ backgroundColor: item.color || undefined }}
              />
            )}
          </div>

          {/* Content */}
          <div>
            {item.date && (
              <span className="text-xs text-muted-foreground font-medium">
                {item.date}
              </span>
            )}
            <h4 className="font-semibold mt-1">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Pricing Table Component
 * Pricing plans comparison.
 */
export function PricingTableRender({
  plans = [
    {
      name: "Basic",
      price: "$9",
      period: "/month",
      description: "Perfect for getting started",
      features: ["1 User", "10 Projects", "5GB Storage"],
      buttonText: "Get Started",
      buttonLink: "#",
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Best for professionals",
      features: ["5 Users", "50 Projects", "50GB Storage", "Priority Support"],
      buttonText: "Get Started",
      buttonLink: "#",
      highlighted: true,
      badge: "Popular",
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large teams",
      features: ["Unlimited Users", "Unlimited Projects", "500GB Storage", "24/7 Support", "Custom Integrations"],
      buttonText: "Contact Sales",
      buttonLink: "#",
    },
  ],
  columns = 3,
}: PricingTableProps) {
  const columnClasses: Record<number, string> = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", columnClasses[columns || 3])}>
      {(plans || []).map((plan, index) => (
        <div
          key={index}
          className={cn(
            "relative rounded-xl border p-6 transition-shadow hover:shadow-lg",
            plan.highlighted && "border-primary shadow-lg scale-105 z-10"
          )}
        >
          {plan.badge && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
              {plan.badge}
            </span>
          )}
          <h3 className="text-xl font-bold">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
          )}
          <div className="mt-4">
            <span className="text-4xl font-bold">{plan.price}</span>
            {plan.period && (
              <span className="text-muted-foreground">{plan.period}</span>
            )}
          </div>
          <ul className="mt-6 space-y-3">
            {(plan.features || []).map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          {plan.buttonText && (
            <a
              href={plan.buttonLink || "#"}
              className={cn(
                "block w-full mt-6 px-4 py-2 text-center rounded-lg font-medium transition-colors",
                plan.highlighted
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {plan.buttonText}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Counter Component
 * Animated number counter.
 */
export function CounterRender({
  value = 1000,
  prefix,
  suffix,
  duration = 2000,
  separator = true,
  decimals = 0,
  label,
  labelPosition = "bottom",
  size = "lg",
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value || 0;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration || 2000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals || 0);
    if (separator) {
      return Number(fixed).toLocaleString();
    }
    return fixed;
  };

  const sizeClasses: Record<string, string> = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl",
  };

  return (
    <div className="text-center">
      {labelPosition === "top" && label && (
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
      )}
      <div className={cn("font-bold", sizeClasses[size || "lg"])}>
        {prefix}
        {formatNumber(displayValue)}
        {suffix}
      </div>
      {labelPosition === "bottom" && label && (
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      )}
    </div>
  );
}

/**
 * Avatar Component
 * User avatar display.
 */
export function AvatarRender({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  rounded = "full",
  border = false,
  status,
}: AvatarProps) {
  const sizeClasses: Record<string, string> = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  const roundedClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            sizeClasses[size || "md"],
            roundedClasses[rounded || "full"],
            "object-cover",
            border && "ring-2 ring-background"
          )}
        />
      ) : (
        <div
          className={cn(
            sizeClasses[size || "md"],
            roundedClasses[rounded || "full"],
            "bg-muted flex items-center justify-center font-medium",
            border && "ring-2 ring-background"
          )}
        >
          {fallback || <User className="w-1/2 h-1/2 text-muted-foreground" />}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-background",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group Component
 * Multiple overlapping avatars.
 */
export function AvatarGroupRender({
  avatars = [
    { src: undefined, alt: "User 1", fallback: "U1" },
    { src: undefined, alt: "User 2", fallback: "U2" },
    { src: undefined, alt: "User 3", fallback: "U3" },
  ],
  max = 4,
  size = "md",
  overlap = "md",
}: AvatarGroupProps) {
  const displayAvatars = (avatars || []).slice(0, max);
  const remaining = (avatars || []).length - (max || 4);

  const sizeClasses: Record<string, string> = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const overlapClasses: Record<string, string> = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
  };

  return (
    <div className="flex items-center">
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            sizeClasses[size || "md"],
            "rounded-full ring-2 ring-background",
            index > 0 && overlapClasses[overlap || "md"]
          )}
        >
          {avatar.src ? (
            <img
              src={avatar.src}
              alt={avatar.alt}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center font-medium">
              {avatar.fallback || <User className="w-1/2 h-1/2 text-muted-foreground" />}
            </div>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            sizeClasses[size || "md"],
            "rounded-full bg-muted ring-2 ring-background flex items-center justify-center font-medium",
            overlapClasses[overlap || "md"]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

/**
 * Icon Component
 * Display icons with styling.
 */
export function IconRender({
  name = "star",
  size = "md",
  color,
  strokeWidth = 2,
  backgroundColor,
  rounded = false,
}: IconProps) {
  const sizeClasses: Record<string, { icon: string; container: string }> = {
    xs: { icon: "w-3 h-3", container: "w-6 h-6" },
    sm: { icon: "w-4 h-4", container: "w-8 h-8" },
    md: { icon: "w-5 h-5", container: "w-10 h-10" },
    lg: { icon: "w-6 h-6", container: "w-12 h-12" },
    xl: { icon: "w-8 h-8", container: "w-16 h-16" },
  };

  // Use Star as default, but in a real app you'd have an icon registry
  const IconComponent = Star;

  if (backgroundColor) {
    return (
      <div
        className={cn(
          sizeClasses[size || "md"].container,
          "flex items-center justify-center",
          rounded ? "rounded-full" : "rounded-md"
        )}
        style={{ backgroundColor }}
      >
        <IconComponent
          className={sizeClasses[size || "md"].icon}
          strokeWidth={strokeWidth}
          style={{ color: color || undefined }}
        />
      </div>
    );
  }

  return (
    <IconComponent
      className={sizeClasses[size || "md"].icon}
      strokeWidth={strokeWidth}
      style={{ color: color || undefined }}
    />
  );
}
