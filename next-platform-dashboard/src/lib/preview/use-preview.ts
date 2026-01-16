"use client";

import { useState, useCallback, useMemo } from "react";
import type { DeviceType } from "./preview-utils";
import { getPreviewUrl } from "./preview-utils";

interface UsePreviewOptions {
  siteId: string;
  pageId: string;
}

interface UsePreviewReturn {
  /** Whether the editor is in preview mode (showing iframe instead of editor) */
  isPreviewMode: boolean;
  /** Set preview mode state */
  setIsPreviewMode: (value: boolean) => void;
  /** Toggle preview mode on/off */
  togglePreviewMode: () => void;
  /** Current device type for responsive preview */
  device: DeviceType;
  /** Set device type */
  setDevice: (device: DeviceType) => void;
  /** Whether the side-by-side preview panel is visible */
  showPreviewPanel: boolean;
  /** Set preview panel visibility */
  setShowPreviewPanel: (value: boolean) => void;
  /** Toggle preview panel visibility */
  togglePreviewPanel: () => void;
  /** Generated preview URL */
  previewUrl: string;
  /** Key for forcing iframe refresh */
  previewKey: number;
  /** Force refresh the preview iframe */
  refreshPreview: () => void;
  /** Open preview in a new browser window */
  openInNewWindow: () => void;
}

/**
 * Hook for managing preview state in the visual editor
 * Provides controls for device switching, preview modes, and panel visibility
 */
export function usePreview({ siteId, pageId }: UsePreviewOptions): UsePreviewReturn {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const previewUrl = useMemo(
    () => getPreviewUrl(siteId, pageId),
    [siteId, pageId]
  );

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const togglePreviewPanel = useCallback(() => {
    setShowPreviewPanel((prev) => !prev);
  }, []);

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const openInNewWindow = useCallback(() => {
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [previewUrl]);

  return {
    isPreviewMode,
    setIsPreviewMode,
    togglePreviewMode,
    device,
    setDevice,
    showPreviewPanel,
    setShowPreviewPanel,
    togglePreviewPanel,
    previewUrl,
    previewKey,
    refreshPreview,
    openInNewWindow,
  };
}
