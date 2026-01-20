"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
}

interface AppCardProps {
  module: Module;
  className?: string;
  showDescription?: boolean;
}

export function AppCard({ module, className, showDescription = false }: AppCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const displayName = module.name;
  const displayIcon = module.icon || "📦";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl",
        "bg-card border hover:border-primary/50 transition-all cursor-pointer",
        "hover:shadow-lg hover:-translate-y-0.5",
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
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-4xl mb-3 shadow-sm">
        {displayIcon}
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
