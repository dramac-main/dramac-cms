'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import type { LoadedStudioModule } from '@/lib/modules/studio-module-loader'

interface ModuleEmbedRendererProps {
  module: LoadedStudioModule
  settings?: Record<string, unknown>
  siteId: string
  theme?: 'light' | 'dark' | 'auto'
  siteFontFamily?: string
  onError?: (error: Error) => void
  onLoad?: () => void
}

/**
 * ModuleEmbedRenderer - Renders modules in an embedded context.
 * 
 * Optimized for external embedding with proper isolation and
 * PostMessage communication support.
 */
export function ModuleEmbedRenderer({
  module,
  settings = {},
  siteId,
  theme: _theme = 'auto',
  siteFontFamily,
  onError,
  onLoad,
}: ModuleEmbedRendererProps) {
  const [currentSettings, setCurrentSettings] = useState(settings)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasRendered = useRef(false)

  // Listen for settings updates from parent
  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setCurrentSettings(prev => ({ ...prev, ...customEvent.detail }))
    }

    window.addEventListener('dramac:settings', handleSettingsUpdate)
    return () => {
      window.removeEventListener('dramac:settings', handleSettingsUpdate)
    }
  }, [])

  // Merge settings with module defaults
  const mergedSettings = useMemo(() => {
    return { ...module.defaultSettings, ...currentSettings }
  }, [module.defaultSettings, currentSettings])

  // Generate the HTML content for the module
  const { html, error } = useMemo(() => {
    try {
      const transpiled = transpileForBrowser(module.renderCode)
      const moduleHtml = generateModuleHtml(module, mergedSettings, siteId, transpiled, siteFontFamily)
      return { html: moduleHtml, error: null }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to render module')
      return { html: '', error: err }
    }
  }, [module, mergedSettings, siteId, siteFontFamily])

  // Call onError/onLoad callbacks
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
    if (!error && html && !hasRendered.current) {
      hasRendered.current = true
      onLoad?.()
    }
  }, [error, html, onError, onLoad])

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgb(254,242,242)',
        border: '1px solid rgb(254,202,202)',
        borderRadius: '8px'
      }}>
        <p style={{ color: 'rgb(220,38,38)', fontWeight: 500, margin: 0 }}>
          Module failed to load
        </p>
        <p style={{ color: 'rgb(239,68,68)', fontSize: '12px', marginTop: '4px' }}>
          {error.message}
        </p>
      </div>
    )
  }

  if (!html) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: 'rgb(113,113,122)'
      }}>
        Loading module...
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width: '100%', minHeight: '100px' }}>
      <iframe
        srcDoc={html}
        style={{
          width: '100%',
          minHeight: '200px',
          border: 'none',
          background: 'transparent'
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title={`Module: ${module.name}`}
        onLoad={() => {
          if (!hasRendered.current) {
            hasRendered.current = true
            onLoad?.()
          }
        }}
      />
    </div>
  )
}

/**
 * Generate the full HTML document for the module iframe.
 */
function generateModuleHtml(
  module: LoadedStudioModule,
  settings: Record<string, unknown>,
  siteId: string,
  transpiledCode: string,
  siteFontFamily?: string
): string {
  const fontStack = siteFontFamily || "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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
      font-family: ${fontStack};
      line-height: 1.5;
    }
    #module-root { padding: 16px; }
    ${module.styles || ''}
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
    window.SITE_ID = "${siteId}";
  </script>
  <script type="text/javascript">
    (function() {
      'use strict';
      
      // Provide a fake exports object for modules that use CommonJS
      var exports = {};
      var module = { exports: exports };
      
      try {
        ${transpiledCode}
        
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
              moduleVersion: window.MODULE_VERSION,
              siteId: window.SITE_ID
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
        
        // Notify parent of error
        if (window.DRAMAC && window.DRAMAC.sendEvent) {
          window.DRAMAC.sendEvent('error', { message: e.message });
        }
      }
    })();
  </script>
</body>
</html>
`
}

/**
 * Simple transpilation for browser compatibility.
 * Removes TypeScript syntax and converts ES6 modules to browser-compatible code.
 */
function transpileForBrowser(code: string): string {
  return (
    code
      // Remove TypeScript type annotations (basic patterns)
      .replace(/:\s*\w+(<[^>]+>)?(\[\])?\s*([,\)=;{])/g, '$3')
      // Remove interface declarations
      .replace(/interface\s+\w+\s*(<[^>]+>)?\s*\{[^}]*\}/g, '')
      // Remove type declarations
      .replace(/type\s+\w+\s*(<[^>]+>)?\s*=\s*[^;]+;/g, '')
      // Remove as type assertions (basic)
      .replace(/\s+as\s+\w+(<[^>]+>)?/g, '')
      // Remove import statements (we provide globals)
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
      .replace(/import\s+['"][^'"]+['"];?\n?/g, '')
      // Convert export default to variable assignment
      .replace(/export\s+default\s+function\s+(\w+)/g, 'var ModuleComponent = function $1')
      .replace(/export\s+default\s+/g, 'var ModuleComponent = ')
      // Remove named exports
      .replace(/export\s+(const|let|var|function|class)/g, '$1')
      // Remove 'use client' and 'use server' directives
      .replace(/['"]use\s+(client|server)['"];?\n?/g, '')
  )
}

// Type declaration for window extensions
declare global {
  interface Window {
    React?: typeof import('react')
    ReactDOM?: typeof import('react-dom')
    MODULE_SETTINGS?: Record<string, unknown>
    MODULE_ID?: string
    MODULE_NAME?: string
    MODULE_SLUG?: string
    MODULE_VERSION?: string
    SITE_ID?: string
    DRAMAC?: {
      sendEvent: (eventName: string, payload: unknown) => void
    }
  }
}
