"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// =============================================================================
// DASHBOARD GRID
// =============================================================================

export interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns at different breakpoints
   */
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Gap between items
   */
  gap?: "sm" | "default" | "lg";
  /**
   * Enable stagger animation on children
   */
  animated?: boolean;
}

const gapClasses = {
  sm: "gap-3",
  default: "gap-4 md:gap-6",
  lg: "gap-6 md:gap-8",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * DashboardGrid - Responsive grid container for dashboard widgets.
 * 
 * @example
 * ```tsx
 * <DashboardGrid cols={{ default: 1, md: 2, lg: 4 }}>
 *   <DashboardWidget>...</DashboardWidget>
 *   <DashboardWidget>...</DashboardWidget>
 * </DashboardGrid>
 * ```
 */
const DashboardGrid = React.forwardRef<HTMLDivElement, DashboardGridProps>(
  ({ 
    className, 
    cols = { default: 1, sm: 2, lg: 4 }, 
    gap = "default",
    animated = true,
    children,
    ...props 
  }, ref) => {
    const _gridColsClass = cn(
      "grid",
      cols.default && `grid-cols-${cols.default}`,
      cols.sm && `sm:grid-cols-${cols.sm}`,
      cols.md && `md:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`,
    );

    // Build grid template columns CSS for custom column counts
    const getGridCols = (): React.CSSProperties => {
      return {
        ...(cols.default && { "--cols-default": cols.default }),
        ...(cols.sm && { "--cols-sm": cols.sm }),
        ...(cols.md && { "--cols-md": cols.md }),
        ...(cols.lg && { "--cols-lg": cols.lg }),
        ...(cols.xl && { "--cols-xl": cols.xl }),
      } as React.CSSProperties;
    };

    const gridClassName = cn(
      "grid",
      gapClasses[gap],
      // Using explicit grid classes for better Tailwind support
      cols.default === 1 && "grid-cols-1",
      cols.default === 2 && "grid-cols-2",
      cols.default === 3 && "grid-cols-3",
      cols.default === 4 && "grid-cols-4",
      cols.sm === 2 && "sm:grid-cols-2",
      cols.sm === 3 && "sm:grid-cols-3",
      cols.sm === 4 && "sm:grid-cols-4",
      cols.md === 2 && "md:grid-cols-2",
      cols.md === 3 && "md:grid-cols-3",
      cols.md === 4 && "md:grid-cols-4",
      cols.lg === 2 && "lg:grid-cols-2",
      cols.lg === 3 && "lg:grid-cols-3",
      cols.lg === 4 && "lg:grid-cols-4",
      cols.xl === 5 && "xl:grid-cols-5",
      cols.xl === 6 && "xl:grid-cols-6",
      className
    );

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={gridClassName}
          style={getGridCols()}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={gridClassName}
        style={getGridCols()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DashboardGrid.displayName = "DashboardGrid";

// =============================================================================
// GRID ITEM - For spanning multiple columns
// =============================================================================

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Column span at different breakpoints
   */
  span?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

/**
 * GridItem - Wrapper for items that span multiple grid columns.
 */
const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          span?.default === 2 && "col-span-2",
          span?.default === 3 && "col-span-3",
          span?.default === 4 && "col-span-4",
          span?.sm === 2 && "sm:col-span-2",
          span?.md === 2 && "md:col-span-2",
          span?.md === 3 && "md:col-span-3",
          span?.lg === 2 && "lg:col-span-2",
          span?.lg === 3 && "lg:col-span-3",
          span?.lg === 4 && "lg:col-span-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = "GridItem";

export { DashboardGrid, GridItem };
