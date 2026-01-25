'use client';

/**
 * EditorContext - Provides site and module context to editor components
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * This context enables editor components (like the toolbox) to access
 * site information and installed modules, allowing for conditional
 * rendering of module-specific components.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useSiteModules } from '@/hooks/use-site-modules';
import type { Site } from '@/types/site';

// Module IDs mapping for component filtering
export const MODULE_IDS = {
  ECOMMERCE: 'ecommerce',
  BLOG: 'blog',
  BOOKING: 'booking',
  CRM: 'crm',
  ANALYTICS: 'analytics',
} as const;

// Component categories that require specific modules
export const MODULE_COMPONENT_CATEGORIES: Record<string, string> = {
  ecommerce: MODULE_IDS.ECOMMERCE,
  blog: MODULE_IDS.BLOG,
  booking: MODULE_IDS.BOOKING,
};

interface EditorContextValue {
  site: Site;
  installedModules: string[];
  isModuleInstalled: (moduleId: string) => boolean;
  isLoading: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  site: Site;
  children: React.ReactNode;
}

export function EditorProvider({ site, children }: EditorProviderProps) {
  const { data: modules, isLoading } = useSiteModules(site.id);
  
  const installedModules = useMemo(() => {
    if (!modules) return [];
    return modules
      .filter(m => m.isEnabled)
      .map(m => m.module.slug || m.module.id);
  }, [modules]);

  const isModuleInstalled = (moduleId: string) => {
    return installedModules.includes(moduleId);
  };

  const value: EditorContextValue = {
    site,
    installedModules,
    isModuleInstalled,
    isLoading,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}

// Optional hook that doesn't throw if context is missing
// Useful for components that may be used outside the editor
export function useEditorContextOptional() {
  return useContext(EditorContext);
}
