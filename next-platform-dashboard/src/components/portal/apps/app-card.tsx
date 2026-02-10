"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";

interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  category?: string | null;
}

interface AppCardProps {
  module: Module;
  className?: string;
  showDescription?: boolean;
}

export function AppCard({ module, className, showDescription = false }: AppCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const displayName = module.name;
  const iconName = resolveIconName(module.icon);
  const LucideIcon = icons[iconName as keyof typeof icons] || icons.Package;

  return (
    <div
      className={cn(
        "group flex flex-col items-center justify-center p-4 rounded-xl",
        "bg-card border hover:border-primary/30 transition-all duration-300 cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5",
        isPressed && "scale-95",
        className
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {/* App Icon */}
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3 transition-all duration-300 group-hover:animate-iconBreathe">
        <LucideIcon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      
      {/* App Name */}
      <span className="text-sm font-medium text-center line-clamp-2">
        {displayName}
      </span>

      {/* Optional Description */}
      {showDescription && module.description && (
        <span className="text-xs text-muted-foreground text-center line-clamp-2 mt-1">
          {module.description}
        </span>
      )}
    </div>
  );
}
