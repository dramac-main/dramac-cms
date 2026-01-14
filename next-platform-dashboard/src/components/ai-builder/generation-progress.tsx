"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface GenerationProgressProps {
  isGenerating: boolean;
}

const steps = [
  { id: 1, label: "Analyzing your description", duration: 2000 },
  { id: 2, label: "Selecting optimal layout", duration: 2500 },
  { id: 3, label: "Generating compelling copy", duration: 3000 },
  { id: 4, label: "Creating visual structure", duration: 2000 },
  { id: 5, label: "Finalizing your website", duration: 1500 },
];

export function GenerationProgress({ isGenerating }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= steps.length) return;
      
      setCurrentStep(stepIndex + 1);
      
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIndex + 1]);
        stepIndex++;
        runStep();
      }, steps[stepIndex].duration);
    };

    runStep();
  }, [isGenerating]);

  if (!isGenerating && completedSteps.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl bg-muted/50 border">
      <div className="space-y-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id && !isCompleted;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="text-xs">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  isCompleted
                    ? "text-foreground"
                    : isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
