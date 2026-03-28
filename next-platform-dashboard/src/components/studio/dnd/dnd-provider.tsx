/**
 * DRAMAC Studio DnD Provider
 *
 * Previously wrapped the entire editor with a single @dnd-kit DndContext.
 * Now simplified: the DnD architecture is split:
 *
 * 1. LIBRARY → CANVAS: Uses HTML5 native Drag API (crosses iframe boundary)
 *    - DraggableComponent uses draggable="true" + dataTransfer
 *    - CanvasContent handles drop events inside the iframe
 *
 * 2. CANVAS REORDER: Uses @dnd-kit DndContext INSIDE the iframe
 *    - CanvasContent contains its own DndContext
 *    - SortableComponent, DroppableCanvas etc. work inside iframe
 *
 * This component is kept for backwards compatibility but just passes through children.
 */

"use client";

import React from "react";

interface DndProviderProps {
  children: React.ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  return <>{children}</>;
}
