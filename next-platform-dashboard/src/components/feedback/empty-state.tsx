"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LucideIcon,
  Search,
  FileQuestion,
  FolderOpen,
  Inbox,
  Plus,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// EMPTY STATE
// =============================================================================

export type EmptyStateIllustration = "search" | "data" | "folder" | "inbox" | "custom";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "ghost" | "link";
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
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
   * Primary action
   */
  action?: EmptyStateAction;
  /**
   * Secondary action
   */
  secondaryAction?: EmptyStateAction;
  /**
   * Illustration type
   */
  illustration?: EmptyStateIllustration;
  /**
   * Custom illustration component
   */
  customIllustration?: React.ReactNode;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Animate on mount
   */
  animated?: boolean;
}

const illustrationIcons: Record<EmptyStateIllustration, LucideIcon> = {
  search: Search,
  data: FileQuestion,
  folder: FolderOpen,
  inbox: Inbox,
  custom: FileQuestion,
};

const sizeClasses = {
  sm: {
    container: "py-6 px-4",
    icon: "h-8 w-8",
    iconWrapper: "h-12 w-12",
    title: "text-sm",
    description: "text-xs",
    button: "h-8 text-xs",
  },
  md: {
    container: "py-10 px-6",
    icon: "h-10 w-10",
    iconWrapper: "h-16 w-16",
    title: "text-base",
    description: "text-sm",
    button: "h-9",
  },
  lg: {
    container: "py-16 px-8",
    icon: "h-12 w-12",
    iconWrapper: "h-20 w-20",
    title: "text-lg",
    description: "text-base",
    button: "h-10",
  },
};

/**
 * EmptyState - Configurable empty state with illustration.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No contacts yet"
 *   description="Add your first contact to get started."
 *   action={{
 *     label: "Add Contact",
 *     onClick: () => setOpen(true),
 *     icon: Plus,
 *   }}
 * />
 * ```
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    className,
    icon,
    title,
    description,
    action,
    secondaryAction,
    illustration = "data",
    customIllustration,
    size = "md",
    animated = true,
    ...props
  }, ref) => {
    const Icon = icon || illustrationIcons[illustration];
    const sizes = sizeClasses[size];

    const content = (
      <div className="flex flex-col items-center gap-3 text-center">
        {customIllustration || (
          <div className={cn(
            "flex items-center justify-center rounded-full bg-muted",
            sizes.iconWrapper
          )}>
            <Icon className={cn("text-muted-foreground", sizes.icon)} />
          </div>
        )}
        
        <div className="space-y-1">
          <h3 className={cn("font-semibold", sizes.title)}>{title}</h3>
          {description && (
            <p className={cn("text-muted-foreground max-w-sm", sizes.description)}>
              {description}
            </p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || "default"}
                className={sizes.button}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || "outline"}
                className={sizes.button}
              >
                {secondaryAction.icon && <secondaryAction.icon className="mr-2 h-4 w-4" />}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );

    if (animated) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex items-center justify-center rounded-lg border border-dashed",
            sizes.container,
            className
          )}
        >
          {content}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed",
          sizes.container,
          className
        )}
        {...props}
      >
        {content}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

// =============================================================================
// NO RESULTS
// =============================================================================

export interface NoResultsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Search query that returned no results
   */
  query?: string;
  /**
   * Suggested searches
   */
  suggestions?: string[];
  /**
   * Handler for clearing search
   */
  onClearSearch?: () => void;
  /**
   * Handler for clicking a suggestion
   */
  onSuggestionClick?: (suggestion: string) => void;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

/**
 * NoResults - Search-specific empty state.
 * 
 * @example
 * ```tsx
 * <NoResults
 *   query={searchQuery}
 *   suggestions={["invoice", "receipt", "payment"]}
 *   onClearSearch={() => setSearchQuery("")}
 *   onSuggestionClick={(s) => setSearchQuery(s)}
 * />
 * ```
 */
const NoResults = React.forwardRef<HTMLDivElement, NoResultsProps>(
  ({
    className,
    query,
    suggestions,
    onClearSearch,
    onSuggestionClick,
    size = "md",
  }, ref) => {
    const sizes = sizeClasses[size];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed text-center",
          sizes.container,
          className
        )}
      >
        <div className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          sizes.iconWrapper
        )}>
          <Search className={cn("text-muted-foreground", sizes.icon)} />
        </div>

        <div className="mt-3 space-y-1">
          <h3 className={cn("font-semibold", sizes.title)}>No results found</h3>
          {query && (
            <p className={cn("text-muted-foreground", sizes.description)}>
              No results for &quot;{query}&quot;
            </p>
          )}
        </div>

        {suggestions && suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onSuggestionClick?.(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {onClearSearch && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={onClearSearch}
          >
            <RefreshCcw className="mr-2 h-3 w-3" />
            Clear search
          </Button>
        )}
      </motion.div>
    );
  }
);

NoResults.displayName = "NoResults";

// =============================================================================
// GETTING STARTED
// =============================================================================

export interface GettingStartedStep {
  title: string;
  description?: string;
  completed?: boolean;
  action?: EmptyStateAction;
}

export interface GettingStartedProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Title text
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Steps to complete
   */
  steps: GettingStartedStep[];
}

/**
 * GettingStarted - Onboarding empty state with steps.
 * 
 * @example
 * ```tsx
 * <GettingStarted
 *   title="Welcome to your dashboard"
 *   steps={[
 *     { title: "Create your first site", completed: true },
 *     { title: "Install a module", action: { label: "Browse", onClick: () => {} } },
 *     { title: "Invite team members" },
 *   ]}
 * />
 * ```
 */
const GettingStarted = React.forwardRef<HTMLDivElement, GettingStartedProps>(
  ({
    className,
    title = "Getting started",
    description,
    steps,
    ...props
  }, ref) => {
    const completedCount = steps.filter((s) => s.completed).length;

    return (
      <div
        ref={ref}
        className={cn("rounded-lg border p-6", className)}
        {...props}
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{steps.length}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                step.completed && "bg-muted/50"
              )}
            >
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                step.completed
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-muted-foreground/30 text-muted-foreground"
              )}>
                {step.completed ? "✓" : i + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  step.completed && "line-through text-muted-foreground"
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                )}
              </div>

              {step.action && !step.completed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0"
                  onClick={step.action.onClick}
                >
                  {step.action.label}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
);

GettingStarted.displayName = "GettingStarted";

export { EmptyState, NoResults, GettingStarted };
