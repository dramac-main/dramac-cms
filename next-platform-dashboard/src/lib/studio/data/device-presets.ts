/**
 * DRAMAC Studio Device Presets
 * 
 * Device presets and zoom data for responsive preview.
 * Created in PHASE-STUDIO-18.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DevicePreset {
  id: string;
  name: string;
  category: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'custom';
  width: number;
  height: number;
  icon: string;
  hasNotch?: boolean;
  hasDynamicIsland?: boolean;
  hasHomeButton?: boolean;
  borderRadius?: number;
  devicePixelRatio?: number;
}

// =============================================================================
// DEVICE PRESETS
// =============================================================================

export const DEVICE_PRESETS: DevicePreset[] = [
  // Phones - iPhone
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'phone',
    width: 375,
    height: 667,
    icon: '📱',
    hasHomeButton: true,
    borderRadius: 40,
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    category: 'phone',
    width: 390,
    height: 844,
    icon: '📱',
    hasNotch: true,
    borderRadius: 47,
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    category: 'phone',
    width: 393,
    height: 852,
    icon: '📱',
    hasDynamicIsland: true,
    borderRadius: 55,
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'phone',
    width: 430,
    height: 932,
    icon: '📱',
    hasDynamicIsland: true,
    borderRadius: 55,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'phone',
    width: 393,
    height: 852,
    icon: '📱',
    hasDynamicIsland: true,
    borderRadius: 55,
  },
  
  // Phones - Android
  {
    id: 'pixel-7',
    name: 'Pixel 7',
    category: 'phone',
    width: 412,
    height: 915,
    icon: '📱',
    borderRadius: 30,
  },
  {
    id: 'pixel-8',
    name: 'Pixel 8',
    category: 'phone',
    width: 412,
    height: 915,
    icon: '📱',
    borderRadius: 30,
  },
  {
    id: 'samsung-s23',
    name: 'Samsung S23',
    category: 'phone',
    width: 360,
    height: 780,
    icon: '📱',
    borderRadius: 30,
  },
  {
    id: 'samsung-s24',
    name: 'Samsung S24',
    category: 'phone',
    width: 360,
    height: 780,
    icon: '📱',
    borderRadius: 30,
  },
  
  // Tablets
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    width: 744,
    height: 1133,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    category: 'tablet',
    width: 820,
    height: 1180,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'tablet',
    width: 834,
    height: 1194,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'ipad-pro-12',
    name: 'iPad Pro 12.9"',
    category: 'tablet',
    width: 1024,
    height: 1366,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'android-tablet',
    name: 'Android Tablet',
    category: 'tablet',
    width: 800,
    height: 1280,
    icon: '💻',
    borderRadius: 16,
  },
  
  // Laptops
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13"',
    category: 'laptop',
    width: 1280,
    height: 800,
    icon: '💻',
  },
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14"',
    category: 'laptop',
    width: 1512,
    height: 982,
    icon: '💻',
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16"',
    category: 'laptop',
    width: 1728,
    height: 1117,
    icon: '💻',
  },
  {
    id: 'laptop-hd',
    name: 'Laptop HD',
    category: 'laptop',
    width: 1366,
    height: 768,
    icon: '💻',
  },
  
  // Desktops
  {
    id: 'desktop-hd',
    name: 'HD (1080p)',
    category: 'desktop',
    width: 1920,
    height: 1080,
    icon: '🖥️',
  },
  {
    id: 'desktop-2k',
    name: '2K (1440p)',
    category: 'desktop',
    width: 2560,
    height: 1440,
    icon: '🖥️',
  },
  {
    id: 'desktop-4k',
    name: '4K (2160p)',
    category: 'desktop',
    width: 3840,
    height: 2160,
    icon: '🖥️',
  },
  {
    id: 'ultrawide',
    name: 'Ultrawide',
    category: 'desktop',
    width: 3440,
    height: 1440,
    icon: '🖥️',
  },
  
  // Custom
  {
    id: 'custom',
    name: 'Custom',
    category: 'custom',
    width: 0,
    height: 0,
    icon: '⚙️',
  },
];

// =============================================================================
// ZOOM CONSTANTS
// =============================================================================

export const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 25;
export const MAX_ZOOM = 400;
export const ZOOM_STEP = 25;

// =============================================================================
// DEFAULT DEVICE IDS PER BREAKPOINT
// =============================================================================

/**
 * Default device to use when switching to a breakpoint via the breakpoint icons
 */
export const DEFAULT_DEVICE_FOR_BREAKPOINT: Record<'mobile' | 'tablet' | 'desktop', string> = {
  mobile: 'iphone-15-pro',
  tablet: 'ipad-air',
  desktop: 'desktop-hd',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get breakpoint category from width
 */
export function getBreakpointFromWidth(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get device preset by ID
 */
export function getDevicePreset(id: string): DevicePreset | undefined {
  return DEVICE_PRESETS.find(d => d.id === id);
}

/**
 * Group presets by category
 */
export function getPresetsByCategory(): Record<string, DevicePreset[]> {
  return DEVICE_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, DevicePreset[]>);
}

/**
 * Get the next zoom level (for zoom in)
 */
export function getNextZoomLevel(currentZoom: number): number {
  for (const level of ZOOM_LEVELS) {
    if (level > currentZoom) return level;
  }
  return MAX_ZOOM;
}

/**
 * Get the previous zoom level (for zoom out)
 */
export function getPreviousZoomLevel(currentZoom: number): number {
  for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
    if (ZOOM_LEVELS[i] < currentZoom) return ZOOM_LEVELS[i];
  }
  return MIN_ZOOM;
}
