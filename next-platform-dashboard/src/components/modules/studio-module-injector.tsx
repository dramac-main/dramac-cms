"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import type { LoadedStudioModule } from "@/lib/modules/studio-module-loader";

interface StudioModuleInjectorProps {
  module: LoadedStudioModule;
  settings?: Record<string, unknown>;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  className?: string;
  minHeight?: string;
}

/**
 * StudioModuleInjector - Renders studio-built modules in an isolated iframe.
 * 
 * This component takes a loaded studio module and renders it in a sandboxed
 * iframe environment with React 18 available globally.
 */
export function StudioModuleInjector({
  module,
  settings = {},
  onError,
  onLoad,
  className = "",
  minHeight = "200px",
}: StudioModuleInjectorProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use useMemo instead of useEffect + useState to avoid cascading renders
  const { html, error } = useMemo(() => {
    try {
      // Merge settings with module defaults
      const mergedSettings = { ...module.defaultSettings, ...settings };

      // Generate the module HTML
      const moduleHtml = generateModuleHtml(module, mergedSettings);
      return { html: moduleHtml, error: null };
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to render module");
      onError?.(err);
      return { html: "", error: err };
    }
  }, [module, settings, onError]);

  const handleIframeLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();

    // Auto-resize iframe based on content
    if (iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc?.body) {
          const height = iframeDoc.body.scrollHeight;
          if (height > 0) {
            iframeRef.current.style.height = `${height}px`;
          }
        }
      } catch {
        // Cross-origin restrictions may prevent this
      }
    }
  }, [onLoad]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm font-medium">
          Module failed to load
        </p>
        <p className="text-red-500 dark:text-red-500 text-xs mt-1">
          {error.message}
        </p>
      </div>
    );
  }

  if (!html) {
    return (
      <div
        className="animate-pulse bg-muted rounded-lg"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={`studio-module-container ${className}`}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{ minHeight, opacity: isLoaded ? 1 : 0.5 }}
        onLoad={handleIframeLoad}
        title={`Module: ${module.name}`}
      />
    </div>
  );
}

/**
 * Generate the full HTML document for the module iframe.
 */
function generateModuleHtml(
  module: LoadedStudioModule,
  settings: Record<string, unknown>
): string {
  const transpiled = transpileForBrowser(module.renderCode);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
    }
    #module-root { padding: 16px; }
    ${module.styles || ""}
  </style>
</head>
<body>
  <div id="module-root"></div>
  <script>
    // Inject module context as globals
    window.MODULE_SETTINGS = ${JSON.stringify(settings)};
    window.MODULE_ID = "${module.id}";
    window.MODULE_NAME = "${module.name}";
    window.MODULE_SLUG = "${module.slug}";
    window.MODULE_VERSION = "${module.version}";
  </script>
  <script type="text/javascript">
    (function() {
      'use strict';
      
      // Provide a fake exports object for modules that use CommonJS
      var exports = {};
      var module = { exports: exports };
      
      try {
        ${transpiled}
        
        // Try to find the component
        var Component = null;
        
        // Check common export patterns
        if (typeof ModuleComponent !== 'undefined') {
          Component = ModuleComponent;
        } else if (typeof exports.default !== 'undefined') {
          Component = exports.default;
        } else if (typeof exports.ModuleComponent !== 'undefined') {
          Component = exports.ModuleComponent;
        } else if (module.exports && typeof module.exports === 'function') {
          Component = module.exports;
        } else if (module.exports && typeof module.exports.default === 'function') {
          Component = module.exports.default;
        }
        
        // Mount the component
        if (Component) {
          var root = ReactDOM.createRoot(document.getElementById('module-root'));
          root.render(
            React.createElement(Component, { 
              settings: window.MODULE_SETTINGS,
              moduleId: window.MODULE_ID,
              moduleVersion: window.MODULE_VERSION
            })
          );
        } else {
          throw new Error('No component found. Export a component as default or named ModuleComponent.');
        }
      } catch (e) {
        console.error('[Module Error]', e);
        document.getElementById('module-root').innerHTML = 
          '<div style="padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">' +
          '<p style="color: #dc2626; font-weight: 500; margin: 0;">Module Error</p>' +
          '<p style="color: #ef4444; font-size: 12px; margin: 4px 0 0;">' + 
          (e.message || 'Unknown error') + '</p></div>';
      }
    })();
  </script>
</body>
</html>
`;
}

/**
 * Simple transpilation for browser compatibility.
 * Removes TypeScript syntax and converts ES6 modules to browser-compatible code.
 */
function transpileForBrowser(code: string): string {
  return (
    code
      // Remove TypeScript type annotations (basic patterns)
      .replace(/:\s*\w+(<[^>]+>)?(\[\])?\s*([,\)=;{])/g, "$3")
      // Remove interface declarations
      .replace(/interface\s+\w+\s*(<[^>]+>)?\s*\{[^}]*\}/g, "")
      // Remove type declarations
      .replace(/type\s+\w+\s*(<[^>]+>)?\s*=\s*[^;]+;/g, "")
      // Remove as type assertions (basic)
      .replace(/\s+as\s+\w+(<[^>]+>)?/g, "")
      // Remove import statements (we provide globals)
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, "")
      .replace(/import\s+['"][^'"]+['"];?\n?/g, "")
      // Convert export default to variable assignment
      .replace(/export\s+default\s+function\s+(\w+)/g, "var ModuleComponent = function $1")
      .replace(/export\s+default\s+/g, "var ModuleComponent = ")
      // Remove named exports
      .replace(/export\s+(const|let|var|function|class)/g, "$1")
      // Remove 'use client' and 'use server' directives
      .replace(/['"]use\s+(client|server)['"];?\n?/g, "")
  );
}

// ============================================================
// Additional Components
// ============================================================

interface ModuleLoadingStateProps {
  minHeight?: string;
}

/**
 * Loading state component for modules
 */
export function ModuleLoadingState({ minHeight = "200px" }: ModuleLoadingStateProps) {
  return (
    <div
      className="animate-pulse bg-muted rounded-lg flex items-center justify-center"
      style={{ minHeight }}
    >
      <div className="text-muted-foreground text-sm">Loading module...</div>
    </div>
  );
}

interface ModuleErrorStateProps {
  error: string;
  moduleName?: string;
  onRetry?: () => void;
}

/**
 * Error state component for modules
 */
export function ModuleErrorState({ error, moduleName, onRetry }: ModuleErrorStateProps) {
  return (
    <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
      <p className="text-red-600 dark:text-red-400 text-sm font-medium">
        {moduleName ? `${moduleName} failed to load` : "Module failed to load"}
      </p>
      <p className="text-red-500 dark:text-red-500 text-xs mt-1">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
