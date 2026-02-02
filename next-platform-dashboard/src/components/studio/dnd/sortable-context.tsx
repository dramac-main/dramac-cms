/**
 * DRAMAC Studio Sortable Context
 * 
 * Provides sortable context for a list of components.
 */

"use client";

import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// =============================================================================
// TYPES
// =============================================================================

interface StudioSortableContextProps {
  items: string[];
  children: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StudioSortableContext({
  items,
  children,
}: StudioSortableContextProps) {
  return (
    <SortableContext
      items={items}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  );
}
