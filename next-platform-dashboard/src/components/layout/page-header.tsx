import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  /**
   * Page title (required)
   */
  title: string;
  /**
   * Optional description below title
   */
  description?: string;
  /**
   * Optional breadcrumb component
   */
  breadcrumb?: React.ReactNode;
  /**
   * Actions area (buttons, dropdowns, etc.)
   */
  actions?: React.ReactNode;
  /**
   * Badge or status indicator next to title
   */
  badge?: React.ReactNode;
  /**
   * Show separator below header
   */
  separator?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Children for backwards compatibility (renders in actions area)
   */
  children?: React.ReactNode;
  /**
   * Back navigation link (backwards compatibility)
   */
  backHref?: string;
}

/**
 * PageHeader - Consistent page header with title, description, and actions
 * 
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   description="Overview of your workspace"
 *   actions={<Button>New Item</Button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  badge,
  separator = false,
  className,
  children,
  backHref,
}: PageHeaderProps) {
  // Support both `actions` prop and `children` for backwards compatibility
  const actionsContent = actions || children;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="mb-2">
          {breadcrumb}
        </div>
      )}
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Section */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {backHref && (
              <Link href={backHref}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
              </Link>
            )}
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {description}
            </p>
          )}
        </div>
        
        {/* Actions Section */}
        {actionsContent && (
          <div className="flex items-center gap-2 shrink-0">
            {actionsContent}
          </div>
        )}
      </div>
      
      {/* Optional Separator */}
      {separator && <Separator />}
    </div>
  );
}

/**
 * PageHeaderSkeleton - Loading state for PageHeader
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
