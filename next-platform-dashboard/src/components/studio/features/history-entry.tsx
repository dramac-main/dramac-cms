/**
 * DRAMAC Studio History Entry Row
 * 
 * Individual history entry with icon, description, and timestamp.
 * Created in PHASE-STUDIO-17.
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Move, 
  Edit3, 
  Copy, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Sparkles,
  RotateCcw,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HistoryEntry, HistoryActionType } from '@/types/studio-history';

// =============================================================================
// ICON MAPPING
// =============================================================================

const actionIcons: Record<HistoryActionType, LucideIcon> = {
  'component.add': Plus,
  'component.delete': Trash2,
  'component.move': Move,
  'component.edit': Edit3,
  'component.duplicate': Copy,
  'component.lock': Lock,
  'component.unlock': Unlock,
  'component.hide': EyeOff,
  'component.show': Eye,
  'page.load': Layers,
  'page.generate': Sparkles,
  'snapshot.restore': RotateCcw,
  'bulk.action': Layers,
};

const actionColors: Record<HistoryActionType, string> = {
  'component.add': 'text-green-500',
  'component.delete': 'text-red-500',
  'component.move': 'text-blue-500',
  'component.edit': 'text-yellow-500',
  'component.duplicate': 'text-purple-500',
  'component.lock': 'text-amber-500',
  'component.unlock': 'text-amber-500',
  'component.hide': 'text-gray-500',
  'component.show': 'text-gray-500',
  'page.load': 'text-muted-foreground',
  'page.generate': 'text-primary',
  'snapshot.restore': 'text-primary',
  'bulk.action': 'text-muted-foreground',
};

// =============================================================================
// PROPS
// =============================================================================

interface HistoryEntryRowProps {
  entry: HistoryEntry;
  isCurrent: boolean;
  onClick: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function HistoryEntryRow({ entry, isCurrent, onClick }: HistoryEntryRowProps) {
  const IconComponent = actionIcons[entry.action] || Edit3;
  const iconColor = actionColors[entry.action] || 'text-muted-foreground';
  
  const timeAgo = formatDistanceToNow(entry.timestamp, { addSuffix: true });
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
        'hover:bg-accent/50 transition-colors',
        isCurrent && 'bg-primary/10'
      )}
    >
      {/* Current indicator */}
      <div
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isCurrent ? 'bg-primary' : 'bg-border'
        )}
      />
      
      {/* Action icon */}
      <IconComponent className={cn('h-4 w-4 shrink-0', iconColor)} />
      
      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          isCurrent && 'font-medium'
        )}>
          {entry.description}
        </p>
      </div>
      
      {/* Timestamp */}
      <span className="text-xs text-muted-foreground shrink-0">
        {timeAgo}
      </span>
    </button>
  );
}
