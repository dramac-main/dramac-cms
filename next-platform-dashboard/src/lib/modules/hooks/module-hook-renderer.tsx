"use client";

import React, { useEffect, useRef, ReactNode, useState } from "react";
import { useModules } from "../context";
import { ModuleSandbox } from "../runtime";
import type { ModuleHookName } from "../types/module-hooks";
import type { Module } from "../types";

// =============================================================
// TYPES
// =============================================================

export interface ModuleHookRendererProps {
  hook: ModuleHookName;
  data?: Record<string, unknown>;
  children?: ReactNode;
  className?: string;
  // Whether to show loading state
  showLoading?: boolean;
  // Whether to render in order or allow parallel rendering
  _sequential?: boolean;
  // Callback when hook execution completes
  onComplete?: (result: HookExecutionResult) => void;
}

export interface HookExecutionResult {
  data: unknown;
  executedModules: string[];
  renderedComponents: number;
  errors: Array<{ moduleId: string; error: string }>;
}

export interface ModuleSlotProps {
  slot: string;
  context?: Record<string, unknown>;
  className?: string;
  fallback?: ReactNode;
}

// =============================================================
// HOOK RENDERER
// =============================================================

/**
 * Renders components from all enabled modules that implement a specific hook.
 * Used for extension points like dashboard-widget, page-header, etc.
 */
export function ModuleHookRenderer({
  hook,
  data = {},
  children,
  className,
  showLoading = false,
  _sequential = false,
  onComplete,
}: ModuleHookRendererProps) {
  const { installedModules, isLoading, executeHook } = useModules();
  const executedRef = useRef(false);
  
  // Find modules that implement this hook
  const modulesWithHook = installedModules.filter(
    (m) => m.isEnabled && m.module.manifest?.hooks?.includes(hook)
  );
  
  // Execute hook on mount
  useEffect(() => {
    if (executedRef.current || isLoading) return;
    
    executedRef.current = true;
    
    executeHook(hook, data).then((result) => {
      if (onComplete) {
        onComplete({
          data: result.data,
          executedModules: result.executedModules,
          renderedComponents: modulesWithHook.length,
          errors: result.errors,
        });
      }
    });
  }, [hook, isLoading, data, executeHook, onComplete, modulesWithHook.length]);
  
  if (isLoading && showLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse h-8 bg-muted rounded" />
      </div>
    );
  }
  
  if (modulesWithHook.length === 0) {
    return children ? <>{children}</> : null;
  }
  
  // Render sandboxed components for each module
  return (
    <div className={className}>
      {modulesWithHook.map((m, _index) => (
        <ModuleHookComponent
          key={m.module.id}
          module={m.module}
          _hook={hook}
          _data={data}
          settings={m.settings}
        />
      ))}
      {children}
    </div>
  );
}

/**
 * Individual module hook component renderer
 */
function ModuleHookComponent({
  module,
  _hook,
  _data,
  settings,
}: {
  module: Module;
  _hook: ModuleHookName;
  _data: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const { scopeId } = useModules();
  
  // Create the sandboxed module object
  const sandboxedModule = {
    id: module.id,
    slug: module.slug,
    packageUrl: module.packageUrl || `modules/${module.slug}/index.js`,
    name: module.name,
    manifest: module.manifest || {
      id: module.id,
      slug: module.slug,
      name: module.name,
      version: module.currentVersion || "1.0.0",
      hooks: [],
      permissions: [],
      installLevel: module.installLevel || "site",
      entryPoints: {},
      settingsSchema: { type: "object" as const },
      defaultSettings: {},
    },
  };
  
  return (
    <ModuleSandbox
      module={sandboxedModule}
      settings={settings}
      permissions={module.manifest?.permissions || []}
      context={{ siteId: scopeId || undefined }}
      onMessage={(type, payload) => {
        console.log(`[Module ${module.slug}] Message:`, type, payload);
      }}
    />
  );
}

// =============================================================
// MODULE SLOT
// =============================================================

/**
 * Renders a named slot where modules can inject content.
 * Similar to WordPress action hooks.
 */
export function ModuleSlot({
  slot,
  context = {},
  className,
  fallback,
}: ModuleSlotProps) {
  // Map slot names to hook names
  const hookName = slotToHook(slot);
  
  if (!hookName) {
    console.warn(`[ModuleSlot] Unknown slot: ${slot}`);
    return fallback ? <>{fallback}</> : null;
  }
  
  return (
    <ModuleHookRenderer hook={hookName} data={context} className={className}>
      {fallback}
    </ModuleHookRenderer>
  );
}

/**
 * Map slot names to hook names
 */
function slotToHook(slot: string): ModuleHookName | null {
  const slotMap: Record<string, ModuleHookName> = {
    // Dashboard slots
    "dashboard:widgets": "dashboard:widget",
    "dashboard:header": "dashboard:header",
    
    // Page slots
    "page:header": "page:header",
    "page:footer": "page:footer",
    "page:content:before": "page:content-before",
    "page:content:after": "page:content-after",
    "page:sidebar": "page:sidebar",
    
    // Editor slots
    "editor:toolbar": "editor:toolbar-extend",
    "editor:sidebar": "editor:sidebar",
    "editor:floating-menu": "editor:floating-menu",
    "editor:preview": "editor:preview",
    
    // Site slots
    "site:header": "site:init",
    "site:settings:tabs": "site:settings-tab",
    
    // Client slots
    "client:overview:widgets": "client:overview-widget",
    "client:settings:tabs": "client:settings-tab",
    
    // Analytics slots
    "analytics:dashboard:widgets": "analytics:dashboard-widget",
    "analytics:reports": "analytics:report",
    
    // Form slots
    "form:fields": "form:field-types",
    "form:validation": "form:validation",
    "form:submission": "form:submission-process",
    
    // Media slots
    "media:toolbar": "media:toolbar",
    "media:upload": "media:upload-process",
    
    // Billing slots
    "billing:checkout": "billing:checkout",
    "billing:invoice": "billing:invoice",
  };
  
  return slotMap[slot] || (slot as ModuleHookName);
}

// =============================================================
// HOOK UTILITIES
// =============================================================

/**
 * Hook to programmatically execute a module hook
 */
export function useExecuteHook() {
  const { executeHook } = useModules();
  return executeHook;
}

/**
 * Hook to get modules that implement a specific hook
 */
export function useModulesWithHook(hook: ModuleHookName): Module[] {
  const { installedModules } = useModules();
  
  return installedModules
    .filter((m) => m.isEnabled && m.module.manifest?.hooks?.includes(hook))
    .map((m) => m.module);
}

/**
 * HOC to wrap a component with module extension support
 */
export function withModuleHook<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  hook: ModuleHookName,
  position: "before" | "after" | "wrap" = "after"
) {
  return function EnhancedComponent(props: P) {
    if (position === "before") {
      return (
        <>
          <ModuleHookRenderer hook={hook} data={props as Record<string, unknown>} />
          <WrappedComponent {...props} />
        </>
      );
    }
    
    if (position === "after") {
      return (
        <>
          <WrappedComponent {...props} />
          <ModuleHookRenderer hook={hook} data={props as Record<string, unknown>} />
        </>
      );
    }
    
    // wrap
    return (
      <ModuleHookRenderer hook={hook} data={props as Record<string, unknown>}>
        <WrappedComponent {...props} />
      </ModuleHookRenderer>
    );
  };
}

// =============================================================
// FILTER HOOKS
// =============================================================

/**
 * Apply filter hooks to transform data
 * Similar to WordPress apply_filters
 */
export async function applyFilters<T>(
  hook: ModuleHookName,
  value: T,
  executeHook: ReturnType<typeof useModules>["executeHook"]
): Promise<T> {
  const result = await executeHook(hook, value);
  return result.data as T;
}

/**
 * Component that applies filters to its children's props
 */
export function FilteredContent<T extends Record<string, unknown>>({
  hook,
  value,
  children,
}: {
  hook: ModuleHookName;
  value: T;
  children: (filteredValue: T) => ReactNode;
}) {
  const { executeHook, isLoading } = useModules();
  const [filteredValue, setFilteredValue] = useState<T>(value);
  const [isFiltering, setIsFiltering] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    setIsFiltering(true);
    
    executeHook(hook, value).then((result) => {
      if (!cancelled) {
        setFilteredValue(result.data as T);
        setIsFiltering(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setFilteredValue(value);
        setIsFiltering(false);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, [hook, value, executeHook]);
  
  if (isLoading || isFiltering) {
    return null;
  }
  
  return <>{children(filteredValue)}</>;
}

// =============================================================
// ACTION HOOKS
// =============================================================

/**
 * Execute an action hook (doesn't return value, just notifies)
 */
export async function doAction(
  hook: ModuleHookName,
  data: unknown,
  executeHook: ReturnType<typeof useModules>["executeHook"]
): Promise<void> {
  await executeHook(hook, data);
}

/**
 * Hook to execute actions on lifecycle events
 */
export function useModuleAction(
  hook: ModuleHookName,
  deps: unknown[] = []
) {
  const { executeHook } = useModules();
  
  useEffect(() => {
    executeHook(hook, { deps });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hook, executeHook, JSON.stringify(deps)]);
}
