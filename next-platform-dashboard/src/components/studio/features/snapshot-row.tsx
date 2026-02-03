/**
 * DRAMAC Studio Snapshot Row
 * 
 * Snapshot entry with restore, compare, and delete actions.
 * Created in PHASE-STUDIO-17.
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Camera, RotateCcw, Trash2, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Snapshot } from '@/types/studio-history';

// =============================================================================
// PROPS
// =============================================================================

interface SnapshotRowProps {
  snapshot: Snapshot;
  onRestore: () => void;
  onDelete: () => void;
  onCompare: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SnapshotRow({ 
  snapshot, 
  onRestore, 
  onDelete,
  onCompare,
}: SnapshotRowProps) {
  const timeAgo = formatDistanceToNow(snapshot.timestamp, { addSuffix: true });
  const componentCount = Object.keys(snapshot.data.components).length;
  
  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      {/* Thumbnail or icon */}
      <div className="shrink-0 w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {snapshot.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={snapshot.thumbnail} 
            alt={snapshot.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{snapshot.name}</p>
        {snapshot.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {snapshot.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          <span>•</span>
          <span>{componentCount} components</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className={cn(
        'flex items-center gap-1 shrink-0',
        'opacity-0 group-hover:opacity-100 transition-opacity'
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCompare}
              >
                <GitCompare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Compare to current</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRestore}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restore snapshot</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete snapshot</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
