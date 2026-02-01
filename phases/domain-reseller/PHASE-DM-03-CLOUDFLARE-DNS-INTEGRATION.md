# Phase DM-03: Cloudflare DNS Integration

> **Priority**: 🔴 HIGH
> **Estimated Time**: 8 hours
> **Prerequisites**: DM-01, DM-02
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create comprehensive Cloudflare DNS integration for:
1. Automatic zone creation for domains
2. DNS record management (CRUD)
3. Automatic DNS configuration for sites
4. SSL/TLS certificate management
5. DNS propagation monitoring
6. Cloudflare security features

---

## 📁 Files to Create

```
src/lib/cloudflare/
├── client.ts              # Cloudflare API client
├── config.ts              # Configuration and constants
├── types.ts               # TypeScript interfaces
├── zones.ts               # Zone management
├── dns.ts                 # DNS record operations
├── ssl.ts                 # SSL/TLS management
├── templates.ts           # DNS templates (for sites, email)
├── propagation.ts         # DNS propagation checking
└── index.ts               # Barrel exports

src/lib/actions/
└── dns.ts                 # Server actions for DNS management
```

---

## 📋 Implementation Tasks

### Task 1: Configuration (20 mins)

```typescript
// src/lib/cloudflare/config.ts

export const CLOUDFLARE_CONFIG = {
  // API Configuration
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  
  // Platform Configuration
  platformIp: process.env.PLATFORM_IP || '76.76.21.21',
  platformCname: process.env.DEFAULT_CNAME_TARGET || 'cname.dramac.app',
  platformNameservers: (process.env.PLATFORM_NAMESERVERS || 'ns1.dramac.app,ns2.dramac.app').split(','),
  
  // Default Settings
  defaultTtl: 3600,
  defaultProxied: true,
  defaultSslMode: 'full' as const,
  
  // Rate Limiting
  maxRequestsPerMinute: 1200,
  requestTimeout: 30000,
} as const;

export function isCloudflareConfigured(): boolean {
  return !!CLOUDFLARE_CONFIG.apiToken;
}

// DNS record templates for different scenarios
export const DNS_TEMPLATES = {
  // Basic site hosting
  site: {
    records: [
      { type: 'A', name: '@', proxied: true },
      { type: 'CNAME', name: 'www', content: '@', proxied: true },
    ],
  },
  
  // Email (Titan Mail)
  titanEmail: {
    records: [
      { type: 'MX', name: '@', content: 'mx1.titan.email', priority: 10 },
      { type: 'MX', name: '@', content: 'mx2.titan.email', priority: 20 },
      { type: 'TXT', name: '@', content: 'v=spf1 include:spf.titan.email ~all' },
      // DKIM added per-domain
    ],
  },
  
  // Google Workspace
  googleWorkspace: {
    records: [
      { type: 'MX', name: '@', content: 'ASPMX.L.GOOGLE.COM', priority: 1 },
      { type: 'MX', name: '@', content: 'ALT1.ASPMX.L.GOOGLE.COM', priority: 5 },
      { type: 'MX', name: '@', content: 'ALT2.ASPMX.L.GOOGLE.COM', priority: 5 },
      { type: 'MX', name: '@', content: 'ALT3.ASPMX.L.GOOGLE.COM', priority: 10 },
      { type: 'MX', name: '@', content: 'ALT4.ASPMX.L.GOOGLE.COM', priority: 10 },
      { type: 'TXT', name: '@', content: 'v=spf1 include:_spf.google.com ~all' },
    ],
  },
  
  // Verification
  verification: {
    prefix: '_dramac-verify',
  },
} as const;
```

### Task 2: Types Definition (30 mins)

```typescript
// src/lib/cloudflare/types.ts

// ============================================================================
// Zone Types
// ============================================================================

export interface CloudflareZone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  paused: boolean;
  type: 'full' | 'partial';
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

export interface CreateZoneParams {
  name: string;
  accountId?: string;
  jumpStart?: boolean;
  type?: 'full' | 'partial';
}

// ============================================================================
// DNS Record Types
// ============================================================================

export type DnsRecordType = 
  | 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' 
  | 'NS' | 'SRV' | 'CAA' | 'PTR' | 'SPF';

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

export interface CreateDnsRecordParams {
  zoneId: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

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

// ============================================================================
// SSL Types
// ============================================================================

export type SslMode = 'off' | 'flexible' | 'full' | 'strict';

export interface SslSettings {
  mode: SslMode;
  strictMode: boolean;
  certificate?: {
    id: string;
    status: string;
    expiresOn: string;
    hosts: string[];
  };
}

export interface UniversalSslSettings {
  enabled: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CloudflareResponse<T> {
  success: boolean;
  errors: CloudflareError[];
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

export interface CloudflareError {
  code: number;
  message: string;
}

// ============================================================================
// Propagation Types
// ============================================================================

export interface PropagationStatus {
  domain: string;
  records: PropagationRecord[];
  allPropagated: boolean;
  lastChecked: string;
}

export interface PropagationRecord {
  type: DnsRecordType;
  name: string;
  expected: string;
  actual: string | null;
  propagated: boolean;
  servers: PropagationServer[];
}

export interface PropagationServer {
  location: string;
  server: string;
  resolved: string | null;
  propagated: boolean;
}
```

### Task 3: Cloudflare API Client (60 mins)

```typescript
// src/lib/cloudflare/client.ts

import { CLOUDFLARE_CONFIG, isCloudflareConfigured } from './config';
import type { CloudflareResponse, CloudflareError } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
}

export class CloudflareConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudflareConfigError';
  }
}

export class CloudflareApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public errors: CloudflareError[]
  ) {
    super(message);
    this.name = 'CloudflareApiError';
  }
  
  static fromResponse(errors: CloudflareError[]): CloudflareApiError {
    const mainError = errors[0] || { code: 0, message: 'Unknown error' };
    return new CloudflareApiError(mainError.message, mainError.code, errors);
  }
}

export class CloudflareClient {
  private baseUrl = 'https://api.cloudflare.com/client/v4';
  private apiToken: string;
  
  constructor() {
    if (!isCloudflareConfigured()) {
      throw new CloudflareConfigError(
        'Cloudflare API not configured. Set CLOUDFLARE_API_TOKEN environment variable.'
      );
    }
    this.apiToken = CLOUDFLARE_CONFIG.apiToken;
  }
  
  /**
   * Execute HTTP request to Cloudflare API
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', params, body } = options;
    
    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CLOUDFLARE_CONFIG.requestTimeout
    );
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json() as CloudflareResponse<T>;
      
      if (!data.success) {
        throw CloudflareApiError.fromResponse(data.errors);
      }
      
      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof CloudflareApiError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CloudflareApiError('Request timeout', 408, []);
      }
      
      throw new CloudflareApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        []
      );
    }
  }
  
  // Public request methods
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }
  
  async post<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }
  
  async put<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }
  
  async patch<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  /**
   * Verify API token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.get('/user/tokens/verify');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let clientInstance: CloudflareClient | null = null;

export function getCloudflareClient(): CloudflareClient {
  if (!clientInstance) {
    clientInstance = new CloudflareClient();
  }
  return clientInstance;
}

export function resetClient(): void {
  clientInstance = null;
}
```

### Task 4: Zone Management (60 mins)

```typescript
// src/lib/cloudflare/zones.ts

import { getCloudflareClient } from './client';
import { CLOUDFLARE_CONFIG } from './config';
import type { CloudflareZone, CreateZoneParams, SslMode } from './types';

export class ZoneService {
  private client = getCloudflareClient();
  
  /**
   * Create a new zone (add domain to Cloudflare)
   */
  async createZone(params: CreateZoneParams): Promise<CloudflareZone> {
    const body: Record<string, unknown> = {
      name: params.name.toLowerCase(),
      jump_start: params.jumpStart ?? true,
      type: params.type ?? 'full',
    };
    
    if (params.accountId || CLOUDFLARE_CONFIG.accountId) {
      body.account = { id: params.accountId || CLOUDFLARE_CONFIG.accountId };
    }
    
    const response = await this.client.post<CloudflareZoneResponse>('/zones', body);
    return this.mapZone(response);
  }
  
  /**
   * Get zone by ID
   */
  async getZone(zoneId: string): Promise<CloudflareZone> {
    const response = await this.client.get<CloudflareZoneResponse>(`/zones/${zoneId}`);
    return this.mapZone(response);
  }
  
  /**
   * Get zone by domain name
   */
  async getZoneByName(name: string): Promise<CloudflareZone | null> {
    const response = await this.client.get<CloudflareZoneResponse[]>('/zones', {
      name: name.toLowerCase(),
    });
    
    if (response.length === 0) {
      return null;
    }
    
    return this.mapZone(response[0]);
  }
  
  /**
   * List all zones
   */
  async listZones(page = 1, perPage = 50): Promise<{ zones: CloudflareZone[]; total: number }> {
    const response = await this.client.get<CloudflareZoneResponse[]>('/zones', {
      page,
      per_page: perPage,
    });
    
    return {
      zones: response.map(z => this.mapZone(z)),
      total: response.length, // Would need pagination info from API
    };
  }
  
  /**
   * Delete a zone
   */
  async deleteZone(zoneId: string): Promise<{ id: string }> {
    return this.client.delete(`/zones/${zoneId}`);
  }
  
  /**
   * Check zone activation status
   */
  async checkActivation(zoneId: string): Promise<{
    activated: boolean;
    nameservers: string[];
    originalNameservers: string[];
  }> {
    const zone = await this.getZone(zoneId);
    return {
      activated: zone.status === 'active',
      nameservers: zone.nameServers,
      originalNameservers: zone.originalNameServers,
    };
  }
  
  /**
   * Get or create zone for a domain
   */
  async getOrCreateZone(domainName: string): Promise<CloudflareZone> {
    // Check if zone already exists
    const existing = await this.getZoneByName(domainName);
    if (existing) {
      return existing;
    }
    
    // Create new zone
    return this.createZone({ name: domainName });
  }
  
  // ============================================================================
  // Zone Settings
  // ============================================================================
  
  /**
   * Set SSL mode for zone
   */
  async setSslMode(zoneId: string, mode: SslMode): Promise<void> {
    await this.client.patch(`/zones/${zoneId}/settings/ssl`, {
      value: mode,
    });
  }
  
  /**
   * Enable Always Use HTTPS
   */
  async enableAlwaysHttps(zoneId: string): Promise<void> {
    await this.client.patch(`/zones/${zoneId}/settings/always_use_https`, {
      value: 'on',
    });
  }
  
  /**
   * Set minimum TLS version
   */
  async setMinTlsVersion(zoneId: string, version: '1.0' | '1.1' | '1.2' | '1.3'): Promise<void> {
    await this.client.patch(`/zones/${zoneId}/settings/min_tls_version`, {
      value: version,
    });
  }
  
  /**
   * Enable automatic HTTPS rewrites
   */
  async enableAutoHttpsRewrites(zoneId: string): Promise<void> {
    await this.client.patch(`/zones/${zoneId}/settings/automatic_https_rewrites`, {
      value: 'on',
    });
  }
  
  /**
   * Apply recommended security settings
   */
  async applySecurityDefaults(zoneId: string): Promise<void> {
    await Promise.all([
      this.setSslMode(zoneId, 'full'),
      this.enableAlwaysHttps(zoneId),
      this.setMinTlsVersion(zoneId, '1.2'),
      this.enableAutoHttpsRewrites(zoneId),
    ]);
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private mapZone(data: CloudflareZoneResponse): CloudflareZone {
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      paused: data.paused,
      type: data.type,
      nameServers: data.name_servers || [],
      originalNameServers: data.original_name_servers || [],
      createdOn: data.created_on,
      modifiedOn: data.modified_on,
      activatedOn: data.activated_on,
      plan: {
        id: data.plan?.id || 'free',
        name: data.plan?.name || 'Free',
      },
    };
  }
}

// Internal response type
interface CloudflareZoneResponse {
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

export const zoneService = new ZoneService();
```

### Task 5: DNS Record Operations (90 mins)

```typescript
// src/lib/cloudflare/dns.ts

import { getCloudflareClient } from './client';
import { CLOUDFLARE_CONFIG, DNS_TEMPLATES } from './config';
import type { DnsRecord, DnsRecordType, CreateDnsRecordParams, UpdateDnsRecordParams } from './types';

export class DnsService {
  private client = getCloudflareClient();
  
  // ============================================================================
  // CRUD Operations
  // ============================================================================
  
  /**
   * Create a DNS record
   */
  async createRecord(params: CreateDnsRecordParams): Promise<DnsRecord> {
    const body: Record<string, unknown> = {
      type: params.type,
      name: params.name,
      content: params.content,
      ttl: params.ttl ?? CLOUDFLARE_CONFIG.defaultTtl,
    };
    
    if (params.priority !== undefined) {
      body.priority = params.priority;
    }
    
    // Only certain record types can be proxied
    if (['A', 'AAAA', 'CNAME'].includes(params.type)) {
      body.proxied = params.proxied ?? CLOUDFLARE_CONFIG.defaultProxied;
    }
    
    const response = await this.client.post<DnsRecordResponse>(
      `/zones/${params.zoneId}/dns_records`,
      body
    );
    
    return this.mapRecord(response);
  }
  
  /**
   * Get a DNS record by ID
   */
  async getRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
    const response = await this.client.get<DnsRecordResponse>(
      `/zones/${zoneId}/dns_records/${recordId}`
    );
    return this.mapRecord(response);
  }
  
  /**
   * Update a DNS record
   */
  async updateRecord(params: UpdateDnsRecordParams): Promise<DnsRecord> {
    const body: Record<string, unknown> = {
      type: params.type,
      name: params.name,
      content: params.content,
      ttl: params.ttl ?? CLOUDFLARE_CONFIG.defaultTtl,
    };
    
    if (params.priority !== undefined) {
      body.priority = params.priority;
    }
    
    if (['A', 'AAAA', 'CNAME'].includes(params.type)) {
      body.proxied = params.proxied ?? CLOUDFLARE_CONFIG.defaultProxied;
    }
    
    const response = await this.client.put<DnsRecordResponse>(
      `/zones/${params.zoneId}/dns_records/${params.recordId}`,
      body
    );
    
    return this.mapRecord(response);
  }
  
  /**
   * Delete a DNS record
   */
  async deleteRecord(zoneId: string, recordId: string): Promise<{ id: string }> {
    return this.client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
  }
  
  /**
   * List all DNS records for a zone
   */
  async listRecords(
    zoneId: string,
    filters?: {
      type?: DnsRecordType;
      name?: string;
      content?: string;
      page?: number;
      perPage?: number;
    }
  ): Promise<{ records: DnsRecord[]; total: number }> {
    const params: Record<string, string | number> = {
      page: filters?.page ?? 1,
      per_page: filters?.perPage ?? 100,
    };
    
    if (filters?.type) params.type = filters.type;
    if (filters?.name) params.name = filters.name;
    if (filters?.content) params.content = filters.content;
    
    const response = await this.client.get<DnsRecordResponse[]>(
      `/zones/${zoneId}/dns_records`,
      params
    );
    
    return {
      records: response.map(r => this.mapRecord(r)),
      total: response.length,
    };
  }
  
  // ============================================================================
  // Batch Operations
  // ============================================================================
  
  /**
   * Create multiple DNS records
   */
  async createRecords(
    zoneId: string,
    records: Omit<CreateDnsRecordParams, 'zoneId'>[]
  ): Promise<{ created: DnsRecord[]; errors: { record: typeof records[0]; error: string }[] }> {
    const created: DnsRecord[] = [];
    const errors: { record: typeof records[0]; error: string }[] = [];
    
    for (const record of records) {
      try {
        const result = await this.createRecord({ ...record, zoneId });
        created.push(result);
      } catch (error) {
        errors.push({
          record,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return { created, errors };
  }
  
  /**
   * Delete multiple DNS records
   */
  async deleteRecords(
    zoneId: string,
    recordIds: string[]
  ): Promise<{ deleted: string[]; errors: { id: string; error: string }[] }> {
    const deleted: string[] = [];
    const errors: { id: string; error: string }[] = [];
    
    for (const recordId of recordIds) {
      try {
        await this.deleteRecord(zoneId, recordId);
        deleted.push(recordId);
      } catch (error) {
        errors.push({
          id: recordId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return { deleted, errors };
  }
  
  // ============================================================================
  // Template Operations
  // ============================================================================
  
  /**
   * Apply site hosting DNS template
   */
  async applySiteTemplate(
    zoneId: string,
    options?: { ipAddress?: string; cname?: string }
  ): Promise<DnsRecord[]> {
    const ip = options?.ipAddress || CLOUDFLARE_CONFIG.platformIp;
    
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = [
      {
        type: 'A',
        name: '@',
        content: ip,
        proxied: true,
      },
      {
        type: 'CNAME',
        name: 'www',
        content: '@',
        proxied: true,
      },
    ];
    
    const result = await this.createRecords(zoneId, records);
    return result.created;
  }
  
  /**
   * Apply Titan Mail DNS template
   */
  async applyTitanEmailTemplate(
    zoneId: string,
    dkimValue?: string
  ): Promise<DnsRecord[]> {
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = [
      // MX Records
      {
        type: 'MX',
        name: '@',
        content: 'mx1.titan.email',
        priority: 10,
      },
      {
        type: 'MX',
        name: '@',
        content: 'mx2.titan.email',
        priority: 20,
      },
      // SPF
      {
        type: 'TXT',
        name: '@',
        content: 'v=spf1 include:spf.titan.email ~all',
      },
    ];
    
    // Add DKIM if provided
    if (dkimValue) {
      records.push({
        type: 'TXT',
        name: 'titan._domainkey',
        content: dkimValue,
      });
    }
    
    // DMARC
    records.push({
      type: 'TXT',
      name: '_dmarc',
      content: 'v=DMARC1; p=none; rua=mailto:dmarc@dramac.app',
    });
    
    const result = await this.createRecords(zoneId, records);
    return result.created;
  }
  
  /**
   * Add verification TXT record
   */
  async addVerificationRecord(
    zoneId: string,
    token: string
  ): Promise<DnsRecord> {
    return this.createRecord({
      zoneId,
      type: 'TXT',
      name: DNS_TEMPLATES.verification.prefix,
      content: token,
    });
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  /**
   * Check if a record exists
   */
  async recordExists(
    zoneId: string,
    type: DnsRecordType,
    name: string
  ): Promise<boolean> {
    const { records } = await this.listRecords(zoneId, { type, name });
    return records.length > 0;
  }
  
  /**
   * Get or create a record
   */
  async getOrCreateRecord(params: CreateDnsRecordParams): Promise<DnsRecord> {
    const { records } = await this.listRecords(params.zoneId, {
      type: params.type,
      name: params.name,
    });
    
    if (records.length > 0) {
      // Update if content differs
      if (records[0].content !== params.content) {
        return this.updateRecord({
          ...params,
          recordId: records[0].id,
        });
      }
      return records[0];
    }
    
    return this.createRecord(params);
  }
  
  /**
   * Delete records by type and name pattern
   */
  async deleteRecordsByPattern(
    zoneId: string,
    type: DnsRecordType,
    namePattern: string
  ): Promise<number> {
    const { records } = await this.listRecords(zoneId, { type });
    const toDelete = records.filter(r => r.name.includes(namePattern));
    
    const { deleted } = await this.deleteRecords(
      zoneId,
      toDelete.map(r => r.id)
    );
    
    return deleted.length;
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private mapRecord(data: DnsRecordResponse): DnsRecord {
    return {
      id: data.id,
      zoneId: data.zone_id,
      zoneName: data.zone_name,
      type: data.type as DnsRecordType,
      name: data.name,
      content: data.content,
      proxiable: data.proxiable,
      proxied: data.proxied,
      ttl: data.ttl,
      locked: data.locked,
      priority: data.priority,
      createdOn: data.created_on,
      modifiedOn: data.modified_on,
    };
  }
}

// Internal response type
interface DnsRecordResponse {
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

export const dnsService = new DnsService();
```

### Task 6: DNS Propagation Checking (45 mins)

```typescript
// src/lib/cloudflare/propagation.ts

import { promisify } from 'util';
import dns from 'dns';
import type { DnsRecordType, PropagationStatus, PropagationRecord, PropagationServer } from './types';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveCname = promisify(dns.resolveCname);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);

// Public DNS servers to check
const DNS_SERVERS = [
  { name: 'Google', ip: '8.8.8.8', location: 'Global' },
  { name: 'Cloudflare', ip: '1.1.1.1', location: 'Global' },
  { name: 'OpenDNS', ip: '208.67.222.222', location: 'US' },
  { name: 'Quad9', ip: '9.9.9.9', location: 'Global' },
];

export class PropagationService {
  /**
   * Check propagation status for a domain's DNS records
   */
  async checkPropagation(
    domain: string,
    expectedRecords: { type: DnsRecordType; name: string; content: string }[]
  ): Promise<PropagationStatus> {
    const records: PropagationRecord[] = [];
    
    for (const expected of expectedRecords) {
      const fullName = expected.name === '@' 
        ? domain 
        : `${expected.name}.${domain}`;
      
      const servers: PropagationServer[] = [];
      let anyPropagated = false;
      
      for (const server of DNS_SERVERS) {
        try {
          const resolved = await this.resolveRecord(
            fullName,
            expected.type,
            server.ip
          );
          
          const propagated = this.matchesExpected(resolved, expected.content);
          if (propagated) anyPropagated = true;
          
          servers.push({
            location: server.location,
            server: server.name,
            resolved,
            propagated,
          });
        } catch {
          servers.push({
            location: server.location,
            server: server.name,
            resolved: null,
            propagated: false,
          });
        }
      }
      
      const actual = servers.find(s => s.resolved)?.resolved || null;
      
      records.push({
        type: expected.type,
        name: expected.name,
        expected: expected.content,
        actual,
        propagated: anyPropagated,
        servers,
      });
    }
    
    return {
      domain,
      records,
      allPropagated: records.every(r => r.propagated),
      lastChecked: new Date().toISOString(),
    };
  }
  
  /**
   * Check if nameservers are pointing to Cloudflare
   */
  async checkNameserverPropagation(
    domain: string,
    expectedNameservers: string[]
  ): Promise<{
    propagated: boolean;
    current: string[];
    expected: string[];
  }> {
    try {
      const current = await resolveNs(domain);
      const normalizedCurrent = current.map(ns => ns.toLowerCase());
      const normalizedExpected = expectedNameservers.map(ns => ns.toLowerCase());
      
      const propagated = normalizedExpected.every(ns => 
        normalizedCurrent.some(c => c.includes(ns.replace(/\.$/, '')))
      );
      
      return {
        propagated,
        current: normalizedCurrent,
        expected: normalizedExpected,
      };
    } catch {
      return {
        propagated: false,
        current: [],
        expected: expectedNameservers,
      };
    }
  }
  
  /**
   * Wait for DNS propagation with polling
   */
  async waitForPropagation(
    domain: string,
    expectedRecords: { type: DnsRecordType; name: string; content: string }[],
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (attempt: number, status: PropagationStatus) => void;
    } = {}
  ): Promise<PropagationStatus> {
    const { maxAttempts = 30, intervalMs = 10000, onProgress } = options;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkPropagation(domain, expectedRecords);
      
      onProgress?.(attempt, status);
      
      if (status.allPropagated) {
        return status;
      }
      
      if (attempt < maxAttempts) {
        await this.delay(intervalMs);
      }
    }
    
    // Return final status even if not fully propagated
    return this.checkPropagation(domain, expectedRecords);
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private async resolveRecord(
    hostname: string,
    type: DnsRecordType,
    dnsServer?: string
  ): Promise<string | null> {
    // Set custom resolver if provided
    if (dnsServer) {
      dns.setServers([dnsServer]);
    }
    
    try {
      switch (type) {
        case 'A': {
          const result = await resolve4(hostname);
          return result[0] || null;
        }
        case 'AAAA': {
          const result = await resolve6(hostname);
          return result[0] || null;
        }
        case 'CNAME': {
          const result = await resolveCname(hostname);
          return result[0] || null;
        }
        case 'MX': {
          const result = await resolveMx(hostname);
          return result[0]?.exchange || null;
        }
        case 'TXT': {
          const result = await resolveTxt(hostname);
          return result.flat().join('') || null;
        }
        case 'NS': {
          const result = await resolveNs(hostname);
          return result.join(', ') || null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  
  private matchesExpected(actual: string | null, expected: string): boolean {
    if (!actual) return false;
    
    const normalizedActual = actual.toLowerCase().replace(/\.$/, '');
    const normalizedExpected = expected.toLowerCase().replace(/\.$/, '');
    
    return normalizedActual === normalizedExpected || 
           normalizedActual.includes(normalizedExpected);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const propagationService = new PropagationService();
```

### Task 7: Server Actions (60 mins)

```typescript
// src/lib/actions/dns.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { zoneService } from "@/lib/cloudflare/zones";
import { dnsService } from "@/lib/cloudflare/dns";
import { propagationService } from "@/lib/cloudflare/propagation";
import type { DnsRecordType } from "@/lib/cloudflare/types";

// ============================================================================
// Zone Actions
// ============================================================================

export async function createCloudflareZone(domainId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  // Verify user has access to domain
  const { data: domain, error } = await supabase
    .from('domains')
    .select('*')
    .eq('id', domainId)
    .single();
  
  if (error || !domain) {
    return { success: false, error: 'Domain not found' };
  }
  
  try {
    // Create zone in Cloudflare
    const zone = await zoneService.createZone({ name: domain.domain_name });
    
    // Store zone in database
    const { error: insertError } = await admin
      .from('cloudflare_zones')
      .insert({
        domain_id: domainId,
        zone_id: zone.id,
        name: zone.name,
        status: zone.status,
        assigned_nameservers: zone.nameServers,
        original_nameservers: zone.originalNameServers,
      });
    
    if (insertError) {
      console.error('[DNS] Failed to store zone:', insertError);
    }
    
    // Update domain with zone info
    await admin
      .from('domains')
      .update({
        cloudflare_zone_id: zone.id,
        nameservers: zone.nameServers,
      })
      .eq('id', domainId);
    
    // Apply security defaults
    await zoneService.applySecurityDefaults(zone.id);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { 
      success: true, 
      data: {
        zoneId: zone.id,
        nameservers: zone.nameServers,
      }
    };
  } catch (error) {
    console.error('[DNS] Zone creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create DNS zone' 
    };
  }
}

// ============================================================================
// DNS Record Actions
// ============================================================================

export async function createDnsRecord(
  domainId: string,
  record: {
    type: DnsRecordType;
    name: string;
    content: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  // Get domain with zone
  const { data: domain, error } = await supabase
    .from('domains')
    .select('*, cloudflare_zones(*)')
    .eq('id', domainId)
    .single();
  
  if (error || !domain) {
    return { success: false, error: 'Domain not found' };
  }
  
  if (!domain.cloudflare_zone_id) {
    return { success: false, error: 'DNS zone not configured. Please set up DNS first.' };
  }
  
  try {
    // Create record in Cloudflare
    const cfRecord = await dnsService.createRecord({
      zoneId: domain.cloudflare_zone_id,
      ...record,
    });
    
    // Store in database
    const { error: insertError } = await admin
      .from('domain_dns_records')
      .insert({
        domain_id: domainId,
        record_type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 3600,
        priority: record.priority,
        proxied: record.proxied,
        cloudflare_record_id: cfRecord.id,
        status: 'active',
        created_by: 'user',
      });
    
    if (insertError) {
      console.error('[DNS] Failed to store record:', insertError);
    }
    
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: cfRecord };
  } catch (error) {
    console.error('[DNS] Record creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create DNS record' 
    };
  }
}

export async function updateDnsRecord(
  domainId: string,
  recordId: string,
  updates: {
    type: DnsRecordType;
    name: string;
    content: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  }
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  // Get domain and record
  const { data: domain } = await supabase
    .from('domains')
    .select('cloudflare_zone_id')
    .eq('id', domainId)
    .single();
  
  const { data: dbRecord } = await supabase
    .from('domain_dns_records')
    .select('cloudflare_record_id')
    .eq('id', recordId)
    .single();
  
  if (!domain?.cloudflare_zone_id || !dbRecord?.cloudflare_record_id) {
    return { success: false, error: 'Record not found' };
  }
  
  try {
    // Update in Cloudflare
    const cfRecord = await dnsService.updateRecord({
      zoneId: domain.cloudflare_zone_id,
      recordId: dbRecord.cloudflare_record_id,
      ...updates,
    });
    
    // Update in database
    await admin
      .from('domain_dns_records')
      .update({
        record_type: updates.type,
        name: updates.name,
        content: updates.content,
        ttl: updates.ttl,
        priority: updates.priority,
        proxied: updates.proxied,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', recordId);
    
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: cfRecord };
  } catch (error) {
    console.error('[DNS] Record update error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update DNS record' 
    };
  }
}

export async function deleteDnsRecord(domainId: string, recordId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  // Get domain and record
  const { data: domain } = await supabase
    .from('domains')
    .select('cloudflare_zone_id')
    .eq('id', domainId)
    .single();
  
  const { data: dbRecord } = await supabase
    .from('domain_dns_records')
    .select('cloudflare_record_id')
    .eq('id', recordId)
    .single();
  
  if (!domain?.cloudflare_zone_id || !dbRecord?.cloudflare_record_id) {
    return { success: false, error: 'Record not found' };
  }
  
  try {
    // Delete from Cloudflare
    await dnsService.deleteRecord(domain.cloudflare_zone_id, dbRecord.cloudflare_record_id);
    
    // Delete from database
    await admin
      .from('domain_dns_records')
      .delete()
      .eq('id', recordId);
    
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true };
  } catch (error) {
    console.error('[DNS] Record deletion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete DNS record' 
    };
  }
}

// ============================================================================
// Template Actions
// ============================================================================

export async function setupSiteDns(domainId: string, siteId?: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: domain } = await supabase
    .from('domains')
    .select('*')
    .eq('id', domainId)
    .single();
  
  if (!domain) {
    return { success: false, error: 'Domain not found' };
  }
  
  // Create zone if needed
  if (!domain.cloudflare_zone_id) {
    const zoneResult = await createCloudflareZone(domainId);
    if (!zoneResult.success) {
      return zoneResult;
    }
  }
  
  try {
    // Apply site template
    const records = await dnsService.applySiteTemplate(domain.cloudflare_zone_id!);
    
    // Store records in database
    for (const record of records) {
      await admin
        .from('domain_dns_records')
        .insert({
          domain_id: domainId,
          record_type: record.type,
          name: record.name.replace(`.${domain.domain_name}`, '').replace(domain.domain_name, '@'),
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied,
          cloudflare_record_id: record.id,
          status: 'active',
          created_by: 'system',
        });
    }
    
    // Update domain status
    await admin
      .from('domains')
      .update({
        dns_configured: true,
        site_id: siteId,
      })
      .eq('id', domainId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true, data: { recordsCreated: records.length } };
  } catch (error) {
    console.error('[DNS] Site setup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to setup site DNS' 
    };
  }
}

export async function setupEmailDns(domainId: string, provider: 'titan' | 'google' = 'titan') {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: domain } = await supabase
    .from('domains')
    .select('*')
    .eq('id', domainId)
    .single();
  
  if (!domain?.cloudflare_zone_id) {
    return { success: false, error: 'DNS zone not configured' };
  }
  
  try {
    let records;
    if (provider === 'titan') {
      records = await dnsService.applyTitanEmailTemplate(domain.cloudflare_zone_id);
    } else {
      // Would implement Google Workspace template
      return { success: false, error: 'Provider not supported yet' };
    }
    
    // Store records
    for (const record of records) {
      await admin
        .from('domain_dns_records')
        .insert({
          domain_id: domainId,
          record_type: record.type,
          name: record.name.replace(`.${domain.domain_name}`, '').replace(domain.domain_name, '@'),
          content: record.content,
          ttl: record.ttl,
          priority: record.priority,
          cloudflare_record_id: record.id,
          status: 'active',
          created_by: 'system',
        });
    }
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true, data: { recordsCreated: records.length } };
  } catch (error) {
    console.error('[DNS] Email setup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to setup email DNS' 
    };
  }
}

// ============================================================================
// Propagation Actions
// ============================================================================

export async function checkDnsPropagation(domainId: string) {
  const supabase = await createClient();
  
  const { data: domain } = await supabase
    .from('domains')
    .select('domain_name, domain_dns_records(*)')
    .eq('id', domainId)
    .single();
  
  if (!domain) {
    return { success: false, error: 'Domain not found' };
  }
  
  const expectedRecords = domain.domain_dns_records
    .filter((r: { status: string }) => r.status === 'active')
    .map((r: { record_type: DnsRecordType; name: string; content: string }) => ({
      type: r.record_type as DnsRecordType,
      name: r.name,
      content: r.content,
    }));
  
  try {
    const status = await propagationService.checkPropagation(
      domain.domain_name,
      expectedRecords
    );
    
    return { success: true, data: status };
  } catch (error) {
    console.error('[DNS] Propagation check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check propagation' 
    };
  }
}

export async function checkNameserverPropagation(domainId: string) {
  const supabase = await createClient();
  
  const { data: domain } = await supabase
    .from('domains')
    .select('domain_name, nameservers')
    .eq('id', domainId)
    .single();
  
  if (!domain || !domain.nameservers?.length) {
    return { success: false, error: 'Domain or nameservers not found' };
  }
  
  try {
    const status = await propagationService.checkNameserverPropagation(
      domain.domain_name,
      domain.nameservers
    );
    
    return { success: true, data: status };
  } catch (error) {
    console.error('[DNS] NS propagation check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check nameserver propagation' 
    };
  }
}
```

### Task 8: Index Exports (10 mins)

```typescript
// src/lib/cloudflare/index.ts

export { getCloudflareClient, resetClient, CloudflareClient, CloudflareApiError, CloudflareConfigError } from './client';
export { zoneService, ZoneService } from './zones';
export { dnsService, DnsService } from './dns';
export { propagationService, PropagationService } from './propagation';
export { CLOUDFLARE_CONFIG, DNS_TEMPLATES, isCloudflareConfigured } from './config';
export * from './types';
```

---

## ✅ Completion Checklist

- [ ] Cloudflare configuration with environment variables
- [ ] Complete TypeScript interfaces
- [ ] API client with error handling
- [ ] Zone creation and management
- [ ] DNS record CRUD operations
- [ ] Batch record operations
- [ ] Site hosting DNS template
- [ ] Email (Titan Mail) DNS template
- [ ] DNS propagation checking
- [ ] Nameserver propagation checking
- [ ] Server actions for zone management
- [ ] Server actions for DNS records
- [ ] Server actions for templates
- [ ] Server actions for propagation
- [ ] Barrel exports
- [ ] TypeScript compiles with zero errors

---

## 🧪 Testing Considerations

1. Test with Cloudflare sandbox/test account
2. Test zone creation and deletion
3. Test all DNS record types
4. Test template application
5. Test propagation checking with various DNS servers
6. Test error handling for API failures
