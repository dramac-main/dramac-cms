"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";

// =============================================================================
// EMPTY STATE VARIANTS
// =============================================================================

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        sm: "py-8 px-4 gap-3",
        default: "py-12 px-6 gap-4",
        lg: "py-16 px-8 gap-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const iconContainerVariants = cva(
  "flex items-center justify-center rounded-full",
  {
    variants: {
      size: {
        sm: "h-10 w-10",
        default: "h-12 w-12",
        lg: "h-16 w-16",
      },
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

const iconVariants = cva("", {
  variants: {
    size: {
      sm: "h-5 w-5",
      default: "h-6 w-6",
      lg: "h-8 w-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const titleVariants = cva("font-semibold text-foreground", {
  variants: {
    size: {
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const descriptionVariants = cva("text-muted-foreground max-w-sm", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// =============================================================================
// EMPTY STATE TYPES
// =============================================================================

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: ButtonProps["variant"];
}

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /**
   * Icon to display
   */
  icon?: LucideIcon;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: EmptyStateAction;
  /**
   * Secondary action button
   */
  secondaryAction?: EmptyStateAction;
  /**
   * Icon container color variant
   */
  iconVariant?: "default" | "primary" | "success" | "warning" | "danger";
  /**
   * Custom content below description
   */
  children?: React.ReactNode;
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

/**
 * EmptyState - A standardized component for empty/zero states.
 * 
 * Use this component when:
 * - A list/table has no items
 * - A search returns no results
 * - A feature hasn't been set up yet
 * - An error prevents content from loading
 * 
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   icon={FileText}
 *   title="No posts yet"
 *   description="Create your first blog post to get started."
 *   action={{
 *     label: "Create Post",
 *     onClick: () => router.push('/posts/new'),
 *     icon: Plus,
 *   }}
 * />
 * 
 * // Search empty state
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try adjusting your search or filters."
 *   size="sm"
 *   secondaryAction={{
 *     label: "Clear Search",
 *     onClick: clearSearch,
 *   }}
 * />
 * 
 * // Error state
 * <EmptyState
 *   icon={AlertTriangle}
 *   title="Something went wrong"
 *   description="We couldn't load the data. Please try again."
 *   iconVariant="danger"
 *   action={{
 *     label: "Try Again",
 *     onClick: refetch,
 *   }}
 * />
 * ```
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      size,
      icon: Icon,
      title,
      description,
      action,
      secondaryAction,
      iconVariant = "default",
      children,
      ...props
    },
    ref
  ) => {
    const renderAction = (actionConfig: EmptyStateAction, isPrimary: boolean) => {
      const ActionIcon = actionConfig.icon;
      const buttonProps: ButtonProps = {
        variant: actionConfig.variant ?? (isPrimary ? "default" : "outline"),
        size: size === "sm" ? "sm" : "default",
        onClick: actionConfig.onClick,
      };

      const content = (
        <>
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
          {actionConfig.label}
        </>
      );

      if (actionConfig.href) {
        return (
          <Button asChild {...buttonProps}>
            <a href={actionConfig.href}>{content}</a>
          </Button>
        );
      }

      return <Button {...buttonProps}>{content}</Button>;
    };

    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size }), className)}
        {...props}
      >
        {Icon && (
          <div className={cn(iconContainerVariants({ size, variant: iconVariant }))}>
            <Icon className={cn(iconVariants({ size }))} aria-hidden="true" />
          </div>
        )}

        <div className="space-y-1">
          <h3 className={cn(titleVariants({ size }))}>{title}</h3>
          {description && (
            <p className={cn(descriptionVariants({ size }))}>{description}</p>
          )}
        </div>

        {children}

        {(action || secondaryAction) && (
          <div className="flex flex-wrap gap-3 mt-2">
            {action && renderAction(action, true)}
            {secondaryAction && renderAction(secondaryAction, false)}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

// =============================================================================
// PRESET EMPTY STATES
// =============================================================================

import { FileText, Search, Filter, AlertTriangle, Inbox, Users, Globe, Database } from "lucide-react";

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyStatePresets = {
  /**
   * No items in a list
   */
  NoItems: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={FileText}
      title="No items yet"
      description="Get started by creating your first item."
      {...props}
    />
  ),

  /**
   * Search returned no results
   */
  NoSearchResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Search}
      title="No results found"
      description="Try adjusting your search terms or filters."
      size="sm"
      {...props}
    />
  ),

  /**
   * Filters returned no results
   */
  NoFilterResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Filter}
      title="No matching items"
      description="No items match your current filters."
      size="sm"
      {...props}
    />
  ),

  /**
   * Error loading data
   */
  LoadError: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={AlertTriangle}
      title="Failed to load"
      description="Something went wrong. Please try again."
      iconVariant="danger"
      {...props}
    />
  ),

  /**
   * Empty inbox/notifications
   */
  EmptyInbox: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Inbox}
      title="All caught up!"
      description="You have no new notifications."
      {...props}
    />
  ),

  /**
   * No team members
   */
  NoTeamMembers: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Users}
      title="No team members"
      description="Invite your team to collaborate."
      {...props}
    />
  ),

  /**
   * No sites created
   */
  NoSites: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Globe}
      title="No sites yet"
      description="Create your first website to get started."
      {...props}
    />
  ),

  /**
   * No data available
   */
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Database}
      title="No data available"
      description="There's nothing to display at the moment."
      {...props}
    />
  ),
};

export { EmptyState };
