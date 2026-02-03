/**
 * DRAMAC Studio Module Sync Hooks
 * 
 * Hooks for module initialization and real-time synchronization.
 * Subscribes to Supabase real-time changes on site_module_installations.
 * 
 * Note: The real-time subscription is optional and will gracefully degrade
 * if the table doesn't exist or realtime is not enabled.
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useModuleStore } from "../store/module-store";
import { getModuleInfo } from "../registry/module-discovery";
import type { InstalledModuleInfo } from "@/types/studio-module";
import type { RealtimeChannel } from "@supabase/supabase-js";

// =============================================================================
// MODULE SYNC HOOK
// =============================================================================

/**
 * Hook to sync module changes in real-time
 * 
 * Subscribes to site_module_installations table changes and updates the module store.
 * Gracefully handles cases where realtime is not available.
 */
export function useModuleSync(siteId: string | null) {
  const { 
    onModuleInstalled, 
    onModuleUninstalled, 
    onModuleStatusChange,
    isInitialized,
  } = useModuleStore();
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'connected' | 'error' | 'disabled'>('idle');

  useEffect(() => {
    if (!siteId || !isInitialized) return;

    const supabase = createClient();
    
    // Check if real-time is supported before subscribing
    // This prevents errors when the table doesn't exist or realtime isn't enabled
    const checkTableAndSubscribe = async () => {
      try {
        // Verify the table exists by attempting a simple query
        const { error: tableError } = await supabase
          .from('site_module_installations')
          .select('id')
          .limit(1);
        
        // If table doesn't exist or we don't have permission, skip subscription
        if (tableError) {
          console.log("[ModuleSync] Realtime disabled - table not accessible:", tableError.message);
          setSyncStatus('disabled');
          return;
        }
        
        // Create channel for this site's module changes
        const channel = supabase
          .channel(`site-modules-${siteId}`)
          .on<{
            id: string;
            site_id: string;
            module_id: string;
            is_enabled: boolean;
          }>(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "site_module_installations",
              filter: `site_id=eq.${siteId}`,
            },
            async (payload) => {
              console.log("[ModuleSync] Module installed:", payload.new.module_id);
          
          // Fetch full module info
          const moduleInfo = await getModuleInfo(payload.new.module_id);
          
          if (moduleInfo) {
            const installed: InstalledModuleInfo = {
              ...moduleInfo,
              status: payload.new.is_enabled ? "active" : "inactive",
              installationId: payload.new.id,
            };
            onModuleInstalled(installed);
          }
        }
      )
      .on<{
        id: string;
        site_id: string;
        module_id: string;
        is_enabled: boolean;
      }>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "site_module_installations",
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          const moduleId = payload.old?.module_id;
          if (moduleId) {
            console.log("[ModuleSync] Module uninstalled:", moduleId);
            onModuleUninstalled(moduleId);
          }
        }
      )
      .on<{
        id: string;
        site_id: string;
        module_id: string;
        is_enabled: boolean;
      }>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_module_installations",
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          const wasEnabled = payload.old.is_enabled;
          const isEnabled = payload.new.is_enabled;
          
          if (wasEnabled !== isEnabled) {
            console.log(
              "[ModuleSync] Module status changed:", 
              payload.new.module_id, 
              isEnabled ? "enabled" : "disabled"
            );
            onModuleStatusChange(
              payload.new.module_id, 
              isEnabled ? "active" : "inactive"
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[ModuleSync] Subscribed to module changes for site:", siteId);
          setSyncStatus('connected');
        } else if (status === "CHANNEL_ERROR") {
          // Log as info, not error - this is expected when realtime isn't configured
          console.log("[ModuleSync] Realtime not available - falling back to manual refresh");
          setSyncStatus('disabled');
        } else if (status === "TIMED_OUT") {
          console.log("[ModuleSync] Subscription timed out - realtime may not be configured");
          setSyncStatus('disabled');
        }
      });

        channelRef.current = channel;
      } catch (err) {
        console.log("[ModuleSync] Unable to initialize realtime sync:", err);
        setSyncStatus('disabled');
      }
    };
    
    checkTableAndSubscribe();

    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [siteId, isInitialized, onModuleInstalled, onModuleUninstalled, onModuleStatusChange]);
  
  return { syncStatus };
}

// =============================================================================
// MODULE INITIALIZATION HOOK
// =============================================================================

/**
 * Hook to initialize modules on editor mount
 */
export function useModuleInitialization(siteId: string | null) {
  const { initialize, reset, isInitialized, loader, initError } = useModuleStore();

  useEffect(() => {
    if (!siteId) return;

    // Initialize module loading for this site
    initialize(siteId);

    // Cleanup is handled by the module store
    // Don't reset immediately to allow navigation between pages
  }, [siteId, initialize]);

  return {
    isLoading: loader.isLoading,
    isInitialized,
    loadedModules: loader.loadedModules,
    failedModules: loader.failedModules,
    error: initError,
    reset,
  };
}

// =============================================================================
// MODULE REFRESH HOOK
// =============================================================================

/**
 * Hook to manually refresh modules
 */
export function useModuleRefresh() {
  const reloadModules = useModuleStore(state => state.reloadModules);
  const isLoading = useModuleStore(state => state.loader.isLoading);

  const refresh = useCallback(async () => {
    await reloadModules();
  }, [reloadModules]);

  return {
    refresh,
    isRefreshing: isLoading,
  };
}

// =============================================================================
// MODULE STATE HOOK
// =============================================================================

/**
 * Hook to access module state
 */
export function useModules() {
  const installedModules = useModuleStore(state => state.installedModules);
  const loadedModules = useModuleStore(state => state.loader.loadedModules);
  const failedModules = useModuleStore(state => state.loader.failedModules);
  const isLoading = useModuleStore(state => state.loader.isLoading);
  const isInitialized = useModuleStore(state => state.isInitialized);
  const getModuleComponentCount = useModuleStore(state => state.getModuleComponentCount);

  return {
    installedModules,
    loadedModules,
    failedModules,
    isLoading,
    isInitialized,
    moduleComponentCount: getModuleComponentCount(),
  };
}
