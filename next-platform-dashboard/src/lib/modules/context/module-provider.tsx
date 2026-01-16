"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type {
  Module,
  AgencyModuleInstallation,
  ClientModuleInstallation,
  SiteModuleInstallation,
  ModuleHookName,
} from "../types";

// =============================================================
// TYPES
// =============================================================

export type ModuleScope = "platform" | "agency" | "client" | "site";

export interface ModuleContextValue {
  // Current scope
  scope: ModuleScope;
  scopeId: string | null; // The ID of the current agency/client/site
  
  // Module data
  availableModules: Module[];
  installedModules: InstalledModuleInfo[];
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Module operations
  getModule: (moduleId: string) => Module | undefined;
  getModuleBySlug: (slug: string) => Module | undefined;
  isModuleInstalled: (moduleId: string) => boolean;
  isModuleEnabled: (moduleId: string) => boolean;
  getModuleSettings: <T = Record<string, unknown>>(moduleId: string) => T | null;
  
  // Hook registration
  registerHookListener: (
    hook: ModuleHookName,
    callback: HookCallback
  ) => () => void;
  executeHook: <T = unknown>(
    hook: ModuleHookName,
    data?: T
  ) => Promise<HookResult<T>>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export interface InstalledModuleInfo {
  module: Module;
  installation:
    | AgencyModuleInstallation
    | ClientModuleInstallation
    | SiteModuleInstallation;
  scope: ModuleScope;
  isEnabled: boolean;
  settings: Record<string, unknown>;
}

export type HookCallback<T = unknown> = (data: T) => T | Promise<T>;

export interface HookResult<T = unknown> {
  data: T;
  executedModules: string[];
  errors: Array<{ moduleId: string; error: string }>;
}

interface ModuleProviderProps {
  children: ReactNode;
  scope: ModuleScope;
  scopeId?: string | null;
  // Optional initial data for SSR
  initialModules?: Module[];
  initialInstallations?: Array<
    AgencyModuleInstallation | ClientModuleInstallation | SiteModuleInstallation
  >;
}

// =============================================================
// CONTEXT
// =============================================================

const ModuleContext = createContext<ModuleContextValue | null>(null);

// =============================================================
// HOOK
// =============================================================

export function useModules(): ModuleContextValue {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModules must be used within a ModuleProvider");
  }
  return context;
}

/**
 * Hook to check if a specific module is available and enabled
 */
export function useModule(moduleIdOrSlug: string): {
  module: Module | null;
  isInstalled: boolean;
  isEnabled: boolean;
  settings: Record<string, unknown>;
  isLoading: boolean;
} {
  const ctx = useModules();
  
  const moduleRecord = ctx.getModule(moduleIdOrSlug) || ctx.getModuleBySlug(moduleIdOrSlug);
  const isInstalled = moduleRecord ? ctx.isModuleInstalled(moduleRecord.id) : false;
  const isEnabled = moduleRecord ? ctx.isModuleEnabled(moduleRecord.id) : false;
  const settings = moduleRecord ? ctx.getModuleSettings(moduleRecord.id) || {} : {};
  
  return {
    module: moduleRecord || null,
    isInstalled,
    isEnabled,
    settings,
    isLoading: ctx.isLoading,
  };
}

/**
 * Hook to register a callback for a specific hook
 */
export function useModuleHook<T = unknown>(
  hook: ModuleHookName,
  callback: HookCallback<T>
): void {
  const ctx = useModules();
  
  useEffect(() => {
    const unregister = ctx.registerHookListener(hook, callback as HookCallback);
    return unregister;
  }, [ctx, hook, callback]);
}

// =============================================================
// PROVIDER
// =============================================================

export function ModuleProvider({
  children,
  scope,
  scopeId = null,
  initialModules = [],
  initialInstallations = [],
}: ModuleProviderProps) {
  // State
  const [availableModules, setAvailableModules] =
    useState<Module[]>(initialModules);
  const [installedModules, setInstalledModules] = useState<InstalledModuleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(!initialModules.length);
  const [isInitialized, setIsInitialized] = useState(!!initialModules.length);
  const [error, setError] = useState<string | null>(null);
  
  // Hook listeners
  const hookListeners = useRef<Map<ModuleHookName, Set<HookCallback>>>(new Map());
  
  // Build installed modules from installations
  useEffect(() => {
    if (initialInstallations.length && availableModules.length) {
      const installed: InstalledModuleInfo[] = [];
      
      for (const installation of initialInstallations) {
        const moduleRecord = availableModules.find((m) => m.id === installation.moduleId);
        if (moduleRecord) {
          installed.push({
            module: moduleRecord,
            installation,
            scope,
            isEnabled: installation.isEnabled,
            settings: installation.settings,
          });
        }
      }
      
      setInstalledModules(installed);
    }
  }, [initialInstallations, availableModules, scope]);
  
  // Fetch modules on mount
  useEffect(() => {
    if (initialModules.length) return; // Skip if we have initial data
    
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeId, initialModules.length]);
  
  // Fetch available and installed modules
  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch available modules
      const modulesRes = await fetch("/api/modules");
      if (!modulesRes.ok) throw new Error("Failed to fetch modules");
      const modulesData = await modulesRes.json();
      setAvailableModules(modulesData.modules || []);
      
      // Fetch installations based on scope
      if (scopeId) {
        let installationsEndpoint = "";
        
        switch (scope) {
          case "agency":
            installationsEndpoint = `/api/modules/agency/${scopeId}/installations`;
            break;
          case "client":
            installationsEndpoint = `/api/modules/client/${scopeId}/installations`;
            break;
          case "site":
            installationsEndpoint = `/api/modules/site/${scopeId}/installations`;
            break;
          default:
            // Platform level - no installations
            break;
        }
        
        if (installationsEndpoint) {
          const installRes = await fetch(installationsEndpoint);
          if (installRes.ok) {
            const installData = await installRes.json();
            
            // Map installations to InstalledModuleInfo
            const installed: InstalledModuleInfo[] = [];
            for (const inst of installData.installations || []) {
              const moduleRecord = (modulesData.modules || []).find(
                (m: Module) => m.id === inst.module_id
              );
              if (moduleRecord) {
                installed.push({
                  module: moduleRecord,
                  installation: inst,
                  scope,
                  isEnabled: inst.is_enabled,
                  settings: inst.settings || {},
                });
              }
            }
            setInstalledModules(installed);
          }
        }
      }
      
      setIsInitialized(true);
    } catch (err) {
      console.error("[ModuleProvider] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setIsLoading(false);
    }
  }, [scope, scopeId]);
  
  // Get module by ID
  const getModule = useCallback(
    (moduleId: string) => availableModules.find((m) => m.id === moduleId),
    [availableModules]
  );
  
  // Get module by slug
  const getModuleBySlug = useCallback(
    (slug: string) => availableModules.find((m) => m.slug === slug),
    [availableModules]
  );
  
  // Check if module is installed
  const isModuleInstalled = useCallback(
    (moduleId: string) => installedModules.some((m) => m.module.id === moduleId),
    [installedModules]
  );
  
  // Check if module is enabled
  const isModuleEnabled = useCallback(
    (moduleId: string) => {
      const installed = installedModules.find((m) => m.module.id === moduleId);
      return installed?.isEnabled ?? false;
    },
    [installedModules]
  );
  
  // Get module settings
  const getModuleSettings = useCallback(
    <T = Record<string, unknown>>(moduleId: string): T | null => {
      const installed = installedModules.find((m) => m.module.id === moduleId);
      return (installed?.settings as T) ?? null;
    },
    [installedModules]
  );
  
  // Register hook listener
  const registerHookListener = useCallback(
    (hook: ModuleHookName, callback: HookCallback): (() => void) => {
      if (!hookListeners.current.has(hook)) {
        hookListeners.current.set(hook, new Set());
      }
      hookListeners.current.get(hook)!.add(callback);
      
      // Return unregister function
      return () => {
        hookListeners.current.get(hook)?.delete(callback);
      };
    },
    []
  );
  
  // Execute hook
  const executeHook = useCallback(
    async <T = unknown>(hook: ModuleHookName, data?: T): Promise<HookResult<T>> => {
      const listeners = hookListeners.current.get(hook);
      const executedModules: string[] = [];
      const errors: Array<{ moduleId: string; error: string }> = [];
      let currentData = data as T;
      
      if (!listeners || listeners.size === 0) {
        return { data: currentData, executedModules, errors };
      }
      
      // Find enabled modules that use this hook
      const modulesWithHook = installedModules.filter(
        (m) => m.isEnabled && m.module.manifest?.hooks?.includes(hook)
      );
      
      // Execute each listener (modules can filter their own execution)
      for (const listener of listeners) {
        try {
          const result = await listener(currentData);
          if (result !== undefined) {
            currentData = result as T;
          }
        } catch (err) {
          // We don't have moduleId in the listener, log generically
          console.error(`[ModuleProvider] Hook ${hook} error:`, err);
          errors.push({
            moduleId: "unknown",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
      
      // Mark all modules with this hook as executed
      for (const m of modulesWithHook) {
        executedModules.push(m.module.id);
      }
      
      return { data: currentData, executedModules, errors };
    },
    [installedModules]
  );
  
  // Refresh data
  const refresh = useCallback(async () => {
    await fetchModules();
  }, [fetchModules]);
  
  // Context value
  const value: ModuleContextValue = {
    scope,
    scopeId,
    availableModules,
    installedModules,
    isLoading,
    isInitialized,
    error,
    getModule,
    getModuleBySlug,
    isModuleInstalled,
    isModuleEnabled,
    getModuleSettings,
    registerHookListener,
    executeHook,
    refresh,
  };
  
  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
}

// =============================================================
// UTILITY COMPONENTS
// =============================================================

/**
 * Renders children only if a module is installed and enabled
 */
export function ModuleGate({
  moduleId,
  children,
  fallback = null,
}: {
  moduleId: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isModuleEnabled, isLoading } = useModules();
  
  if (isLoading) return null;
  if (!isModuleEnabled(moduleId)) return <>{fallback}</>;
  
  return <>{children}</>;
}

/**
 * Renders children only if ANY of the specified modules are enabled
 */
export function ModuleGateAny({
  moduleIds,
  children,
  fallback = null,
}: {
  moduleIds: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isModuleEnabled, isLoading } = useModules();
  
  if (isLoading) return null;
  if (!moduleIds.some(isModuleEnabled)) return <>{fallback}</>;
  
  return <>{children}</>;
}

/**
 * Renders children only if ALL of the specified modules are enabled
 */
export function ModuleGateAll({
  moduleIds,
  children,
  fallback = null,
}: {
  moduleIds: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isModuleEnabled, isLoading } = useModules();
  
  if (isLoading) return null;
  if (!moduleIds.every(isModuleEnabled)) return <>{fallback}</>;
  
  return <>{children}</>;
}
