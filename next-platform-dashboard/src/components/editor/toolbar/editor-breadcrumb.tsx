"use client";

import { useEditor } from "@craftjs/core";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorBreadcrumb() {
  const { selectedNodeId, nodeAncestors, actions } = useEditor((state) => {
    const selectedId = state.events.selected.values().next().value;
    const ancestors: { id: string; name: string }[] = [];

    if (selectedId) {
      let currentId = selectedId;
      while (currentId) {
        const node = state.nodes[currentId];
        if (node) {
          ancestors.unshift({
            id: currentId,
            name: node.data.displayName || node.data.name || "Unknown",
          });
        }
        currentId = node?.data.parent || "";
      }
    }

    return {
      selectedNodeId: selectedId,
      nodeAncestors: ancestors,
    };
  });

  if (!selectedNodeId || nodeAncestors.length === 0) {
    return (
      <div className="h-10 border-b bg-muted/30 flex items-center px-4">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Home className="h-3 w-3" />
          Select an element to see its location
        </span>
      </div>
    );
  }

  return (
    <div className="h-10 border-b bg-muted/30 flex items-center px-4 overflow-x-auto">
      <nav className="flex items-center text-sm">
        {nodeAncestors.map((node, index) => {
          const isLast = index === nodeAncestors.length - 1;
          const isRoot = index === 0;

          return (
            <div key={node.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2",
                  isLast && "font-medium",
                  !isLast && "text-muted-foreground"
                )}
                onClick={() => {
                  actions.selectNode(node.id);
                }}
              >
                {isRoot && <Home className="h-3 w-3 mr-1" />}
                {node.name}
              </Button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
