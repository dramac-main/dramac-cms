"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// =============================================================================
// SKELETON COMPOSER TYPES
// =============================================================================

export type SkeletonLayoutType = 
  | "page"
  | "dashboard"
  | "list"
  | "grid"
  | "detail"
  | "form"
  | "table"
  | "cards"
  | "chat"
  | "profile"
  | "settings"
  | "editor";

export interface SkeletonComposerConfig {
  /**
   * Layout type
   */
  layout: SkeletonLayoutType;
  /**
   * Number of items (for list/grid/table)
   */
  count?: number;
  /**
   * Show header section
   */
  showHeader?: boolean;
  /**
   * Show sidebar
   */
  showSidebar?: boolean;
  /**
   * Show footer
   */
  showFooter?: boolean;
  /**
   * Custom sections
   */
  sections?: SkeletonSection[];
}

export interface SkeletonSection {
  type: "text" | "card" | "table" | "stats" | "chart" | "list" | "form" | "custom";
  height?: string | number;
  rows?: number;
  columns?: number;
  className?: string;
}

// =============================================================================
// SKELETON SECTIONS
// =============================================================================

function SkeletonHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn("w-64 space-y-4 border-r pr-4", className)}>
      <Skeleton className="h-8 w-32 mb-6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

function SkeletonStatsRow({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", 
      count === 2 && "grid-cols-2",
      count === 3 && "grid-cols-3",
      count === 4 && "grid-cols-4",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-6 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="w-full" style={{ height: `${height - 100}px` }} />
    </div>
  );
}

function SkeletonCardGrid({ count = 6, columns = 3, className }: { count?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", 
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 bg-muted/50 p-4 border-b">
        <Skeleton className="h-4 w-4" />
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 p-4 border-b last:border-b-0">
          <Skeleton className="h-4 w-4" />
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

function SkeletonList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton shape="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// LAYOUT COMPOSERS
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonStatsRow count={4} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <SkeletonCardGrid count={6} columns={3} />
    </div>
  );
}

function ListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <SkeletonList count={count} />
    </div>
  );
}

function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-24" />
      </div>
      <SkeletonCardGrid count={count} columns={3} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton shape="circle" className="h-20 w-20" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="flex gap-2 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <SkeletonHeader />
      <div className="rounded-xl border p-6">
        <SkeletonForm fields={5} />
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex gap-6">
      <SkeletonSidebar />
      <div className="flex-1 space-y-6">
        <SkeletonHeader />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Toolbox */}
      <div className="w-64 border-r p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 p-8 bg-muted/30">
        <div className="mx-auto max-w-4xl bg-background rounded-lg shadow-lg p-8 min-h-[600px] space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      
      {/* Right Panel - Settings */}
      <div className="w-72 border-l p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <Skeleton shape="circle" className="h-24 w-24" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex gap-2 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <SkeletonCardGrid count={6} columns={2} />
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation List */}
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-2 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
              <Skeleton shape="circle" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton shape="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("flex gap-3", i % 2 === 1 && "justify-end")}>
              {i % 2 === 0 && <Skeleton shape="circle" className="h-8 w-8" />}
              <Skeleton className={cn("h-16", i % 2 === 0 ? "w-64" : "w-48")} />
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON COMPOSER
// =============================================================================

export interface SkeletonComposerProps {
  /**
   * Layout type or custom configuration
   */
  layout: SkeletonLayoutType | SkeletonComposerConfig;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * SkeletonComposer - Dynamic skeleton composition based on layout type.
 * 
 * @example
 * ```tsx
 * // Simple layout type
 * <SkeletonComposer layout="dashboard" />
 * 
 * // With custom config
 * <SkeletonComposer
 *   layout={{
 *     layout: "list",
 *     count: 10,
 *     showHeader: true,
 *   }}
 * />
 * ```
 */
export function SkeletonComposer({ layout, className }: SkeletonComposerProps) {
  const layoutType = typeof layout === "string" ? layout : layout.layout;
  const config = typeof layout === "string" ? { layout } : layout;

  const renderLayout = () => {
    switch (layoutType) {
      case "dashboard":
        return <DashboardSkeleton />;
      case "page":
        return <PageSkeleton />;
      case "list":
        return <ListSkeleton count={config.count} />;
      case "grid":
        return <GridSkeleton count={config.count} />;
      case "detail":
        return <DetailSkeleton />;
      case "form":
        return <FormSkeleton />;
      case "table":
        return <SkeletonTable rows={config.count || 5} />;
      case "cards":
        return <SkeletonCardGrid count={config.count || 6} />;
      case "settings":
        return <SettingsSkeleton />;
      case "editor":
        return <EditorSkeleton />;
      case "profile":
        return <ProfileSkeleton />;
      case "chat":
        return <ChatSkeleton />;
      default:
        return <PageSkeleton />;
    }
  };

  return <div className={className}>{renderLayout()}</div>;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  SkeletonHeader,
  SkeletonSidebar,
  SkeletonStatsRow,
  SkeletonChart,
  SkeletonCardGrid,
  SkeletonTable,
  SkeletonForm,
  SkeletonList,
  DashboardSkeleton,
  PageSkeleton,
  ListSkeleton,
  GridSkeleton,
  DetailSkeleton,
  FormSkeleton,
  SettingsSkeleton,
  EditorSkeleton,
  ProfileSkeleton,
  ChatSkeleton,
};
