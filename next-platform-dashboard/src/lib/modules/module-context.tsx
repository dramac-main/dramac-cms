"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Module, SiteModule } from "@/types/modules";

export interface EnabledModule {
  module: Module;
  settings: Record<string, unknown>;
}

interface ModuleContextValue {
  enabledModules: EnabledModule[];
  isModuleEnabled: (slug: string) => boolean;
  getModuleSettings: (slug: string) => Record<string, unknown> | null;
  getModule: (slug: string) => EnabledModule | null;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

interface ModuleProviderProps {
  modules: EnabledModule[];
  children: ReactNode;
}

export function ModuleProvider({ modules, children }: ModuleProviderProps) {
  const moduleMap = new Map(modules.map((m) => [m.module.slug, m]));

  const isModuleEnabled = (slug: string) => moduleMap.has(slug);

  const getModuleSettings = (slug: string) => {
    const mod = moduleMap.get(slug);
    return mod?.settings || null;
  };

  const getModule = (slug: string) => moduleMap.get(slug) || null;

  return (
    <ModuleContext.Provider
      value={{
        enabledModules: modules,
        isModuleEnabled,
        getModuleSettings,
        getModule,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModules must be used within ModuleProvider");
  }
  return context;
}

export function useModule(slug: string) {
  const { getModule, isModuleEnabled, getModuleSettings } = useModules();
  return {
    module: getModule(slug),
    isEnabled: isModuleEnabled(slug),
    settings: getModuleSettings(slug),
  };
}
