/**
 * Automation Starter Packs
 *
 * Curated bundles of workflow templates that install with one click
 * or automatically on site creation based on installed modules.
 */

export interface StarterPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateIds: string[];
  autoInstallForModules?: string[];
  activateOnInstall: boolean;
  isSystemPack: boolean;
  category: "system" | "growth" | "engagement" | "operations";
}

// ============================================================================
// SYSTEM PACKS — Auto-install, cannot be uninstalled
// ============================================================================

const ESSENTIAL_COMMUNICATIONS_PACK: StarterPack = {
  id: "essential-communications",
  name: "Essential Communications",
  description:
    "Core notifications for form submissions and live chat. Auto-installed for every site.",
  icon: "Bell",
  templateIds: [
    "system-form-submission",
    "system-chat-new-message",
    "system-chat-missed",
    "system-chat-assigned",
  ],
  autoInstallForModules: [], // Empty = always install
  activateOnInstall: true,
  isSystemPack: true,
  category: "system",
};

const BOOKING_COMMUNICATIONS_PACK: StarterPack = {
  id: "booking-communications",
  name: "Booking Communications",
  description:
    "Complete booking lifecycle notifications — confirmations, reminders, cancellations, and follow-ups.",
  icon: "CalendarCheck",
  templateIds: [
    "system-booking-created",
    "system-booking-confirmed",
    "system-booking-cancelled",
    "system-booking-completed",
    "system-booking-no-show",
    "system-booking-payment-received",
    "system-booking-reminder",
    "system-booking-cancelled-followup",
  ],
  autoInstallForModules: ["booking"],
  activateOnInstall: true,
  isSystemPack: true,
  category: "system",
};

const ECOMMERCE_COMMUNICATIONS_PACK: StarterPack = {
  id: "ecommerce-communications",
  name: "E-Commerce Communications",
  description:
    "Full order, payment, and quote lifecycle notifications — shipping updates, receipts, and quote workflows.",
  icon: "ShoppingCart",
  templateIds: [
    // Order templates
    "system-order-created",
    "system-order-shipped",
    "system-order-delivered",
    "system-order-cancelled",
    "system-payment-received",
    "system-payment-proof-uploaded",
    "system-refund-issued",
    "system-low-stock-alert",
    // Quote templates
    "system-quote-created",
    "system-quote-sent",
    "system-quote-reminder",
    "system-quote-accepted",
    "system-quote-rejected",
    "system-quote-amendment",
    "system-quote-converted",
  ],
  autoInstallForModules: ["ecommod01"],
  activateOnInstall: true,
  isSystemPack: true,
  category: "system",
};

// ============================================================================
// GROWTH PACKS — Optional, user-installed
// ============================================================================

const BOOKING_GROWTH_PACK: StarterPack = {
  id: "booking-growth",
  name: "Booking Growth",
  description:
    "Grow your booking business with CRM integration, cancellation recovery, feedback collection, and no-show follow-ups.",
  icon: "TrendingUp",
  templateIds: [
    "booking-to-crm-contact",
    "booking-cancelled-followup",
    "post-appointment-feedback",
    "no-show-followup",
    "booking-confirmation-chat",
  ],
  activateOnInstall: false,
  isSystemPack: false,
  category: "growth",
};

const ECOMMERCE_GROWTH_PACK: StarterPack = {
  id: "ecommerce-growth",
  name: "E-Commerce Growth",
  description:
    "Boost e-commerce revenue with abandoned cart recovery, first-purchase thank-yous, quote automation, and multi-channel stock alerts.",
  icon: "Rocket",
  templateIds: [
    "order-to-crm-contact",
    "abandoned-cart-recovery",
    "first-purchase-thank-you",
    "quote-accepted-to-order",
    "quote-reminder-sequence",
    "low-stock-multi-alert",
    "refund-processed-workflow",
  ],
  activateOnInstall: false,
  isSystemPack: false,
  category: "growth",
};

const LEAD_GENERATION_PACK: StarterPack = {
  id: "lead-generation",
  name: "Lead Generation",
  description:
    "Capture, score, and nurture leads with welcome sequences, drip campaigns, form handlers, and CRM integration.",
  icon: "Target",
  templateIds: [
    "lead-welcome-sequence",
    "lead-scoring-automation",
    "lead-nurture-drip",
    "form-submission-handler",
    "webhook-to-crm",
    "chat-to-crm-contact",
  ],
  activateOnInstall: false,
  isSystemPack: false,
  category: "engagement",
};

const CUSTOMER_SUCCESS_PACK: StarterPack = {
  id: "customer-success",
  name: "Customer Success",
  description:
    "Delight customers with onboarding flows, satisfaction surveys, VIP escalation, and deal-to-quote conversion.",
  icon: "Heart",
  templateIds: [
    "customer-onboarding",
    "chat-resolved-satisfaction",
    "chat-vip-escalation",
    "deal-won-to-quote",
  ],
  activateOnInstall: false,
  isSystemPack: false,
  category: "operations",
};

// ============================================================================
// EXPORTS
// ============================================================================

export const STARTER_PACKS: StarterPack[] = [
  // System packs (auto-install)
  ESSENTIAL_COMMUNICATIONS_PACK,
  BOOKING_COMMUNICATIONS_PACK,
  ECOMMERCE_COMMUNICATIONS_PACK,
  // Growth packs (user-installed)
  BOOKING_GROWTH_PACK,
  ECOMMERCE_GROWTH_PACK,
  LEAD_GENERATION_PACK,
  CUSTOMER_SUCCESS_PACK,
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get a starter pack by ID
 */
export function getStarterPackById(
  packId: string,
): StarterPack | undefined {
  return STARTER_PACKS.find((p) => p.id === packId);
}

/**
 * Get all system packs (auto-install, cannot uninstall)
 */
export function getSystemPacks(): StarterPack[] {
  return STARTER_PACKS.filter((p) => p.isSystemPack);
}

/**
 * Get optional packs (user-installable)
 */
export function getOptionalPacks(): StarterPack[] {
  return STARTER_PACKS.filter((p) => !p.isSystemPack);
}

/**
 * Get packs that should auto-install for a given set of module slugs.
 * System packs with empty autoInstallForModules always match.
 * System packs with specific modules match if any are in the installed set.
 */
export function getPacksForModules(
  installedModuleSlugs: string[],
): StarterPack[] {
  return STARTER_PACKS.filter((p) => {
    if (!p.isSystemPack) return false;
    if (!p.autoInstallForModules) return false;
    // Empty array = always install
    if (p.autoInstallForModules.length === 0) return true;
    // Match if any installed module slug is in the pack's list
    return p.autoInstallForModules.some((slug) =>
      installedModuleSlugs.includes(slug),
    );
  });
}

/**
 * Get packs that should auto-install when a specific module is added.
 * Used when a new module is installed on an existing site.
 */
export function getPacksForNewModule(
  moduleSlug: string,
): StarterPack[] {
  return STARTER_PACKS.filter((p) => {
    if (!p.isSystemPack) return false;
    if (!p.autoInstallForModules) return false;
    return p.autoInstallForModules.includes(moduleSlug);
  });
}

/**
 * Get packs grouped by category
 */
export function getPacksByCategory(): Record<string, StarterPack[]> {
  const grouped: Record<string, StarterPack[]> = {};
  for (const pack of STARTER_PACKS) {
    if (!grouped[pack.category]) grouped[pack.category] = [];
    grouped[pack.category].push(pack);
  }
  return grouped;
}
