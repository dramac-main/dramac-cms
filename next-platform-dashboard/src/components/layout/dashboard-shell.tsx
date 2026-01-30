"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  /** Page content */
  children: ReactNode;
  /** Additional class name for the container */
  className?: string;
  /** Whether to apply default padding */
  noPadding?: boolean;
  /** Maximum width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md", 
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
  none: "",
};

/**
 * DashboardShell provides a consistent wrapper for dashboard pages.
 * It handles spacing, max-width constraints, and animations.
 * 
 * @example
 * ```tsx
 * <DashboardShell>
 *   <PageHeader title="Dashboard" />
 *   <Content />
 * </DashboardShell>
 * 
 * // Full width page
 * <DashboardShell maxWidth="full">
 *   <Editor />
 * </DashboardShell>
 * ```
 */
export function DashboardShell({
  children,
  className,
  noPadding = false,
  maxWidth = "2xl",
}: DashboardShellProps) {
  return (
    <div 
      className={cn(
        "flex-1 flex flex-col",
        !noPadding && "p-4 lg:p-6",
        className
      )}
    >
      <div className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth]
      )}>
        {children}
      </div>
    </div>
  );
}

interface DashboardSectionProps {
  /** Section content */
  children: ReactNode;
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Additional class name */
  className?: string;
  /** Actions to display in the section header */
  actions?: ReactNode;
}

/**
 * DashboardSection provides a consistent section wrapper within dashboard pages.
 * 
 * @example
 * ```tsx
 * <DashboardSection 
 *   title="Recent Activity"
 *   description="Your latest actions"
 *   actions={<Button>View All</Button>}
 * >
 *   <ActivityList />
 * </DashboardSection>
 * ```
 */
export function DashboardSection({
  children,
  title,
  description,
  className,
  actions,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4">
          {title && (
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface DashboardGridProps {
  /** Grid items */
  children: ReactNode;
  /** Number of columns on different breakpoints */
  columns?: {
    default?: 1 | 2 | 3 | 4;
    sm?: 1 | 2 | 3 | 4;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4;
    xl?: 1 | 2 | 3 | 4;
  };
  /** Gap between items */
  gap?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
}

const gapClasses = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

/**
 * DashboardGrid provides a responsive grid layout for dashboard content.
 * 
 * @example
 * ```tsx
 * <DashboardGrid columns={{ default: 1, sm: 2, lg: 4 }}>
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 * </DashboardGrid>
 * ```
 */
export function DashboardGrid({
  children,
  columns = { default: 1, sm: 2, lg: 4 },
  gap = "md",
  className,
}: DashboardGridProps) {
  const getColumnClasses = () => {
    const classes: string[] = ["grid"];
    
    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    
    return classes.join(" ");
  };

  return (
    <div className={cn(getColumnClasses(), gapClasses[gap], className)}>
      {children}
    </div>
  );
}
