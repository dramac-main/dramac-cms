"use client";

import { cn } from "@/lib/utils";
import { industryTemplates, IndustryTemplate } from "@/lib/ai/templates";
import {
  Palette,
  Rocket,
  ShoppingCart,
  UtensilsCrossed,
  User,
  HeartPulse,
  Home,
  Dumbbell,
  GraduationCap,
  Heart,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette,
  Rocket,
  ShoppingCart,
  UtensilsCrossed,
  User,
  HeartPulse,
  Home,
  Dumbbell,
  GraduationCap,
  Heart,
};

interface IndustrySelectorProps {
  selected: string | null;
  onSelect: (industry: IndustryTemplate) => void;
}

export function IndustrySelector({ selected, onSelect }: IndustrySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Choose Your Industry</h3>
        <p className="text-sm text-muted-foreground">
          Select an industry to get optimized templates and suggestions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {industryTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Palette;
          const isSelected = selected === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-center">{template.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
