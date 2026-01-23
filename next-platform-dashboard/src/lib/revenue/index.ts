// src/lib/revenue/index.ts
// Phase EM-43: Revenue Sharing Dashboard - Exports

export { RevenueService, revenueService } from "./revenue-service";
export type {
  SaleRecord,
  EarningsSummary,
  RevenueAnalytics,
} from "./revenue-service";

export { PayoutService, payoutService } from "./payout-service";
export type {
  PayoutAccount,
  Payout,
  PayoutLineItem,
} from "./payout-service";
