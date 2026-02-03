/**
 * DRAMAC Studio Help Tooltip
 * 
 * Wrapper component for contextual help tooltips.
 * Automatically shows tooltip content based on key.
 * 
 * @phase STUDIO-26
 */

"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTooltipContent } from "@/lib/studio/onboarding/tooltip-content";

// =============================================================================
// COMPONENT
// =============================================================================

interface HelpTooltipProps {
  /** Key matching TOOLTIP_CONTENT for automatic content */
  tooltipKey: string;
  /** The element to wrap */
  children: ReactNode;
  /** Tooltip position */
  side?: "top" | "bottom" | "left" | "right";
  /** Delay before showing tooltip in ms */
  delayDuration?: number;
  /** Align tooltip relative to trigger */
  align?: "start" | "center" | "end";
  /** Custom content (overrides tooltipKey lookup) */
  content?: string;
}

export function HelpTooltip({
  tooltipKey,
  children,
  side = "top",
  delayDuration = 500, // Half second delay to not be annoying
  align = "center",
  content,
}: HelpTooltipProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const tooltipContent = content || getTooltipContent(tooltipKey);

  // Disable tooltips during tutorial
  useEffect(() => {
    const checkTutorial = () => {
      const tutorialActive = document.querySelector("[data-tutorial-active]");
      setIsEnabled(!tutorialActive);
    };

    checkTutorial();
    
    // Check periodically in case tutorial starts/ends
    const interval = setInterval(checkTutorial, 1000);
    return () => clearInterval(interval);
  }, []);

  // If no content or disabled, just render children
  if (!tooltipContent || !isEnabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// SIMPLE TOOLTIP (no lookup, direct content)
// =============================================================================

interface SimpleTooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayDuration?: number;
  align?: "start" | "center" | "end";
}

export function SimpleTooltip({
  content,
  children,
  side = "top",
  delayDuration = 300,
  align = "center",
}: SimpleTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align}>
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HelpTooltip;
