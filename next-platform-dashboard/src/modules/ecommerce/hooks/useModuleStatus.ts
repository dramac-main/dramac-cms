/**
 * useModuleStatus Hook
 * 
 * PHASE-ECOM-52: Navigation & Widget Auto-Setup
 * 
 * Hook to check the installation status of a module on a site.
 * Used by header components to conditionally render module widgets.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ModuleStatus {
  /** Whether the module is installed on the site */
  isInstalled: boolean;
  
  /** Whether the module is currently enabled */
  isEnabled: boolean;
  
  /** Module settings if available */
  settings: Record<string, unknown> | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error if any */
  error: string | null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Check if a module is installed and enabled on a site
 * 
 * @param moduleId - The module ID to check
 * @param siteId - The site ID to check for
 * @returns Module status object
 * 
 * @example
 * ```tsx
 * function SiteHeader({ siteId }) {
 *   const { isInstalled, isEnabled } = useModuleStatus('ecommerce', siteId);
 *   
 *   return (
 *     <header>
 *       {isInstalled && isEnabled && <CartIconWidget siteId={siteId} />}
 *     </header>
 *   );
 * }
 * ```
 */
export function useModuleStatus(
  moduleId: string,
  siteId: string | null | undefined
): ModuleStatus {
  const [status, setStatus] = useState<ModuleStatus>({
    isInstalled: false,
    isEnabled: false,
    settings: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!siteId || !moduleId) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: !siteId ? 'No site ID provided' : 'No module ID provided',
      }));
      return;
    }

    let mounted = true;

    async function checkModuleStatus() {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('site_module_installations')
          .select('id, is_enabled, settings')
          .eq('site_id', siteId!)
          .eq('module_id', moduleId)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          setStatus({
            isInstalled: false,
            isEnabled: false,
            settings: null,
            isLoading: false,
            error: error.message,
          });
          return;
        }

        setStatus({
          isInstalled: !!data,
          isEnabled: data?.is_enabled ?? false,
          settings: (data?.settings as Record<string, unknown>) ?? null,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;
        
        setStatus({
          isInstalled: false,
          isEnabled: false,
          settings: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    checkModuleStatus();

    return () => {
      mounted = false;
    };
  }, [moduleId, siteId]);

  return status;
}

/**
 * Check if e-commerce module is installed (convenience wrapper)
 */
export function useEcommerceStatus(siteId: string | null | undefined): ModuleStatus {
  return useModuleStatus('ecommerce', siteId);
}

/**
 * Get multiple module statuses at once
 */
export function useModulesStatus(
  moduleIds: string[],
  siteId: string | null | undefined
): Record<string, ModuleStatus> {
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>(() => {
    const initial: Record<string, ModuleStatus> = {};
    for (const id of moduleIds) {
      initial[id] = {
        isInstalled: false,
        isEnabled: false,
        settings: null,
        isLoading: true,
        error: null,
      };
    }
    return initial;
  });

  useEffect(() => {
    if (!siteId || moduleIds.length === 0) {
      return;
    }

    let mounted = true;

    async function checkStatuses() {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('site_module_installations')
          .select('module_id, is_enabled, settings')
          .eq('site_id', siteId!)
          .in('module_id', moduleIds);

        if (!mounted) return;

        const newStatuses: Record<string, ModuleStatus> = {};
        
        for (const id of moduleIds) {
          const installation = data?.find(d => d.module_id === id);
          
          newStatuses[id] = {
            isInstalled: !!installation,
            isEnabled: installation?.is_enabled ?? false,
            settings: (installation?.settings as Record<string, unknown>) ?? null,
            isLoading: false,
            error: error?.message ?? null,
          };
        }

        setStatuses(newStatuses);
      } catch (err) {
        if (!mounted) return;
        
        const errorStatuses: Record<string, ModuleStatus> = {};
        for (const id of moduleIds) {
          errorStatuses[id] = {
            isInstalled: false,
            isEnabled: false,
            settings: null,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
        setStatuses(errorStatuses);
      }
    }

    checkStatuses();

    return () => {
      mounted = false;
    };
  }, [moduleIds.join(','), siteId]);

  return statuses;
}
