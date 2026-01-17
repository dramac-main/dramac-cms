"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AppIframeSandboxProps {
  moduleId: string;
  appUrl: string;
  clientId: string;
  agencyId?: string;
  siteId?: string;
  settings?: Record<string, unknown>;
  className?: string;
}

export function AppIframeSandbox({
  moduleId,
  appUrl,
  clientId,
  agencyId,
  siteId,
  settings,
  className,
}: AppIframeSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build URL with context parameters
  const buildUrl = useCallback(() => {
    try {
      const url = new URL(appUrl);
      url.searchParams.set("clientId", clientId);
      url.searchParams.set("moduleId", moduleId);
      url.searchParams.set("context", "portal");
      
      if (agencyId) {
        url.searchParams.set("agencyId", agencyId);
      }
      if (siteId) {
        url.searchParams.set("siteId", siteId);
      }
      
      // Add settings as URL params (limited to simple values)
      if (settings) {
        Object.entries(settings).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            url.searchParams.set(`s_${key}`, String(value));
          }
        });
      }
      
      return url.toString();
    } catch {
      // If URL parsing fails, return as-is with query params appended
      const separator = appUrl.includes("?") ? "&" : "?";
      return `${appUrl}${separator}clientId=${clientId}&moduleId=${moduleId}&context=portal`;
    }
  }, [appUrl, clientId, moduleId, agencyId, siteId, settings]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Try to validate origin (if we can parse the appUrl)
      try {
        const expectedOrigin = new URL(appUrl).origin;
        if (event.origin !== expectedOrigin) return;
      } catch {
        // If we can't parse, check for known internal origins
        const allowedOrigins = [window.location.origin];
        if (!allowedOrigins.includes(event.origin)) return;
      }

      const { type, payload } = event.data || {};

      switch (type) {
        case "module:ready":
          console.log("Module ready:", moduleId);
          break;
        case "module:resize":
          // Handle dynamic resize if needed
          if (typeof payload === "object" && payload !== null && "height" in payload) {
            // Could set iframe height dynamically
          }
          break;
        case "module:navigate":
          // Handle navigation requests from module
          if (typeof payload === "object" && payload !== null && "url" in payload) {
            window.location.href = payload.url as string;
          }
          break;
        case "module:error":
          console.error("Module error:", payload);
          setError(typeof payload === "string" ? payload : "Module encountered an error");
          break;
        case "module:close":
          // Handle close request - navigate back
          window.history.back();
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appUrl, moduleId]);

  // Send context to iframe when loaded
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
    
    // Send initial context to iframe
    if (iframeRef.current?.contentWindow) {
      try {
        const targetOrigin = new URL(appUrl).origin;
        iframeRef.current.contentWindow.postMessage({
          type: "portal:context",
          payload: {
            clientId,
            agencyId,
            siteId,
            moduleId,
            settings,
          },
        }, targetOrigin);
      } catch {
        // Fallback to wildcard (less secure, but works for relative URLs)
        iframeRef.current.contentWindow.postMessage({
          type: "portal:context",
          payload: {
            clientId,
            agencyId,
            siteId,
            moduleId,
            settings,
          },
        }, "*");
      }
    }
  }, [appUrl, clientId, agencyId, siteId, moduleId, settings]);

  const handleError = useCallback(() => {
    setError("Failed to load the app. Please try again later.");
    setIsLoaded(true);
  }, []);

  if (error) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-muted/50", className)}>
        <div className="text-center p-6">
          <p className="text-destructive font-medium mb-2">Failed to load app</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoaded(false);
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={buildUrl()}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full border-0 transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="clipboard-write; clipboard-read"
        title={`Module: ${moduleId}`}
      />
    </div>
  );
}
