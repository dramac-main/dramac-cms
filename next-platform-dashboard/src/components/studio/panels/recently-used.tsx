/**
 * DRAMAC Studio Recently Used Section
 * 
 * Shows recently used components for quick access.
 * Stored in session storage.
 */

"use client";

import React from "react";
import { Clock } from "lucide-react";
import { ComponentCard } from "./component-card";
import { componentRegistry } from "@/lib/studio/registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface RecentlyUsedProps {
  componentTypes: string[];
  onComponentDoubleClick?: (type: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RecentlyUsed({
  componentTypes,
  onComponentDoubleClick,
}: RecentlyUsedProps) {
  if (componentTypes.length === 0) {
    return null;
  }
  
  // Get definitions for the types
  const definitions = componentTypes
    .map((type) => componentRegistry.get(type))
    .filter((d): d is NonNullable<typeof d> => d !== undefined)
    .slice(0, 6); // Max 6 recent items
  
  if (definitions.length === 0) {
    return null;
  }
  
  return (
    <div className="border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">Recently Used</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {definitions.length}
        </span>
      </div>
      
      {/* Compact component cards */}
      <div className="flex flex-wrap gap-2 px-3 pb-3">
        {definitions.map((definition) => (
          <ComponentCard
            key={definition.type}
            definition={definition}
            variant="compact"
            onDoubleClick={() => onComponentDoubleClick?.(definition.type)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HOOK FOR MANAGING RECENTLY USED
// =============================================================================

const STORAGE_KEY = "studio-recently-used";
const MAX_RECENT = 10;

export function useRecentlyUsed() {
  const [recentTypes, setRecentTypes] = React.useState<string[]>([]);
  
  // Load from session storage on mount
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentTypes(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);
  
  // Add a type to recently used
  const addRecent = React.useCallback((type: string) => {
    setRecentTypes((prev) => {
      // Remove if already exists, add to front
      const filtered = prev.filter((t) => t !== type);
      const updated = [type, ...filtered].slice(0, MAX_RECENT);
      
      // Save to session storage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore errors
      }
      
      return updated;
    });
  }, []);
  
  // Clear recently used
  const clearRecent = React.useCallback(() => {
    setRecentTypes([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }, []);
  
  return {
    recentTypes,
    addRecent,
    clearRecent,
  };
}
