/**
 * Module Runtime V2
 * 
 * Advanced runtime for executing modules with full React 19 support,
 * state management, lifecycle hooks, and platform bridge integration.
 * 
 * @module module-runtime-v2
 */

import { generateImportMap, type ModuleDependency } from "./module-dependencies";
import { 
  createBridgeMessage, 
  type BridgeMessage, 
  type BridgeMessageType, 
  type ModuleContext 
} from "./module-bridge";

// ============================================================================
// Types
// ============================================================================

export interface ModuleRuntimeConfig {
  moduleId: string;
  moduleSourceId: string;
  siteId: string;
  clientId?: string;
  agencyId?: string;
  userId?: string;
  settings: Record<string, unknown>;
  permissions: string[];
  environment: "development" | "staging" | "production";
  renderMode: "iframe" | "inline" | "modal" | "drawer";
}

export interface ModuleManifest {
  version: string;
  name: string;
  description?: string;
  entryPoint: string;
  mainComponent: string;
  permissions: string[];
  dependencies: ModuleDependency[];
  renderMode: "iframe" | "inline" | "modal" | "drawer";
  defaultWidth?: string;
  defaultHeight?: string;
  resizable: boolean;
  supportsDarkMode: boolean;
  supportsMobile: boolean;
  supportsOffline: boolean;
}

export interface ModuleFile {
  id: string;
  path: string;
  type: "typescript" | "javascript" | "css" | "json" | "markdown" | "image" | "svg" | "html";
  content: string;
  isEntryPoint: boolean;
}

export interface CompiledModule {
  html: string;
  javascript: string;
  css: string;
  importMap: Record<string, string>;
  manifest: ModuleManifest;
}

export interface RuntimeMessage {
  type: RuntimeMessageType;
  payload: unknown;
  moduleId: string;
  requestId?: string;
  timestamp: number;
}

export type RuntimeMessageType =
  | "MODULE_READY"
  | "MODULE_ERROR"
  | "MODULE_RESIZE"
  | "MODULE_CLOSE"
  | "BRIDGE_REQUEST"
  | "BRIDGE_RESPONSE"
  | "SETTINGS_CHANGED"
  | "THEME_CHANGED"
  | "HEARTBEAT"
  | "HEARTBEAT_ACK";

// ============================================================================
// Module Compiler
// ============================================================================

/**
 * Compile module files into executable code
 */
export async function compileModule(
  moduleSourceId: string,
  files: ModuleFile[],
  manifest: Partial<ModuleManifest>
): Promise<CompiledModule> {
  // Generate import map for dependencies
  const importMap = await generateImportMap(moduleSourceId);

  // Find entry point file
  const entryFile = files.find(f => f.isEntryPoint) || 
    files.find(f => f.path === "src/index.tsx") ||
    files.find(f => f.path === "src/index.ts") ||
    files.find(f => f.path.endsWith(".tsx")) ||
    files[0];

  if (!entryFile) {
    throw new Error("No entry point found in module files");
  }

  // Collect all TypeScript/JavaScript files
  const codeFiles = files.filter(f => 
    f.type === "typescript" || f.type === "javascript"
  );

  // Collect all CSS files
  const cssFiles = files.filter(f => f.type === "css");

  // Transpile TypeScript to JavaScript (simplified)
  const compiledCode = transpileModuleCode(codeFiles, entryFile.path);

  // Combine CSS
  const combinedCss = cssFiles.map(f => f.content).join("\n\n");

  // Generate HTML wrapper
  const html = generateModuleHtml(
    compiledCode,
    combinedCss,
    importMap,
    manifest
  );

  return {
    html,
    javascript: compiledCode,
    css: combinedCss,
    importMap,
    manifest: {
      version: manifest.version || "1.0.0",
      name: manifest.name || "Unnamed Module",
      description: manifest.description,
      entryPoint: entryFile.path,
      mainComponent: manifest.mainComponent || "default",
      permissions: manifest.permissions || [],
      dependencies: [],
      renderMode: manifest.renderMode || "iframe",
      defaultWidth: manifest.defaultWidth,
      defaultHeight: manifest.defaultHeight,
      resizable: manifest.resizable ?? true,
      supportsDarkMode: manifest.supportsDarkMode ?? true,
      supportsMobile: manifest.supportsMobile ?? true,
      supportsOffline: manifest.supportsOffline ?? false,
    },
  };
}

/**
 * Simple TypeScript to JavaScript transpilation
 * In production, use a proper bundler like esbuild
 */
function transpileModuleCode(files: ModuleFile[], entryPath: string): string {
  // For now, just remove TypeScript annotations
  // In production, use esbuild or swc
  
  let code = "";
  
  for (const file of files) {
    let content = file.content;
    
    // Remove TypeScript-specific syntax (simplified)
    content = content
      // Remove type annotations
      .replace(/: \w+(\[\])?(\s*[,\)=])/g, "$2")
      // Remove interface declarations
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
      // Remove type declarations
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
      // Remove generic type parameters
      .replace(/<[^>]+>/g, "")
      // Remove 'as' type assertions
      .replace(/\s+as\s+\w+/g, "");
    
    code += `// File: ${file.path}\n${content}\n\n`;
  }
  
  return code;
}

/**
 * Generate HTML wrapper for module
 */
function generateModuleHtml(
  javascript: string,
  css: string,
  importMap: Record<string, string>,
  manifest: Partial<ModuleManifest>
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manifest.name || "Module"}</title>
  
  <!-- Import Map for Dependencies -->
  <script type="importmap">
${JSON.stringify({ imports: importMap }, null, 2)}
  </script>
  
  <!-- Module Styles -->
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: system-ui, sans-serif; }
    #root { height: 100%; }
    
    /* Custom Module Styles */
    ${css}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- Module Bridge -->
  <script>
    window.__MODULE_BRIDGE__ = {
      moduleId: null,
      requestHandlers: new Map(),
      
      init(moduleId) {
        this.moduleId = moduleId;
        window.addEventListener("message", this.handleMessage.bind(this));
        this.sendToParent("MODULE_READY", { moduleId });
      },
      
      sendToParent(type, payload, requestId) {
        window.parent.postMessage({
          type,
          payload,
          moduleId: this.moduleId,
          requestId: requestId || this.generateRequestId(),
          timestamp: Date.now(),
        }, "*");
      },
      
      handleMessage(event) {
        const { type, payload, requestId } = event.data || {};
        if (type === "BRIDGE_RESPONSE" && requestId) {
          const handler = this.requestHandlers.get(requestId);
          if (handler) {
            handler(payload);
            this.requestHandlers.delete(requestId);
          }
        }
        if (type === "SETTINGS_CHANGED") {
          window.dispatchEvent(new CustomEvent("module:settings", { detail: payload }));
        }
        if (type === "THEME_CHANGED") {
          document.documentElement.setAttribute("data-theme", payload.theme);
        }
        if (type === "HEARTBEAT") {
          this.sendToParent("HEARTBEAT_ACK", { timestamp: Date.now() });
        }
      },
      
      request(type, payload) {
        return new Promise((resolve, reject) => {
          const requestId = this.generateRequestId();
          const timeout = setTimeout(() => {
            this.requestHandlers.delete(requestId);
            reject(new Error("Request timeout"));
          }, 30000);
          
          this.requestHandlers.set(requestId, (response) => {
            clearTimeout(timeout);
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || "Request failed"));
            }
          });
          
          this.sendToParent("BRIDGE_REQUEST", { bridgeType: type, ...payload }, requestId);
        });
      },
      
      generateRequestId() {
        return "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
      },
      
      // Convenience methods
      async api(endpoint, options = {}) {
        return this.request("API_REQUEST", { endpoint, ...options });
      },
      
      async getData(dataKey) {
        return this.request("DB_QUERY", { dataKey });
      },
      
      async setData(dataKey, value) {
        return this.request("DB_UPSERT", { dataKey, value });
      },
      
      async getSettings() {
        return this.request("SETTINGS_GET", {});
      },
      
      async setSettings(settings) {
        return this.request("SETTINGS_SET", { settings });
      },
      
      async uploadFile(path, file) {
        return this.request("STORAGE_UPLOAD", { path, file });
      },
      
      async emit(eventName, data) {
        return this.request("EVENT_EMIT", { eventName, data });
      },
    };
  </script>
  
  <!-- Module Code -->
  <script type="module">
    import React from "react";
    import { createRoot } from "react-dom/client";
    
    // Module Context
    const ModuleContext = React.createContext(null);
    
    export function useModule() {
      const context = React.useContext(ModuleContext);
      if (!context) throw new Error("useModule must be used within ModuleProvider");
      return context;
    }
    
    export function useModuleSettings() {
      const { settings, setSettings } = useModule();
      return [settings, setSettings];
    }
    
    export function useModuleData(key) {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      
      React.useEffect(() => {
        window.__MODULE_BRIDGE__.getData(key)
          .then(result => {
            setData(result?.records?.[0]?.data_value);
            setLoading(false);
          })
          .catch(err => {
            setError(err);
            setLoading(false);
          });
      }, [key]);
      
      const update = React.useCallback(async (value) => {
        await window.__MODULE_BRIDGE__.setData(key, value);
        setData(value);
      }, [key]);
      
      return { data, loading, error, update };
    }
    
    // Module Provider Component
    function ModuleProvider({ children, moduleId, initialSettings }) {
      const [settings, setSettingsState] = React.useState(initialSettings || {});
      
      const setSettings = React.useCallback(async (newSettings) => {
        await window.__MODULE_BRIDGE__.setSettings(newSettings);
        setSettingsState(newSettings);
      }, []);
      
      // Listen for external settings changes
      React.useEffect(() => {
        const handler = (event) => {
          setSettingsState(event.detail.settings);
        };
        window.addEventListener("module:settings", handler);
        return () => window.removeEventListener("module:settings", handler);
      }, []);
      
      const value = React.useMemo(() => ({
        moduleId,
        settings,
        setSettings,
        bridge: window.__MODULE_BRIDGE__,
      }), [moduleId, settings, setSettings]);
      
      return React.createElement(ModuleContext.Provider, { value }, children);
    }
    
    // User's Module Code
    ${javascript}
    
    // Mount Module
    const root = createRoot(document.getElementById("root"));
    const moduleId = new URLSearchParams(window.location.search).get("moduleId") || "unknown";
    const settings = JSON.parse(new URLSearchParams(window.location.search).get("settings") || "{}");
    
    window.__MODULE_BRIDGE__.init(moduleId);
    
    // Look for default export or Module export
    const ModuleComponent = typeof Module !== "undefined" ? Module : 
                           typeof Default !== "undefined" ? Default :
                           typeof App !== "undefined" ? App : 
                           () => React.createElement("div", null, "No module component found");
    
    root.render(
      React.createElement(ModuleProvider, { moduleId, initialSettings: settings },
        React.createElement(ModuleComponent)
      )
    );
  </script>
</body>
</html>`;
}

// ============================================================================
// Runtime Host (Parent Window)
// ============================================================================

export interface ModuleHostConfig {
  containerElement: HTMLElement;
  moduleId: string;
  moduleSourceId: string;
  compiledModule: CompiledModule;
  config: ModuleRuntimeConfig;
  onMessage?: (message: RuntimeMessage) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

/**
 * Create a module host that manages the iframe
 */
export function createModuleHost(hostConfig: ModuleHostConfig) {
  let iframe: HTMLIFrameElement | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let lastHeartbeat = Date.now();
  const pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();

  function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  function handleMessage(event: MessageEvent) {
    if (!iframe || event.source !== iframe.contentWindow) return;

    const message = event.data as RuntimeMessage;
    if (!message || message.moduleId !== hostConfig.moduleId) return;

    hostConfig.onMessage?.(message);

    switch (message.type) {
      case "MODULE_READY":
        hostConfig.onReady?.();
        startHeartbeat();
        break;

      case "MODULE_ERROR":
        hostConfig.onError?.(new Error(message.payload as string));
        break;

      case "MODULE_RESIZE":
        handleResize(message.payload as { width: number; height: number });
        break;

      case "BRIDGE_REQUEST":
        handleBridgeRequest(message);
        break;

      case "HEARTBEAT_ACK":
        lastHeartbeat = Date.now();
        break;
    }
  }

  async function handleBridgeRequest(message: RuntimeMessage) {
    const { bridgeType, ...payload } = message.payload as { bridgeType: BridgeMessageType } & Record<string, unknown>;
    
    try {
      // Forward to server-side bridge
      const response = await fetch("/api/modules/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: bridgeType,
          moduleId: hostConfig.moduleId,
          requestId: message.requestId,
          payload,
          context: {
            moduleId: hostConfig.moduleId,
            siteId: hostConfig.config.siteId,
            clientId: hostConfig.config.clientId,
            agencyId: hostConfig.config.agencyId,
            userId: hostConfig.config.userId,
            settings: hostConfig.config.settings,
            permissions: hostConfig.config.permissions,
            environment: hostConfig.config.environment,
          },
        }),
      });

      const result = await response.json();
      
      sendToModule("BRIDGE_RESPONSE", result.payload, message.requestId);
    } catch (error) {
      sendToModule("BRIDGE_RESPONSE", {
        success: false,
        error: error instanceof Error ? error.message : "Bridge request failed",
      }, message.requestId);
    }
  }

  function handleResize(size: { width: number; height: number }) {
    if (!iframe || !hostConfig.compiledModule.manifest.resizable) return;
    
    if (size.width) iframe.style.width = `${size.width}px`;
    if (size.height) iframe.style.height = `${size.height}px`;
  }

  function sendToModule(type: RuntimeMessageType, payload: unknown, requestId?: string) {
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage({
      type,
      payload,
      moduleId: hostConfig.moduleId,
      requestId: requestId || generateRequestId(),
      timestamp: Date.now(),
    }, "*");
  }

  function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
      // Check if module is responding
      if (Date.now() - lastHeartbeat > 60000) {
        hostConfig.onError?.(new Error("Module heartbeat timeout"));
        return;
      }
      
      sendToModule("HEARTBEAT", { timestamp: Date.now() });
    }, 15000);
  }

  function mount() {
    // Create iframe
    iframe = document.createElement("iframe");
    iframe.style.border = "none";
    iframe.style.width = hostConfig.compiledModule.manifest.defaultWidth || "100%";
    iframe.style.height = hostConfig.compiledModule.manifest.defaultHeight || "100%";
    iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-forms", "allow-popups");

    // Create blob URL for HTML
    const blob = new Blob([hostConfig.compiledModule.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Add query params for module context
    const params = new URLSearchParams({
      moduleId: hostConfig.moduleId,
      settings: JSON.stringify(hostConfig.config.settings),
    });

    iframe.src = `${url}?${params.toString()}`;

    // Listen for messages
    window.addEventListener("message", handleMessage);

    // Mount iframe
    hostConfig.containerElement.appendChild(iframe);

    // Clean up blob URL after load
    iframe.onload = () => {
      URL.revokeObjectURL(url);
    };
  }

  function unmount() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    window.removeEventListener("message", handleMessage);

    // Resolve any pending requests with error
    for (const [, request] of pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error("Module unmounted"));
    }
    pendingRequests.clear();

    if (iframe) {
      iframe.remove();
      iframe = null;
    }
  }

  function updateSettings(settings: Record<string, unknown>) {
    hostConfig.config.settings = settings;
    sendToModule("SETTINGS_CHANGED", { settings });
  }

  function updateTheme(theme: "light" | "dark" | "system") {
    sendToModule("THEME_CHANGED", { theme });
  }

  return {
    mount,
    unmount,
    sendToModule,
    updateSettings,
    updateTheme,
    get iframe() { return iframe; },
  };
}

// ============================================================================
// Module Context Helpers
// ============================================================================

/**
 * Create module context for server-side operations
 */
export function createModuleContext(config: ModuleRuntimeConfig): ModuleContext {
  return {
    moduleId: config.moduleId,
    siteId: config.siteId,
    clientId: config.clientId,
    agencyId: config.agencyId,
    userId: config.userId,
    settings: config.settings,
    permissions: config.permissions,
    environment: config.environment,
  };
}

/**
 * Validate module permissions
 */
export function validatePermissions(
  required: string[],
  granted: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter(perm => !granted.includes(perm));
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize module settings for transmission
 */
export function sanitizeSettings(
  settings: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(settings)) {
    // Only pass serializable values
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      Array.isArray(value) ||
      (typeof value === "object" && value !== null)
    ) {
      try {
        // Ensure it's JSON serializable
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        // Skip non-serializable values
      }
    }
  }
  
  return sanitized;
}
