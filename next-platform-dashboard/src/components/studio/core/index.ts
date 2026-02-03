/**
 * Studio Core Components
 * 
 * Central exports for all core Studio components.
 */

export { StudioProvider, type StudioProviderProps } from "./studio-provider";
export { StudioLoading } from "./studio-loading";
export { ComponentWrapper } from "./component-wrapper";

// PHASE-STUDIO-18: Responsive Preview
export { StudioFrame } from "./studio-frame";

// PHASE-STUDIO-19: Nested Components & Zones
export { 
  ZoneRenderer, 
  WithZones, 
  ZonePlaceholder,
  useComponentHasZones,
  getZoneDefinitions,
} from "./zone-renderer";

// Placeholder exports for later phases
// export { StudioCanvas } from "./studio-canvas";
