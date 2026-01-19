import { createClient } from "@/lib/supabase/server";

interface ModuleInjectorProps {
  siteId: string;
}

interface SiteModuleData {
  settings: Record<string, unknown> | null;
  module: {
    id: string;
    slug: string;
    name: string;
    source: string | null;
    render_code: string | null;
    styles: string | null;
    settings_schema: Record<string, unknown> | null;
    default_settings: Record<string, unknown> | null;
  } | null;
}

/**
 * Server component that injects studio module code into rendered sites.
 * 
 * This component:
 * 1. Fetches all enabled modules for the site
 * 2. Filters for studio-built modules (source = 'studio')
 * 3. Injects their CSS styles and JavaScript code
 * 4. Passes module settings to each module
 * 
 * The injected code runs in an IIFE (Immediately Invoked Function Expression)
 * to provide module isolation.
 */
export async function ModuleInjector({ siteId }: ModuleInjectorProps) {
  if (!siteId) {
    return null;
  }

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get all enabled modules for this site from site_module_installations (V2)
    const { data: siteModules, error } = await db
      .from("site_module_installations")
      .select(`
        settings,
        module:modules_v2(
          id, 
          slug,
          name,
          source, 
          render_code, 
          styles,
          settings_schema,
          default_settings
        )
      `)
      .eq("site_id", siteId)
      .eq("status", "active");

    if (error) {
      console.error("[ModuleInjector] Error fetching site modules:", error);
      return null;
    }

    if (!siteModules?.length) {
      return null;
    }

    // Filter for studio modules that have render code
    const studioModules = (siteModules as SiteModuleData[]).filter(
      (sm) => sm.module?.source === "studio" && sm.module?.render_code
    );

    if (studioModules.length === 0) {
      return null;
    }

    // Collect all CSS styles
    const styles = studioModules
      .map((sm) => sm.module?.styles)
      .filter((s): s is string => Boolean(s))
      .join("\n\n/* --- Module Separator --- */\n\n");

    // Build JavaScript for each module
    const scripts = studioModules
      .map((sm) => {
        const mod = sm.module!;
        // Merge default settings with site-specific settings
        const mergedSettings = {
          ...(mod.default_settings || {}),
          ...(sm.settings || {}),
        };
        
        // Wrap in IIFE for isolation
        return `
/* Module: ${mod.name} (${mod.slug}) */
(function() {
  "use strict";
  
  // Module context
  const DRAMAC_MODULE = {
    id: "${mod.id}",
    slug: "${mod.slug}",
    name: "${mod.name}",
    settings: ${JSON.stringify(mergedSettings)},
  };
  
  // Make settings available
  const moduleSettings = DRAMAC_MODULE.settings;
  const moduleId = DRAMAC_MODULE.slug;
  
  try {
    ${mod.render_code}
  } catch (e) {
    console.error("[Module ${mod.slug}] Error:", e);
  }
})();
`;
      })
      .join("\n");

    return (
      <>
        {/* Module Styles */}
        {styles && (
          <style 
            dangerouslySetInnerHTML={{ __html: styles }} 
            data-dramac-modules="studio-styles"
          />
        )}
        
        {/* Module Scripts */}
        {scripts && (
          <script
            dangerouslySetInnerHTML={{ __html: scripts }}
            data-dramac-modules="studio-scripts"
          />
        )}
        
        {/* Module Registry for debugging */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__DRAMAC_MODULES__ = window.__DRAMAC_MODULES__ || {};
              window.__DRAMAC_MODULES__.studio = ${JSON.stringify(
                studioModules.map((sm) => ({
                  id: sm.module?.id,
                  slug: sm.module?.slug,
                  name: sm.module?.name,
                }))
              )};
            `,
          }}
          data-dramac-modules="registry"
        />
      </>
    );
  } catch (error) {
    console.error("[ModuleInjector] Unexpected error:", error);
    return null;
  }
}

/**
 * Client-side module loader for dynamic loading after page render.
 * Use this when modules need to be loaded dynamically.
 */
export function ModuleLoaderScript({ siteId }: { siteId: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.__DRAMAC_SITE_ID__ = "${siteId}";
          
          // Dynamic module loader
          window.loadDramacModule = async function(moduleSlug) {
            try {
              const response = await fetch('/api/modules/render/' + moduleSlug + '?siteId=' + window.__DRAMAC_SITE_ID__);
              if (!response.ok) throw new Error('Failed to load module');
              const data = await response.json();
              
              // Inject styles if present
              if (data.styles) {
                const style = document.createElement('style');
                style.setAttribute('data-dramac-module', moduleSlug);
                style.textContent = data.styles;
                document.head.appendChild(style);
              }
              
              // Inject and execute script
              if (data.renderCode) {
                const script = document.createElement('script');
                script.setAttribute('data-dramac-module', moduleSlug);
                script.textContent = data.renderCode;
                document.body.appendChild(script);
              }
              
              return true;
            } catch (e) {
              console.error('[ModuleLoader] Failed to load ' + moduleSlug + ':', e);
              return false;
            }
          };
        `,
      }}
      data-dramac-modules="loader"
    />
  );
}
