// src/lib/cloudflare/index.ts
// Cloudflare Integration - Barrel Exports

// ============================================================================
// Client & Errors
// ============================================================================
export {
  CloudflareClient,
  CloudflareApiError,
  CloudflareConfigError,
  getCloudflareClient,
  resetClient,
  canCreateClient,
} from './client';

// ============================================================================
// Services
// ============================================================================
export { ZoneService, zoneService } from './zones';
export { DnsService, dnsService } from './dns';
export { PropagationService, propagationService } from './propagation';

// ============================================================================
// Configuration
// ============================================================================
export {
  CLOUDFLARE_CONFIG,
  DNS_TEMPLATES,
  SSL_MODE_INFO,
  DNS_RECORD_INFO,
  isCloudflareConfigured,
} from './config';

// ============================================================================
// Types
// ============================================================================
export type {
  // Zone types
  CloudflareZone,
  CreateZoneParams,
  ZoneStatus,
  ZoneType,
  ZoneActivationStatus,
  
  // DNS types
  DnsRecord,
  DnsRecordType,
  CreateDnsRecordParams,
  UpdateDnsRecordParams,
  ListDnsRecordsFilters,
  
  // SSL types
  SslMode,
  SslCertificate,
  SslSettings,
  UniversalSslSettings,
  TlsVersion,
  
  // API types
  CloudflareError,
  CloudflareResponse,
  CloudflarePaginationInfo,
  
  // Propagation types
  PropagationStatus,
  PropagationRecord,
  PropagationServer,
  ExpectedDnsRecord,
  NameserverPropagationStatus,
  
  // Batch types
  BatchCreateResult,
  BatchDeleteResult,
  
  // Template types
  TemplateRecord,
  DnsTemplate,
  
  // Service result types
  ServiceResult,
  ZoneCreationResult,
  DnsSetupResult,

  // DNSSEC types
  DnssecStatus,
  CloudflareDnssecResponse,
} from './types';
