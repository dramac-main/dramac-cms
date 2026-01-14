"use client";

import { useModules } from "@/lib/modules/module-context";
import {
  InjectionPoint,
  getComponentsForInjectionPoint,
} from "@/lib/modules/components";

interface ModuleInjectorProps {
  point: InjectionPoint;
}

export function ModuleInjector({ point }: ModuleInjectorProps) {
  const { enabledModules, getModuleSettings } = useModules();
  
  const enabledSlugs = new Set(enabledModules.map((m) => m.module.slug));
  const components = getComponentsForInjectionPoint(point, enabledSlugs);

  if (components.length === 0) return null;

  return (
    <>
      {components.map((mc) => {
        const settings = getModuleSettings(mc.slug) || {};
        const Component = mc.component;
        return <Component key={mc.slug} settings={settings} />;
      })}
    </>
  );
}
