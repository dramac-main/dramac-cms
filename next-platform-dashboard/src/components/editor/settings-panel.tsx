"use client";

import { useEditor } from "@craftjs/core";
import { Suspense, useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectedNode {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings?: () => Promise<any>;
  isDeletable: boolean;
}

export function SettingsPanel() {
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = state.events.selected.values().next().value;
    let selected: SelectedNode | undefined;

    if (currentNodeId) {
      const nodeData = state.nodes[currentNodeId]?.data;
      const nodeRelated = state.nodes[currentNodeId]?.related;
      const toolbarFn = nodeRelated?.toolbar;
      selected = {
        id: currentNodeId,
        name: nodeData?.displayName || nodeData?.name || 'Unknown',
        settings: toolbarFn as SelectedNode['settings'],
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return { selected };
  });

  const [ToolbarComponent, setToolbarComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (!selected?.settings) {
      setToolbarComponent(null);
      return;
    }

    selected.settings().then((component) => {
      if (component && typeof component === 'object' && 'default' in component && component.default) {
        setToolbarComponent(() => component.default as React.ComponentType);
      } else if (typeof component === 'function') {
        setToolbarComponent(() => component as React.ComponentType);
      } else {
        setToolbarComponent(null);
      }
    }).catch(() => {
      setToolbarComponent(null);
    });
  }, [selected]);

  if (!selected) {
    return (
      <div className="w-80 border-l bg-background">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </h2>
        </div>
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Settings className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Select an element to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selected.name}</h2>
          {selected.isDeletable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => actions.delete(selected.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4">
          <Suspense fallback={<SettingsLoading />}>
            {ToolbarComponent ? (
              <ToolbarComponent />
            ) : (
              <p className="text-sm text-muted-foreground">
                No settings available for this component.
              </p>
            )}
          </Suspense>
        </div>
      </ScrollArea>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
