"use client";

import { cn } from "@/lib/utils";
import { INDUSTRIES, type IndustryId } from "@/lib/constants/onboarding";
import { Check } from "lucide-react";

interface IndustrySelectorProps {
  value?: IndustryId;
  onChange: (id: IndustryId) => void;
}

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {INDUSTRIES.map((industry) => (
        <button
          key={industry.id}
          type="button"
          onClick={() => onChange(industry.id)}
          className={cn(
            "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
            "hover:border-primary/50 hover:bg-muted/50",
            value === industry.id
              ? "border-primary bg-primary/5"
              : "border-border"
          )}
        >
          {value === industry.id && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-2xl mb-2">{industry.icon}</span>
          <span className="text-xs font-medium text-center">
            {industry.label}
          </span>
        </button>
      ))}
    </div>
  );
}
