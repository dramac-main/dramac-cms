"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='sidebar']",
    title: "Navigation Sidebar",
    description: "Access all your clients, sites, and settings from here.",
    position: "right",
  },
  {
    target: "[data-tour='clients']",
    title: "Client Management",
    description: "Add and manage your clients. Each client can have multiple websites.",
    position: "right",
  },
  {
    target: "[data-tour='sites']",
    title: "Site Builder",
    description: "Create stunning websites with our visual editor or AI builder.",
    position: "right",
  },
  {
    target: "[data-tour='ai-builder']",
    title: "AI Builder",
    description: "Generate complete websites from a simple description in seconds!",
    position: "right",
  },
  {
    target: "[data-tour='modules']",
    title: "Module Marketplace",
    description: "Extend your sites with powerful add-ons like forms, analytics, and more.",
    position: "right",
  },
];

interface ProductTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

function calculatePosition(element: Element, position: "top" | "bottom" | "left" | "right") {
  const rect = element.getBoundingClientRect();
  let top = 0;
  let left = 0;

  switch (position) {
    case "right":
      top = rect.top + rect.height / 2 - 50;
      left = rect.right + 16;
      break;
    case "left":
      top = rect.top + rect.height / 2 - 50;
      left = rect.left - 316;
      break;
    case "top":
      top = rect.top - 120;
      left = rect.left + rect.width / 2 - 150;
      break;
    case "bottom":
      top = rect.bottom + 16;
      left = rect.left + rect.width / 2 - 150;
      break;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (left < 16) left = 16;
  if (left + 320 > viewportWidth) left = viewportWidth - 336;
  if (top < 16) top = 16;
  if (top + 150 > viewportHeight) top = viewportHeight - 166;

  return { top, left };
}

export function ProductTour({ onComplete, isOpen }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const highlightedRef = useRef<Element | null>(null);

  const step = useMemo(() => TOUR_STEPS[currentStep], [currentStep]);

  const handlePositionUpdate = useCallback(() => {
    if (!isOpen) return;
    
    const element = document.querySelector(step.target);
    if (element) {
      const newPosition = calculatePosition(element, step.position);
      setPosition(newPosition);
      
      // Update highlight
      if (highlightedRef.current && highlightedRef.current !== element) {
        highlightedRef.current.classList.remove("ring-2", "ring-primary", "ring-offset-2", "relative", "z-50");
      }
      element.classList.add("ring-2", "ring-primary", "ring-offset-2", "relative", "z-50");
      highlightedRef.current = element;
    }
  }, [isOpen, step.target, step.position]);

  // Initial position calculation
  useEffect(() => {
    if (!isOpen) return;
    
    // Defer to avoid synchronous setState
    const timeoutId = setTimeout(handlePositionUpdate, 0);
    
    return () => clearTimeout(timeoutId);
  }, [isOpen, currentStep, handlePositionUpdate]);

  // Event listeners for scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    
    window.addEventListener("scroll", handlePositionUpdate, true);
    window.addEventListener("resize", handlePositionUpdate);
    
    return () => {
      window.removeEventListener("scroll", handlePositionUpdate, true);
      window.removeEventListener("resize", handlePositionUpdate);
    };
  }, [isOpen, handlePositionUpdate]);

  // Cleanup highlight on unmount or close
  useEffect(() => {
    return () => {
      if (highlightedRef.current) {
        highlightedRef.current.classList.remove("ring-2", "ring-primary", "ring-offset-2", "relative", "z-50");
        highlightedRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onComplete} />

      {/* Tooltip */}
      <Card
        className="fixed w-80 z-50 shadow-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{step.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-1"
              onClick={onComplete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {step.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {isLast ? (
                <Button size="sm" onClick={onComplete}>
                  Finish Tour
                </Button>
              ) : (
                <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
