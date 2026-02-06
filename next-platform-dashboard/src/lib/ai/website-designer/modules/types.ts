/**
 * PHASE AWD-09: Module Integration Intelligence
 * Type Definitions
 *
 * Types for intelligent module detection, configuration,
 * and integration into website generation.
 */

import type { GeneratedPage, GeneratedComponent } from "../types";

// =============================================================================
// MODULE TYPES
// =============================================================================

/**
 * Available module types
 */
export type ModuleType =
  | "ecommerce"
  | "booking"
  | "crm"
  | "automation"
  | "social-media";

/**
 * Module requirement priority
 */
export type ModulePriority = "high" | "medium" | "low";

/**
 * Module requirement analysis result
 */
export interface ModuleRequirement {
  module: ModuleType;
  required: boolean;
  priority: ModulePriority;
  reason: string;
  suggestedConfig: ModuleConfig;
}

// =============================================================================
// MODULE CONFIGURATION
// =============================================================================

/**
 * Base module configuration
 */
export interface ModuleConfig {
  enabled: boolean;
  settings: Record<string, unknown>;
  components: ModuleComponent[];
  pages: ModulePage[];
  integrations: ModuleIntegration[];
}

/**
 * Module-specific component configuration
 */
export interface ModuleComponent {
  componentType: string;
  placement: "page" | "global";
  page?: string;
  position?: "header" | "footer" | "main";
  props: Record<string, unknown>;
}

/**
 * Module page template
 */
export interface ModulePage {
  name: string;
  slug: string;
  template: string;
  components: string[];
}

/**
 * Module integration configuration
 */
export interface ModuleIntegration {
  type: string;
  config: Record<string, unknown>;
}

// =============================================================================
// SHIPPING ZONE TYPE
// =============================================================================

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  methods: ShippingMethod[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  type: "flat" | "weight" | "price" | "free";
  price?: number;
  freeThreshold?: number;
}

// =============================================================================
// ECOMMERCE CONFIG
// =============================================================================

export interface EcommerceConfig extends ModuleConfig {
  settings: {
    currency: string;
    taxRate: number;
    shippingEnabled: boolean;
    shippingZones: ShippingZone[];
    paymentMethods: string[];
    inventoryTracking: boolean;
    lowStockThreshold: number;
  };
}

// =============================================================================
// BOOKING CONFIG
// =============================================================================

export interface BookingConfig extends ModuleConfig {
  settings: {
    timezone: string;
    bookingWindow: number;
    cancellationPolicy: string;
    requireDeposit: boolean;
    depositAmount: number;
    confirmationEmail: boolean;
    reminderEmail: boolean;
  };
}

// =============================================================================
// CRM CONFIG
// =============================================================================

export interface CRMConfig extends ModuleConfig {
  settings: {
    leadCapture: boolean;
    leadScoring: boolean;
    emailIntegration: boolean;
    pipelineStages: string[];
    autoAssignment: boolean;
  };
}

// =============================================================================
// AUTOMATION CONFIG
// =============================================================================

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
}

export interface AutomationConfig extends ModuleConfig {
  settings: {
    welcomeEmail: boolean;
    abandonedCartEmail: boolean;
    followUpSequence: boolean;
    reviewRequest: boolean;
  };
  workflows: AutomationWorkflow[];
}

// =============================================================================
// SOCIAL MEDIA CONFIG
// =============================================================================

export interface SocialMediaConfig extends ModuleConfig {
  settings: {
    platforms: string[];
    autoPost: boolean;
    feedDisplay: boolean;
    shareButtons: boolean;
  };
}

// =============================================================================
// BUSINESS CONTEXT TYPE
// =============================================================================

/**
 * Business data context for module decisions
 */
export interface BusinessDataContext {
  client?: {
    industry?: string;
    businessName?: string;
  };
  site: {
    domain?: string;
    name?: string;
  };
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    category?: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
  }>;
  team?: Array<{
    id: string;
    name: string;
    role?: string;
  }>;
  testimonials?: Array<{
    id: string;
    author: string;
    content: string;
  }>;
  social?: Array<{
    platform: string;
    url: string;
  }>;
  hours?: Array<{
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }>;
}

// =============================================================================
// INDUSTRY MODULE MAPPING
// =============================================================================

export interface IndustryModuleMapping {
  required: ModuleType[];
  recommended: ModuleType[];
}

export const INDUSTRY_MODULE_MAPPING: Record<string, IndustryModuleMapping> = {
  restaurant: {
    required: ["booking"],
    recommended: ["crm", "social-media", "automation"],
  },
  ecommerce: {
    required: ["ecommerce"],
    recommended: ["crm", "automation", "social-media"],
  },
  saas: {
    required: ["crm"],
    recommended: ["automation"],
  },
  healthcare: {
    required: ["booking", "crm"],
    recommended: ["automation"],
  },
  "real-estate": {
    required: ["crm"],
    recommended: ["automation", "social-media"],
  },
  service: {
    required: ["booking", "crm"],
    recommended: ["automation"],
  },
  portfolio: {
    required: [],
    recommended: ["crm", "social-media"],
  },
  construction: {
    required: ["crm"],
    recommended: ["automation"],
  },
  fitness: {
    required: ["booking"],
    recommended: ["crm", "automation", "social-media"],
  },
  education: {
    required: ["crm"],
    recommended: ["automation", "social-media"],
  },
  agency: {
    required: ["crm"],
    recommended: ["automation", "social-media"],
  },
  nonprofit: {
    required: ["crm"],
    recommended: ["automation", "social-media"],
  },
  general: {
    required: [],
    recommended: ["crm", "social-media"],
  },
};

// =============================================================================
// MODULE FEATURE FLAGS
// =============================================================================

export interface ModuleFeatureFlags {
  hasProducts: boolean;
  hasServices: boolean;
  hasTeam: boolean;
  hasTestimonials: boolean;
  hasSocialLinks: boolean;
  hasBusinessHours: boolean;
}

/**
 * Extract feature flags from business context
 */
export function extractFeatureFlags(
  context: BusinessDataContext
): ModuleFeatureFlags {
  return {
    hasProducts: (context.products?.length ?? 0) > 0,
    hasServices: (context.services?.length ?? 0) > 0,
    hasTeam: (context.team?.length ?? 0) > 0,
    hasTestimonials: (context.testimonials?.length ?? 0) > 0,
    hasSocialLinks: (context.social?.length ?? 0) > 0,
    hasBusinessHours: (context.hours?.length ?? 0) > 0,
  };
}
