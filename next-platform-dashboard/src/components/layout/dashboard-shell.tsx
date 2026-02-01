import { cn } from '@/lib/utils';
import { LAYOUT } from '@/config/layout';

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Optional override for padding. 
   * Set to false to disable padding (useful when content has its own padding)
   */
  noPadding?: boolean;
  /**
   * Optional override for max width.
   * Set to false to disable max-width constraint
   */
  noMaxWidth?: boolean;
  /**
   * Header content (typically PageHeader component)
   */
  header?: React.ReactNode;
  /**
   * Optional description shown below content
   */
  footer?: React.ReactNode;
}

/**
 * DashboardShell - Consistent wrapper for dashboard page content
 * 
 * NOTE: Padding is now handled globally by dashboard-layout-client.tsx
 * This component provides structural organization (header/content/footer)
 * and optional max-width constraints.
 * 
 * Provides:
 * - Header/content/footer structure
 * - Gap spacing between sections
 * - Optional max-width constraint (for pages that need it within the global max-width)
 */
export function DashboardShell({
  children,
  noPadding = true, // Default to no padding since layout handles it
  noMaxWidth = true, // Default to no max-width since layout handles it
  header,
  footer,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        // Base styles
        'flex flex-col min-h-full w-full',
        // Optional padding (disabled by default - layout provides global padding)
        !noPadding && 'p-4 md:p-6 lg:p-8',
        // Optional max width constraint
        !noMaxWidth && 'max-w-7xl mx-auto',
        className
      )}
      {...props}
    >
      {/* Header Section */}
      {header && (
        <div className="pb-4 md:pb-6">
          {header}
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Footer Section */}
      {footer && (
        <div className="pt-4 md:pt-6 mt-auto">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * DashboardContent - Inner content wrapper for semantic structure
 * Use inside DashboardShell when you need additional content grouping
 */
export function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('space-y-4 md:space-y-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DashboardSection - For grouping related content with spacing
 */
export function DashboardSection({
  children,
  title,
  description,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn('space-y-4', className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

interface DashboardGridProps {
  /** Grid items */
  children: React.ReactNode;
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

export default DashboardShell;
