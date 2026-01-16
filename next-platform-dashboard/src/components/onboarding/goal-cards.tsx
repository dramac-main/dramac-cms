"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const GOALS = [
  {
    id: "build-sites",
    label: "Build client websites",
    description: "Create and manage websites for clients",
    icon: "🌐",
  },
  {
    id: "grow-agency",
    label: "Grow my agency",
    description: "Scale operations and take on more clients",
    icon: "📈",
  },
  {
    id: "automate",
    label: "Automate workflows",
    description: "Save time with AI and automation",
    icon: "⚡",
  },
  {
    id: "white-label",
    label: "White-label for clients",
    description: "Offer a branded experience",
    icon: "🏷️",
  },
  {
    id: "modules",
    label: "Add functionality",
    description: "Extend sites with modules",
    icon: "🧩",
  },
  {
    id: "revenue",
    label: "Generate recurring revenue",
    description: "Monthly subscriptions from clients",
    icon: "💰",
  },
];

const TEAM_SIZES = [
  { id: "solo", label: "Just me", description: "Solo agency" },
  { id: "small", label: "2-5 people", description: "Small team" },
  { id: "medium", label: "6-20 people", description: "Growing team" },
  { id: "large", label: "20+ people", description: "Large agency" },
];

interface GoalCardsProps {
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
  teamSize?: string;
  onTeamSizeChange: (size: string) => void;
}

export function GoalCards({
  selectedGoals,
  onGoalsChange,
  teamSize,
  onTeamSizeChange,
}: GoalCardsProps) {
  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((g) => g !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Size */}
      <div>
        <h3 className="text-sm font-medium mb-3">Team Size</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEAM_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => onTeamSizeChange(size.id)}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-all",
                "hover:border-primary/50",
                teamSize === size.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <p className="font-medium text-sm">{size.label}</p>
              <p className="text-xs text-muted-foreground">{size.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          What are your main goals? <span className="text-muted-foreground">(Select all that apply)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                "hover:border-primary/50",
                selectedGoals.includes(goal.id)
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {selectedGoals.includes(goal.id) && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="text-xl">{goal.icon}</span>
              <div>
                <p className="font-medium text-sm">{goal.label}</p>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
