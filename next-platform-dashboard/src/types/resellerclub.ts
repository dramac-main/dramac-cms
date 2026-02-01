// src/types/resellerclub.ts
// ResellerClub Public Type Exports

// Re-export all types for public use
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
} from '@/lib/resellerclub/types';
