"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Package, Zap, MessageSquare, ShoppingCart, Calendar, Bot, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// =============================================================================
// MODULE USAGE WIDGET
// =============================================================================

export interface ModuleUsageData {
  moduleId: string;
  name: string;
  icon?: string;
  enabled: number;
  total: number;
  category: string;
}

export interface ModuleUsageWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  modules: ModuleUsageData[];
  maxItems?: number;
  animated?: boolean;
}

const moduleIcons: Record<string, LucideIcon> = {
  "social-media": MessageSquare,
  "crm": Zap,
  "ecommerce": ShoppingCart,
  "booking": Calendar,
  "automation": Bot,
  "default": Package,
};

const moduleColors: Record<string, { bg: string; text: string; progress: string }> = {
  "social-media": {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    progress: "bg-blue-500",
  },
  "crm": {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
    progress: "bg-violet-500",
  },
  "ecommerce": {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    progress: "bg-emerald-500",
  },
  "booking": {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    progress: "bg-amber-500",
  },
  "automation": {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-600 dark:text-pink-400",
    progress: "bg-pink-500",
  },
  "default": {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    progress: "bg-gray-500",
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * ModuleUsageWidget - Display module installation metrics.
 * 
 * @example
 * ```tsx
 * <ModuleUsageWidget
 *   modules={[
 *     { moduleId: "crm", name: "CRM", enabled: 8, total: 12, category: "crm" },
 *     { moduleId: "social", name: "Social Media", enabled: 5, total: 12, category: "social-media" },
 *   ]}
 * />
 * ```
 */
const ModuleUsageWidget = React.forwardRef<HTMLDivElement, ModuleUsageWidgetProps>(
  ({ className, modules, maxItems = 5, animated = true, ...props }, ref) => {
    const displayModules = modules.slice(0, maxItems);
    
    if (modules.length === 0) {
      return (
        <div 
          ref={ref} 
          className={cn(
            "flex flex-col items-center justify-center py-8 text-center",
            className
          )}
          {...props}
        >
          <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No modules installed yet</p>
          <a 
            href="/marketplace/v2" 
            className="text-sm text-primary hover:underline mt-1"
          >
            Browse Marketplace
          </a>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {displayModules.map((module, index) => {
          const category = module.category.toLowerCase();
          const Icon = moduleIcons[category] || moduleIcons.default;
          const colors = moduleColors[category] || moduleColors.default;
          const percentage = module.total > 0 
            ? Math.round((module.enabled / module.total) * 100) 
            : 0;

          const Wrapper = animated ? motion.div : "div";
          const wrapperProps = animated ? { variants: itemVariants } : {};

          return (
            <Wrapper
              key={module.moduleId}
              {...wrapperProps}
              className="group"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", colors.bg)}>
                  <Icon className={cn("h-4 w-4", colors.text)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{module.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {module.enabled}/{module.total} sites
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full transition-all duration-500 rounded-full", colors.progress)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </Wrapper>
          );
        })}

        {modules.length > maxItems && (
          <div className="text-center pt-2">
            <a 
              href="/dashboard/modules/subscriptions" 
              className="text-xs text-primary hover:underline"
            >
              View all {modules.length} modules →
            </a>
          </div>
        )}
      </div>
    );
  }
);

ModuleUsageWidget.displayName = "ModuleUsageWidget";

export { ModuleUsageWidget };
