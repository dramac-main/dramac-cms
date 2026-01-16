"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDeviceConfig, type DeviceType } from "@/lib/preview/preview-utils";

interface PreviewFrameProps {
  url: string;
  device: DeviceType;
  refreshKey?: number;
  className?: string;
  showDeviceFrame?: boolean;
}

/**
 * Preview frame component that displays a page in an iframe
 * with responsive device frames and loading/error states
 */
export function PreviewFrame({
  url,
  device,
  refreshKey = 0,
  className,
  showDeviceFrame = true,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const deviceConfig = getDeviceConfig(device);
  const isFullWidth = device === "full";

  // Create a unique key for the iframe that changes when url or refreshKey changes
  // This will cause the iframe to remount, triggering a new load
  const iframeKey = `${url}-${refreshKey}`;

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      // Force reload by reassigning src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "";
      iframeRef.current.src = currentSrc;
    }
  }, []);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-muted/30 overflow-hidden",
        className
      )}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-medium">Preview Failed to Load</h3>
              <p className="text-sm text-muted-foreground">
                There was an error loading the preview.
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Device frame wrapper */}
      <div
        className={cn(
          "relative bg-white shadow-lg overflow-hidden transition-all duration-300",
          showDeviceFrame && !isFullWidth && "border-8 border-gray-800 rounded-[2rem]",
          !showDeviceFrame && "rounded-lg border",
          isFullWidth && "rounded-lg border"
        )}
        style={{
          width: isFullWidth ? "100%" : deviceConfig.width,
          height: isFullWidth ? "100%" : deviceConfig.height,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        {/* Device notch for mobile (only when device frame is shown) */}
        {showDeviceFrame && device === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl z-20" />
        )}

        {/* Home indicator for mobile (only when device frame is shown) */}
        {showDeviceFrame && device === "mobile" && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full z-20" />
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={`${url}?t=${refreshKey}`}
          className={cn(
            "w-full h-full border-0 bg-white",
            showDeviceFrame && device === "mobile" && "pt-6 pb-4"
          )}
          onLoad={handleLoad}
          onError={handleError}
          title="Page Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}
