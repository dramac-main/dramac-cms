/**
 * Editor Loading Skeleton
 * 
 * A polished loading skeleton that matches the editor layout.
 * Shows during initial load and content migration.
 */

"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface EditorLoadingSkeletonProps {
  message?: string;
  showMigrationProgress?: boolean;
  className?: string;
}

/**
 * Animated skeleton pulse component
 */
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted/60 rounded-md",
        className
      )}
    />
  );
}

/**
 * Main editor loading skeleton with polished animations
 */
export function EditorLoadingSkeleton({
  message = "Loading editor...",
  showMigrationProgress = false,
  className,
}: EditorLoadingSkeletonProps) {
  return (
    <div className={cn("h-screen flex flex-col bg-background", className)}>
      {/* Header skeleton */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SkeletonPulse className="h-8 w-8" />
          <SkeletonPulse className="h-5 w-32" />
          <SkeletonPulse className="h-5 w-1 bg-border" />
          <SkeletonPulse className="h-5 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-8 w-8 rounded-full" />
          <SkeletonPulse className="h-8 w-8 rounded-full" />
          <SkeletonPulse className="h-8 w-8 rounded-full" />
          <div className="w-px h-6 bg-border mx-1" />
          <SkeletonPulse className="h-8 w-24 rounded-md" />
          <SkeletonPulse className="h-8 w-24 rounded-md" />
          <SkeletonPulse className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Component list */}
        <div className="w-64 border-r bg-card p-4 flex flex-col gap-4">
          {/* Search */}
          <SkeletonPulse className="h-9 w-full rounded-md" />
          
          {/* Category groups */}
          {[1, 2, 3, 4, 5].map((group) => (
            <div key={group} className="space-y-2">
              <SkeletonPulse className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((item) => (
                  <SkeletonPulse key={item} className="h-16 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex-1 bg-muted/30 flex items-center justify-center relative">
          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Animated logo */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Loading text */}
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Preparing your creative workspace
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Migration progress */}
            {showMigrationProgress && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Migrating content from legacy format...
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Decorative canvas outline */}
          <div className="absolute inset-8 border-2 border-dashed border-muted-foreground/10 rounded-lg pointer-events-none" />
        </div>

        {/* Right sidebar - Settings panel */}
        <div className="w-72 border-l bg-card p-4 flex flex-col gap-4">
          {/* Panel header */}
          <SkeletonPulse className="h-6 w-32" />
          
          {/* Settings groups */}
          {[1, 2, 3].map((group) => (
            <div key={group} className="space-y-3">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-9 w-full rounded-md" />
              <SkeletonPulse className="h-9 w-full rounded-md" />
            </div>
          ))}
          
          {/* Spacing */}
          <div className="flex-1" />
          
          {/* Bottom actions */}
          <SkeletonPulse className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact loading indicator for inline use
 */
export function EditorLoadingIndicator({
  message = "Loading...",
  size = "default",
}: {
  message?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizes = {
    sm: { container: "gap-2", dot: "w-1.5 h-1.5", text: "text-xs" },
    default: { container: "gap-2", dot: "w-2 h-2", text: "text-sm" },
    lg: { container: "gap-3", dot: "w-2.5 h-2.5", text: "text-base" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center", s.container)}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("rounded-full bg-primary", s.dot)}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span className={cn("text-muted-foreground", s.text)}>{message}</span>
    </div>
  );
}

/**
 * Saving indicator overlay
 */
export function EditorSavingOverlay({
  isVisible,
}: {
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-card border rounded-lg px-6 py-4 shadow-lg flex items-center gap-3"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
        <span className="text-sm font-medium">Saving changes...</span>
      </motion.div>
    </motion.div>
  );
}

export default EditorLoadingSkeleton;
