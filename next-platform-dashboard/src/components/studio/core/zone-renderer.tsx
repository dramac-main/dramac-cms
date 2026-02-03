/**
 * DRAMAC Studio Zone Renderer
 * 
 * Renders zones for a component based on its definition.
 * Components can use this to automatically render their drop zones.
 * 
 * Phase STUDIO-19: Nested Components & Zones
 */

"use client";

import React from "react";
import { DroppableZone } from "@/components/studio/dnd/droppable-zone";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import type { StudioComponent } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface ZoneRendererProps {
  /** The component to render zones for */
  component: StudioComponent;
  /** Optional children to render alongside zones */
  children?: React.ReactNode;
  /** Optional render function for zone child components */
  renderZoneComponent?: (component: StudioComponent) => React.ReactNode;
}

interface WithZonesProps {
  /** The component with zones */
  component: StudioComponent;
  /** Render function for a specific zone */
  renderZone: (zoneName: string) => React.ReactNode;
  /** Children to scan for data-zone placeholders */
  children?: React.ReactNode;
}

interface ZonePlaceholderProps {
  /** Component ID that owns the zone */
  componentId: string;
  /** Zone name */
  zoneName: string;
  /** Optional render function for zone child components */
  renderComponent?: (component: StudioComponent) => React.ReactNode;
  /** Optional className */
  className?: string;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Renders all zones for a component based on its definition
 */
export function ZoneRenderer({ 
  component, 
  children,
  renderZoneComponent,
}: ZoneRendererProps) {
  const definition = componentRegistry.get(component.type);
  
  if (!definition?.zones) {
    // No zones defined, just render children (if any)
    return <>{children}</>;
  }
  
  return (
    <>
      {Object.entries(definition.zones).map(([zoneName, zoneDef]) => (
        <DroppableZone
          key={zoneName}
          parentId={component.id}
          zoneName={zoneName}
          zoneDef={zoneDef}
          renderComponent={renderZoneComponent}
        />
      ))}
    </>
  );
}

/**
 * HOC pattern for components that need custom zone placement.
 * Scans children for elements with data-zone attribute and replaces
 * them with the actual zone content.
 */
export function WithZones({ component, renderZone, children }: WithZonesProps) {
  const definition = componentRegistry.get(component.type);
  
  if (!definition?.zones) {
    return <>{children}</>;
  }
  
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const dataZone = (child.props as Record<string, unknown>)["data-zone"];
          if (dataZone && typeof dataZone === "string") {
            return renderZone(dataZone);
          }
        }
        return child;
      })}
    </>
  );
}

/**
 * Placeholder component for custom zone placement.
 * Use this inside component render functions to control zone position.
 */
export function ZonePlaceholder({
  componentId,
  zoneName,
  renderComponent,
  className,
}: ZonePlaceholderProps) {
  const definition = componentRegistry.get(
    // We need to get the component to get its type - this is a helper
    // that works when you know the zone name and parent ID
    ""
  );
  
  // Get zone definition from component
  const parentComponent = componentRegistry.get(componentId);
  const zoneDef = parentComponent?.zones?.[zoneName];
  
  if (!zoneDef) {
    console.warn(`[ZonePlaceholder] Zone "${zoneName}" not found on component "${componentId}"`);
    return null;
  }
  
  return (
    <DroppableZone
      parentId={componentId}
      zoneName={zoneName}
      zoneDef={zoneDef}
      className={className}
      renderComponent={renderComponent}
    />
  );
}

/**
 * Hook to check if a component has zones
 */
export function useComponentHasZones(componentType: string): boolean {
  const definition = componentRegistry.get(componentType);
  return !!definition?.zones && Object.keys(definition.zones).length > 0;
}

/**
 * Get zone definitions for a component type
 */
export function getZoneDefinitions(componentType: string) {
  const definition = componentRegistry.get(componentType);
  return definition?.zones;
}
