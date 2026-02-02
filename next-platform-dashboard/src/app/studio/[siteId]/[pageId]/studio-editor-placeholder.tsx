/**
 * Studio Editor Placeholder
 * 
 * Temporary component showing store state until full UI is built in Phase STUDIO-04.
 */

"use client";

import { useEditorStore, useUIStore, useSelectionStore, useHistoryState, undo, redo } from "@/lib/studio/store";
import Link from "next/link";
import { ArrowLeft, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudioEditorPlaceholderProps {
  siteName: string;
  pageName: string;
  siteId: string;
  pageId: string;
}

export function StudioEditorPlaceholder({
  siteName,
  pageName,
  siteId,
  pageId,
}: StudioEditorPlaceholderProps) {
  // Store state
  const data = useEditorStore((s) => s.data);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isLoading = useEditorStore((s) => s.isLoading);
  const error = useEditorStore((s) => s.error);
  
  const breakpoint = useUIStore((s) => s.breakpoint);
  const zoom = useUIStore((s) => s.zoom);
  const panels = useUIStore((s) => s.panels);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  
  const selectedId = useSelectionStore((s) => s.componentId);
  
  const { canUndo, canRedo, undoCount, redoCount } = useHistoryState();
  
  // Test actions
  const addComponent = useEditorStore((s) => s.addComponent);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const select = useSelectionStore((s) => s.select);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-destructive">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
          <Link href={`/dashboard/sites/${siteId}/pages`}>
            <Button className="mt-4">Back to Pages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const componentCount = Object.keys(data.components).length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top toolbar */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Link href={`/dashboard/sites/${siteId}/pages`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        
        <div className="flex-1">
          <span className="font-medium">{siteName}</span>
          <span className="text-muted-foreground mx-2">/</span>
          <span>{pageName}</span>
          {isDirty && <span className="text-orange-500 ml-2">●</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => undo()} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => redo()} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">DRAMAC Studio - State Debug</h1>
            <p className="text-muted-foreground mb-4">
              Phase STUDIO-02 complete! Stores are working. Phase STUDIO-04 will add the full UI.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">Components</p>
                <p className="text-2xl font-bold">{componentCount}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">Breakpoint</p>
                <p className="text-2xl font-bold capitalize">{breakpoint}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">Zoom</p>
                <p className="text-2xl font-bold">{Math.round(zoom * 100)}%</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">History</p>
                <p className="text-2xl font-bold">{undoCount}/{redoCount}</p>
              </div>
            </div>
          </div>

          {/* Test controls */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Test Store Actions</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                onClick={() => {
                  const id = addComponent("Heading", { text: "New Heading" }, "root");
                  select(id);
                }}
              >
                Add Heading
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const id = addComponent("Text", { text: "New paragraph" }, "root");
                  select(id);
                }}
              >
                Add Text
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (selectedId) {
                    deleteComponent(selectedId);
                    clearSelection();
                  }
                }}
                disabled={!selectedId}
              >
                Delete Selected
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={zoomIn}>Zoom In</Button>
              <Button size="sm" variant="outline" onClick={zoomOut}>Zoom Out</Button>
              <Button size="sm" variant="outline" onClick={() => setBreakpoint("mobile")}>Mobile</Button>
              <Button size="sm" variant="outline" onClick={() => setBreakpoint("tablet")}>Tablet</Button>
              <Button size="sm" variant="outline" onClick={() => setBreakpoint("desktop")}>Desktop</Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Selected: {selectedId || "None"}</p>
              <p>Panels: L:{panels.left ? "✓" : "✗"} R:{panels.right ? "✓" : "✗"} B:{panels.bottom ? "✓" : "✗"}</p>
            </div>
          </div>

          {/* Component list */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Components ({componentCount})</h2>
            {data.root.children.length === 0 ? (
              <p className="text-muted-foreground">No components yet. Click &quot;Add Heading&quot; to test.</p>
            ) : (
              <ul className="space-y-2">
                {data.root.children.map((id) => {
                  const comp = data.components[id];
                  return (
                    <li
                      key={id}
                      className={`p-2 rounded cursor-pointer ${
                        selectedId === id ? "bg-primary/10 border border-primary" : "bg-muted"
                      }`}
                      onClick={() => select(id)}
                    >
                      <span className="font-medium">{comp.type}</span>
                      <span className="text-muted-foreground ml-2">
                        {JSON.stringify(comp.props).slice(0, 50)}...
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Raw data */}
          <details className="bg-card border rounded-lg">
            <summary className="p-4 cursor-pointer font-semibold">Raw Page Data</summary>
            <pre className="p-4 text-xs overflow-auto max-h-96 border-t">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
