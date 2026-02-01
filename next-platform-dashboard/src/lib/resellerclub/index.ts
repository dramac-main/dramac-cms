// src/lib/resellerclub/index.ts
// ResellerClub API - Barrel Exports

// Client
export { 
  ResellerClubClient, 
  getResellerClubClient, 
  resetClient, 
  isClientAvailable 
} from './client';

// Services
export { DomainService, domainService } from './domains';
export { ContactService, contactService } from './contacts';
export { CustomerService, customerService } from './customers';
export { OrderService, orderService } from './orders';

// Configuration
export { 
  RESELLERCLUB_CONFIG, 
  TLD_CATEGORIES, 
  SUPPORTED_TLDS, 
  isConfigured,
  getApiUrl,
} from './config';

// Types
export type {
  // Domain types
  DomainAvailability,
  DomainPrice,
  DomainDetails,
  DomainRegistrationParams,
  DomainRenewalParams,
  DomainTransferParams,
  DomainSearchResult,
  // Contact types
  Contact,
  ContactCreateParams,
  // Customer types
  Customer,
  CustomerCreateParams,
  // Order types
  Order,
  Transaction,
  // Email types
  EmailOrderParams,
  EmailAccountCreateParams,
  EmailAccount,
  // DNS types
  DnsRecordParams,
  DnsRecord,
  // Pricing types
  TldPricing,
  // Response types
  ResellerClubApiError,
  SearchResponse,
} from './types';

// Errors
export {
  ResellerClubError,
  DomainNotAvailableError,
  InsufficientFundsError,
  DomainExpiredError,
  TransferNotAllowedError,
  AuthCodeInvalidError,
  ConfigurationError,
  RequestTimeoutError,
  RateLimitError,
  CustomerNotFoundError,
  ContactNotFoundError,
  DomainNotFoundError,
  OrderNotFoundError,
  InvalidParameterError,
  parseApiError,
} from './errors';

// Utilities
export {
  parseDomainName,
  isValidDomainName,
  isSupportedTld,
  getTldCategory,
  formatPrice,
  yearsUntilExpiry,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired,
  formatExpiryDate,
  generateDomainSuggestions,
  normalizePhoneNumber,
  isValidEmail,
  parseResellerClubDate,
  generateSecureString,
  calculateMarkup,
  getStatusBadgeColor,
} from './utils';
