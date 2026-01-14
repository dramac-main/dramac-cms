"use client";

import { useModule, useModules } from "./module-context";

// Hook to check if analytics is available
export function useAnalytics() {
  const { isEnabled, settings } = useModule("analytics");
  
  const trackEvent = (name: string, data?: Record<string, unknown>) => {
    if (!isEnabled) return;
    console.log("[Analytics] Event:", name, data);
    // Real implementation would send to analytics service
  };

  const trackPageView = (path: string) => {
    if (!isEnabled) return;
    console.log("[Analytics] Page view:", path);
  };

  return {
    isEnabled,
    trackEvent,
    trackPageView,
  };
}

// Hook to check if forms module is available
export function useForms() {
  const { isEnabled, settings } = useModule("forms-pro");
  
  const submitForm = async (formId: string, data: Record<string, unknown>) => {
    if (!isEnabled) {
      throw new Error("Forms module not enabled");
    }
    
    // Real implementation would submit to forms API
    console.log("[Forms] Submit:", formId, data);
    return { success: true };
  };

  return {
    isEnabled,
    submitForm,
    settings,
  };
}

// Hook to check if blog module is available
export function useBlog() {
  const { isEnabled, settings } = useModule("blog");
  
  return {
    isEnabled,
    postsPerPage: (settings?.postsPerPage as number) || 10,
    commentsEnabled: (settings?.enableComments as boolean) ?? true,
  };
}

// Hook to check if multilingual module is available
export function useMultilingual() {
  const { isEnabled, settings } = useModule("multilingual");
  
  return {
    isEnabled,
    languages: (settings?.languages as string[]) || ["en"],
    currentLanguage: (settings?.currentLanguage as string) || "en",
  };
}

// Generic hook to use any module's features
export function useModuleFeature<T = unknown>(
  slug: string,
  featureExtractor: (settings: Record<string, unknown>) => T
): { isEnabled: boolean; feature: T | null } {
  const { isEnabled, settings } = useModule(slug);
  
  return {
    isEnabled,
    feature: isEnabled && settings ? featureExtractor(settings) : null,
  };
}
