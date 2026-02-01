// src/lib/resellerclub/email/index.ts
// Business Email - Barrel Exports

// Types
export * from './types';

// API Client
export { businessEmailApi } from './client';

// Services
export { emailOrderService } from './order-service';
export { emailAccountService } from './account-service';
export { emailDnsService, DEFAULT_MX_RECORDS, DEFAULT_SPF_RECORD } from './dns-service';
