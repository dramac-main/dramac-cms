/**
 * Preview utility types and functions
 * Handles device configurations, URLs, and clipboard operations
 */

export type DeviceType = "mobile" | "tablet" | "desktop" | "full";

export interface DeviceConfig {
  id: DeviceType;
  label: string;
  icon: string;
  width: number;
  height: number;
  scale?: number;
}

/**
 * Device configurations for responsive preview
 */
export const DEVICES: DeviceConfig[] = [
  { id: "mobile", label: "Mobile", icon: "📱", width: 375, height: 667 },
  { id: "tablet", label: "Tablet", icon: "📱", width: 768, height: 1024 },
  { id: "desktop", label: "Desktop", icon: "🖥️", width: 1280, height: 800 },
  { id: "full", label: "Full Width", icon: "🖥️", width: 0, height: 0 }, // 0 = 100%
];

/**
 * Get device configuration by type
 */
export function getDeviceConfig(device: DeviceType): DeviceConfig {
  return DEVICES.find((d) => d.id === device) || DEVICES[2]; // Default to desktop
}

/**
 * Get the preview URL for a specific page
 */
export function getPreviewUrl(siteId: string, pageId: string): string {
  const baseUrl = typeof window !== "undefined" 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || "";
  return `${baseUrl}/preview/${siteId}/${pageId}`;
}

/**
 * Get the public URL for a site
 */
export function getPublicUrl(subdomain: string, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
  return `https://${subdomain}.${baseDomain}`;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand("copy");
  } finally {
    textArea.remove();
  }
}

/**
 * Calculate scale factor for device preview
 */
export function calculateScale(
  deviceWidth: number,
  deviceHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 40
): number {
  if (deviceWidth === 0 || deviceHeight === 0) return 1;
  
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  
  const scaleX = availableWidth / deviceWidth;
  const scaleY = availableHeight / deviceHeight;
  
  return Math.min(scaleX, scaleY, 1); // Never scale up, only down
}

/**
 * Format preview URL with cache-busting timestamp
 */
export function getPreviewUrlWithTimestamp(
  siteId: string,
  pageId: string,
  timestamp?: number
): string {
  const baseUrl = getPreviewUrl(siteId, pageId);
  const t = timestamp || Date.now();
  return `${baseUrl}?t=${t}`;
}
