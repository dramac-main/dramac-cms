/**
 * Change Preview Component
 * 
 * Shows a diff of proposed AI changes before applying.
 * Phase STUDIO-11: AI Component Chat
 */

"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface ChangePreviewProps {
  currentProps: Record<string, unknown>;
  proposedChanges: Record<string, unknown>;
  explanation?: string;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    // Truncate long strings
    return value.length > 50 ? `"${value.slice(0, 50)}..."` : `"${value}"`;
  }
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      return json.length > 50 ? json.slice(0, 50) + "..." : json;
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

/**
 * Check if two values are different
 */
function isDifferent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function ChangePreview({ 
  currentProps, 
  proposedChanges,
  explanation,
}: ChangePreviewProps) {
  const changedKeys = Object.keys(proposedChanges).filter(key => 
    isDifferent(currentProps[key], proposedChanges[key])
  );
  
  if (changedKeys.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          No changes proposed
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-muted/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-4 py-2 border-b">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Proposed Changes ({changedKeys.length})
        </h4>
      </div>
      
      {/* Changes list */}
      <div className="divide-y">
        {changedKeys.map((key) => {
          const oldValue = currentProps[key];
          const newValue = proposedChanges[key];
          
          return (
            <div key={key} className="px-4 py-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {key}
              </div>
              <div className="space-y-1">
                {/* Old value */}
                <div className="flex items-start gap-2">
                  <Minus className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <code className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded break-all">
                    {formatValue(oldValue)}
                  </code>
                </div>
                
                {/* New value */}
                <div className="flex items-start gap-2">
                  <Plus className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <code className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded break-all">
                    {formatValue(newValue)}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Explanation */}
      {explanation && (
        <div className="px-4 py-3 border-t bg-background/50">
          <p className="text-xs text-muted-foreground italic">
            💡 {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
