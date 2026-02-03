/**
 * Module Placeholder Component
 * 
 * Displayed when a component from an uninstalled module is encountered.
 * Provides visual feedback and a link to install the required module.
 */

"use client";

import React from "react";
import { AlertTriangle, Download, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// TYPES
// =============================================================================

interface ModulePlaceholderProps {
  componentType: string;
  moduleName?: string;
  moduleId?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ModulePlaceholder({
  componentType,
  moduleName,
  moduleId,
}: ModulePlaceholderProps) {
  // Try to extract module name from component type
  const inferredModuleName = moduleName || inferModuleName(componentType);
  
  return (
    <div className="border-2 border-dashed border-yellow-500/50 rounded-lg p-6 bg-yellow-50/50 dark:bg-yellow-950/20">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Package className="h-12 w-12 text-yellow-500/50" />
          <AlertTriangle className="h-5 w-5 text-yellow-500 absolute -bottom-1 -right-1" />
        </div>
        
        <h3 className="font-semibold text-foreground mt-4 mb-2">
          Module Component Unavailable
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          The <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{componentType}</code> component 
          requires the <strong>{inferredModuleName || "unknown"}</strong> module.
        </p>
        
        <p className="text-xs text-muted-foreground mb-4">
          This component will not render on the live site until the module is installed.
        </p>
        
        {moduleId && (
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => {
              // Navigate to module installation
              window.open(`/dashboard/modules/${moduleId}`, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
            Install Module
          </Button>
        )}
        
        {!moduleId && inferredModuleName && (
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => {
              // Navigate to module marketplace
              window.open(`/dashboard/modules?search=${encodeURIComponent(inferredModuleName)}`, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
            Find Module
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Try to infer module name from component type
 */
function inferModuleName(componentType: string): string | undefined {
  // Common prefixes to module names
  const prefixMap: Record<string, string> = {
    "Ecommerce": "E-Commerce",
    "Booking": "Booking",
    "Crm": "CRM",
    "Automation": "Automation",
    "Social": "Social Media",
    "SocialMedia": "Social Media",
  };
  
  for (const [prefix, name] of Object.entries(prefixMap)) {
    if (componentType.startsWith(prefix)) {
      return name;
    }
  }
  
  // Try to extract from camelCase
  const match = componentType.match(/^([A-Z][a-z]+)/);
  if (match) {
    return match[1];
  }
  
  return undefined;
}
