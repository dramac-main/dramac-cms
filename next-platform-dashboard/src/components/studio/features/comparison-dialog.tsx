/**
 * DRAMAC Studio Comparison Dialog
 * 
 * Shows differences between snapshots or states.
 * Created in PHASE-STUDIO-17.
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Edit3, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SnapshotDiff } from '@/types/studio-history';

// =============================================================================
// PROPS
// =============================================================================

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: SnapshotDiff | null;
  title?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ComparisonDialog({
  open,
  onOpenChange,
  diff,
  title = 'Version Comparison',
}: ComparisonDialogProps) {
  if (!diff) return null;
  
  const hasChanges = 
    diff.componentsAdded.length > 0 || 
    diff.componentsRemoved.length > 0 || 
    diff.componentsModified.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Summary */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Summary:</span>
              <span className="font-medium">{diff.summary}</span>
            </div>
            
            {!hasChanges && (
              <div className="text-center py-8 text-muted-foreground">
                No differences found
              </div>
            )}
            
            {/* Added components */}
            {diff.componentsAdded.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    Added ({diff.componentsAdded.length})
                  </span>
                </div>
                <div className="grid gap-1 pl-6">
                  {diff.componentsAdded.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-green-500/10 text-green-600"
                    >
                      <Badge variant="outline" className="text-xs">
                        {comp.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {comp.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Removed components */}
            {diff.componentsRemoved.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    Removed ({diff.componentsRemoved.length})
                  </span>
                </div>
                <div className="grid gap-1 pl-6">
                  {diff.componentsRemoved.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-red-500/10 text-red-600"
                    >
                      <Badge variant="outline" className="text-xs">
                        {comp.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {comp.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Modified components */}
            {diff.componentsModified.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    Modified ({diff.componentsModified.length})
                  </span>
                </div>
                <div className="grid gap-2 pl-6">
                  {diff.componentsModified.map((comp) => (
                    <div
                      key={comp.id}
                      className="text-sm py-2 px-3 rounded border bg-card"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {comp.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {comp.id}
                        </span>
                      </div>
                      <div className="grid gap-1">
                        {Object.entries(comp.changes).slice(0, 5).map(([prop, { old: oldVal, new: newVal }]) => (
                          <div key={prop} className="text-xs grid grid-cols-[100px_1fr] gap-2">
                            <span className="font-medium text-muted-foreground truncate">
                              {prop}:
                            </span>
                            <div className="grid gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-red-500">-</span>
                                <span className="text-red-600 truncate">
                                  {formatValue(oldVal)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-green-500">+</span>
                                <span className="text-green-600 truncate">
                                  {formatValue(newVal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {Object.keys(comp.changes).length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{Object.keys(comp.changes).length - 5} more changes
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'empty';
  }
  if (typeof value === 'string') {
    return value.length > 50 ? value.slice(0, 50) + '...' : value;
  }
  const str = JSON.stringify(value);
  return str.length > 50 ? str.slice(0, 50) + '...' : str;
}
