"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FlaskConical, Beaker, Sparkles, Zap } from "lucide-react";
import type { BetaTier } from "@/lib/modules/beta-program";

interface BetaModuleBadgeProps {
  tier?: BetaTier;
  status?: "draft" | "testing" | "published" | "deprecated";
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tierConfig: Record<
  BetaTier,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    description: string;
  }
> = {
  internal: {
    label: "Internal",
    icon: <Zap className="h-3 w-3" />,
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800",
    description: "Internal testing only - DRAMAC team",
  },
  alpha: {
    label: "Alpha",
    icon: <Beaker className="h-3 w-3" />,
    className:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-800",
    description: "Early alpha testing - may have bugs",
  },
  early_access: {
    label: "Early Access",
    icon: <Sparkles className="h-3 w-3" />,
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800",
    description: "Pre-release features, mostly stable",
  },
  standard: {
    label: "Beta",
    icon: <FlaskConical className="h-3 w-3" />,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800",
    description: "Standard beta testing",
  },
};

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
    description: string;
  }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
    description: "Module is in development",
  },
  testing: {
    label: "Testing",
    className:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
    description: "Module is available for beta testing",
  },
  published: {
    label: "Published",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
    description: "Module is live and available to all",
  },
  deprecated: {
    label: "Deprecated",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800",
    description: "Module is no longer supported",
  },
};

export function BetaModuleBadge({
  tier,
  status,
  showTooltip = true,
  size = "md",
  className = "",
}: BetaModuleBadgeProps) {
  // If status is testing, show beta badge
  if (status === "testing" || tier) {
    const config = tier ? tierConfig[tier] : tierConfig.standard;
    const sizeClasses = {
      sm: "text-xs px-1.5 py-0.5",
      md: "text-xs px-2 py-0.5",
      lg: "text-sm px-2.5 py-1",
    };

    const badge = (
      <Badge
        variant="outline"
        className={`${config.className} ${sizeClasses[size]} ${className} flex items-center gap-1`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent>
              <p>{config.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badge;
  }

  // Show status badge if provided and not testing
  if (status) {
    const config = statusConfig[status] || statusConfig.draft;
    const sizeClasses = {
      sm: "text-xs px-1.5 py-0.5",
      md: "text-xs px-2 py-0.5",
      lg: "text-sm px-2.5 py-1",
    };

    const badge = (
      <Badge
        variant="outline"
        className={`${config.className} ${sizeClasses[size]} ${className}`}
      >
        {config.label}
      </Badge>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent>
              <p>{config.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badge;
  }

  return null;
}

interface ModuleStatusBadgeProps {
  status: "draft" | "testing" | "published" | "deprecated";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Badge specifically for module status
 */
export function ModuleStatusBadge({
  status,
  size = "md",
  showTooltip = true,
  className = "",
}: ModuleStatusBadgeProps) {
  return (
    <BetaModuleBadge
      status={status}
      size={size}
      showTooltip={showTooltip}
      className={className}
    />
  );
}

interface BetaTierBadgeProps {
  tier: BetaTier;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Badge specifically for beta tier
 */
export function BetaTierBadge({
  tier,
  size = "md",
  showTooltip = true,
  className = "",
}: BetaTierBadgeProps) {
  return (
    <BetaModuleBadge
      tier={tier}
      size={size}
      showTooltip={showTooltip}
      className={className}
    />
  );
}

interface TestingBadgeProps {
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Simple "Testing" badge indicator
 */
export function TestingBadge({
  size = "md",
  showTooltip = true,
  className = "",
}: TestingBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  const badge = (
    <Badge
      variant="outline"
      className={`bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800 ${sizeClasses[size]} ${className} flex items-center gap-1`}
    >
      <FlaskConical className="h-3 w-3" />
      Testing
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>This module is currently in testing and may not be fully stable</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
