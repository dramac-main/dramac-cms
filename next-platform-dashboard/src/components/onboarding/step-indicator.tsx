"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              index < steps.length - 1 && "flex-1"
            )}
          >
            {/* Step circle */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isCompleted && "bg-primary border-primary",
                isCurrent && "border-primary bg-primary/10",
                !isCompleted && !isCurrent && "border-muted-foreground/30"
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isCurrent ? "text-primary" : "text-muted-foreground/50"
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:inline",
                isCompleted && "text-primary",
                isCurrent && "text-foreground",
                !isCompleted && !isCurrent && "text-muted-foreground/50"
              )}
            >
              {step.title}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
