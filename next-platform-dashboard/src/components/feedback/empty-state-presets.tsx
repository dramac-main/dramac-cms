"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  Search,
  Filter,
  Database,
  Settings,
  Inbox,
  FolderOpen,
  Image,
  Calendar,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Zap,
  Bot,
  Globe,
  Plus,
  Upload,
  Link,
  RefreshCcw,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// =============================================================================
// EMPTY STATE PRESET TYPES
// =============================================================================

export type EmptyStatePreset =
  | "no-data"
  | "no-results"
  | "no-matches"
  | "search"
  | "filter"
  | "contacts"
  | "sites"
  | "pages"
  | "posts"
  | "media"
  | "modules"
  | "settings"
  | "inbox"
  | "calendar"
  | "orders"
  | "messages"
  | "analytics"
  | "automations"
  | "agents"
  | "integrations"
  | "error"
  | "offline"
  | "permission"
  | "coming-soon";

interface PresetConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  actionLabel?: string;
  actionIcon?: LucideIcon;
}

const presetConfigs: Record<EmptyStatePreset, PresetConfig> = {
  "no-data": {
    icon: Database,
    title: "No data yet",
    description: "Start by adding your first item to see it here.",
    actionLabel: "Add Item",
    actionIcon: Plus,
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "We couldn't find anything matching your search. Try different keywords.",
    actionLabel: "Clear Search",
    actionIcon: RefreshCcw,
  },
  "no-matches": {
    icon: Filter,
    title: "No matching items",
    description: "No items match your current filters. Try adjusting or clearing them.",
    actionLabel: "Clear Filters",
    actionIcon: RefreshCcw,
  },
  search: {
    icon: Search,
    title: "Search for something",
    description: "Use the search bar above to find what you're looking for.",
  },
  filter: {
    icon: Filter,
    title: "No filters applied",
    description: "Apply filters to narrow down your results.",
    actionLabel: "Add Filter",
    actionIcon: Plus,
  },
  contacts: {
    icon: Users,
    title: "No contacts yet",
    description: "Add your first contact to start building your CRM.",
    actionLabel: "Add Contact",
    actionIcon: Plus,
    variant: "primary",
  },
  sites: {
    icon: Globe,
    title: "No sites yet",
    description: "Create your first website to get started.",
    actionLabel: "Create Site",
    actionIcon: Plus,
    variant: "primary",
  },
  pages: {
    icon: FileText,
    title: "No pages yet",
    description: "Add pages to build your website structure.",
    actionLabel: "Add Page",
    actionIcon: Plus,
  },
  posts: {
    icon: FileText,
    title: "No posts yet",
    description: "Create your first blog post to share with the world.",
    actionLabel: "Create Post",
    actionIcon: Plus,
  },
  media: {
    icon: Image,
    title: "No media files",
    description: "Upload images, videos, and documents to use in your content.",
    actionLabel: "Upload Files",
    actionIcon: Upload,
  },
  modules: {
    icon: Zap,
    title: "No modules installed",
    description: "Browse the marketplace to add powerful features to your site.",
    actionLabel: "Browse Marketplace",
    actionIcon: ArrowRight,
    variant: "primary",
  },
  settings: {
    icon: Settings,
    title: "No settings configured",
    description: "Configure your settings to customize your experience.",
    actionLabel: "Configure",
    actionIcon: Settings,
  },
  inbox: {
    icon: Inbox,
    title: "Your inbox is empty",
    description: "Messages and notifications will appear here.",
  },
  calendar: {
    icon: Calendar,
    title: "No events scheduled",
    description: "Schedule posts or appointments to see them on the calendar.",
    actionLabel: "Schedule Event",
    actionIcon: Plus,
  },
  orders: {
    icon: ShoppingCart,
    title: "No orders yet",
    description: "Orders will appear here once customers start purchasing.",
  },
  messages: {
    icon: MessageSquare,
    title: "No messages yet",
    description: "Start a conversation or wait for messages to arrive.",
    actionLabel: "New Message",
    actionIcon: Plus,
  },
  analytics: {
    icon: BarChart3,
    title: "No data to display",
    description: "Analytics will appear once there's enough activity to report.",
  },
  automations: {
    icon: Zap,
    title: "No automations yet",
    description: "Create your first automation to save time on repetitive tasks.",
    actionLabel: "Create Automation",
    actionIcon: Plus,
    variant: "primary",
  },
  agents: {
    icon: Bot,
    title: "No AI agents deployed",
    description: "Deploy an AI agent to automate tasks and assist your team.",
    actionLabel: "Deploy Agent",
    actionIcon: Plus,
    variant: "primary",
  },
  integrations: {
    icon: Link,
    title: "No integrations connected",
    description: "Connect third-party services to extend your capabilities.",
    actionLabel: "Add Integration",
    actionIcon: Plus,
  },
  error: {
    icon: Database,
    title: "Unable to load data",
    description: "Something went wrong while loading. Please try again.",
    actionLabel: "Retry",
    actionIcon: RefreshCcw,
    variant: "danger",
  },
  offline: {
    icon: Globe,
    title: "You're offline",
    description: "Check your internet connection and try again.",
    actionLabel: "Retry",
    actionIcon: RefreshCcw,
    variant: "warning",
  },
  permission: {
    icon: FolderOpen,
    title: "Access restricted",
    description: "You don't have permission to view this content.",
    variant: "warning",
  },
  "coming-soon": {
    icon: Zap,
    title: "Coming Soon",
    description: "This feature is under development. Stay tuned!",
    variant: "primary",
  },
};

// =============================================================================
// EMPTY STATE PRESET COMPONENT
// =============================================================================

export interface EmptyStatePresetProps {
  /**
   * Preset type
   */
  preset: EmptyStatePreset;
  /**
   * Override title
   */
  title?: string;
  /**
   * Override description
   */
  description?: string;
  /**
   * Primary action handler
   */
  onAction?: () => void;
  /**
   * Override action label
   */
  actionLabel?: string;
  /**
   * Secondary action
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg";
  /**
   * Custom className
   */
  className?: string;
}

/**
 * EmptyStatePreset - Pre-configured empty states for common scenarios.
 * 
 * @example
 * ```tsx
 * // Simple preset
 * <EmptyStatePreset preset="contacts" onAction={() => router.push('/contacts/new')} />
 * 
 * // With overrides
 * <EmptyStatePreset
 *   preset="no-results"
 *   title="No contacts found"
 *   description="Try a different search term"
 *   onAction={() => clearSearch()}
 * />
 * ```
 */
export function EmptyStatePreset({
  preset,
  title,
  description,
  onAction,
  actionLabel,
  secondaryAction,
  size = "default",
  className,
}: EmptyStatePresetProps) {
  const config = presetConfigs[preset];
  const Icon = config.icon;

  return (
    <EmptyState
      icon={Icon}
      title={title || config.title}
      description={description || config.description}
      size={size}
      action={
        onAction || config.actionLabel
          ? {
              label: actionLabel || config.actionLabel || "Action",
              onClick: onAction || (() => {}),
              icon: config.actionIcon,
            }
          : undefined
      }
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

// =============================================================================
// CONTEXTUAL EMPTY STATES
// =============================================================================

export interface NoResultsEmptyStateProps {
  /**
   * Search query that returned no results
   */
  query?: string;
  /**
   * Handler to clear search
   */
  onClear?: () => void;
  /**
   * Custom suggestions
   */
  suggestions?: string[];
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg";
  /**
   * Custom className
   */
  className?: string;
}

/**
 * NoResultsEmptyState - Specialized empty state for search with no results.
 */
export function NoResultsEmptyState({
  query,
  onClear,
  suggestions,
  size = "default",
  className,
}: NoResultsEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No results found</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        {query
          ? `We couldn't find anything matching "${query}"`
          : "We couldn't find anything matching your search"}
      </p>
      
      {suggestions && suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-md bg-muted text-sm text-muted-foreground"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {onClear && (
        <Button variant="outline" size={size === "sm" ? "sm" : "default"} onClick={onClear}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Clear search
        </Button>
      )}
    </div>
  );
}

export interface FilterEmptyStateProps {
  /**
   * Active filter count
   */
  filterCount?: number;
  /**
   * Handler to clear filters
   */
  onClear?: () => void;
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg";
  /**
   * Custom className
   */
  className?: string;
}

/**
 * FilterEmptyState - Empty state when filters return no matches.
 */
export function FilterEmptyState({
  filterCount,
  onClear,
  size = "default",
  className,
}: FilterEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Filter className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No matching items</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        {filterCount
          ? `${filterCount} filter${filterCount > 1 ? "s" : ""} applied, but no items match`
          : "No items match your current filters"}
      </p>
      {onClear && (
        <Button variant="outline" size={size === "sm" ? "sm" : "default"} onClick={onClear}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

export interface GettingStartedEmptyStateProps {
  /**
   * Title
   */
  title?: string;
  /**
   * Description
   */
  description?: string;
  /**
   * Steps to get started
   */
  steps?: Array<{
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    completed?: boolean;
  }>;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * GettingStartedEmptyState - Onboarding empty state with steps.
 */
export function GettingStartedEmptyState({
  title = "Get Started",
  description = "Complete these steps to get up and running",
  steps = [],
  className,
}: GettingStartedEmptyStateProps) {
  return (
    <div className={cn("py-8", className)}>
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon || Zap;
          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                step.completed
                  ? "bg-success/5 border-success/20"
                  : "bg-card hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  step.completed ? "bg-success/10" : "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    step.completed ? "text-success" : "text-primary"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
                {step.action && !step.completed && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2"
                    onClick={step.action.onClick}
                  >
                    {step.action.label}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
              {step.completed && (
                <span className="text-xs text-success font-medium">Completed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { presetConfigs };
