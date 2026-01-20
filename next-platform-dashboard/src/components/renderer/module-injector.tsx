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
 * Transpile module code for browser execution.
 * Removes TypeScript syntax and converts ES6 exports.
 */
function transpileForBrowser(code: string): string {
  return code
    // Remove TypeScript type annotations
    .replace(/:\s*\w+(\[\])?(\s*[,\)=])/g, "$2")
    .replace(/:\s*\w+(\[\])?(\s*{)/g, "$2")
    .replace(/<\w+>/g, "")
    .replace(/interface\s+\w+\s*{[^}]*}/g, "")
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
    // Convert exports to browser-compatible format
    .replace(/export\s+default\s+function\s+(\w+)/g, "var ModuleComponent = function $1")
    .replace(/export\s+default\s+/g, "var ModuleComponent = ")
    .replace(/export\s+function\s+(\w+)/g, "var $1 = function")
    .replace(/export\s+const\s+(\w+)/g, "var $1")
    .replace(/export\s+{[^}]*}/g, "")
    // Remove import statements
    .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, "")
    .replace(/import\s+['"][^'"]+['"];?\n?/g, "");
}

/**
 * Server component that injects studio module code into rendered sites.
 * 
 * This component:
 * 1. Fetches all enabled modules for the site
 * 2. Creates a div container for each module
 * 3. Loads React 18 UMD bundle
 * 4. Executes module render code in isolated IIFE
 */
export async function ModuleInjector({ siteId }: ModuleInjectorProps) {
  if (!siteId) {
    return null;
  }

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get all enabled module installations for this site
    const { data: installations, error: installError } = await db
      .from("site_module_installations")
      .select("module_id, settings")
      .eq("site_id", siteId)
      .eq("is_enabled", true);

    if (installError) {
      console.error("[ModuleInjector] Error fetching installations:", installError);
      return null;
    }

    if (!installations?.length) {
      return null;
    }

    // Get the module IDs
    const moduleIds = installations.map((i: { module_id: string }) => i.module_id);

    // Fetch modules from modules_v2 (published marketplace)
    const { data: v2Modules, error: v2Error } = await db
      .from("modules_v2")
      .select("id, slug, name, source, render_code, styles, settings_schema, default_settings")
      .in("id", moduleIds)
      .eq("is_active", true);

    if (v2Error) {
      console.error("[ModuleInjector] Error fetching modules_v2:", v2Error);
    }

    // Also fetch from module_source for testing/staging modules
    const { data: sourceModules, error: sourceError } = await db
      .from("module_source")
      .select("id, slug, name, render_code, styles, settings_schema, default_settings, status")
      .in("id", moduleIds)
      .in("status", ["published", "testing"]);

    if (sourceError) {
      console.error("[ModuleInjector] Error fetching module_source:", sourceError);
    }

    // Combine both sources - convert module_source format and add 'studio' source
    const sourceConverted = (sourceModules || []).map((m: any) => ({
      ...m,
      source: "studio", // Mark as studio module for rendering
    }));

    // Merge: v2 modules take precedence, then source modules
    const v2Ids = new Set((v2Modules || []).map((m: any) => m.id));
    const modules = [
      ...(v2Modules || []),
      ...sourceConverted.filter((m: any) => !v2Ids.has(m.id)),
    ];

    if (!modules?.length) {
      console.log("[ModuleInjector] No modules found for IDs:", moduleIds);
      return null;
    }

    // Create a map for easy lookup
    const moduleMap = new Map(modules.map((m: SiteModuleData["module"]) => [m?.id, m]));

    // Combine installations with their modules
    const siteModules: SiteModuleData[] = installations
      .map((install: { module_id: string; settings: Record<string, unknown> | null }) => ({
        settings: install.settings,
        module: moduleMap.get(install.module_id) || null,
      }))
      .filter((sm: SiteModuleData) => sm.module !== null);

    // Filter for studio modules that have render code
    const studioModules = siteModules.filter(
      (sm) => sm.module?.source === "studio" && sm.module?.render_code
    );

    if (studioModules.length === 0) {
      console.log("[ModuleInjector] No studio modules with render code");
      return null;
    }

    // Collect all CSS styles
    const styles = studioModules
      .map((sm) => sm.module?.styles)
      .filter((s): s is string => Boolean(s))
      .join("\n\n/* --- Module Separator --- */\n\n");

    // Build mount points and scripts for each module
    const moduleContainers = studioModules.map((sm) => {
      const mod = sm.module!;
      return `<div id="dramac-module-${mod.slug}" class="dramac-module-container" data-module-id="${mod.id}" data-module-slug="${mod.slug}"></div>`;
    }).join("\n");

    // Build initialization script for each module
    const initScripts = studioModules.map((sm) => {
      const mod = sm.module!;
      const mergedSettings = {
        ...(mod.default_settings || {}),
        ...(sm.settings || {}),
      };
      
      const transpiledCode = transpileForBrowser(mod.render_code || "");
      
      return `
(function() {
  "use strict";
  
  // Module: ${mod.name} (${mod.slug})
  var settings = ${JSON.stringify(mergedSettings)};
  var moduleId = "${mod.slug}";
  var containerId = "dramac-module-${mod.slug}";
  
  try {
    // Execute module code (defines ModuleComponent)
    ${transpiledCode}
    
    // Find the mount point
    var container = document.getElementById(containerId);
    if (!container) {
      console.error("[Module ${mod.slug}] Container not found:", containerId);
      return;
    }
    
    // Check if we have a component to render
    if (typeof ModuleComponent === 'undefined') {
      console.warn("[Module ${mod.slug}] No ModuleComponent exported");
      return;
    }
    
    // Render with React
    var root = ReactDOM.createRoot(container);
    root.render(React.createElement(ModuleComponent, { settings: settings }));
    
    console.log("[Module ${mod.slug}] Rendered successfully");
  } catch (e) {
    console.error("[Module ${mod.slug}] Error:", e);
    var container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div style="padding: 1rem; background: #fee2e2; border: 1px solid #ef4444; border-radius: 0.5rem; color: #b91c1c;"><strong>Module Error:</strong> ' + e.message + '</div>';
    }
  }
})();
`;
    }).join("\n\n");

    return (
      <>
        {/* Module Styles */}
        {styles && (
          <style 
            dangerouslySetInnerHTML={{ __html: styles }} 
            data-dramac-modules="studio-styles"
          />
        )}
        
        {/* Module Mount Points - placed at the TOP of the page */}
        <div 
          id="dramac-modules-container"
          data-dramac-modules="containers"
          dangerouslySetInnerHTML={{ __html: moduleContainers }}
        />
        
        {/* Load React 18 UMD (required for module execution) */}
        <script 
          src="https://unpkg.com/react@18/umd/react.production.min.js"
          crossOrigin="anonymous"
        />
        <script 
          src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
          crossOrigin="anonymous"
        />
        
        {/* Module Initialization Scripts - run after React loads */}
        <script
          dangerouslySetInnerHTML={{ 
            __html: `
              // Wait for React to be available
              function initDramacModules() {
                if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
                  setTimeout(initDramacModules, 50);
                  return;
                }
                
                console.log('[ModuleInjector] Initializing ${studioModules.length} module(s)');
                
                ${initScripts}
              }
              
              // Start initialization
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initDramacModules);
              } else {
                initDramacModules();
              }
            ` 
          }}
          data-dramac-modules="studio-scripts"
        />
        
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
