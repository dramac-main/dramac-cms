// src/lib/resellerclub/email/index.ts
// Business Email - Barrel Exports

// Types
export * from './types';

// API Clients
export { businessEmailApi } from './client';
export {
  titanMailApi,
  TITAN_PRODUCT_KEYS,
  TITAN_PLAN_IDS,
  TITAN_PLANS,
  titanPlanName,
} from './titan-client';
export type {
  TitanRegion,
  TitanPlanName,
  TitanPlanInfo,
  TitanCreateOrderParams,
  TitanCreateOrderResult,
  TitanOrderDetails,
} from './titan-client';

// Services
export { emailOrderService } from './order-service';
export { emailAccountService } from './account-service';
export { emailDnsService, DEFAULT_MX_RECORDS, DEFAULT_SPF_RECORD } from './dns-service';
