import { cn } from "@/lib/utils";
import {
  Building2,
  ShoppingBag,
  Utensils,
  Heart,
  GraduationCap,
  Briefcase,
  Camera,
  Palette,
  Hammer,
  Plane,
  Dumbbell,
  Music,
} from "lucide-react";
import type { BuilderFormData } from "../types";

interface StepIndustryProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

const industries = [
  { id: "business-services", name: "Business Services", icon: Briefcase },
  { id: "ecommerce", name: "E-Commerce", icon: ShoppingBag },
  { id: "restaurant", name: "Restaurant & Food", icon: Utensils },
  { id: "healthcare", name: "Healthcare", icon: Heart },
  { id: "education", name: "Education", icon: GraduationCap },
  { id: "real-estate", name: "Real Estate", icon: Building2 },
  { id: "photography", name: "Photography", icon: Camera },
  { id: "creative", name: "Creative Agency", icon: Palette },
  { id: "construction", name: "Construction", icon: Hammer },
  { id: "travel", name: "Travel & Tourism", icon: Plane },
  { id: "fitness", name: "Fitness & Wellness", icon: Dumbbell },
  { id: "entertainment", name: "Entertainment", icon: Music },
];

export function StepIndustry({ data, onUpdate }: StepIndustryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select your industry</h2>
        <p className="text-muted-foreground">
          This helps us choose the right layout and content style for your business.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {industries.map((industry) => {
          const Icon = industry.icon;
          const isSelected = data.industryId === industry.id;

          return (
            <button
              key={industry.id}
              type="button"
              onClick={() => onUpdate({ industryId: industry.id })}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-center">
                {industry.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
