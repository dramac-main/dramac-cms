/**
 * PHASE AWD-09: Module Integration Intelligence
 * Default Module Configurations
 *
 * Provides default configurations for each module type.
 */

import type {
  ModuleType,
  ModuleConfig,
  EcommerceConfig,
  BookingConfig,
  CRMConfig,
  AutomationConfig,
  SocialMediaConfig,
} from "./types";

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Get default configuration for a module type
 */
export function getDefaultModuleConfig(
  module: ModuleType,
  features?: string[]
): ModuleConfig {
  switch (module) {
    case "ecommerce":
      return getDefaultEcommerceConfig(features);
    case "booking":
      return getDefaultBookingConfig(features);
    case "crm":
      return getDefaultCRMConfig(features);
    case "automation":
      return getDefaultAutomationConfig(features);
    case "social-media":
      return getDefaultSocialMediaConfig(features);
    default:
      return {
        enabled: true,
        settings: {},
        components: [],
        pages: [],
        integrations: [],
      };
  }
}

/**
 * Default E-commerce configuration
 */
function getDefaultEcommerceConfig(features?: string[]): EcommerceConfig {
  return {
    enabled: true,
    settings: {
      currency: "USD", // US Dollar default
      taxRate: 16, // Platform default
      shippingEnabled: true,
      shippingZones: [
        {
          id: "zm-domestic",
          name: "Domestic (Zambia)",
          countries: ["ZM"],
          methods: [
            { id: "standard", name: "Standard Delivery", type: "flat", price: 50 },
            { id: "express", name: "Express Delivery", type: "flat", price: 100 },
          ],
        },
      ],
      paymentMethods: ["card", "mobile-money"],
      inventoryTracking: true,
      lowStockThreshold: 10,
    },
    components: [
      {
        componentType: "ProductGrid",
        placement: "page",
        page: "/shop",
        props: { columns: 3, showFilters: true },
      },
      {
        componentType: "Cart",
        placement: "global",
        position: "header",
        props: {},
      },
      {
        componentType: "FeaturedProducts",
        placement: "page",
        page: "/",
        props: { count: 4 },
      },
    ],
    pages: [
      {
        name: "Shop",
        slug: "/shop",
        template: "shop",
        components: ["ProductGrid", "ProductFilters", "Pagination"],
      },
      {
        name: "Cart",
        slug: "/cart",
        template: "cart",
        components: ["CartItems", "CartSummary", "CartActions"],
      },
      {
        name: "Checkout",
        slug: "/checkout",
        template: "checkout",
        components: ["CheckoutForm", "OrderSummary", "PaymentMethods"],
      },
    ],
    integrations: [{ type: "stripe", config: {} }],
  };
}

/**
 * Default Booking configuration
 */
function getDefaultBookingConfig(features?: string[]): BookingConfig {
  return {
    enabled: true,
    settings: {
      timezone: "Africa/Lusaka", // Platform timezone default
      bookingWindow: 30,
      cancellationPolicy: "24 hours notice required",
      requireDeposit: false,
      depositAmount: 0,
      confirmationEmail: true,
      reminderEmail: true,
    },
    components: [
      {
        componentType: "BookingWidget",
        placement: "page",
        page: "/",
        props: { variant: "compact" },
      },
      {
        componentType: "BookingCalendar",
        placement: "page",
        page: "/book",
        props: {},
      },
      {
        componentType: "BookingServiceSelector",
        placement: "page",
        page: "/book",
        props: {},
      },
    ],
    pages: [
      {
        name: "Book Now",
        slug: "/book",
        template: "booking",
        components: ["BookingCalendar", "BookingServiceSelector", "BookingForm"],
      },
    ],
    integrations: [],
  };
}

/**
 * Default CRM configuration
 */
function getDefaultCRMConfig(features?: string[]): CRMConfig {
  return {
    enabled: true,
    settings: {
      leadCapture: true,
      leadScoring: false,
      emailIntegration: true,
      pipelineStages: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal",
        "Won",
        "Lost",
      ],
      autoAssignment: false,
    },
    components: [
      {
        componentType: "ContactForm",
        placement: "page",
        page: "/contact",
        props: { captureAsLead: true, fields: ["name", "email", "phone", "message"] },
      },
      {
        componentType: "Newsletter",
        placement: "global",
        position: "footer",
        props: {
          title: "Stay Updated",
          description: "Subscribe to our newsletter for updates and special offers.",
        },
      },
    ],
    pages: [],
    integrations: [],
  };
}

/**
 * Default Automation configuration
 */
function getDefaultAutomationConfig(features?: string[]): AutomationConfig {
  return {
    enabled: true,
    settings: {
      welcomeEmail: true,
      abandonedCartEmail: false,
      followUpSequence: true,
      reviewRequest: false,
    },
    workflows: [
      {
        id: "welcome",
        name: "Welcome Email",
        trigger: "contact_form_submit",
        actions: ["send_welcome_email"],
        enabled: true,
      },
      {
        id: "follow-up",
        name: "Follow Up Sequence",
        trigger: "contact_form_submit",
        actions: ["wait_3_days", "send_follow_up_email"],
        enabled: true,
      },
    ],
    components: [],
    pages: [],
    integrations: [{ type: "email", config: { provider: "sendgrid" } }],
  };
}

/**
 * Default Social Media configuration
 */
function getDefaultSocialMediaConfig(features?: string[]): SocialMediaConfig {
  return {
    enabled: true,
    settings: {
      platforms: ["facebook", "instagram", "twitter"],
      autoPost: false,
      feedDisplay: true,
      shareButtons: true,
    },
    components: [
      {
        componentType: "SocialFeed",
        placement: "page",
        page: "/",
        props: { count: 6, columns: 3 },
      },
      {
        componentType: "ShareButtons",
        placement: "global",
        props: {},
      },
      {
        componentType: "SocialIcons",
        placement: "global",
        position: "footer",
        props: {},
      },
    ],
    pages: [],
    integrations: [],
  };
}
