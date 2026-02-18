// src/lib/cloudflare/types.ts
// Cloudflare API TypeScript Type Definitions

// ============================================================================
// Zone Types
// ============================================================================

/**
 * Zone status as returned by Cloudflare API
 */
export type ZoneStatus = 
  | 'active'
  | 'pending'
  | 'initializing'
  | 'moved'
  | 'deleted'
  | 'deactivated';

/**
 * Zone type - full (nameserver) or partial (CNAME)
 */
export type ZoneType = 'full' | 'partial';

/**
 * Cloudflare Zone representation
 */
export interface CloudflareZone {
  id: string;
  name: string;
  status: ZoneStatus;
  paused: boolean;
  type: ZoneType;
  nameServers: string[];
  originalNameServers: string[];
  createdOn: string;
  modifiedOn: string;
  activatedOn?: string;
  plan: {
    id: string;
    name: string;
  };
}

/**
 * Parameters for creating a new zone
 */
export interface CreateZoneParams {
  name: string;
  accountId?: string;
  jumpStart?: boolean;
  type?: ZoneType;
}

/**
 * Zone activation status
 */
export interface ZoneActivationStatus {
  activated: boolean;
  nameservers: string[];
  originalNameservers: string[];
}

// ============================================================================
// DNS Record Types
// ============================================================================

/**
 * Supported DNS record types
 */
export type DnsRecordType = 
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'TXT'
  | 'NS'
  | 'SRV'
  | 'CAA'
  | 'PTR'
  | 'SPF'; // Deprecated but still used

/**
 * DNS Record as returned by Cloudflare
 */
export interface DnsRecord {
  id: string;
  zoneId: string;
  zoneName: string;
  type: DnsRecordType;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  priority?: number;
  createdOn: string;
  modifiedOn: string;
}

/**
 * Parameters for creating a DNS record
 */
export interface CreateDnsRecordParams {
  zoneId: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

/**
 * Parameters for updating a DNS record
 */
export interface UpdateDnsRecordParams {
  recordId: string;
  zoneId: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

/**
 * Filters for listing DNS records
 */
export interface ListDnsRecordsFilters {
  type?: DnsRecordType;
  name?: string;
  content?: string;
  page?: number;
  perPage?: number;
}

// ============================================================================
// SSL/TLS Types
// ============================================================================

/**
 * SSL encryption modes
 */
export type SslMode = 'off' | 'flexible' | 'full' | 'strict';

/**
 * SSL certificate information
 */
export interface SslCertificate {
  id: string;
  status: string;
  expiresOn: string;
  hosts: string[];
}

/**
 * Zone SSL settings
 */
export interface SslSettings {
  mode: SslMode;
  strictMode: boolean;
  certificate?: SslCertificate;
}

/**
 * Universal SSL settings
 */
export interface UniversalSslSettings {
  enabled: boolean;
}

/**
 * TLS version options
 */
export type TlsVersion = '1.0' | '1.1' | '1.2' | '1.3';

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard Cloudflare API error
 */
export interface CloudflareError {
  code: number;
  message: string;
  error_chain?: CloudflareError[];
}

/**
 * Standard Cloudflare API response wrapper
 */
export interface CloudflareResponse<T> {
  success: boolean;
  errors: CloudflareError[];
  messages: string[];
  result: T;
  result_info?: CloudflarePaginationInfo;
}

/**
 * Pagination information from Cloudflare API
 */
export interface CloudflarePaginationInfo {
  page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_count: number;
}

// ============================================================================
// Propagation Types
// ============================================================================

/**
 * DNS propagation check result for a domain
 */
export interface PropagationStatus {
  domain: string;
  records: PropagationRecord[];
  allPropagated: boolean;
  lastChecked: string;
}

/**
 * Propagation status for a specific record
 */
export interface PropagationRecord {
  type: DnsRecordType;
  name: string;
  expected: string;
  actual: string | null;
  propagated: boolean;
  servers: PropagationServer[];
}

/**
 * DNS server propagation result
 */
export interface PropagationServer {
  location: string;
  server: string;
  resolved: string | null;
  propagated: boolean;
}

/**
 * Expected DNS record for propagation checking
 */
export interface ExpectedDnsRecord {
  type: DnsRecordType;
  name: string;
  content: string;
}

/**
 * Nameserver propagation status
 */
export interface NameserverPropagationStatus {
  propagated: boolean;
  current: string[];
  expected: string[];
}

// ============================================================================
// Batch Operation Types
// ============================================================================

/**
 * Result of batch record creation
 */
export interface BatchCreateResult {
  created: DnsRecord[];
  errors: { record: Omit<CreateDnsRecordParams, 'zoneId'>; error: string }[];
}

/**
 * Result of batch record deletion
 */
export interface BatchDeleteResult {
  deleted: string[];
  errors: { id: string; error: string }[];
}

// ============================================================================
// Internal API Response Types (from Cloudflare API)
// ============================================================================

/**
 * Zone as returned by Cloudflare API (snake_case)
 * @internal
 */
export interface CloudflareZoneResponse {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: 'full' | 'partial';
  name_servers: string[];
  original_name_servers: string[];
  created_on: string;
  modified_on: string;
  activated_on?: string;
  plan?: {
    id: string;
    name: string;
  };
}

/**
 * DNS Record as returned by Cloudflare API (snake_case)
 * @internal
 */
export interface DnsRecordResponse {
  id: string;
  zone_id: string;
  zone_name: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  priority?: number;
  created_on: string;
  modified_on: string;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * DNS template record definition
 */
export interface TemplateRecord {
  type: DnsRecordType;
  name: string;
  content?: string;
  priority?: number;
  proxied?: boolean;
}

/**
 * DNS template configuration
 */
export interface DnsTemplate {
  records: TemplateRecord[];
  dkimSelector?: string;
  dmarcRecord?: string;
}

// ============================================================================
// Service Result Types
// ============================================================================

/**
 * Generic service operation result
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Zone creation result with nameserver info
 */
export interface ZoneCreationResult {
  zoneId: string;
  nameservers: string[];
}

/**
 * DNS setup result with record count
 */
export interface DnsSetupResult {
  recordsCreated: number;
}

// ============================================================================
// DNSSEC Types
// ============================================================================

/**
 * DNSSEC status for a zone
 */
export interface DnssecStatus {
  /** Current DNSSEC state */
  status: 'active' | 'pending' | 'disabled' | 'error';
  /** Full DS record string (e.g. "example.com. 3600 IN DS 2371 13 2 DIGEST") */
  dsRecord?: string;
  /** DNSSEC algorithm number (e.g. 13 = ECDSA P-256 SHA-256) */
  algorithm?: number;
  /** Key tag identifying the signing key */
  keyTag?: number;
  /** Digest type number (e.g. 2 = SHA-256) */
  digestType?: number;
  /** Hex digest of the public key */
  digest?: string;
  /** ISO timestamp of last modification */
  modifiedOn?: string;
}

/**
 * Cloudflare DNSSEC API response shape
 * @internal
 */
export interface CloudflareDnssecResponse {
  status: string;
  flags?: number;
  algorithm?: string | number;
  key_type?: string;
  digest_type?: string | number;
  digest?: string;
  ds?: string;
  key_tag?: number;
  public_key?: string;
  modified_on?: string;
}
