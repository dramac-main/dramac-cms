/**
 * Paddle Billing Module
 *
 * Phase EM-59: Paddle Billing Integration
 *
 * Paddle is the primary billing provider for DRAMAC CMS.
 * Supports Zambia payouts via Payoneer/Wise.
 *
 * Exports:
 * - Client setup and configuration
 * - Subscription management service
 * - Usage tracking service
 * - Webhook handlers
 *
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

// Client & Configuration
export {
  paddle,
  isPaddleConfigured,
  isPaddleSandbox,
  PADDLE_IDS,
  PLAN_CONFIGS,
  OVERAGE_RATES,
  getPlanConfig,
  getPriceId,
  getPlanTypeFromPriceId,
  getPlanLimits,
  isWhiteLabelEnabled,
  getTrialEligiblePlans,
  formatPrice,
  calculateOverageCost,
  type PlanType,
  type BillingCycle,
  type PlanConfig,
} from "./client";

// Subscription Service
export {
  SubscriptionService,
  subscriptionService,
  type CreateSubscriptionParams,
  type SubscriptionDetails,
} from "./subscription-service";

// Usage Tracking
export {
  UsageTracker,
  usageTracker,
  recordAutomationRun,
  recordAiAction,
  recordApiCall,
  recordEmailSend,
  recordFileStorage,
  type UsageType,
  type UsageReport,
  type UsageLimitCheck,
} from "./usage-tracker";

// Webhook Handlers
export { handlePaddleEvent } from "./webhook-handlers";

// Server Actions (for use in Server Components)
export {
  getAgencySubscriptionPaddle,
  getBillingOverviewPaddle,
  cancelSubscriptionPaddle,
  pauseSubscriptionPaddle,
  resumeSubscriptionPaddle,
  undoCancelSubscriptionPaddle,
  changeSubscriptionPlanPaddle,
  previewPlanChangePaddle,
  validateDowngradePaddle,
  getAgencyUsagePaddle,
  getUsageAlertsPaddle,
  getUsageHistoryPaddle,
  getAgencyInvoicesPaddle,
  getProductsPaddle,
  hasActiveSubscriptionPaddle,
  getSubscriptionStatusPaddle,
  isPaddleEnabledPaddle,
} from "./billing-actions";

// Dunning Service (Phase EM-59B)
export {
  DunningService,
  dunningService,
  type DunningConfig,
} from "./dunning-service";

// Enterprise Service (Phase EM-59B)
export {
  EnterpriseService,
  enterpriseService,
  type EnterpriseQuote,
  type EnterpriseRequirements,
  type ProposedPricing,
  type CreateQuoteParams,
} from "./enterprise-service";

// Email Usage Tracking (Phase BIL-05)
export { trackEmailSend, getEmailUsage, checkEmailLimit } from "./email-usage";

// Storage Tracking (Phase BIL-05)
export {
  trackFileUpload,
  trackFileDelete,
  getStorageUsage,
  checkStorageLimit,
} from "./storage-tracker";

// Plan Enforcer (Phase BIL-05)
export {
  enforceSiteLimit,
  enforceTeamMemberLimit,
  enforceWhiteLabel,
  getAgencyLimits,
} from "./plan-enforcer";

// Client-side (for use in Client Components)
// Import from '@/lib/paddle/paddle-client' directly for client components
