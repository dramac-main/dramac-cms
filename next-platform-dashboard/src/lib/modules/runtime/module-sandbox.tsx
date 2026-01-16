"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import type { ModuleManifest, ModulePermission } from "../types";

// =============================================================
// TYPES
// =============================================================

export interface SandboxedModule {
  id: string;
  name: string;
  slug: string;
  packageUrl: string;
  manifest: ModuleManifest;
}

export interface ModuleSandboxContext {
  agencyId?: string;
  clientId?: string;
  siteId?: string;
  pageId?: string;
  userId?: string;
}

export interface ModuleSandboxProps {
  module: SandboxedModule;
  settings: Record<string, unknown>;
  context: ModuleSandboxContext;
  permissions: ModulePermission[];
  height?: number | "auto";
  className?: string;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  onMessage?: (type: string, payload: unknown) => void;
}

// Message types for iframe communication
type MessageType =
  | "MODULE_READY"
  | "MODULE_ERROR"
  | "API_REQUEST"
  | "API_RESPONSE"
  | "API_DENIED"
  | "SETTINGS_UPDATE"
  | "SETTINGS_SAVED"
  | "INIT"
  | "RESIZE"
  | "ANALYTICS_EVENT";

interface ModuleMessage {
  type: MessageType;
  payload: unknown;
  moduleId: string;
  requestId?: string;
}

// =============================================================
// SANDBOX COMPONENT
// =============================================================

function ModuleSandboxComponent({
  module,
  settings,
  context,
  permissions,
  height = "auto",
  className = "",
  onError,
  onLoad,
  onMessage,
}: ModuleSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [iframeHeight, setIframeHeight] = useState<number>(height === "auto" ? 200 : height);

  // Send message to the sandboxed module
  const sendToModule = useCallback(
    (type: MessageType, payload: unknown, requestId?: string) => {
      if (!iframeRef.current?.contentWindow) return;

      const message: ModuleMessage = {
        type,
        payload,
        moduleId: module.id,
        requestId,
      };

      // Get the origin from the package URL
      try {
        const url = new URL(module.packageUrl);
        iframeRef.current.contentWindow.postMessage(message, url.origin);
      } catch {
        // If URL is invalid, try with wildcard (less secure, but works for development)
        iframeRef.current.contentWindow.postMessage(message, "*");
      }
    },
    [module.id, module.packageUrl]
  );

  // Handle API requests from the module
  const handleApiRequest = useCallback(
    async (
      payload: {
        requestId: string;
        endpoint: string;
        method: string;
        data?: unknown;
        permission: ModulePermission;
      },
      moduleId: string
    ) => {
      try {
        // Proxy the request through our API
        const response = await fetch(`/api/modules/${moduleId}/proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: payload.endpoint,
            method: payload.method,
            data: payload.data,
            permission: payload.permission,
          }),
        });

        const result = await response.json();

        sendToModule(
          "API_RESPONSE",
          {
            requestId: payload.requestId,
            success: response.ok,
            data: result.data,
            error: result.error,
          },
          payload.requestId
        );
      } catch (error) {
        sendToModule(
          "API_RESPONSE",
          {
            requestId: payload.requestId,
            success: false,
            error: error instanceof Error ? error.message : "Request failed",
          },
          payload.requestId
        );
      }
    },
    [sendToModule]
  );

  // Handle settings update from the module
  const handleSettingsUpdate = useCallback(
    async (payload: { settings: Record<string, unknown>; requestId?: string }) => {
      try {
        const response = await fetch(`/api/modules/${module.id}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: payload.settings,
            context,
          }),
        });

        const result = await response.json();

        sendToModule("SETTINGS_SAVED", {
          success: response.ok,
          error: result.error,
        });
      } catch (error) {
        sendToModule("SETTINGS_SAVED", {
          success: false,
          error: error instanceof Error ? error.message : "Failed to save settings",
        });
      }
    },
    [module.id, context, sendToModule]
  );

  // Handle messages from the sandboxed module
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin
      if (!isValidModuleOrigin(event.origin, module.packageUrl)) {
        return;
      }

      const data = event.data as ModuleMessage;

      // Verify this message is from our module
      if (data.moduleId !== module.id) return;

      switch (data.type) {
        case "MODULE_READY":
          setIsLoaded(true);
          setHasError(false);
          onLoad?.();
          break;

        case "MODULE_ERROR":
          setHasError(true);
          const errorMsg = (data.payload as { message?: string })?.message || "Module error";
          setErrorMessage(errorMsg);
          onError?.(new Error(errorMsg));
          break;

        case "API_REQUEST": {
          const apiPayload = data.payload as {
            requestId: string;
            endpoint: string;
            method: string;
            data?: unknown;
            permission: ModulePermission;
          };

          // Check if module has permission
          if (permissions.includes(apiPayload.permission)) {
            handleApiRequest(apiPayload, module.id);
          } else {
            sendToModule("API_DENIED", {
              requestId: apiPayload.requestId,
              reason: `Missing permission: ${apiPayload.permission}`,
            });
          }
          break;
        }

        case "SETTINGS_UPDATE":
          handleSettingsUpdate(data.payload as { settings: Record<string, unknown> });
          break;

        case "RESIZE": {
          const resizePayload = data.payload as { height?: number };
          if (height === "auto" && resizePayload.height) {
            setIframeHeight(Math.max(100, Math.min(2000, resizePayload.height)));
          }
          break;
        }

        case "ANALYTICS_EVENT": {
          // Track module analytics
          const analyticsPayload = data.payload as {
            eventType: string;
            eventName: string;
            metadata?: Record<string, unknown>;
          };

          fetch("/api/modules/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleId: module.id,
              ...analyticsPayload,
              context,
            }),
          }).catch(console.error);
          break;
        }

        default:
          // Forward unknown messages to parent handler
          onMessage?.(data.type, data.payload);
      }
    },
    [
      module.id,
      module.packageUrl,
      permissions,
      height,
      context,
      onLoad,
      onError,
      onMessage,
      handleApiRequest,
      handleSettingsUpdate,
      sendToModule,
    ]
  );

  // Set up message listener
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Send initial context to module once iframe loads
  useEffect(() => {
    if (isLoaded && iframeRef.current) {
      sendToModule("INIT", {
        moduleId: module.id,
        moduleSlug: module.slug,
        settings,
        context,
        permissions,
        manifest: module.manifest,
      });
    }
  }, [isLoaded, module, settings, context, permissions, sendToModule]);

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    setHasError(true);
    setErrorMessage(`Failed to load module: ${module.slug}`);
    onError?.(new Error(`Failed to load module: ${module.slug}`));
  }, [module.slug, onError]);

  // Retry loading
  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage("");
    setIsLoaded(false);
    
    // Force iframe reload
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
        }
      }, 100);
    }
  }, []);

  // Error state
  if (hasError) {
    return (
      <div className={`module-sandbox-error p-4 bg-destructive/10 border border-destructive rounded-lg ${className}`}>
        <p className="text-sm text-destructive">
          Module &quot;{module.slug}&quot; failed to load.
          {errorMessage && <span className="block mt-1 text-xs opacity-80">{errorMessage}</span>}
        </p>
        <button
          onClick={handleRetry}
          className="mt-2 text-sm text-destructive underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`module-sandbox relative ${className}`} data-module-id={module.id}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-xs text-muted-foreground">Loading {module.name}...</span>
          </div>
        </div>
      )}

      {/* Sandboxed iframe */}
      <iframe
        ref={iframeRef}
        src={module.packageUrl}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        className="w-full border-0 rounded-lg"
        style={{
          minHeight: 100,
          height: height === "auto" ? iframeHeight : height,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
        title={`Module: ${module.slug}`}
        onError={handleIframeError}
        loading="lazy"
      />
    </div>
  );
}

// =============================================================
// UTILITIES
// =============================================================

/**
 * Validate that a message origin matches the module's package URL
 */
function isValidModuleOrigin(origin: string, packageUrl: string): boolean {
  // Development mode - allow localhost
  if (process.env.NODE_ENV === "development") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }

  // Check against allowed module CDN origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_MODULE_CDN_URL,
    "https://modules.dramac.app",
    "https://cdn.dramac.app",
  ].filter(Boolean);

  // Check if origin matches any allowed origin
  for (const allowed of allowedOrigins) {
    if (allowed && origin.startsWith(allowed)) {
      return true;
    }
  }

  // Check if origin matches the package URL
  try {
    const packageOrigin = new URL(packageUrl).origin;
    return origin === packageOrigin;
  } catch {
    return false;
  }
}

// Export memoized component to prevent unnecessary re-renders
export const ModuleSandbox = memo(ModuleSandboxComponent);

// =============================================================
// MODULE SDK (for module developers)
// =============================================================

/**
 * SDK interface that modules can use to communicate with the platform
 * This would be published as @dramac/module-sdk npm package
 */
export interface ModuleSDK {
  // Initialization
  onReady: (callback: () => void) => void;
  
  // Settings
  getSettings: () => Record<string, unknown>;
  updateSettings: (settings: Record<string, unknown>) => Promise<void>;
  
  // API requests
  apiRequest: <T = unknown>(
    endpoint: string,
    options?: {
      method?: string;
      data?: unknown;
      permission?: ModulePermission;
    }
  ) => Promise<T>;
  
  // Context
  getContext: () => ModuleSandboxContext;
  
  // UI
  resize: (height: number) => void;
  
  // Analytics
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
  
  // Error reporting
  reportError: (error: Error) => void;
}

/**
 * Example SDK implementation (for documentation purposes)
 * Actual SDK would be in a separate @dramac/module-sdk package
 */
export const createModuleSDKExample = (): string => `
// @dramac/module-sdk
class DramacModuleSDK {
  private moduleId: string;
  private settings: Record<string, unknown> = {};
  private context: ModuleSandboxContext = {};
  private onReadyCallbacks: (() => void)[] = [];
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

  constructor() {
    this.moduleId = '';
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    const { type, payload, moduleId, requestId } = event.data;
    
    if (type === 'INIT') {
      this.moduleId = payload.moduleId;
      this.settings = payload.settings;
      this.context = payload.context;
      this.onReadyCallbacks.forEach(cb => cb());
      this.sendMessage('MODULE_READY', {});
    }
    
    if (type === 'API_RESPONSE' && requestId) {
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        if (payload.success) {
          pending.resolve(payload.data);
        } else {
          pending.reject(new Error(payload.error));
        }
        this.pendingRequests.delete(requestId);
      }
    }
  }

  private sendMessage(type: string, payload: unknown, requestId?: string) {
    window.parent.postMessage({ type, payload, moduleId: this.moduleId, requestId }, '*');
  }

  onReady(callback: () => void) {
    this.onReadyCallbacks.push(callback);
  }

  getSettings() {
    return this.settings;
  }

  async updateSettings(settings: Record<string, unknown>) {
    this.sendMessage('SETTINGS_UPDATE', { settings });
  }

  async apiRequest(endpoint: string, options = {}) {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.sendMessage('API_REQUEST', { ...options, endpoint, requestId });
    });
  }

  getContext() {
    return this.context;
  }

  resize(height: number) {
    this.sendMessage('RESIZE', { height });
  }

  trackEvent(eventName: string, metadata?: Record<string, unknown>) {
    this.sendMessage('ANALYTICS_EVENT', { eventType: 'action', eventName, metadata });
  }

  reportError(error: Error) {
    this.sendMessage('MODULE_ERROR', { message: error.message, stack: error.stack });
  }
}

export const dramac = new DramacModuleSDK();
`;
