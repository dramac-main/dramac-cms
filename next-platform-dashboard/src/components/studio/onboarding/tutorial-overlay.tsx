/**
 * DRAMAC Studio Tutorial Overlay
 * 
 * Visual overlay with spotlight and tooltip for tutorial steps.
 * Uses framer-motion for smooth animations.
 * 
 * @phase STUDIO-26
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTutorialOptional } from "./tutorial-provider";
import type { TutorialStep } from "@/lib/studio/onboarding/tutorial-steps";

// =============================================================================
// MAIN OVERLAY COMPONENT
// =============================================================================

export function TutorialOverlay() {
  const tutorial = useTutorialOptional();
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Get values from tutorial context (safely handle null context)
  const state = tutorial?.state ?? { isActive: false, currentStep: 0, completedAt: null };
  const currentStepData = tutorial?.currentStepData ?? null;
  const totalSteps = tutorial?.totalSteps ?? 0;
  const nextStep = tutorial?.nextStep ?? (() => {});
  const prevStep = tutorial?.prevStep ?? (() => {});
  const skipTutorial = tutorial?.skipTutorial ?? (() => {});

  // Find and measure target element
  useEffect(() => {
    if (!state.isActive || !currentStepData) return;

    const updateTargetRect = () => {
      if (currentStepData.target === "body") {
        // Center of screen
        setTargetRect(null);
      } else {
        const element = document.querySelector(currentStepData.target);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        } else {
          // Target not found - use center position
          console.warn(`[Tutorial] Target not found: ${currentStepData.target}`);
          setTargetRect(null);
        }
      }
    };

    updateTargetRect();

    // Update on resize
    window.addEventListener("resize", updateTargetRect);
    
    // Update on scroll
    window.addEventListener("scroll", updateTargetRect, true);
    
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [state.isActive, currentStepData]);

  // Handle escape key to skip
  useEffect(() => {
    if (!state.isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTutorial();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isActive, nextStep, prevStep, skipTutorial]);

  if (!state.isActive || !currentStepData) return null;

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === totalSteps - 1;
  const showSpotlight = currentStepData.spotlight && targetRect;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]" data-tutorial-overlay="true">
        {/* Backdrop with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
          {showSpotlight ? (
            <SpotlightBackdrop targetRect={targetRect} />
          ) : (
            <div className="absolute inset-0 bg-black/60" />
          )}
        </motion.div>

        {/* Tooltip */}
        <TutorialTooltip
          step={currentStepData}
          stepNumber={state.currentStep + 1}
          totalSteps={totalSteps}
          targetRect={targetRect}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
        />
      </div>
    </AnimatePresence>
  );
}

// =============================================================================
// SPOTLIGHT BACKDROP
// =============================================================================

interface SpotlightBackdropProps {
  targetRect: DOMRect;
}

function SpotlightBackdrop({ targetRect }: SpotlightBackdropProps) {
  const padding = 8;
  const radius = 8;

  const x = targetRect.left - padding;
  const y = targetRect.top - padding;
  const width = targetRect.width + padding * 2;
  const height = targetRect.height + padding * 2;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={radius}
            ry={radius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.6)"
        mask="url(#spotlight-mask)"
      />
      {/* Highlight border around target */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        className="animate-pulse"
      />
    </svg>
  );
}

// =============================================================================
// TUTORIAL TOOLTIP
// =============================================================================

interface TutorialTooltipProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TutorialTooltip({
  step,
  stepNumber,
  totalSteps,
  targetRect,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
}: TutorialTooltipProps) {
  // Calculate tooltip position
  const getTooltipStyle = useCallback((): React.CSSProperties => {
    if (!targetRect || step.position === "center") {
      // Center on screen
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const gap = 16;
    const style: React.CSSProperties = { position: "fixed" };

    switch (step.position) {
      case "top":
        style.bottom = window.innerHeight - targetRect.top + gap;
        style.left = targetRect.left + targetRect.width / 2;
        style.transform = "translateX(-50%)";
        break;
      case "bottom":
        style.top = targetRect.bottom + gap;
        style.left = targetRect.left + targetRect.width / 2;
        style.transform = "translateX(-50%)";
        break;
      case "left":
        style.right = window.innerWidth - targetRect.left + gap;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = "translateY(-50%)";
        break;
      case "right":
        style.left = targetRect.right + gap;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = "translateY(-50%)";
        break;
    }

    return style;
  }, [targetRect, step.position]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key={step.id}
      style={getTooltipStyle()}
      className={cn(
        "w-80 bg-card border rounded-xl shadow-2xl p-4",
        "max-w-[calc(100vw-32px)]"
      )}
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        aria-label="Skip tutorial"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === stepNumber - 1
                ? "w-4 bg-primary"
                : i < stepNumber - 1
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {stepNumber} of {totalSteps}
        </span>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirstStep}
          className={cn(isFirstStep && "invisible")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex gap-2">
          {!isLastStep && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <SkipForward className="w-4 h-4 mr-1" />
              Skip
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {step.nextButtonText || (isLastStep ? "Done" : "Next")}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default TutorialOverlay;
