/**
 * Symbol Instance Renderer
 * 
 * Renders a symbol instance on the canvas.
 * Applies overrides and handles sync status display.
 * 
 * Phase: STUDIO-25 Symbols & Reusable Components
 */

'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Package,
  Unlink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSymbolStore } from '@/lib/studio/store/symbol-store';
import { useUIStore } from '@/lib/studio/store/ui-store';
import {
  applySymbolOverrides,
  type SymbolInstanceComponent,
  type StudioSymbol,
  type SymbolOverrides,
} from '@/types/studio-symbols';
import type { StudioComponent } from '@/types/studio';

// =============================================================================
// TYPES
// =============================================================================

interface SymbolInstanceRendererProps {
  /** The symbol instance component */
  instance: SymbolInstanceComponent;
  /** Renderer function for child components */
  renderComponent: (component: StudioComponent) => React.ReactNode;
  /** Whether the instance is selected */
  isSelected?: boolean;
  /** Whether the instance is hovered */
  isHovered?: boolean;
  /** Callback when instance is clicked */
  onClick?: (e: React.MouseEvent) => void;
  /** Callback when instance is double-clicked (to edit) */
  onDoubleClick?: (e: React.MouseEvent) => void;
  /** Callback to sync instance */
  onSync?: () => void;
  /** Callback to detach instance */
  onDetach?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SymbolInstanceRenderer({
  instance,
  renderComponent,
  isSelected = false,
  isHovered = false,
  onClick,
  onDoubleClick,
  onSync,
  onDetach,
}: SymbolInstanceRendererProps) {
  // Get the source symbol
  const { getSymbol, checkSyncStatus } = useSymbolStore();
  const symbol = getSymbol(instance.symbolId);

  // Check sync status
  const syncStatus = useMemo(() => {
    if (!symbol) return null;
    return {
      isUpToDate: instance.symbolVersion === symbol.version,
      latestVersion: symbol.version,
    };
  }, [symbol, instance.symbolVersion]);

  // Apply overrides to symbol components
  const renderedComponents = useMemo(() => {
    if (!symbol) return [];

    const overrides: SymbolOverrides = instance.symbolOverrides || { props: {} };
    return applySymbolOverrides(symbol.components, overrides);
  }, [symbol, instance.symbolOverrides]);

  // Get the root component for rendering
  const rootComponent = useMemo(() => {
    if (!symbol || renderedComponents.length === 0) return null;
    return renderedComponents.find((c) => c.id === symbol.rootComponentId) || renderedComponents[0];
  }, [symbol, renderedComponents]);

  // Build a component tree for rendering
  const buildComponentTree = (
    parentId: string | undefined
  ): React.ReactNode => {
    const children = renderedComponents.filter((c) => c.parentId === parentId);
    
    if (children.length === 0) return null;

    return children.map((child) => (
      <React.Fragment key={child.id}>
        {renderComponent({
          ...child,
          // Mark as part of symbol for styling
          props: {
            ...child.props,
            _isSymbolChild: true,
          },
        })}
        {buildComponentTree(child.id)}
      </React.Fragment>
    ));
  };

  // If symbol not found or detached
  if (!symbol || instance.isDetached) {
    return (
      <div
        className={cn(
          'relative p-4 border-2 border-dashed rounded-lg',
          instance.isDetached
            ? 'border-muted-foreground/30 bg-muted/30'
            : 'border-destructive/50 bg-destructive/10'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {instance.isDetached ? (
            <>
              <Unlink className="h-4 w-4" />
              <span className="text-sm">Detached from symbol</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Symbol not found</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative group',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isHovered && !isSelected && 'ring-1 ring-muted-foreground/30'
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Symbol indicator badge */}
      {(isSelected || isHovered) && (
        <div className="absolute -top-6 left-0 z-10 flex items-center gap-1">
          <Badge
            variant="secondary"
            className="gap-1 text-xs px-1.5 py-0 bg-primary text-primary-foreground"
          >
            <Package className="h-3 w-3" />
            {symbol.name}
          </Badge>

          {/* Sync status indicator */}
          {syncStatus && !syncStatus.isUpToDate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="gap-1 text-xs px-1.5 py-0 border-amber-500 text-amber-500"
                >
                  <RefreshCw className="h-3 w-3" />
                  Update available
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Symbol has been updated. Click to sync.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isSelected && (
        <div className="absolute -top-6 right-0 z-10 flex items-center gap-1">
          {syncStatus && !syncStatus.isUpToDate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 px-1.5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSync?.();
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync
                </Button>
              </TooltipTrigger>
              <TooltipContent>Update to latest version</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-5 px-1.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetach?.();
                }}
              >
                <Unlink className="h-3 w-3 mr-1" />
                Detach
              </Button>
            </TooltipTrigger>
            <TooltipContent>Convert to regular components</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Render symbol content */}
      <div className="symbol-instance-content">
        {rootComponent && (
          <>
            {renderComponent({
              ...rootComponent,
              // Pass through instance position/size overrides
              props: {
                ...rootComponent.props,
                ...instance.props,
              },
            })}
          </>
        )}
      </div>

      {/* Symbol overlay on hover */}
      {(isSelected || isHovered) && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none border-2 rounded',
            isSelected ? 'border-primary' : 'border-primary/50'
          )}
        />
      )}
    </div>
  );
}

// =============================================================================
// SYMBOL PREVIEW (for drag preview or thumbnails)
// =============================================================================

interface SymbolPreviewProps {
  symbol: StudioSymbol;
  className?: string;
}

export function SymbolPreview({ symbol, className }: SymbolPreviewProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center bg-muted rounded-md overflow-hidden',
        className
      )}
    >
      {symbol.thumbnail ? (
        <img
          src={symbol.thumbnail}
          alt={symbol.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
          <Package className="h-8 w-8 mb-2" />
          <span className="text-xs font-medium">{symbol.name}</span>
          <span className="text-[10px]">{symbol.components.length} components</span>
        </div>
      )}
    </div>
  );
}

export default SymbolInstanceRenderer;
