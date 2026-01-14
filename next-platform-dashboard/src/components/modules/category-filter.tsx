"use client";

import { cn } from "@/lib/utils";
import { MODULE_CATEGORIES, ModuleCategory } from "@/types/modules";
import {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Grid,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
};

interface CategoryFilterProps {
  selected: ModuleCategory | null;
  onSelect: (category: ModuleCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const categories = Object.entries(MODULE_CATEGORIES) as [ModuleCategory, typeof MODULE_CATEGORIES[ModuleCategory]][];

  return (
    <div className="flex flex-wrap gap-2">
      {/* All */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors",
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        )}
      >
        <Grid className="w-4 h-4" />
        All
      </button>

      {/* Category buttons */}
      {categories.map(([key, { label, icon }]) => {
        const Icon = iconMap[icon] || Grid;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors",
              selected === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
