"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MODULE_CATEGORIES } from "@/lib/modules/module-catalog";
import type { ModuleCategory } from "@/lib/modules/module-types";
import { cn } from "@/lib/utils";

interface ModuleCategoryFilterProps {
  selected: ModuleCategory | null;
  onChange: (category: ModuleCategory | null) => void;
}

export function ModuleCategoryFilter({
  selected,
  onChange,
}: ModuleCategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selected === null ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(null)}
        >
          All
        </Button>

        {MODULE_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selected === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(category.id as ModuleCategory)}
            className={cn(
              selected === category.id && "bg-primary"
            )}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
